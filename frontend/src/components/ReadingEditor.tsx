import { useState, useEffect } from 'react'
import { StyledListbox } from './ui/StyledListbox'
import ReactMarkdown from 'react-markdown'
import { useCardData } from '../hooks/useCardData'

interface TrainingReading {
  reading_id: string
  spread_id: string
  spread_name: string
  question_category: string
  question: string
  cards: Array<{
    position_name: string
    position_index: number
    card_name: string
    orientation: string
  }>
  source: 'common' | 'special'
  has_interpretation: boolean
  spread_config?: any
}

interface InterpretationData {
  reading_id: string
  interpretation: string
  notes: string
  status: 'not_started' | 'draft' | 'completed'
  created_at?: string
  updated_at?: string
  source_file?: string
}

interface ReadingEditorProps {
  reading: TrainingReading
  onClose: () => void
}

export function ReadingEditor({ reading, onClose }: ReadingEditorProps) {
  const [interpretation, setInterpretation] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'not_started' | 'draft' | 'completed'>('not_started')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  
  // Get card data for enhanced information
  const { spreadsConfig, getCardInterpretation } = useCardData()
  
  // Computed property: read-only when status is 'completed'
  const isReadOnly = status === 'completed'

  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'draft', label: 'Draft' },
    { value: 'completed', label: 'Completed' }
  ]

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus as any)
    
    // For read-only files or any status change, update via API
    try {
      const response = await fetch(`/api/dev/training-readings/${reading.reading_id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      // Revert status on error
      setStatus(status)
    }
  }
  const [sourceFile, setSourceFile] = useState<string | null>(null)
  const [contextString, setContextString] = useState<string | null>(null)
  const [contextExpanded, setContextExpanded] = useState(false)
  const [contextLoading, setContextLoading] = useState(false)

  useEffect(() => {
    loadExistingInterpretation()
    loadContextString()
  }, [reading.reading_id])

  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [interpretation, notes, status])

  const loadExistingInterpretation = async () => {
    try {
      const response = await fetch(`/api/dev/training-readings/${reading.reading_id}/interpretation`)
      const data: InterpretationData = await response.json()
      
      setInterpretation(data.interpretation || '')
      setNotes(data.notes || '')
      setStatus(data.status || 'not_started')
      setHasUnsavedChanges(false)
      
      // Store source file information but allow editing
      if (data.source_file) {
        setSourceFile(data.source_file)
      }
      
      if (data.updated_at) {
        setLastSaved(new Date(data.updated_at).toLocaleString())
      }
    } catch (error) {
      console.error('Failed to load existing interpretation:', error)
    }
  }

  const loadContextString = async () => {
    setContextLoading(true)
    try {
      const response = await fetch(`/api/dev/training-readings/${reading.reading_id}/context`)
      if (response.ok) {
        const data = await response.text()
        setContextString(data)
      }
    } catch (error) {
      console.error('Failed to load context string:', error)
    } finally {
      setContextLoading(false)
    }
  }

  const saveInterpretation = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/dev/training-readings/${reading.reading_id}/interpretation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interpretation,
          notes,
          status
        }),
      })

      if (response.ok) {
        setLastSaved(new Date().toLocaleString())
        setHasUnsavedChanges(false)
      } else {
        throw new Error('Failed to save interpretation')
      }
    } catch (error) {
      console.error('Failed to save interpretation:', error)
      alert('Failed to save interpretation. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoSave = () => {
    if (hasUnsavedChanges && !saving) {
      saveInterpretation()
    }
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(handleAutoSave, 30000)
    return () => clearInterval(interval)
  }, [hasUnsavedChanges, saving])

  const getCardColor = (orientation: string) => {
    return orientation === 'Reversed' ? 'text-red-400' : 'text-green-400'
  }

  const toggleCardExpanded = (cardIndex: number) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(cardIndex)) {
      newExpanded.delete(cardIndex)
    } else {
      newExpanded.add(cardIndex)
    }
    setExpandedCards(newExpanded)
  }

  const getPositionDescription = (positionName: string) => {
    try {
      if (!spreadsConfig) return "Loading position information..."
      
      const spread = spreadsConfig.spreads.find(s => s.id === reading.spread_id)
      if (!spread) return "Position information not available."
      
      const position = spread.positions.find(p => p.name === positionName)
      return position?.detailed_description || position?.short_description || position?.description || "Position description not available."
    } catch (error) {
      console.error("Error getting position description:", error)
      return "Unable to load position description."
    }
  }

  const renderSpreadInfo = () => {
    if (reading.spread_config) {
      return (
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-2">Custom Spread: {reading.spread_config.name}</h4>
          <p className="text-slate-300 text-sm mb-3">{reading.spread_config.description}</p>
          <div className="space-y-2">
            {reading.spread_config.positions?.map((position: any, index: number) => (
              <div key={index} className="text-sm">
                <span className="font-medium text-slate-200">{position.name}:</span>
                <span className="text-slate-400 ml-2">{position.short_description}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onClose}
            className="flex items-center text-slate-400 hover:text-slate-200 transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Readings
          </button>
          <h2 className="text-2xl font-bold text-orange-400 mb-1">
            {reading.reading_id}
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className={`px-2 py-1 rounded font-medium ${
              reading.source === 'common' 
                ? 'bg-blue-900 text-blue-200' 
                : 'bg-purple-900 text-purple-200'
            }`}>
              {reading.source}
            </span>
            <span className="px-2 py-1 rounded font-medium bg-slate-700 text-slate-300">
              {reading.spread_name}
            </span>
            <span className="text-orange-300">{reading.question_category}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-40">
            <StyledListbox
              value={status}
              onChange={handleStatusChange}
              options={statusOptions}
              size="md"
              disabled={saving}
            />
          </div>
          
          {!isReadOnly && (
            <button
              onClick={saveInterpretation}
              disabled={saving || !hasUnsavedChanges}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                saving || !hasUnsavedChanges
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          
          {isReadOnly && (
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-900/30 text-violet-300 rounded text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completed
            </div>
          )}
        </div>
      </div>

      {lastSaved && (
        <div className="text-sm text-slate-400">
          Last saved: {lastSaved}
          {hasUnsavedChanges && <span className="text-yellow-400 ml-2">• Unsaved changes</span>}
        </div>
      )}

      {sourceFile && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">
              Source file: <code className="bg-blue-900/40 px-1 rounded">{sourceFile.split('/').pop()}</code>
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading Details */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Question</h3>
            <p className="text-slate-100 leading-relaxed">{reading.question}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Cards Drawn</h3>
            <div className="space-y-3">
              {reading.cards.map((card, index) => {
                const cardInfo = {
                  name: card.card_name,
                  position: card.position_name,
                  reversed: card.orientation === 'Reversed',
                  image_url: ''
                }
                
                let cardInterpretation
                try {
                  cardInterpretation = getCardInterpretation(cardInfo)
                } catch (error) {
                  console.error("Error getting card interpretation:", error)
                  cardInterpretation = null
                }
                
                const isExpanded = expandedCards.has(index)

                return (
                  <div key={index} className="border border-slate-700 rounded-lg overflow-hidden">
                    {/* Card Header - Always Visible */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => toggleCardExpanded(index)}
                    >
                      <div>
                        <div className="font-medium text-slate-200">{card.position_name}</div>
                        <div className="text-sm text-slate-400">Position {card.position_index + 1}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`font-medium ${getCardColor(card.orientation)}`}>
                            {card.card_name}
                          </div>
                          <div className="text-sm text-slate-400">{card.orientation}</div>
                        </div>
                        <div className="text-slate-400">
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-700 p-4 bg-slate-900/50">
                        <div className="space-y-4">
                          {/* Position Description */}
                          <div>
                            <h4 className="text-sm font-semibold text-violet-400 mb-2">Position Meaning</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {getPositionDescription(card.position_name)}
                            </p>
                          </div>

                          {/* Card Interpretation */}
                          {cardInterpretation && (
                            <div>
                              <h4 className="text-sm font-semibold text-violet-400 mb-2">Card Meaning</h4>
                              <div className="space-y-3">
                                {/* Upright/Reversed Meaning */}
                                <div>
                                  <h5 className="text-xs font-medium text-slate-400 mb-1">
                                    {card.orientation === 'Reversed' ? 'Reversed' : 'Upright'} Meaning
                                  </h5>
                                  {card.orientation === 'Reversed' ? (
                                    <div className="space-y-2">
                                      {cardInterpretation.reversed?.essence && (
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                          <span className="font-medium">Essence:</span> {cardInterpretation.reversed.essence}
                                        </p>
                                      )}
                                      {cardInterpretation.reversed?.keywords && (
                                        <div>
                                          <span className="text-xs font-medium text-slate-400">Keywords: </span>
                                          <span className="text-sm text-red-300">
                                            {Array.isArray(cardInterpretation.reversed.keywords) 
                                              ? cardInterpretation.reversed.keywords.join(', ')
                                              : cardInterpretation.reversed.keywords}
                                          </span>
                                        </div>
                                      )}
                                      {cardInterpretation.reversed?.psychological && (
                                        <p className="text-sm text-slate-300">
                                          <span className="font-medium">Psychological:</span> {cardInterpretation.reversed.psychological}
                                        </p>
                                      )}
                                      {cardInterpretation.reversed?.spiritual && (
                                        <p className="text-sm text-slate-300">
                                          <span className="font-medium">Spiritual:</span> {cardInterpretation.reversed.spiritual}
                                        </p>
                                      )}
                                      {cardInterpretation.reversed?.practical && (
                                        <p className="text-sm text-slate-300">
                                          <span className="font-medium">Practical:</span> {cardInterpretation.reversed.practical}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {cardInterpretation.upright?.essence && (
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                          <span className="font-medium">Essence:</span> {cardInterpretation.upright.essence}
                                        </p>
                                      )}
                                      {cardInterpretation.upright?.keywords && (
                                        <div>
                                          <span className="text-xs font-medium text-slate-400">Keywords: </span>
                                          <span className="text-sm text-green-300">
                                            {Array.isArray(cardInterpretation.upright.keywords) 
                                              ? cardInterpretation.upright.keywords.join(', ')
                                              : cardInterpretation.upright.keywords}
                                          </span>
                                        </div>
                                      )}
                                      {cardInterpretation.upright?.psychological && (
                                        <p className="text-sm text-slate-300">
                                          <span className="font-medium">Psychological:</span> {cardInterpretation.upright.psychological}
                                        </p>
                                      )}
                                      {cardInterpretation.upright?.spiritual && (
                                        <p className="text-sm text-slate-300">
                                          <span className="font-medium">Spiritual:</span> {cardInterpretation.upright.spiritual}
                                        </p>
                                      )}
                                      {cardInterpretation.upright?.practical && (
                                        <p className="text-sm text-slate-300">
                                          <span className="font-medium">Practical:</span> {cardInterpretation.upright.practical}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {renderSpreadInfo()}

          {/* Context String Display */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setContextExpanded(!contextExpanded)}
            >
              <h3 className="text-lg font-semibold">Generated Context String</h3>
              <div className="flex items-center gap-2">
                {contextLoading && (
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <svg 
                  className={`w-5 h-5 text-slate-400 transform transition-transform ${contextExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {contextExpanded && (
              <div className="mt-4 border-t border-slate-700 pt-4">
                <div className="text-sm text-slate-400 mb-3">
                  This is the exact context string sent to the LLM for training on this reading.
                </div>
                {contextString ? (
                  <pre className="text-xs bg-slate-900 rounded p-3 overflow-x-auto text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto border border-slate-700">
                    {contextString.replace(/\\n/g, '\n')}
                  </pre>
                ) : (
                  <div className="text-slate-400 text-sm italic">
                    Context string not available for this reading
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Interpretation Editor */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">
              {isReadOnly ? 'Interpretation' : 'Full Reading Interpretation'}
            </h3>
            
            {isReadOnly ? (
              <div className="w-full min-h-80 px-4 py-3 bg-slate-800/40 border border-slate-600 rounded text-slate-100 prose prose-invert max-w-none
                prose-headings:text-violet-400 prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-2xl prose-h1:mb-6 prose-h1:text-violet-300
                prose-h2:text-xl prose-h2:mb-4 prose-h2:text-violet-400 prose-h2:border-b prose-h2:border-slate-700 prose-h2:pb-2
                prose-h3:text-lg prose-h3:mb-3 prose-h3:text-violet-400
                prose-p:text-slate-200 prose-p:leading-relaxed prose-p:mb-4
                prose-strong:text-violet-300 prose-strong:font-semibold
                prose-em:text-orange-300 prose-em:italic
                prose-ul:text-slate-200 prose-ol:text-slate-200 prose-ul:space-y-2 prose-ol:space-y-2
                prose-li:text-slate-200 prose-li:leading-relaxed prose-li:marker:text-violet-400
                prose-blockquote:border-l-violet-500 prose-blockquote:border-l-4 
                prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:text-slate-300 prose-blockquote:italic prose-blockquote:bg-violet-500/5
                prose-code:bg-slate-700 prose-code:text-orange-300 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-600 prose-pre:p-4 prose-pre:rounded-lg
                prose-hr:border-slate-600 prose-hr:my-8
                prose-a:text-violet-400 prose-a:underline prose-a:decoration-violet-400/50 hover:prose-a:decoration-violet-400">
                <ReactMarkdown>
                  {interpretation}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                placeholder="Write the complete interpretation for this reading..."
                className="w-full h-80 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            )}
            
            <div className="mt-2 text-sm text-slate-400">
              {interpretation.length} characters
              {isReadOnly && <span className="ml-2 text-violet-400">• Rendered as markdown</span>}
              {sourceFile && <span className="ml-2 text-blue-400">• Originally from {sourceFile.split('/').pop()}</span>}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Notes & Context</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about interpretation approach, context, or reminders..."
              className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              readOnly={isReadOnly}
            />
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Writing Guidelines</h3>
            <div className="text-sm text-slate-300 space-y-2">
              <p>• Write in a compassionate, insightful tone</p>
              <p>• Address the specific question asked</p>
              <p>• Connect cards to their positions meaningfully</p>
              <p>• Consider reversed cards' shadow meanings</p>
              <p>• Provide actionable guidance where appropriate</p>
              <p>• Aim for 200-400 words for comprehensive coverage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}