import { useState, useEffect } from 'react'

interface Card {
  position_name: string
  position_index: number
  card_name: string
  orientation: string
}

interface Spread {
  id: string
  name: string
  description: string
  positions: Array<{
    name: string
    short_description: string
    detailed_description: string
    keywords: string[]
  }>
}

interface CustomPosition {
  name: string
  short_description: string
  detailed_description?: string
  x: number
  y: number
  rotation?: number
  zIndex?: number
  keywords?: string[]
}

interface CustomSpreadConfig {
  name: string
  description: string
  positions: CustomPosition[]
}

interface ReadingCreatorProps {
  onClose: () => void
}

const QUESTION_CATEGORIES = [
  'Love & Relationships',
  'Career & Finance', 
  'Health & Wellness',
  'Spiritual Growth',
  'Creative & Expression',
  'Family & Home',
  'Personal Development',
  'Decision Making',
  'Life Transitions',
  'General Guidance'
]

const MAJOR_ARCANA = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
  'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
  'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
  'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
  'Judgement', 'The World'
]

const MINOR_ARCANA = {
  'Wands': ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'],
  'Cups': ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'],
  'Swords': ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'],
  'Pentacles': ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King']
}

export function ReadingCreator({ onClose }: ReadingCreatorProps) {
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Spread Selection/Creation, 3: Card Selection, 4: Review
  const [loading, setLoading] = useState(false)
  const [spreads, setSpreads] = useState<Spread[]>([])
  const [isCustomSpread, setIsCustomSpread] = useState(false)
  
  // Form state
  const [question, setQuestion] = useState('')
  const [questionCategory, setQuestionCategory] = useState('')
  const [selectedSpreadId, setSelectedSpreadId] = useState('')
  const [selectedSpread, setSelectedSpread] = useState<Spread | null>(null)
  const [customSpreadConfig, setCustomSpreadConfig] = useState<CustomSpreadConfig | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [cardSearch, setCardSearch] = useState('')
  
  // Load spreads on mount
  useEffect(() => {
    loadSpreads()
  }, [])

  const loadSpreads = async () => {
    try {
      // Load spreads config from backend
      const response = await fetch('/api/dev/spreads')
      const data = await response.json()
      setSpreads(data.spreads || [])
    } catch (error) {
      console.error('Failed to load spreads:', error)
    }
  }

  const generateAllCards = () => {
    const allCards = [...MAJOR_ARCANA]
    
    Object.entries(MINOR_ARCANA).forEach(([suit, ranks]) => {
      ranks.forEach(rank => {
        allCards.push(`${rank} of ${suit}`)
      })
    })
    
    return allCards.sort()
  }

  const filteredCards = generateAllCards().filter(card =>
    card.toLowerCase().includes(cardSearch.toLowerCase())
  )

  const handleSpreadSelect = (spreadId: string) => {
    setSelectedSpreadId(spreadId)
    const spread = spreads.find(s => s.id === spreadId)
    setSelectedSpread(spread || null)
    
    if (spread) {
      // Initialize cards array with positions
      const initialCards: Card[] = spread.positions.map((position, index) => ({
        position_name: position.name,
        position_index: index,
        card_name: '',
        orientation: 'Upright'
      }))
      setCards(initialCards)
    }
  }

  const updateCard = (index: number, field: keyof Card, value: string) => {
    const newCards = [...cards]
    newCards[index] = { ...newCards[index], [field]: value }
    setCards(newCards)
  }

  const canProceedToStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 2: return question.trim() && questionCategory
      case 3: return (selectedSpreadId && selectedSpread) || (isCustomSpread && customSpreadConfig)
      case 4: return cards.every(card => card.card_name.trim())
      default: return true
    }
  }

  const handleCustomSpreadCreation = () => {
    setIsCustomSpread(true)
    setSelectedSpreadId('')
    setSelectedSpread(null)
    
    // Initialize with a basic 3-card custom spread
    const initialCustomSpread: CustomSpreadConfig = {
      name: 'Custom Spread',
      description: 'A custom spread for this reading',
      positions: [
        { name: 'Position 1', short_description: 'First position', x: 25, y: 50 },
        { name: 'Position 2', short_description: 'Second position', x: 50, y: 50 },
        { name: 'Position 3', short_description: 'Third position', x: 75, y: 50 }
      ]
    }
    
    setCustomSpreadConfig(initialCustomSpread)
    
    // Initialize cards for the custom spread
    const initialCards: Card[] = initialCustomSpread.positions.map((position, index) => ({
      position_name: position.name,
      position_index: index,
      card_name: '',
      orientation: 'Upright'
    }))
    setCards(initialCards)
  }
  
  const updateCustomSpread = (field: keyof CustomSpreadConfig, value: any) => {
    if (!customSpreadConfig) return
    
    const updated = { ...customSpreadConfig, [field]: value }
    setCustomSpreadConfig(updated)
    
    // If positions changed, update cards array
    if (field === 'positions') {
      const newCards: Card[] = value.map((position: CustomPosition, index: number) => ({
        position_name: position.name,
        position_index: index,
        card_name: cards[index]?.card_name || '',
        orientation: cards[index]?.orientation || 'Upright'
      }))
      setCards(newCards)
    }
  }
  
  const addCustomPosition = () => {
    if (!customSpreadConfig) return
    
    const newPosition: CustomPosition = {
      name: `Position ${customSpreadConfig.positions.length + 1}`,
      short_description: 'New position',
      x: 50,
      y: 50
    }
    
    const updatedPositions = [...customSpreadConfig.positions, newPosition]
    updateCustomSpread('positions', updatedPositions)
  }
  
  const removeCustomPosition = (index: number) => {
    if (!customSpreadConfig || customSpreadConfig.positions.length <= 1) return
    
    const updatedPositions = customSpreadConfig.positions.filter((_, i) => i !== index)
    updateCustomSpread('positions', updatedPositions)
  }
  
  const updateCustomPosition = (index: number, field: keyof CustomPosition, value: any) => {
    if (!customSpreadConfig) return
    
    const updatedPositions = [...customSpreadConfig.positions]
    updatedPositions[index] = { ...updatedPositions[index], [field]: value }
    updateCustomSpread('positions', updatedPositions)
  }

  const handleSubmit = async () => {
    if (!canProceedToStep(4)) return
    
    setLoading(true)
    try {
      const readingData = {
        question,
        question_category: questionCategory,
        spread_id: isCustomSpread ? 'custom-ephemeral' : selectedSpreadId,
        spread_name: isCustomSpread ? customSpreadConfig?.name : selectedSpread?.name,
        cards: cards.map(card => ({
          position_name: card.position_name,
          position_index: card.position_index,
          card_name: card.card_name,
          orientation: card.orientation
        })),
        spread_config: isCustomSpread ? customSpreadConfig : null
      }

      const response = await fetch('/api/dev/training-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readingData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Reading created:', result)
        onClose()
      } else {
        throw new Error('Failed to create reading')
      }
    } catch (error) {
      console.error('Failed to create reading:', error)
      alert('Failed to create reading. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step === stepNumber 
              ? 'bg-orange-600 text-white' 
              : step > stepNumber 
              ? 'bg-green-600 text-white'
              : 'bg-slate-600 text-slate-300'
          }`}>
            {step > stepNumber ? '✓' : stepNumber}
          </div>
          {stepNumber < 4 && (
            <div className={`w-12 h-1 mx-2 ${
              step > stepNumber ? 'bg-green-600' : 'bg-slate-600'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Reading Question</h3>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter the question for this reading..."
          className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">Question Category</h3>
        <select
          value={questionCategory}
          onChange={(e) => setQuestionCategory(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Select a category...</option>
          {QUESTION_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Choose or Create Spread</h3>
        <button
          onClick={handleCustomSpreadCreation}
          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Custom
        </button>
      </div>
      
      {!isCustomSpread ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spreads.map(spread => (
              <div
                key={spread.id}
                onClick={() => handleSpreadSelect(spread.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSpreadId === spread.id
                    ? 'border-orange-500 bg-orange-900/20'
                    : 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <h4 className="font-semibold text-slate-100 mb-2">{spread.name}</h4>
                <p className="text-sm text-slate-400 mb-3">{spread.description}</p>
                <div className="text-xs text-slate-500">
                  {spread.positions.length} positions
                </div>
              </div>
            ))}
          </div>
          
          {selectedSpread && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Positions in {selectedSpread.name}</h4>
              <div className="space-y-2">
                {selectedSpread.positions.map((position, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-slate-200">{position.name}:</span>
                    <span className="text-slate-400 ml-2">{position.short_description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                setIsCustomSpread(false)
                setCustomSpreadConfig(null)
                setCards([])
              }}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Preset Spreads
            </button>
          </div>
          
          {customSpreadConfig && (
            <>
              <div className="bg-slate-800 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold mb-3">Custom Spread Details</h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={customSpreadConfig.name}
                    onChange={(e) => updateCustomSpread('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={customSpreadConfig.description}
                    onChange={(e) => updateCustomSpread('description', e.target.value)}
                    className="w-full h-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Card Positions</h4>
                  <button
                    onClick={addCustomPosition}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    Add Position
                  </button>
                </div>
                
                <div className="space-y-4">
                  {customSpreadConfig.positions.map((position, index) => (
                    <div key={index} className="bg-slate-700 rounded p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-slate-200">Position {index + 1}</h5>
                        {customSpreadConfig.positions.length > 1 && (
                          <button
                            onClick={() => removeCustomPosition(index)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-slate-300 mb-1">Name</label>
                          <input
                            type="text"
                            value={position.name}
                            onChange={(e) => updateCustomPosition(index, 'name', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-slate-300 mb-1">Description</label>
                          <input
                            type="text"
                            value={position.short_description}
                            onChange={(e) => updateCustomPosition(index, 'short_description', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-slate-300 mb-1">X Position (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={position.x}
                            onChange={(e) => updateCustomPosition(index, 'x', parseFloat(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-slate-300 mb-1">Y Position (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={position.y}
                            onChange={(e) => updateCustomPosition(index, 'y', parseFloat(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Select Cards</h3>
      
      <div className="mb-4">
        <input
          type="text"
          value={cardSearch}
          onChange={(e) => setCardSearch(e.target.value)}
          placeholder="Search cards..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div key={index} className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-200">{card.position_name}</h4>
                {selectedSpread && (
                  <p className="text-sm text-slate-400">
                    {selectedSpread.positions[index]?.short_description}
                  </p>
                )}
              </div>
              <select
                value={card.orientation}
                onChange={(e) => updateCard(index, 'orientation', e.target.value)}
                className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Upright">Upright</option>
                <option value="Reversed">Reversed</option>
              </select>
            </div>
            
            <select
              value={card.card_name}
              onChange={(e) => updateCard(index, 'card_name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a card...</option>
              {filteredCards.map(cardName => (
                <option key={cardName} value={cardName}>{cardName}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Review Reading</h3>
      
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Question</h4>
        <p className="text-slate-300 mb-4">{question}</p>
        
        <h4 className="font-semibold mb-2">Category</h4>
        <p className="text-slate-300 mb-4">{questionCategory}</p>
        
        <h4 className="font-semibold mb-2">Spread</h4>
        <p className="text-slate-300 mb-4">
          {isCustomSpread ? `${customSpreadConfig?.name} (Custom)` : selectedSpread?.name}
        </p>
        
        <h4 className="font-semibold mb-2">Cards</h4>
        <div className="space-y-2">
          {cards.map((card, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
              <div>
                <span className="font-medium text-slate-200">{card.position_name}</span>
              </div>
              <div className="text-right">
                <span className={`font-medium ${card.orientation === 'Reversed' ? 'text-red-400' : 'text-green-400'}`}>
                  {card.card_name}
                </span>
                <div className="text-sm text-slate-400">{card.orientation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )


  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
          <h2 className="text-2xl font-bold text-orange-400">
            Create New Reading
          </h2>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="bg-slate-800 rounded-lg p-6 min-h-96">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            step === 1
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          Previous
        </button>

        <div className="text-sm text-slate-400">
          Step {step} of 4
        </div>

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceedToStep(step + 1)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              canProceedToStep(step + 1)
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceedToStep(4) || loading}
            className={`px-6 py-2 rounded font-medium transition-colors ${
              canProceedToStep(4) && !loading
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Creating...' : 'Create Reading'}
          </button>
        )}
      </div>
    </div>
  )
}