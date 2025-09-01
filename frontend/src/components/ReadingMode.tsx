import axios from 'axios'
import { useState, useEffect } from 'react'
import { Button } from '@headlessui/react'
import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { DynamicSpreadRenderer } from './SpreadRenderer'
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
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(null)

  // Notify parent when spread changes
  useEffect(() => {
    onSpreadChange(selectedSpread)
  }, [selectedSpread, onSpreadChange])

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
    if (!selectedSpread) return
    
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
                  onCardClick={onCardClick}
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
  )
}