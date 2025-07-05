import React, { useState, useEffect } from 'react';
import { Persona, AppView } from './types';
import { personas } from './data/personas';
import PersonaSelection from './components/PersonaSelection';
import ChatInterface from './components/ChatInterface';
import TextGeneration from './components/TextGeneration';
import apiService from './services/api';
import mockApiService from './services/mockApi';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('personas');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [currentMode, setCurrentMode] = useState<'chat' | 'generate'>('chat');
  const [useMockAPI, setUseMockAPI] = useState(true); // Start with mock API
  const [apiConnected, setApiConnected] = useState(false);

  // Get current API service
  const getCurrentApiService = () => {
    return useMockAPI ? mockApiService : apiService;
  };

  // Test API connection
  const testConnection = async () => {
    try {
      const connected = await apiService.testConnection();
      setApiConnected(connected);
      if (connected) {
        setUseMockAPI(false);
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      setApiConnected(false);
    }
  };

  // Check API connection on app load
  useEffect(() => {
    testConnection();
  }, []);

  // Handle persona selection
  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
  };

  // Start chat with selected persona
  const handleStartChat = () => {
    if (selectedPersona) {
      setCurrentView('chat');
      setCurrentMode('chat');
    }
  };

  // Go back to persona selection
  const handleBack = () => {
    setCurrentView('personas');
    setSelectedPersona(null);
  };

  // Switch between chat and generate modes
  const handleSwitchMode = (mode: 'chat' | 'generate') => {
    setCurrentMode(mode);
    setCurrentView(mode);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back
      if (e.key === 'Escape' && currentView !== 'personas') {
        handleBack();
      }
      
      // Tab to switch modes when in chat/generate view
      if (e.key === 'Tab' && (currentView === 'chat' || currentView === 'generate')) {
        e.preventDefault();
        const newMode = currentMode === 'chat' ? 'generate' : 'chat';
        handleSwitchMode(newMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, currentMode]);

  // Error boundary fallback
  const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );

  // Loading state
  if (personas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading personas...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="App">
        {/* API Status Bar */}
        <div className={cn(
          'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm',
          useMockAPI ? 'bg-orange-500 text-white' : apiConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                useMockAPI ? 'bg-orange-200' : apiConnected ? 'bg-green-200' : 'bg-red-200'
              )}></div>
              <span>
                {useMockAPI ? 'Using Mock API (Demo Mode)' : apiConnected ? 'Connected to Backend' : 'Backend Offline'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {!useMockAPI && !apiConnected && (
                <button
                  onClick={testConnection}
                  className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors"
                >
                  Retry
                </button>
              )}
              {useMockAPI && (
                <button
                  onClick={testConnection}
                  className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors"
                >
                  Try Backend
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-10">
          {currentView === 'personas' && (
            <PersonaSelection
              personas={personas}
              selectedPersona={selectedPersona}
              onPersonaSelect={handlePersonaSelect}
              onStartChat={handleStartChat}
            />
          )}

          {(currentView === 'chat' || currentView === 'generate') && selectedPersona && (
            <>
              {currentMode === 'chat' ? (
                <ChatInterface
                  persona={selectedPersona}
                  onBack={handleBack}
                  onSwitchMode={handleSwitchMode}
                  currentMode={currentMode}
                  apiService={getCurrentApiService()}
                />
              ) : (
                <TextGeneration
                  persona={selectedPersona}
                  onBack={handleBack}
                  onSwitchMode={handleSwitchMode}
                  currentMode={currentMode}
                  apiService={getCurrentApiService()}
                />
              )}
            </>
          )}

          {/* Keyboard shortcuts help */}
          {currentView !== 'personas' && (
            <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-lg opacity-75 hover:opacity-100 transition-opacity">
              <div>ESC: Back to personas</div>
              <div>TAB: Switch mode</div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return <ErrorFallback error={error as Error} />;
  }
}

export default App;
