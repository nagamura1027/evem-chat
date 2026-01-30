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

export default function ChatArea({ thread, onThreadUpdate }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Reset messages when thread changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [thread?.id]);
  
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
    
    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userMessage }]);
    
    // Add placeholder for assistant
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);
    
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: thread.id,
          message: userMessage,
        }),
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
                // Update thread list to reflect new conversation_id
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
      
      // Mark message as complete
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled, remove the streaming message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMsgId));
      } else {
        const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
        setError(errorMessage);
        // Update the assistant message to show error
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };
  
  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">チャットを選択</h2>
          <p className="text-slate-500">左側のスレッド一覧から選択するか、<br/>新しいチャットを開始してください</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-slate-200 truncate">
          {thread.title || '新しいチャット'}
        </h2>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">何でも聞いてください。AIがお答えします。</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 message-enter ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 text-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content || (message.isStreaming && (
                      <span className="typing-cursor">▋</span>
                    ))}
                    {message.isStreaming && message.content && (
                      <span className="typing-cursor">▋</span>
                    )}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
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
      <div className="p-4 border-t border-slate-700/50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力... (Shift+Enterで改行)"
                rows={1}
                disabled={isLoading}
                className="w-full resize-none bg-slate-700/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {isLoading ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

