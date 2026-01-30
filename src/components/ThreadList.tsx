'use client';

import { Thread } from '@/types';

interface ThreadListProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: Thread) => void;
  onNewThread: () => void;
  isLoading: boolean;
}

export default function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  onNewThread,
  isLoading,
}: ThreadListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨日';
    } else if (days < 7) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <button
          onClick={onNewThread}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新しいチャット
        </button>
      </div>
      
      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-700/50 mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">チャット履歴がありません</p>
            <p className="text-slate-600 text-xs mt-1">新しいチャットを始めましょう</p>
          </div>
        ) : (
          <div className="py-2">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`w-full text-left px-4 py-3 transition-all duration-150 ${
                  selectedThreadId === thread.id
                    ? 'bg-blue-600/20 border-l-2 border-blue-500'
                    : 'hover:bg-slate-700/50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      selectedThreadId === thread.id ? 'text-blue-400' : 'text-slate-200'
                    }`}>
                      {thread.title || '新しいチャット'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(thread.updated_at)}
                    </p>
                  </div>
                  <svg 
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-colors ${
                      selectedThreadId === thread.id ? 'text-blue-400' : 'text-slate-600'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

