import React, { useState, useRef } from 'react';
import { Persona } from '../types';
import { cn } from '../utils';
import { useChat } from '../hooks/useChat';

interface TextGenerationProps {
  persona: Persona;
  onBack: () => void;
  onSwitchMode: (mode: 'chat' | 'generate') => void;
  currentMode: 'chat' | 'generate';
  apiService: any; // API service instance
}

const TextGeneration: React.FC<TextGenerationProps> = ({ 
  persona, 
  onBack, 
  onSwitchMode, 
  currentMode,
  apiService 
}) => {
  const { generateText, isLoading, error, isConnected } = useChat(apiService);
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [style, setStyle] = useState('creative'); // Text generation style
  const [settings, setSettings] = useState({
    maxLength: 200,
    temperature: 0.7,
  });
  const [history, setHistory] = useState<Array<{ prompt: string; result: string; timestamp: Date }>>([]);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    const result = await generateText(prompt, style, { maxTokens: settings.maxLength });
    if (result) {
      setGeneratedText(result);
      setHistory(prev => [{
        prompt: prompt.trim(),
        result,
        timestamp: new Date()
      }, ...prev].slice(0, 10)); // Keep last 10 generations
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    
    // Auto-resize textarea
    if (promptRef.current) {
      promptRef.current.style.height = 'auto';
      promptRef.current.style.height = `${promptRef.current.scrollHeight}px`;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const useAsPrompt = (text: string) => {
    setPrompt(text);
    if (promptRef.current) {
      promptRef.current.focus();
      promptRef.current.style.height = 'auto';
      promptRef.current.style.height = `${promptRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{persona.avatar}</span>
              <span className="text-lg">{persona.flag}</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{persona.name}</h2>
              <p className="text-sm text-gray-600">Text Generation</p>
            </div>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: isConnected ? '#10B981' : '#EF4444' }}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onSwitchMode('chat')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded transition-colors',
                currentMode === 'chat' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Chat
            </button>
            <button
              onClick={() => onSwitchMode('generate')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded transition-colors',
                currentMode === 'generate' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Input Section */}
          <div className="bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Text</h3>
              
              {/* Prompt Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={handlePromptChange}
                  onKeyPress={handleKeyPress}
                  placeholder={`Enter your prompt for ${persona.name}...`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[120px] max-h-[300px]"
                  rows={5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Press Ctrl+Enter (Cmd+Enter on Mac) to generate
                </p>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Length: {settings.maxLength}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={settings.maxLength}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxLength: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {settings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className={cn(
                  'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200',
                  prompt.trim() && !isLoading
                    ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </div>
                ) : (
                  'Generate Text'
                )}
              </button>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Generations</h4>
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-500">
                          {item.timestamp.toLocaleTimeString()}
                        </p>
                        <button
                          onClick={() => useAsPrompt(item.prompt)}
                          className="text-xs text-primary-600 hover:text-primary-700 underline"
                        >
                          Use as prompt
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 font-medium">
                        {item.prompt.length > 100 ? `${item.prompt.substring(0, 100)}...` : item.prompt}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.result.length > 150 ? `${item.result.substring(0, 150)}...` : item.result}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="bg-gray-50 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Generated Text</h3>
                {generatedText && (
                  <button
                    onClick={() => copyToClipboard(generatedText)}
                    className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
              {generatedText ? (
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">{persona.avatar}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{persona.name}</h4>
                      <p className="text-sm text-gray-600">{persona.culture}</p>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {generatedText}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No text generated yet
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Enter a prompt and click "Generate Text" to see {persona.name}'s creative output.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextGeneration;
