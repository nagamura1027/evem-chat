import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAllowedEmail } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';
  
  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      // エラーログを詳細に出力（秘密情報は含めない）
      console.error('[Auth Callback Error]', {
        code: error.code || 'unknown',
        message: error.message,
        status: error.status,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.redirect(`${origin}/login?error=auth_error&error_description=${encodeURIComponent(error.message)}`);
    }
    
    // Check if email domain is allowed
    const userEmail = data.user?.email;
    if (!isAllowedEmail(userEmail)) {
      // Sign out the user if email is not allowed
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/login?error=domain_not_allowed`
      );
    }
    
    return NextResponse.redirect(`${origin}${next}`);
  }
  
  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}

