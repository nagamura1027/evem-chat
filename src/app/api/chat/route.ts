import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isAllowedEmail } from '@/lib/auth';
import type { ChatRequest, DifyChatRequest, DifyMessageEvent } from '@/types';

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY;

export async function POST(request: NextRequest) {
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
        JSON.stringify({ error: 'Access denied. Only @evem-japan.com emails are allowed.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse request body
    const body: ChatRequest = await request.json();
    const { thread_id, message } = body;
    
    if (!thread_id || !message) {
      return new Response(
        JSON.stringify({ error: 'thread_id and message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get thread (RLS will ensure user owns it)
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('*')
      .eq('id', thread_id)
      .single();
    
    if (threadError || !thread) {
      return new Response(
        JSON.stringify({ error: 'Thread not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if this is the first message (no conversation_id yet)
    const isFirstMessage = !thread.dify_conversation_id;
    
    // Prepare Dify request (blocking mode for stability)
    const difyRequest: DifyChatRequest = {
      inputs: {},
      query: message,
      response_mode: 'blocking',
      conversation_id: thread.dify_conversation_id || '',
      user: user.id,
      auto_generate_name: true,
    };
    
    // Call Dify API
    const difyResponse = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(difyRequest),
    });
    
    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error('Dify API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to communicate with AI service' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const difyData = await difyResponse.json();
    const serviceClient = createServiceRoleClient();
    
    // Update thread with conversation_id
    if (difyData.conversation_id) {
      const updates: Record<string, unknown> = {
        dify_conversation_id: difyData.conversation_id,
        updated_at: new Date().toISOString(),
      };
      
      if (isFirstMessage) {
        updates.title = message.slice(0, 20);
      }
      
      await serviceClient
        .from('threads')
        .update(updates)
        .eq('id', thread_id);
    }
    
    // Return response as SSE format for compatibility with frontend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send message content
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          event: 'message',
          answer: difyData.answer || ''
        })}\n\n`));
        
        // Send message_end
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          event: 'message_end',
          conversation_id: difyData.conversation_id
        })}\n\n`));
        
        controller.close();
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}



