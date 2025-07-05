import { useState, useCallback, useEffect } from 'react';
import { Message, Persona, ChatRequest, GenerateRequest, ApiError } from '../types';
import { generateId } from '../utils';

export const useChat = (apiService: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      if (apiService) {
        const connected = await apiService.testConnection();
        setIsConnected(connected);
      }
    };
    testConnection();
  }, [apiService]);

  const sendMessage = useCallback(async (content: string, persona: Persona) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Convert message history to API format
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      const request: ChatRequest = {
        message: content.trim(),
        persona: persona.role, // Use persona role
        culture: persona.culture, // Use persona culture
        conversation_history: conversationHistory,
      };

      const response = await apiService.sendMessage(request);

      if (!response.success) {
        throw new Error(response.error_message || 'Failed to get response');
      }

      const aiMessage: Message = {
        id: generateId(),
        content: response.response,
        sender: 'ai',
        timestamp: new Date(),
        persona,
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsConnected(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.detail || 'Failed to send message. Please try again.');
      setIsConnected(false);
      
      // Remove the user message if the API call failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, apiService]);

  const generateText = useCallback(async (prompt: string, style: string = 'creative', options?: { maxTokens?: number }) => {
    if (!prompt.trim() || isLoading) return null;

    setIsLoading(true);
    setError(null);

    try {
      const request: GenerateRequest = {
        prompt: prompt.trim(),
        style: style,
        max_tokens: options?.maxTokens || 512,
      };

      const response = await apiService.generateText(request);
      
      if (!response.success) {
        throw new Error(response.error_message || 'Failed to generate text');
      }
      
      setIsConnected(true);
      return response.generated_text;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.detail || 'Failed to generate text. Please try again.');
      setIsConnected(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, apiService]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const retryLastMessage = useCallback(async (persona: Persona) => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'user');
    if (lastUserMessage && persona) {
      // Remove the last AI message if it exists
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.sender === 'ai') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      await sendMessage(lastUserMessage.content, persona);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    isConnected,
    sendMessage,
    generateText,
    clearMessages,
    retryLastMessage,
  };
};
