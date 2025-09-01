import axios from 'axios'
import { useState, useEffect } from 'react'
import { Button } from '@headlessui/react'
import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { InterpretationPanel } from './components/InterpretationPanel'
import { DynamicSpreadRenderer } from './components/SpreadRenderer'
import { PracticeMode } from './components/PracticeMode'
import type { SpreadsConfig } from './types/spreads'

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

type AppMode = 'reading' | 'practice'

function App() {
  const [mode, setMode] = useState<AppMode>('reading')
  const [question, setQuestion] = useState('')
  const [selectedSpread, setSelectedSpread] = useState<{id: string, name: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(null)
  const [selectedCard, setSelectedCard] = useState<CardInfo | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [interpretations, setInterpretations] = useState(null)
  const [enhancedCards, setEnhancedCards] = useState(null)
  const [spreadsConfig, setSpreadsConfig] = useState<SpreadsConfig | null>(null)
  const [availableSpreads, setAvailableSpreads] = useState<{id: string, name: string, category: string}[]>([])

  // Category colors for spread labels
  const getCategoryColor = (category: string) => {
    const colors = {
      'simple': 'bg-green-500/20 text-green-300 border-green-500/30',
      'timeline': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'decision': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'relationship': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'wellness': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'comprehensive': 'bg-red-500/20 text-red-300 border-red-500/30'
    }
    return colors[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  const getCategoryName = (category: string) => {
    const names = {
      'simple': 'Simple',
      'timeline': 'Timeline',
      'decision': 'Decision',
      'relationship': 'Relationship',
      'wellness': 'Wellness',
      'comprehensive': 'Comprehensive'
    }
    return names[category] || category
  }

  // Load interpretations and spreads config on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load interpretations (legacy)
        const interpretationsResponse = await axios.get('http://127.0.0.1:8000/api/interpretations')
        setInterpretations(interpretationsResponse.data)

        // Load enhanced cards data
        const enhancedCardsResponse = await axios.get('http://127.0.0.1:8000/api/enhanced-cards')
        setEnhancedCards(enhancedCardsResponse.data)

        // Load spreads configuration
        const spreadsResponse = await axios.get('http://127.0.0.1:8000/api/spreads')
        const config: SpreadsConfig = spreadsResponse.data
        setSpreadsConfig(config)

        // Extract available spreads for dropdown with categories
        const spreads = config.spreads.map(spread => ({
          id: spread.id,
          name: spread.name,
          category: spread.category
        }))
        setAvailableSpreads(spreads)
        
        // Set default selected spread
        if (spreads.length > 0) {
          setSelectedSpread(spreads[0])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  const handleCardClick = (card: CardInfo, index: number) => {
    setSelectedCard(card)
    setIsPanelOpen(true)
  }

  const handlePanelClose = () => {
    setIsPanelOpen(false)
    setSelectedCard(null)
  }

  const getEnhancedCardInterpretation = (card: CardInfo) => {
    if (!enhancedCards) return undefined

    // Convert card name to the key format used in enhanced cards (e.g., "The Fool" -> "the_fool")
    const cardKey = card.name.toLowerCase().replace(/\\s+/g, '_').replace(/[^\\w_]/g, '').replace(/&/g, 'and')
    const cardData = enhancedCards[cardKey]

    if (cardData && cardData.core_meanings) {
      const upright = cardData.core_meanings.upright
      const reversed = cardData.core_meanings.reversed
      
      return {
        general: upright.essence || `${card.name} represents a powerful energy in your reading.`,
        upright: {
          essence: upright.essence,
          keywords: upright.keywords,
          psychological: upright.psychological,
          spiritual: upright.spiritual,
          practical: upright.practical,
          shadow: upright.shadow
        },
        reversed: {
          essence: reversed.essence,
          keywords: reversed.keywords,
          psychological: reversed.psychological,
          spiritual: reversed.spiritual,
          practical: reversed.practical,
          shadow: reversed.shadow
        },
        archetype: cardData.archetype,
        suit: cardData.suit
      }
    }
    return undefined
  }

  const getCardInterpretation = (card: CardInfo) => {
    // Try enhanced cards first, fallback to legacy interpretations
    const enhanced = getEnhancedCardInterpretation(card)
    if (enhanced) return enhanced

    if (!interpretations) return undefined
    
    const cardData = interpretations.cards[card.name]
    
    if (cardData) {
      return {
        general: cardData.general,
        upright: cardData.upright,
        reversed: cardData.reversed
      }
    } else {
      // Provide fallback interpretation if card not found in data
      return {
        general: `${card.name} represents a powerful energy in your reading that invites reflection and growth.`,
        upright: 'This card in its upright position brings positive energy and clear guidance to your situation.',
        reversed: 'When reversed, this card suggests the need for patience, reflection, or a different approach.'
      }
    }
  }

  const getPositionMeaning = (card: CardInfo) => {
    if (!spreadsConfig || !selectedSpread) {
      return "This position represents a specific aspect of your reading."
    }
    
    // Find the spread configuration
    const spread = spreadsConfig.spreads.find(s => s.id === selectedSpread.id)
    if (!spread) {
      return "This position represents a specific aspect of your reading."
    }
    
    // Find the position by name
    const position = spread.positions.find(p => p.name === card.position)
    if (position) {
      // Use detailed_description if available, fallback to short_description or description
      return position.detailed_description || position.short_description || position.description || "This position represents a specific aspect of your reading."
    } else {
      return `The ${card.position} position represents a specific aspect of your reading that provides insight into your situation.`
    }
  }

  const callTarotAPI = async (question: string, spreadType: string) => {
    const response = await axios.post(
      'http://127.0.0.1:8000/api/reading',
      {
        question: question,
        spread_type: spreadType,
        shuffle_count: 7,
        include_date: false
      }
    )
    return response.data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await callTarotAPI(question, selectedSpread.id)
      setReading(result)
      console.log('Reading result:', result)
    } catch (error) {
      console.error('Error getting reading:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            Arcanum
          </h1>
          <p className="text-slate-400 text-lg">Digital Tarot Reader</p>
          
          {/* Navigation */}
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
          </div>
        </div>

        {mode === 'reading' && (
          <>
            <div className="max-w-md mx-auto">
              <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="question" className="block text-sm font-medium text-slate-200 mb-3">
                      What question would you like to ask the cards?
                    </label>
                    <input
                      id="question"
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="w-full p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      placeholder="Enter your question..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-3">
                      Choose your spread:
                    </label>
                    <Listbox value={selectedSpread} onChange={setSelectedSpread}>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-slate-800 border border-slate-700 py-4 pl-4 pr-10 text-left text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500">
                          {selectedSpread ? (
                            <div className="flex items-center justify-between pr-6">
                              <span className="block truncate">{selectedSpread.name}</span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-md border ${getCategoryColor(selectedSpread.category)}`}>
                                {getCategoryName(selectedSpread.category)}
                              </span>
                            </div>
                          ) : (
                            <span className="block truncate">Loading spreads...</span>
                          )}
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronUpDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg bg-slate-800 border border-slate-700 py-1 shadow-xl">
                          {availableSpreads.map((spread) => (
                            <Listbox.Option
                              key={spread.id}
                              className={({ active }) =>
                                `relative cursor-default select-none py-3 pl-10 pr-4 ${
                                  active ? 'bg-violet-600 text-white' : 'text-slate-100'
                                }`
                              }
                              value={spread}
                            >
                              {({ selected }) => (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                      {spread.name}
                                    </span>
                                    <span className={`ml-2 px-2 py-1 text-xs rounded-md border ${getCategoryColor(spread.category)}`}>
                                      {getCategoryName(spread.category)}
                                    </span>
                                  </div>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-violet-400">
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Drawing Cards...' : 'Draw Cards'}
                  </Button>
                </form>
              </div>
            </div>

            {reading && (
              <div className="mt-16 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-100 mb-2">
                    Your Reading
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 mx-auto rounded-full"></div>
                </div>
                
                <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 shadow-2xl">
                  <div className="mb-8 text-center">
                    <p className="text-xl font-medium text-slate-100 mb-2">"{reading.question}"</p>
                    <p className="text-slate-400">{reading.spread_name}</p>
                  </div>
                  
                  <div className="py-8">
                    {spreadsConfig && selectedSpread ? (
                      <DynamicSpreadRenderer
                        spreadId={selectedSpread.id}
                        spreadsConfig={spreadsConfig}
                        cards={reading.cards}
                        onCardClick={handleCardClick}
                      />
                    ) : (
                      <div className="text-center text-slate-400">Loading spread configuration...</div>
                    )}
                  </div>
                </div>

                {/* Reading Interpretation Section */}
                {reading.interpretation && (
                  <div className="mt-8 bg-slate-900/30 backdrop-blur border border-slate-700 rounded-xl p-8 shadow-xl">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-slate-100 mb-2">
                        Reading Interpretation
                      </h3>
                      <div className="w-16 h-0.5 bg-gradient-to-r from-violet-400 to-indigo-400 mx-auto rounded-full"></div>
                    </div>
                    
                    <div className="prose prose-invert prose-slate max-w-none">
                      <div 
                        className="text-slate-200 leading-relaxed text-base space-y-4"
                        dangerouslySetInnerHTML={{
                          __html: reading.interpretation
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em class="text-violet-300">$1</em>')
                            .replace(/---/g, '<hr class="border-slate-600 my-6" />')
                            .replace(/\n\n/g, '</p><p class="mb-4">')
                            .replace(/^(.)/gm, '<p class="mb-4">$1')
                            .replace(/<p class="mb-4">$/, '')
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {mode === 'practice' && (
          <PracticeMode 
            spreadsConfig={spreadsConfig}
            onCardClick={handleCardClick}
          />
        )}

        {/* Interpretation Panel */}
        <InterpretationPanel
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
          card={selectedCard}
          interpretation={selectedCard ? getCardInterpretation(selectedCard) : undefined}
          positionMeaning={selectedCard ? getPositionMeaning(selectedCard) : undefined}
        />
      </div>
    </div>
  )
}

export default App