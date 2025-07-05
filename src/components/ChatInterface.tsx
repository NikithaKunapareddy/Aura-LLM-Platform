import React, { useState, useRef, useEffect } from 'react';
import { Message, Persona } from '../types';
import { cn, formatTime, formatDate } from '../utils';
import { useChat } from '../hooks/useChat';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showAvatar = true }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={cn(
      'flex items-end space-x-3 mb-4',
      isUser ? 'flex-row-reverse space-x-reverse' : ''
    )}>
      {/* Avatar */}
      {showAvatar && !isUser && message.persona && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg">
          {message.persona.avatar}
        </div>
      )}
      
      {/* Message */}
      <div className={cn(
        'chat-bubble',
        isUser ? 'chat-bubble-user' : 'chat-bubble-ai'
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          'text-xs mt-2 opacity-75',
          isUser ? 'text-blue-100' : 'text-gray-500'
        )}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, placeholder = "Type your message..." }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-3">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32 bg-white"
          rows={1}
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className={cn(
          'flex-shrink-0 p-3 rounded-2xl transition-all duration-200',
          input.trim() && !isLoading
            ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </form>
  );
};

interface ChatInterfaceProps {
  persona: Persona;
  onBack: () => void;
  onSwitchMode: (mode: 'chat' | 'generate') => void;
  currentMode: 'chat' | 'generate';
  apiService: any; // API service instance
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  persona, 
  onBack, 
  onSwitchMode, 
  currentMode,
  apiService 
}) => {
  const { messages, isLoading, error, isConnected, sendMessage, clearMessages, retryLastMessage } = useChat(apiService);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom && messages.length > 5);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages.length]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, persona);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    let currentGroup: Message[] = [];

    messages.forEach(message => {
      const messageDate = formatDate(message.timestamp);
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [messages]);

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
              <p className="text-sm text-gray-600">{persona.role} from {persona.culture}</p>
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

          {/* Clear Chat */}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
            <button
              onClick={() => retryLastMessage(persona)}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6">
              <span className="text-6xl">{persona.avatar}</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chat with {persona.name}
            </h3>
            <p className="text-gray-600 max-w-md mb-6">
              {persona.greeting}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {persona.personality_traits.map((trait, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-8">
                <div className="text-center mb-4">
                  <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                    {group.date}
                  </span>
                </div>
                {group.messages.map((message, messageIndex) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showAvatar={messageIndex === 0 || group.messages[messageIndex - 1].sender !== message.sender}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 p-3 bg-primary-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder={`Message ${persona.name}...`}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
