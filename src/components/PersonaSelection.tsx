import React from 'react';
import { Persona } from '../types';
import { cn } from '../utils';

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onClick: (persona: Persona) => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, isSelected, onClick }) => {
  return (
    <div
      className={cn(
        'persona-card',
        isSelected && 'selected'
      )}
      onClick={() => onClick(persona)}
      style={{
        borderColor: isSelected ? persona.accent_color : undefined,
        backgroundColor: isSelected ? `${persona.accent_color}10` : undefined,
      }}
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">{persona.avatar}</span>
          <span className="text-lg">{persona.flag}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{persona.name}</h3>
          <p className="text-sm text-gray-600">{persona.culture}</p>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: persona.accent_color }}
        >
          {persona.role}
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-4 leading-relaxed">
        {persona.description}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {persona.personality_traits.map((trait, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
          >
            {trait}
          </span>
        ))}
      </div>
      
      <div className="border-t pt-3">
        <p className="text-sm text-gray-600 italic">
          "{persona.greeting}"
        </p>
      </div>
    </div>
  );
};

interface PersonaSelectionProps {
  personas: Persona[];
  selectedPersona: Persona | null;
  onPersonaSelect: (persona: Persona) => void;
  onStartChat: () => void;
}

const PersonaSelection: React.FC<PersonaSelectionProps> = ({
  personas,
  selectedPersona,
  onPersonaSelect,
  onStartChat,
}) => {
  const roles = ['Mentor', 'Friend', 'Romantic'];
  const cultures = ['Delhi, India', 'Tokyo, Japan', 'Paris, France', 'Berlin, Germany'];

  const [filterRole, setFilterRole] = React.useState<string>('');
  const [filterCulture, setFilterCulture] = React.useState<string>('');

  const filteredPersonas = personas.filter(persona => {
    const roleMatch = !filterRole || persona.role === filterRole;
    const cultureMatch = !filterCulture || persona.culture === filterCulture;
    return roleMatch && cultureMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Choose Your AI Persona</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with AI personalities from different cultures and roles. 
            Each persona brings unique perspectives, cultural insights, and communication styles.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterRole('')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                !filterRole 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              )}
            >
              All Roles
            </button>
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  filterRole === role 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                )}
              >
                {role}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCulture('')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                !filterCulture 
                  ? 'bg-accent-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              )}
            >
              All Cultures
            </button>
            {cultures.map(culture => (
              <button
                key={culture}
                onClick={() => setFilterCulture(culture)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  filterCulture === culture 
                    ? 'bg-accent-500 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                )}
              >
                {culture.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredPersonas.map(persona => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isSelected={selectedPersona?.id === persona.id}
              onClick={onPersonaSelect}
            />
          ))}
        </div>

        {/* Start Chat Button */}
        {selectedPersona && (
          <div className="text-center animate-slide-up">
            <div className="inline-flex items-center space-x-4 bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{selectedPersona.avatar}</span>
                <span className="text-lg">{selectedPersona.flag}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedPersona.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPersona.role} from {selectedPersona.culture}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={onStartChat}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span>Start Chatting with {selectedPersona.name}</span>
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.524A11.956 11.956 0 0012 20.25M3 12a9 9 0 1112.907 8.226A8.957 8.957 0 0118 12.75M3 12a8.96 8.96 0 004.906 1.525A11.956 11.956 0 0012 20.25" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaSelection;
