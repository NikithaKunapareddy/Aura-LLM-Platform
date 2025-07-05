import axios from 'axios';
import { ChatRequest, ChatResponse, GenerateRequest, GenerateResponse, ApiError } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for LLM responses
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const apiError: ApiError = {
      detail: error.response?.data?.detail || error.message || 'An unexpected error occurred',
      status_code: error.response?.status || 500,
    };
    
    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  }
);

export const apiService = {
  // Chat endpoint
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chat', request);
    return response.data;
  },

  // Text generation endpoint
  async generateText(request: GenerateRequest): Promise<GenerateResponse> {
    const response = await api.post<GenerateResponse>('/generate', request);
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await api.get('/health');
    return response.data;
  },

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
};

export default apiService;
