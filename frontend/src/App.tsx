import { useState } from 'react'
import { InterpretationPanel } from './components/InterpretationPanel'
import { ReadingMode } from './components/ReadingMode'
import { PracticeMode } from './components/PracticeMode'
import { DevMode } from './components/DevMode'
import { SpreadLayoutCreator } from './components/SpreadLayoutCreator'
import { StylingPlaybook } from './components/StylingPlaybook'
import { StoryMode } from './components/StoryMode'
import { useCardData } from './hooks/useCardData'

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

type AppMode = 'reading' | 'practice' | 'layout' | 'dev' | 'story'

function App() {
  const [mode, setMode] = useState<AppMode>('reading')
  const [selectedCard, setSelectedCard] = useState<CardInfo | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [currentSpread, setCurrentSpread] = useState<{id: string, name: string} | null>(null)
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false)
  
  // Get shared card data and utilities
  const {
    spreadsConfig,
    availableSpreads,
    getCategoryColor,
    getCategoryName,
    getCardInterpretation,
    getPositionMeaning
  } = useCardData()

  const handleCardClick = (card: CardInfo, _index: number) => {
    setSelectedCard(card)
    setIsPanelOpen(true)
  }

  const handlePanelClose = () => {
    setIsPanelOpen(false)
    setSelectedCard(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            Arcanum
          </h1>
          <p className="text-slate-400 text-lg">Digital Tarot Reader</p>
          
          {/* Mode Navigation */}
          <div className="flex justify-center mt-8 space-x-4">
            <button
              onClick={() => setMode('reading')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                mode === 'reading'
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Reading Mode
            </button>
            <button
              onClick={() => setMode('practice')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                mode === 'practice'
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Practice Mode
            </button>
            <button
              onClick={() => setMode('layout')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                mode === 'layout'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Layout Creator
            </button>
            <button
              onClick={() => setMode('dev')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                mode === 'dev'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Dev Mode
            </button>
            <button
              onClick={() => setMode('story')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                mode === 'story'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Story Mode
            </button>
          </div>
        </div>

        {/* Mode Content */}
        {mode === 'reading' && (
          <ReadingMode
            spreadsConfig={spreadsConfig}
            availableSpreads={availableSpreads}
            onCardClick={handleCardClick}
            getCategoryColor={getCategoryColor}
            getCategoryName={getCategoryName}
            onSpreadChange={setCurrentSpread}
          />
        )}

        {mode === 'practice' && (
          <PracticeMode 
            spreadsConfig={spreadsConfig}
            onCardClick={handleCardClick}
            onSpreadChange={setCurrentSpread}
          />
        )}

        {mode === 'layout' && (
          <SpreadLayoutCreator 
            onExport={(layout) => {
              const output = JSON.stringify(layout, null, 2);
              navigator.clipboard.writeText(output);
              console.log('Exported layout:', layout);
              alert('Layout JSON copied to clipboard!\n\nCheck the console for the full output, or paste from clipboard into your spreads-config.json file.');
            }}
          />
        )}

        {mode === 'dev' && (
          <DevMode />
        )}

        {mode === 'story' && (
          <div className="fixed inset-0 bg-slate-950 z-40">
            <StoryMode onModeChange={setMode} />
          </div>
        )}

        {/* Shared Interpretation Panel */}
        <InterpretationPanel
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
          card={selectedCard}
          interpretation={selectedCard ? getCardInterpretation(selectedCard) : undefined}
          positionMeaning={selectedCard ? getPositionMeaning(selectedCard, currentSpread) : undefined}
        />

        {/* Floating Styling Playbook Button */}
        <button
          onClick={() => setIsPlaybookOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center group z-40"
          title="Design System Playbook"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0a4 4 0 004-4v-4a2 2 0 012-2h4a2 2 0 012 2v4a4 4 0 01-4 4z" />
          </svg>
          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Style Guide
          </span>
        </button>

        {/* Styling Playbook Modal */}
        <StylingPlaybook 
          isOpen={isPlaybookOpen}
          onClose={() => setIsPlaybookOpen(false)}
        />
      </div>
    </div>
  )
}

export default App