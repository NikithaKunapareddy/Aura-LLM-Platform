export interface Persona {
  id: string;
  name: string;
  culture: string;
  role: string;
  description: string;
  avatar: string;
  flag: string;
  accent_color: string;
  personality_traits: string[];
  greeting: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  persona?: Persona;
}

export interface ChatRequest {
  message: string;
  persona: string;
  culture: string;
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatResponse {
  response: string;
  persona: string;
  culture: string;
  success: boolean;
  error_message?: string;
}

export interface GenerateRequest {
  prompt: string;
  style: string;
  max_tokens?: number;
}

export interface GenerateResponse {
  generated_text: string;
  style: string;
  success: boolean;
  error_message?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export type AppView = 'personas' | 'chat' | 'generate';
