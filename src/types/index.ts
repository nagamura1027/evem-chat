// Supabase Database types
export interface Thread {
  id: string;
  user_id: string;
  title: string;
  dify_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateThreadRequest {
  title?: string;
}

export interface CreateThreadResponse {
  thread: Thread;
}

export interface ThreadsResponse {
  threads: Thread[];
}

// Chat types
export interface ChatRequest {
  thread_id: string;
  message: string;
}

// Dify API types
export interface DifyMessageEvent {
  event: 'message' | 'message_end' | 'error' | 'ping';
  task_id?: string;
  id?: string;
  answer?: string;
  conversation_id?: string;
  message_id?: string;
  code?: string;
  message?: string;
  status?: number;
}

export interface DifyChatRequest {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: 'streaming' | 'blocking';
  conversation_id: string;
  user: string;
  auto_generate_name: boolean;
}

// API Response types
export interface ApiError {
  error: string;
  code?: string;
}

