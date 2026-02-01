import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAllowedEmail } from '@/lib/auth';
import type { ThreadsResponse, ApiError } from '@/types';

export async function GET(): Promise<NextResponse<ThreadsResponse | ApiError>> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check email domain
    if (!isAllowedEmail(user.email)) {
      return NextResponse.json(
        { error: 'Access denied. Only @evem-japan.com emails are allowed.' },
        { status: 403 }
      );
    }
    
    // Get threads for user (RLS will also enforce this)
    const { data: threads, error: selectError } = await supabase
      .from('threads')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: true });
    
    if (selectError) {
      console.error('Failed to fetch threads:', selectError);
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ threads: threads || [] });
  } catch (error) {
    console.error('Threads fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

