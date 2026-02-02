'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Thread, DifyMessageEvent } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface ChatAreaProps {
  thread: Thread | null;
  onThreadUpdate: () => void;
}

// Cache for message history
const messageCache = new Map<string, Message[]>();

export default function ChatArea({ thread, onThreadUpdate }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Load message history when thread changes
  useEffect(() => {
    setError(null);
    
    if (thread?.id && thread?.dify_conversation_id) {
      // Check cache first
      const cached = messageCache.get(thread.id);
      if (cached) {
        setMessages(cached);
      } else {
        setMessages([]);
        loadMessageHistory(thread.id);
      }
    } else {
      setMessages([]);
    }
  }, [thread?.id, thread?.dify_conversation_id]);
  
  // Fetch message history from API
  const loadMessageHistory = async (threadId: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/messages?thread_id=${threadId}`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      const data = await response.json();
      
      // Transform Dify messages to our format
      const loadedMessages: Message[] = [];
      for (const msg of data.messages || []) {
        loadedMessages.push({
          id: `user-${msg.id}`,
          role: 'user',
          content: msg.query,
        });
        loadedMessages.push({
          id: `assistant-${msg.id}`,
          role: 'assistant',
          content: msg.answer,
        });
      }
      // Save to cache
      messageCache.set(threadId, loadedMessages);
      setMessages(loadedMessages);
    } catch (err) {
      console.error('Failed to load message history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!thread || !input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userMessage }]);
    
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);
    
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: thread.id, message: userMessage }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            
            try {
              const event: DifyMessageEvent = JSON.parse(jsonStr);
              
              if (event.event === 'message' && event.answer) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMsgId 
                      ? { ...msg, content: msg.content + event.answer }
                      : msg
                  )
                );
              }
              
              if (event.event === 'message_end') {
                onThreadUpdate();
              }
              
              if (event.event === 'error') {
                throw new Error(event.message || 'AI service error');
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) {
                console.warn('Failed to parse SSE data:', jsonStr);
              } else {
                throw parseError;
              }
            }
          }
        }
      }
      
      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        );
        // Update cache
        if (thread?.id) messageCache.set(thread.id, updated);
        return updated;
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages(prev => prev.filter(msg => msg.id !== assistantMsgId));
      } else {
        const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
        setError(errorMessage);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, content: `エラー: ${errorMessage}`, isStreaming: false }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };
  
  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#212121]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2F2F2F] mb-4">
            <svg className="w-8 h-8 text-[#9B9B9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-white mb-2">チャットを選択</h2>
          <p className="text-[#9B9B9B] text-sm">左側から選択するか、<br/>新しいチャットを開始してください</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-[#212121]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#10A37F] border-t-transparent mx-auto mb-4"></div>
              <p className="text-[#9B9B9B] text-sm">履歴を読み込み中...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-4">
              <h2 className="text-xl font-medium text-white mb-2">EVeM DNA Chat</h2>
              <p className="text-[#9B9B9B] text-sm">大事にしたい思想や経営方針について質問してください</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`py-6 px-4 message-enter ${
                  message.role === 'assistant' ? 'bg-[#2F2F2F]' : 'bg-[#212121]'
                }`}
              >
                <div className="max-w-3xl mx-auto flex gap-4">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center ${
                    message.role === 'assistant' ? 'bg-[#10A37F]' : 'bg-[#5436DA]'
                  }`}>
                    {message.role === 'assistant' ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm mb-1">
                      {message.role === 'assistant' ? 'EVeM DNA' : 'あなた'}
                    </p>
                    <div 
                      className="text-[#ECECEC] text-sm whitespace-pre-wrap break-words leading-relaxed prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          ? message.content
                              .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
                              .replace(/\n/g, '<br>')
                          : ''
                      }}
                    />
                    {message.isStreaming && (
                      <span className="typing-cursor">▋</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="px-4 py-2">
          <div className="max-w-3xl mx-auto bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <div className="p-4 bg-[#212121]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative bg-[#2F2F2F] rounded-xl border border-[#3A3A3A] focus-within:border-[#10A37F]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを送信..."
              rows={1}
              disabled={isLoading}
              className="w-full resize-none bg-transparent text-white placeholder-[#6B6B6B] rounded-xl px-4 py-3 pr-12 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="absolute right-2 bottom-2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="w-8 h-8 flex items-center justify-center bg-[#6B6B6B] hover:bg-[#9B9B9B] text-white rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-white disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-black disabled:text-[#6B6B6B] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-[#6B6B6B] mt-2">
            EVeM DNA Chatは経営方針についてお答えします
          </p>
        </form>
      </div>
    </div>
  );
}
