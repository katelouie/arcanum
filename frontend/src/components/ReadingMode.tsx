import axios from 'axios'
import { useState, useEffect } from 'react'
import { Button } from '@headlessui/react'
import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { DynamicSpreadRenderer } from './SpreadRenderer'
import { TappingRhythm } from './TappingRhythm'
import { MLXIntegrationSection } from './MLXIntegrationSection'
import { ModelSelector } from './ModelSelector'
import ReactMarkdown from 'react-markdown'
import type { SpreadsConfig } from '../types/spreads'

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface ReadingModeProps {
  spreadsConfig: SpreadsConfig | null;
  availableSpreads: {id: string, name: string, category: string}[];
  onCardClick: (card: CardInfo, index: number) => void;
  getCategoryColor: (category: string) => string;
  getCategoryName: (category: string) => string;
  onSpreadChange: (spread: {id: string, name: string} | null) => void;
}

// MLX Tabbed Section Component
function MLXTabbedSection({ reading }: { reading: any }) {
  const [activeTab, setActiveTab] = useState('interpretation')
  
  const tabs = [
    { id: 'interpretation', label: 'AI Reading', icon: '🔮' },
    { id: 'raw-output', label: 'Raw Output', icon: '📄' },
    { id: 'user-prompt', label: 'User Prompt', icon: '❓' },
    { id: 'system-prompt', label: 'System Prompt', icon: '⚙️' }
  ]
  
  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-slate-700">
        <div className="flex space-x-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-violet-400 border-violet-400 bg-slate-800/50'
                  : 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'interpretation' && (
          <div>
            {reading.ai_response ? (
              <>
                <h4 className="text-lg font-semibold text-slate-100 mb-4">AI-Generated Reading</h4>
                <div className="text-slate-200 leading-relaxed prose prose-slate prose-invert max-w-none">
                  <ReactMarkdown>{reading.ai_response.text}</ReactMarkdown>
                </div>
                
                {reading.ai_response && (
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                    <h5 className="text-sm font-medium text-slate-300 mb-2">Generation Metadata</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                      <div>Tokens Generated: {reading.ai_response.tokens_generated}</div>
                      <div>Inference Time: {reading.ai_response.inference_time.toFixed(3)}s</div>
                      <div>Model: {reading.ai_response.model_id}</div>
                      <div>Generated: {reading.ai_response.timestamp}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No AI interpretation available for this reading
              </div>
            )}
          </div>
        )}

        {activeTab === 'raw-output' && (
          <div>
            {reading.ai_response ? (
              <>
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Raw Model Output</h4>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                  {reading.ai_response.raw_text || reading.ai_response.text}
                </div>
                
                <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-600/30">
                  <p className="text-amber-200 text-sm">
                    📄 This shows the complete, unfiltered output from the model before any cleaning or processing.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No raw output available
              </div>
            )}
          </div>
        )}

        {activeTab === 'user-prompt' && (
          <div>
            <h4 className="text-lg font-semibold text-slate-100 mb-4">User Prompt</h4>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-800/50 rounded-lg p-4 overflow-x-auto">
              {reading.full_prompt.user_prompt}
            </pre>
          </div>
        )}

        {activeTab === 'system-prompt' && (
          <div>
            <h4 className="text-lg font-semibold text-slate-100 mb-4">System Prompt</h4>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-800/50 rounded-lg p-4 overflow-x-auto">
              {reading.full_prompt.system_prompt}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReadingMode({ 
  spreadsConfig, 
  availableSpreads, 
  onCardClick, 
  getCategoryColor, 
  getCategoryName,
  onSpreadChange
}: ReadingModeProps) {
  const [question, setQuestion] = useState('')
  const [selectedSpread, setSelectedSpread] = useState<{id: string, name: string} | null>(
    availableSpreads.length > 0 ? availableSpreads[0] : null
  )
  const [includeDate, setIncludeDate] = useState(false)
  const [rhythm, setRhythm] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  // Notify parent when spread changes
  useEffect(() => {
    onSpreadChange(selectedSpread)
  }, [selectedSpread, onSpreadChange])

  const callCardsAPI = async (question: string, spreadType: string, includeDateInSeed: boolean = false, rhythmData: number[] = []) => {
    const response = await axios.post(
      'http://127.0.0.1:8000/api/reading/cards',
      {
        question: question,
        spread_type: spreadType,
        shuffle_count: 7,
        include_date: includeDateInSeed,
        rhythm: rhythmData.length > 0 ? rhythmData : null
      }
    )
    return response.data
  }

  const callAIInterpretationAPI = async (systemPrompt: string, userPrompt: string) => {
    const response = await axios.post(
      'http://127.0.0.1:8000/api/reading/ai-interpretation',
      {
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9
      }
    )
    return response.data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSpread) return
    
    setLoading(true)
    setReading(null) // Clear previous reading
    
    try {
      // Phase 1: Get cards and prompts (fast)
      console.log('Drawing cards...')
      const cardsResult = await callCardsAPI(question, selectedSpread.id, includeDate, rhythm)
      setReading(cardsResult)
      console.log('Cards drawn successfully')
      
      // Phase 2: Generate AI interpretation (slow) - only if we have prompts
      if (cardsResult.full_prompt?.system_prompt && cardsResult.full_prompt?.user_prompt) {
        setAiLoading(true)
        console.log('Generating AI interpretation...')
        
        try {
          const aiResult = await callAIInterpretationAPI(
            cardsResult.full_prompt.system_prompt,
            cardsResult.full_prompt.user_prompt
          )
          
          // Update reading with AI response
          setReading(prev => ({
            ...prev,
            ai_response: aiResult
          }))
          console.log('AI interpretation generated:', aiResult)
        } catch (aiError) {
          console.error('AI interpretation failed:', aiError)
          // Reading still shows cards and prompts even if AI fails
        } finally {
          setAiLoading(false)
        }
      }
      
    } catch (error) {
      console.error('Error getting reading:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Inputs */}
            <div>
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
              <p className="text-xs text-slate-500 mt-2">
                The cards will give you the same reading for identical questions, ensuring consistent guidance. Enable the date option below for fresh daily insights.
              </p>
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

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDate}
                  onChange={(e) => setIncludeDate(e.target.checked)}
                  className="w-4 h-4 text-violet-600 bg-slate-800 border-slate-600 rounded focus:ring-violet-500 focus:ring-2"
                />
                <span className="text-sm text-slate-300">
                  Include date in reading (for daily draws)
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-1 ml-7">
                When enabled, asking the same question on different days will give different results
              </p>
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

            {/* Right Column - Model & Rhythm Controls */}
            <div className="space-y-6">
              <ModelSelector onModelChange={setSelectedModel} />
              
              <div className="border-t border-slate-700 pt-6">
                <TappingRhythm
                  onRhythmCapture={setRhythm}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
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
                  onCardClick={onCardClick}
                />
              ) : (
                <div className="text-center text-slate-400">Loading spread configuration...</div>
              )}
            </div>
          </div>

          {/* MLX Integration Section */}
          {reading && reading.full_prompt && (
            <div className="mt-8 bg-slate-900/30 backdrop-blur border border-slate-700 rounded-xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-700 p-6">
                <h3 className="text-2xl font-bold text-slate-100 mb-2">MLX Model Integration</h3>
              </div>

              {aiLoading ? (
                <div className="text-center py-12 px-6">
                  <div className="w-8 h-8 border-4 border-slate-600 border-t-violet-400 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-300">Generating your reading...</p>
                </div>
              ) : (
                <MLXTabbedSection reading={reading} />
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}