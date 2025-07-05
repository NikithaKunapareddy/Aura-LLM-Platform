/**
 * Mock API service for testing the frontend without backend.
 * This allows us to test the UI components and interactions.
 */

import { ChatRequest, ChatResponse, GenerateRequest, GenerateResponse } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock responses
const mockPersonas = [
  { id: 'mentor', name: 'Mentor', description: 'Wise and supportive guidance' },
  { id: 'friend', name: 'Friend', description: 'Casual and friendly conversation' },
  { id: 'romantic', name: 'Romantic', description: 'Loving and affectionate' },
  { id: 'professional', name: 'Professional', description: 'Formal and business-oriented' }
];

const mockCultures = [
  { id: 'delhi', name: 'Delhi', description: 'Warm and expressive Indian culture' },
  { id: 'japanese', name: 'Japanese', description: 'Polite and respectful Japanese culture' },
  { id: 'parisian', name: 'Parisian', description: 'Sophisticated French culture' },
  { id: 'berlin', name: 'Berlin', description: 'Direct and efficient German culture' }
];

const getMockResponse = (persona: string, culture: string, message: string): string => {
  const responses = {
    mentor: {
      delhi: `Beta, I understand your concern about "${message}". Let me share some wisdom...`,
      japanese: `Sensei here. Your question about "${message}" requires careful consideration...`,
      parisian: `Mon cher étudiant, regarding "${message}", allow me to guide you...`,
      berlin: `Ja, your inquiry about "${message}" is practical. Here's my direct advice...`
    },
    friend: {
      delhi: `Yaar, about "${message}" - let me tell you what I think!`,
      japanese: `Friend-san, about "${message}", I think this way...`,
      parisian: `Mon ami, regarding "${message}", I have some thoughts...`,
      berlin: `Hey buddy, about "${message}" - here's what I think...`
    },
    romantic: {
      delhi: `My jaan, when you ask about "${message}", my heart wants to say...`,
      japanese: `My beloved, about "${message}", I feel deeply that...`,
      parisian: `Mon amour, regarding "${message}", let me express my feelings...`,
      berlin: `Mein Schatz, about "${message}", I want to share with you...`
    },
    professional: {
      delhi: `Good day. Regarding your inquiry about "${message}", I propose...`,
      japanese: `Honourable colleague, concerning "${message}", I respectfully suggest...`,
      parisian: `Bonjour, regarding your professional query about "${message}"...`,
      berlin: `Guten Tag. Concerning "${message}", here is my professional assessment...`
    }
  };

  return responses[persona as keyof typeof responses]?.[culture as keyof typeof responses.mentor] || 
         `Thank you for your message about "${message}". I'll respond as a ${persona} from ${culture} culture.`;
};

export const mockApiService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    await delay(1500); // Simulate LLM response time
    
    const response = getMockResponse(request.persona, request.culture, request.message);
    
    return {
      response,
      persona: request.persona,
      culture: request.culture,
      success: true
    };
  },

  async generateText(request: GenerateRequest): Promise<GenerateResponse> {
    await delay(2000); // Simulate text generation time
    
    const styles = {
      creative: "Once upon a time, in a world where imagination knows no bounds...",
      professional: "In accordance with industry standards and best practices, the following analysis...",
      casual: "So, you know how sometimes you just want to write something cool? Well...",
      academic: "This research examines the fundamental principles underlying..."
    };
    
    const baseText = styles[request.style as keyof typeof styles] || "Generated text based on your prompt...";
    const generated = `${baseText}\n\nYour prompt: "${request.prompt}"\n\nThis is a ${request.style} style response that demonstrates the text generation capabilities of our LLM system.`;
    
    return {
      generated_text: generated,
      style: request.style,
      success: true
    };
  },

  async healthCheck(): Promise<{ status: string }> {
    await delay(200);
    return { status: "healthy" };
  },

  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  },

  // Additional methods for mock data
  async getPersonas() {
    await delay(300);
    return { personas: mockPersonas, success: true };
  },

  async getCultures() {
    await delay(300);
    return { cultures: mockCultures, success: true };
  }
};

export default mockApiService;
