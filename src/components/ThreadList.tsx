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
  isLoading,
}: ThreadListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '今日';
    } else if (days === 1) {
      return '昨日';
    } else if (days < 7) {
      return `${days}日前`;
    } else if (days < 30) {
      return '過去7日間';
    } else {
      return '過去30日間';
    }
  };
  
  // Group threads by date
  const groupedThreads = threads.reduce((groups, thread) => {
    const dateLabel = formatDate(thread.updated_at);
    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(thread);
    return groups;
  }, {} as Record<string, Thread[]>);
  
  return (
    <div className="flex-1 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#10A37F] border-t-transparent"></div>
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-8 px-4">
          <p className="text-[#6B6B6B] text-sm">チャット履歴がありません</p>
        </div>
      ) : (
        <div className="px-2 py-2">
          {Object.entries(groupedThreads).map(([dateLabel, groupThreads]) => (
            <div key={dateLabel}>
              <p className="px-3 py-2 text-xs text-[#6B6B6B] font-medium">{dateLabel}</p>
              {groupThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => onSelectThread(thread)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors group ${
                    selectedThreadId === thread.id
                      ? 'bg-[#2F2F2F]'
                      : 'hover:bg-[#2F2F2F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#9B9B9B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm text-[#ECECEC] truncate flex-1">
                      {thread.title || '新しいチャット'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
