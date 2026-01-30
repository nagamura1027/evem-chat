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
    
    // Prepare Dify request
    const difyRequest: DifyChatRequest = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
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
    
    // Create SSE stream to client
    const encoder = new TextEncoder();
    const serviceClient = createServiceRoleClient();
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = difyResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        let conversationId: string | null = null;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (jsonStr.trim() === '') continue;
                
                try {
                  const event: DifyMessageEvent = JSON.parse(jsonStr);
                  
                  if (event.event === 'ping') {
                    // Ignore ping events
                    continue;
                  }
                  
                  if (event.event === 'message') {
                    // Forward message to client
                    controller.enqueue(encoder.encode(`data: ${jsonStr}\n\n`));
                  }
                  
                  if (event.event === 'message_end') {
                    // Store conversation_id
                    conversationId = event.conversation_id || null;
                    controller.enqueue(encoder.encode(`data: ${jsonStr}\n\n`));
                  }
                  
                  if (event.event === 'error') {
                    controller.enqueue(encoder.encode(`data: ${jsonStr}\n\n`));
                  }
                } catch (parseError) {
                  console.error('Failed to parse SSE data:', parseError);
                }
              }
            }
          }
          
          // After stream ends, update thread if needed
          if (conversationId) {
            const updates: Record<string, unknown> = {
              dify_conversation_id: conversationId,
              updated_at: new Date().toISOString(),
            };
            
            // Update title with first message if this is the first message
            if (isFirstMessage) {
              updates.title = message.slice(0, 20);
            }
            
            await serviceClient
              .from('threads')
              .update(updates)
              .eq('id', thread_id);
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: 'error', message: 'Stream processing error' })}\n\n`)
          );
        } finally {
          controller.close();
        }
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

