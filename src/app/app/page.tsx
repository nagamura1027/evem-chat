'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAllowedEmail } from '@/lib/auth';
import ThreadList from '@/components/ThreadList';
import ChatArea from '@/components/ChatArea';
import { Thread } from '@/types';

export default function AppPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    try {
      const response = await fetch('/api/threads');
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [router]);
  
  useEffect(() => {
    const supabase = createClient();
    
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (!isAllowedEmail(user.email)) {
        await supabase.auth.signOut();
        router.push('/login?error=domain_not_allowed');
        return;
      }
      
      setUserEmail(user.email || '');
      loadThreads();
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router, loadThreads]);
  
  const handleNewThread = async () => {
    try {
      const response = await fetch('/api/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新しいチャット' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setThreads(prev => [data.thread, ...prev]);
        setSelectedThread(data.thread);
        setIsMobileMenuOpen(false);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };
  
  const handleSelectThread = (thread: Thread) => {
    setSelectedThread(thread);
    setIsMobileMenuOpen(false);
  };
  
  const handleThreadUpdate = () => {
    loadThreads();
  };
  
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  return (
    <div className="h-screen flex bg-[#212121]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#171717]">
        {/* Sidebar Header */}
        <div className="p-3">
          <button
            onClick={handleNewThread}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white border border-[#3A3A3A] rounded-lg hover:bg-[#2F2F2F] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新しいチャット
          </button>
        </div>
        
        {/* Thread List */}
        <ThreadList
          threads={threads}
          selectedThreadId={selectedThread?.id || null}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
          isLoading={isLoadingThreads}
        />
        
        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#3A3A3A]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2F2F2F] cursor-pointer" onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-[#5436DA] flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{userEmail.split('@')[0]}</p>
              <p className="text-xs text-[#6B6B6B]">ログアウト</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Sidebar - Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col bg-[#171717]">
            <div className="flex items-center justify-between p-3 border-b border-[#3A3A3A]">
              <button
                onClick={handleNewThread}
                className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-white border border-[#3A3A3A] rounded-lg hover:bg-[#2F2F2F]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新しいチャット
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-2 p-2 text-[#9B9B9B] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ThreadList
              threads={threads}
              selectedThreadId={selectedThread?.id || null}
              onSelectThread={handleSelectThread}
              onNewThread={handleNewThread}
              isLoading={isLoadingThreads}
            />
            <div className="p-3 border-t border-[#3A3A3A]">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2F2F2F] cursor-pointer" onClick={handleLogout}>
                <div className="w-8 h-8 rounded-full bg-[#5436DA] flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{userEmail.split('@')[0]}</p>
                  <p className="text-xs text-[#6B6B6B]">ログアウト</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-12 px-3 border-b border-[#3A3A3A] bg-[#212121]">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-[#9B9B9B] hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-white">EVeM DNA Chat</span>
          <button
            onClick={handleNewThread}
            className="p-2 text-[#9B9B9B] hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </header>
        
        {/* Chat Area */}
        <main className="flex-1 overflow-hidden">
          <ChatArea
            thread={selectedThread}
            onThreadUpdate={handleThreadUpdate}
          />
        </main>
      </div>
    </div>
  );
}
