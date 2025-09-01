import { XMarkIcon } from '@heroicons/react/24/outline';

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface InterpretationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardInfo | null;
  interpretation?: {
    general: string;
    upright: string | {
      essence: string;
      keywords: string[];
      psychological: string;
      spiritual: string;
      practical: string;
      shadow: string;
    };
    reversed: string | {
      essence: string;
      keywords: string[];
      psychological: string;
      spiritual: string;
      practical: string;
      shadow: string;
    };
    archetype?: string;
    suit?: string;
  };
  positionMeaning?: string;
}

export function InterpretationPanel({ 
  isOpen, 
  onClose, 
  card, 
  interpretation,
  positionMeaning
}: InterpretationPanelProps) {
  if (!card) return null;

  // Helper function to render enhanced card meaning
  const renderEnhancedMeaning = (meaning: any, isActive: boolean, type: 'upright' | 'reversed') => {
    if (typeof meaning === 'string') {
      // Legacy format
      return (
        <p className="text-slate-300 leading-relaxed">{meaning}</p>
      );
    }

    // Enhanced format
    return (
      <div className="space-y-3">
        <p className="text-slate-200 leading-relaxed font-medium">{meaning.essence}</p>
        
        {meaning.keywords && meaning.keywords.length > 0 && (
          <div>
            <h6 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Keywords</h6>
            <div className="flex flex-wrap gap-1">
              {meaning.keywords.map((keyword: string, idx: number) => (
                <span key={idx} className="px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {meaning.psychological && (
            <div>
              <h6 className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Psychological</h6>
              <p className="text-slate-300 text-sm leading-relaxed">{meaning.psychological}</p>
            </div>
          )}
          
          {meaning.spiritual && (
            <div>
              <h6 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">Spiritual</h6>
              <p className="text-slate-300 text-sm leading-relaxed">{meaning.spiritual}</p>
            </div>
          )}
          
          {meaning.practical && (
            <div>
              <h6 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">Practical</h6>
              <p className="text-slate-300 text-sm leading-relaxed">{meaning.practical}</p>
            </div>
          )}
          
          {meaning.shadow && (
            <div>
              <h6 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Shadow Aspect</h6>
              <p className="text-slate-300 text-sm leading-relaxed">{meaning.shadow}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop overlay - no blur, allows clicks to pass through to cards */}
      <div 
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 pointer-events-none ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Side panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-slate-100">Card Interpretation</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Card Image and Basic Info */}
            <div className="text-center">
              <div className="mb-4">
                <img 
                  src={`http://127.0.0.1:8000${card.image_url}`}
                  alt={card.name}
                  className={`w-32 h-56 object-cover rounded-lg shadow-xl border border-slate-600 mx-auto ${
                    card.reversed ? 'transform rotate-180' : ''
                  }`}
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">{card.name}</h3>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <span className="px-3 py-1 bg-violet-600 text-white text-sm font-medium rounded-full">
                  {card.position}
                </span>
                {card.reversed && (
                  <span className="px-3 py-1 bg-red-900/50 text-red-400 text-sm font-medium rounded-full border border-red-800">
                    Reversed
                  </span>
                )}
                {interpretation?.archetype && (
                  <span className="px-3 py-1 bg-amber-900/50 text-amber-300 text-sm font-medium rounded-full border border-amber-800">
                    {interpretation.archetype.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
                {interpretation?.suit && (
                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 text-sm font-medium rounded-full border border-blue-800">
                    {interpretation.suit.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>
            </div>

            {/* Position Meaning */}
            <div className="bg-gradient-to-r from-violet-900/20 to-indigo-900/20 rounded-lg p-4 border border-violet-500/30">
              <h4 className="text-lg font-semibold text-violet-200 mb-3 flex items-center">
                <span className="mr-2">📍</span>
                Position: {card.position}
              </h4>
              <p className="text-slate-200 leading-relaxed">
                {positionMeaning || "This position represents the specific aspect of your question being addressed."}
              </p>
            </div>

            {/* Card Interpretation */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-100">Card Meaning</h4>
              
              {/* Upright Meaning */}
              <div className={`bg-slate-800/30 rounded-lg p-4 border ${
                !card.reversed ? 'border-green-500/30 bg-green-900/10' : 'border-slate-700/50'
              }`}>
                <h5 className={`font-medium mb-3 flex items-center ${
                  !card.reversed ? 'text-green-400' : 'text-slate-400'
                }`}>
                  Upright Meaning
                  {!card.reversed && <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded-full">Current</span>}
                </h5>
                {renderEnhancedMeaning(
                  interpretation?.upright || "In its upright position, this card encourages you to embrace new opportunities and trust your instincts.",
                  !card.reversed,
                  'upright'
                )}
              </div>

              {/* Reversed Meaning */}
              <div className={`bg-slate-800/30 rounded-lg p-4 border ${
                card.reversed ? 'border-red-500/30 bg-red-900/10' : 'border-slate-700/50'
              }`}>
                <h5 className={`font-medium mb-3 flex items-center ${
                  card.reversed ? 'text-red-400' : 'text-slate-400'
                }`}>
                  Reversed Meaning
                  {card.reversed && <span className="ml-2 text-xs bg-red-600 px-2 py-1 rounded-full">Current</span>}
                </h5>
                {renderEnhancedMeaning(
                  interpretation?.reversed || "When reversed, this card may indicate blocked energy, delays, or the need for inner reflection.",
                  card.reversed,
                  'reversed'
                )}
              </div>
            </div>

            {/* Future LLM Integration Placeholder */}
            <div className="bg-gradient-to-r from-violet-900/20 to-indigo-900/20 rounded-lg p-4 border border-violet-700/30">
              <h5 className="font-medium text-violet-300 mb-2">Personalized Insight</h5>
              <p className="text-slate-400 text-sm italic">
                Enhanced AI interpretation coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}