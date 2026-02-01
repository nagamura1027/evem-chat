'use client';

import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  // エラー発生時にログを出力（デバッグ用）
  if (error) {
    console.error('[Auth Error]', {
      code: error,
      description: errorDescription || 'No description provided',
      timestamp: new Date().toISOString(),
    });
  }
  
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    
    // 環境変数でサイトURLが指定されていればそれを使用、なければ現在のoriginを使用
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    
    console.log('[Auth] Initiating OAuth with redirectTo:', `${siteUrl}/auth/callback`);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
          hd: 'evem-japan.com',
        },
      },
    });
    
    if (error) {
      console.error('Login error:', error);
    }
  };
  
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'domain_not_allowed':
        return '@evem-japan.com のメールアドレスでのみログインできます。';
      case 'auth_error':
        return '認証に失敗しました。もう一度お試しください。';
      case 'no_code':
        return '認証コードがありません。もう一度お試しください。';
      default:
        return null;
    }
  };
  
  const errorMessage = getErrorMessage(error);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src="/logo-white.png"
              alt="EVeM"
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">EVeM DNA Chat</h1>
          <p className="text-[#9B9B9B] text-sm">大事にしたい思想や経営方針について</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-[#2F2F2F] rounded-xl p-6 border border-[#3A3A3A]">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{errorMessage}</p>
            </div>
          )}
          
          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン
          </button>
          
          {/* Domain Notice */}
          <p className="mt-4 text-center text-xs text-[#6B6B6B]">
            @evem-japan.com のメールアドレスが必要です
          </p>
        </div>
        
        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#6B6B6B]">
          © {new Date().getFullYear()} EVeM Japan
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
