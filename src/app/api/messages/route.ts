import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAllowedEmail } from '@/lib/auth';

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check email domain
    if (!isAllowedEmail(user.email)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get thread_id from query params
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('thread_id');
    
    if (!threadId) {
      return new Response(
        JSON.stringify({ error: 'thread_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get thread (RLS will ensure user owns it)
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .single();
    
    if (threadError || !thread) {
      return new Response(
        JSON.stringify({ error: 'Thread not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // If no conversation_id yet, return empty messages
    if (!thread.dify_conversation_id) {
      return new Response(
        JSON.stringify({ messages: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch messages from Dify API
    const difyResponse = await fetch(
      `${DIFY_BASE_URL}/messages?conversation_id=${thread.dify_conversation_id}&user=${user.id}&limit=100`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!difyResponse.ok) {
      console.error('Dify API error:', await difyResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const difyData = await difyResponse.json();
    
    // Transform Dify messages to our format
    const messages = (difyData.data || []).map((msg: {
      id: string;
      query: string;
      answer: string;
      created_at: number;
    }) => ({
      id: msg.id,
      query: msg.query,
      answer: msg.answer,
      created_at: msg.created_at,
    })).reverse(); // Reverse to get chronological order
    
    return new Response(
      JSON.stringify({ messages }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Messages API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

