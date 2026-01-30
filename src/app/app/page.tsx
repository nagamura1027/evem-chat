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
  
  // Check auth and load threads on mount
  useEffect(() => {
    const supabase = createClient();
    
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Double-check email domain on client side
      if (!isAllowedEmail(user.email)) {
        await supabase.auth.signOut();
        router.push('/login?error=domain_not_allowed');
        return;
      }
      
      setUserEmail(user.email || '');
      loadThreads();
    };
    
    checkAuth();
    
    // Listen for auth changes
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
        headers: {
          'Content-Type': 'application/json',
        },
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
    // Reload threads to get updated conversation_id and title
    loadThreads();
  };
  
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 bg-white rounded-lg px-2 flex items-center justify-center">
              <img src="/logo.png" alt="EVeM" className="h-5 w-auto" />
            </div>
            <span className="font-semibold text-white hidden sm:inline">EVeM Chat</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:inline">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-72 flex-col border-r border-slate-700/50 bg-slate-800/30">
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThread?.id || null}
            onSelectThread={handleSelectThread}
            onNewThread={handleNewThread}
            isLoading={isLoadingThreads}
          />
        </aside>
        
        {/* Sidebar - Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col bg-slate-800 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <span className="font-semibold text-white">チャット履歴</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
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
            </aside>
          </div>
        )}
        
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-slate-900/30">
          <ChatArea
            thread={selectedThread}
            onThreadUpdate={handleThreadUpdate}
          />
        </main>
      </div>
    </div>
  );
}

