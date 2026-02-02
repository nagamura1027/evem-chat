import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAllowedEmail } from '@/lib/auth';
import type { CreateThreadResponse, ApiError } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<CreateThreadResponse | ApiError>> {
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
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const title = body.title || '新しいチャット';
    
    // Create thread
    const { data: thread, error: insertError } = await supabase
      .from('threads')
      .insert({
        user_id: user.id,
        title: title,
        dify_conversation_id: null,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Failed to create thread:', insertError);
      return NextResponse.json(
        { error: 'Failed to create thread' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ thread });
  } catch (error) {
    console.error('Thread creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



