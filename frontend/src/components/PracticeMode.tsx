import { useState, useEffect } from 'react'
import { Button } from '@headlessui/react'
import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, StarIcon } from '@heroicons/react/20/solid'
import { DynamicSpreadRenderer } from './SpreadRenderer'
import axios from 'axios'
import type { SpreadsConfig } from '../types/spreads'

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface ClientProfile {
  id: string;
  name: string;
  age_range: string;
  background: {
    occupation: string;
    life_stage: string;
    relationship_status: string;
    cultural_context?: string;
  };
  personality_traits: string[];
  tarot_experience: string;
}

interface PracticeScenario {
  id: string;
  title: string;
  category: string;
  difficulty_level: string;
  question_type: string;
  emotional_intensity: string;
  context: {
    situation_background: string;
    recent_events: string[];
    client_concerns: string[];
    hidden_factors?: string[];
  };
  primary_question: string;
  followup_questions?: string[];
  suggested_spreads: string[];
  learning_objectives: string[];
  challenge_factors?: string[];
}

interface PracticeSession {
  session_id: string;
  client_profile: ClientProfile;
  scenario: PracticeScenario;
  suggested_spreads: string[];
}

interface DrawnCard {
  card_name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface CardInterpretation {
  card_name: string;
  position: string;
  interpretation: string;
  connection_to_question?: string;
}

interface UserInterpretation {
  overall_reading: string;
  card_interpretations: CardInterpretation[];
  synthesis?: string;
  advice_given?: string;
  reading_time_minutes?: number;
}

interface AIEvaluation {
  overall_score: number;
  criteria_scores: {
    card_knowledge: number;
    position_relevance: number;
    reading_coherence: number;
    empathy_communication: number;
    practical_guidance: number;
    ethical_considerations: number;
    intuitive_insight: number;
  };
  strengths: string[];
  areas_for_improvement: string[];
  missed_opportunities?: string[];
  alternative_interpretations?: any[];
  next_steps: string[];
}

interface PracticeModeProps {
  spreadsConfig: SpreadsConfig | null;
  onCardClick: (card: CardInfo, index: number) => void;
  onSpreadChange: (spread: {id: string, name: string} | null) => void;
}

type PracticeStep = 'start' | 'scenarios' | 'scenario' | 'spread-selection' | 'reading' | 'interpretation' | 'feedback'

const difficultyColors = {
  'beginner': 'bg-green-500/20 text-green-300 border-green-500/30',
  'intermediate': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'advanced': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'expert': 'bg-red-500/20 text-red-300 border-red-500/30'
}

const categoryColors = {
  'career': 'bg-blue-500/20 text-blue-300',
  'relationships': 'bg-pink-500/20 text-pink-300',
  'personal_growth': 'bg-purple-500/20 text-purple-300',
  'finances': 'bg-green-500/20 text-green-300',
  'health': 'bg-teal-500/20 text-teal-300',
  'spirituality': 'bg-indigo-500/20 text-indigo-300',
  'family': 'bg-orange-500/20 text-orange-300',
  'creativity': 'bg-rose-500/20 text-rose-300',
  'life_transition': 'bg-amber-500/20 text-amber-300',
  'decision_making': 'bg-cyan-500/20 text-cyan-300',
  'crisis': 'bg-red-500/20 text-red-300',
  'general_guidance': 'bg-gray-500/20 text-gray-300'
}

export function PracticeMode({ spreadsConfig, onCardClick, onSpreadChange }: PracticeModeProps) {
  const [step, setStep] = useState<PracticeStep>('start')
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [selectedSpread, setSelectedSpread] = useState<string>('')
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [convertedCards, setConvertedCards] = useState<CardInfo[]>([])
  const [userInterpretation, setUserInterpretation] = useState<UserInterpretation>({
    overall_reading: '',
    card_interpretations: [],
    synthesis: '',
    advice_given: ''
  })
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null)
  const [loading, setLoading] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [availableScenarios, setAvailableScenarios] = useState<PracticeScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<PracticeScenario | null>(null)
  const [filters, setFilters] = useState({
    difficulty: '',
    category: '',
    emotional_intensity: '',
    question_type: ''
  })

  // Filter scenarios based on selected filters
  const filteredScenarios = availableScenarios.filter(scenario => {
    if (filters.difficulty && scenario.difficulty_level !== filters.difficulty) return false
    if (filters.category && scenario.category !== filters.category) return false
    if (filters.emotional_intensity && scenario.emotional_intensity !== filters.emotional_intensity) return false
    if (filters.question_type && scenario.question_type !== filters.question_type) return false
    return true
  })

  // Clear spread when component unmounts or step changes to start
  useEffect(() => {
    if (step === 'start') {
      onSpreadChange(null)
    }
  }, [step, onSpreadChange])

  const loadScenarios = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/practice/scenarios')
      setAvailableScenarios(response.data.scenarios)
      setStep('scenarios')
    } catch (error) {
      console.error('Failed to load scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const startPracticeWithScenario = async (scenario: PracticeScenario) => {
    setLoading(true)
    setSelectedScenario(scenario)
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/practice/start', {
        user_id: 'practice_user_' + Date.now(),
        difficulty_preference: null,
        category_preference: null,
        scenario_id: scenario.id // Add scenario selection
      })
      
      setSession(response.data)
      setStep('scenario')
    } catch (error) {
      console.error('Failed to start practice session:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectSpreadAndDrawCards = async (spread: string) => {
    if (!session) return
    
    setLoading(true)
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/practice/select-spread', {
        session_id: session.session_id,
        selected_spread: spread
      })
      
      setDrawnCards(response.data.cards_drawn)
      setSelectedSpread(spread)
      
      // Notify parent about spread change
      const spreadConfig = spreadsConfig?.spreads.find(s => s.id === spread)
      if (spreadConfig) {
        onSpreadChange({ id: spread, name: spreadConfig.name })
      }
      
      // Convert drawn cards to CardInfo format for the spread renderer
      const cards: CardInfo[] = response.data.cards_drawn.map((card: DrawnCard) => ({
        name: card.card_name,
        position: card.position,
        reversed: card.reversed,
        image_url: card.image_url
      }))
      setConvertedCards(cards)
      
      // Initialize card interpretations
      const cardInterps = response.data.cards_drawn.map((card: DrawnCard) => ({
        card_name: card.card_name,
        position: card.position,
        interpretation: '',
        connection_to_question: ''
      }))
      setUserInterpretation(prev => ({
        ...prev,
        card_interpretations: cardInterps
      }))
      
      setStep('reading')
      setStartTime(new Date())
    } catch (error) {
      console.error('Failed to select spread and draw cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCardInterpretation = (cardName: string, field: string, value: string) => {
    setUserInterpretation(prev => ({
      ...prev,
      card_interpretations: prev.card_interpretations.map(card => 
        card.card_name === cardName ? { ...card, [field]: value } : card
      )
    }))
  }

  const submitInterpretation = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const readingTime = startTime ? (new Date().getTime() - startTime.getTime()) / (1000 * 60) : undefined
      
      const response = await axios.post('http://127.0.0.1:8000/api/practice/submit', {
        session_id: session.session_id,
        interpretation: {
          ...userInterpretation,
          reading_time_minutes: readingTime
        }
      })
      
      setAiEvaluation(response.data.ai_evaluation)
      setStep('feedback')
    } catch (error) {
      console.error('Failed to submit interpretation:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetSession = () => {
    setStep('start')
    setSession(null)
    setSelectedSpread('')
    onSpreadChange(null)
    setDrawnCards([])
    setConvertedCards([])
    setUserInterpretation({
      overall_reading: '',
      card_interpretations: [],
      synthesis: '',
      advice_given: ''
    })
    setAiEvaluation(null)
    setStartTime(null)
  }

  if (step === 'start') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Practice Mode</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Hone your tarot reading skills with realistic client scenarios. You'll receive a client profile, 
            their question, and background context. Give your interpretation, then receive AI feedback to improve your skills.
          </p>
          <Button
            onClick={loadScenarios}
            disabled={loading}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? 'Loading Scenarios...' : 'Choose Practice Scenario'}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'scenarios') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-violet-400 mb-4">Choose Your Practice Scenario</h2>
          <p className="text-slate-300 text-lg">
            Select from our collection of realistic client scenarios to practice your tarot reading skills.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-slate-900/30 backdrop-blur border border-slate-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Filter Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 p-2.5"
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 p-2.5"
              >
                <option value="">All Categories</option>
                <option value="career">Career</option>
                <option value="relationships">Relationships</option>
                <option value="personal_growth">Personal Growth</option>
                <option value="finances">Finances</option>
                <option value="health">Health</option>
                <option value="spirituality">Spirituality</option>
                <option value="family">Family</option>
                <option value="creativity">Creativity</option>
                <option value="life_transition">Life Transition</option>
                <option value="decision_making">Decision Making</option>
                <option value="crisis">Crisis</option>
                <option value="general_guidance">General Guidance</option>
                <option value="addiction_recovery">Addiction Recovery</option>
                <option value="identity">Identity</option>
                <option value="education">Education</option>
                <option value="lifestyle">Lifestyle</option>
              </select>
            </div>

            {/* Emotional Intensity Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Emotional Intensity</label>
              <select
                value={filters.emotional_intensity}
                onChange={(e) => setFilters({...filters, emotional_intensity: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 p-2.5"
              >
                <option value="">All Intensities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="crisis">Crisis</option>
              </select>
            </div>

            {/* Question Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Question Type</label>
              <select
                value={filters.question_type}
                onChange={(e) => setFilters({...filters, question_type: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 p-2.5"
              >
                <option value="">All Question Types</option>
                <option value="yes_no">Yes/No</option>
                <option value="timing">Timing</option>
                <option value="choice_between_options">Choice Between Options</option>
                <option value="situation_analysis">Situation Analysis</option>
                <option value="advice_seeking">Advice Seeking</option>
                <option value="relationship_dynamics">Relationship Dynamics</option>
                <option value="personal_insight">Personal Insight</option>
                <option value="spiritual_guidance">Spiritual Guidance</option>
                <option value="past_influence">Past Influence</option>
                <option value="future_potential">Future Potential</option>
                <option value="practical_guidance">Practical Guidance</option>
                <option value="overcoming_fear">Overcoming Fear</option>
                <option value="decision_making">Decision Making</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setFilters({difficulty: '', category: '', emotional_intensity: '', question_type: ''})}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear All Filters
            </button>
            <span className="text-sm text-slate-400">
              Showing {filteredScenarios.length} of {availableScenarios.length} scenarios
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:border-violet-500/50 transition-all duration-200 cursor-pointer"
              onClick={() => startPracticeWithScenario(scenario)}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    categoryColors[scenario.category] || 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {scenario.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${
                    difficultyColors[scenario.difficulty_level] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                  }`}>
                    {scenario.difficulty_level}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{scenario.title}</h3>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-violet-300 mb-1">Primary Question</h4>
                  <p className="text-slate-300 text-sm leading-relaxed italic">"{scenario.primary_question}"</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-violet-300 mb-1">Situation</h4>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {scenario.context.situation_background}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>💡 {scenario.learning_objectives.length} learning objectives</span>
                  <span className={`px-2 py-1 rounded ${
                    scenario.emotional_intensity === 'high' ? 'bg-red-900/30 text-red-400' :
                    scenario.emotional_intensity === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-green-900/30 text-green-400'
                  }`}>
                    {scenario.emotional_intensity} intensity
                  </span>
                </div>
              </div>

              {loading && selectedScenario?.id === scenario.id && (
                <div className="absolute inset-0 bg-slate-900/50 rounded-xl flex items-center justify-center">
                  <div className="text-violet-400">Starting scenario...</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => setStep('start')}
            className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Start
          </button>
        </div>
      </div>
    )
  }

  if (step === 'scenario' && session) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Client Profile */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
            👤 Client Profile
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-200 mb-2">{session.client_profile.name}</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-400">Age:</span> <span className="text-slate-300">{session.client_profile.age_range}</span></p>
                <p><span className="text-slate-400">Occupation:</span> <span className="text-slate-300">{session.client_profile.background.occupation}</span></p>
                <p><span className="text-slate-400">Relationship:</span> <span className="text-slate-300">{session.client_profile.background.relationship_status.replace('_', ' ')}</span></p>
                <p><span className="text-slate-400">Tarot Experience:</span> <span className="text-slate-300">{session.client_profile.tarot_experience.replace('_', ' ')}</span></p>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-slate-300 mb-2">Personality Traits</h5>
              <div className="flex flex-wrap gap-1">
                {session.client_profile.personality_traits.map((trait, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded">
                    {trait}
                  </span>
                ))}
              </div>
              {session.client_profile.background.cultural_context && (
                <div className="mt-3">
                  <h5 className="font-medium text-slate-300 mb-1">Background</h5>
                  <p className="text-sm text-slate-400">{session.client_profile.background.cultural_context}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scenario */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-100">📋 Scenario</h3>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 text-xs rounded-full border ${categoryColors[session.scenario.category] || 'bg-gray-500/20 text-gray-300'}`}>
                {session.scenario.category.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 text-xs rounded-full border ${difficultyColors[session.scenario.difficulty_level]}`}>
                {session.scenario.difficulty_level}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-200 mb-2">Situation</h4>
              <p className="text-slate-300 leading-relaxed">{session.scenario.context.situation_background}</p>
            </div>
            
            {session.scenario.context.recent_events.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Recent Events</h4>
                <ul className="space-y-1">
                  {session.scenario.context.recent_events.map((event, idx) => (
                    <li key={idx} className="text-slate-300 text-sm">• {event}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-violet-200 mb-2">Client's Question</h4>
              <p className="text-violet-100 font-medium italic">"{session.scenario.primary_question}"</p>
            </div>

            {session.scenario.context.client_concerns.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Client's Concerns</h4>
                <ul className="space-y-1">
                  {session.scenario.context.client_concerns.map((concern, idx) => (
                    <li key={idx} className="text-slate-300 text-sm">• {concern}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setStep('scenarios')}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Scenarios
            </button>
            <Button
              onClick={() => setStep('spread-selection')}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Choose Spread
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'spread-selection' && session) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-slate-100 mb-6 text-center">Choose Your Spread</h3>
          
          <div className="space-y-4">
            <p className="text-slate-300 text-center mb-6">
              Select a tarot spread that best fits the client's question and situation.
            </p>
            
            {session.suggested_spreads.map((spreadId) => {
              const spread = spreadsConfig?.spreads.find(s => s.id === spreadId)
              if (!spread) return null
              
              return (
                <button
                  key={spreadId}
                  onClick={() => selectSpreadAndDrawCards(spreadId)}
                  disabled={loading}
                  className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-100">{spread.name}</h4>
                      <p className="text-slate-400 text-sm mt-1">{spread.description}</p>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {spread.positions.length} cards
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setStep('scenario')}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Back to Scenario
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'reading' && session && spreadsConfig) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Question Reminder */}
        <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4 text-center">
          <p className="text-violet-100 font-medium">Client's Question: "{session.scenario.primary_question}"</p>
        </div>

        {/* Spread */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 shadow-2xl">
          <DynamicSpreadRenderer
            spreadId={selectedSpread}
            spreadsConfig={spreadsConfig}
            cards={convertedCards}
            onCardClick={onCardClick}
          />
        </div>

        {/* Interpretation Form */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-slate-100 mb-6">Your Interpretation</h3>
          
          {/* Overall Reading */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Overall Reading
            </label>
            <textarea
              value={userInterpretation.overall_reading}
              onChange={(e) => setUserInterpretation(prev => ({...prev, overall_reading: e.target.value}))}
              className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
              placeholder="Write your overall interpretation of the reading for this client..."
            />
          </div>

          {/* Individual Card Interpretations */}
          <div className="space-y-4 mb-6">
            <h4 className="text-lg font-semibold text-slate-200">Card Interpretations</h4>
            {drawnCards.map((card, idx) => (
              <div key={idx} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <h5 className="font-medium text-slate-200">{card.card_name}</h5>
                  <span className="ml-2 px-2 py-1 text-xs bg-violet-600 text-white rounded">
                    {card.position}
                  </span>
                  {card.reversed && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded">
                      Reversed
                    </span>
                  )}
                </div>
                <textarea
                  value={userInterpretation.card_interpretations.find(c => c.card_name === card.card_name)?.interpretation || ''}
                  onChange={(e) => updateCardInterpretation(card.card_name, 'interpretation', e.target.value)}
                  className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                  placeholder="How do you interpret this card in this position?"
                />
              </div>
            ))}
          </div>

          {/* Synthesis */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Synthesis & Connections
            </label>
            <textarea
              value={userInterpretation.synthesis}
              onChange={(e) => setUserInterpretation(prev => ({...prev, synthesis: e.target.value}))}
              className="w-full h-24 p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
              placeholder="How do the cards work together to answer the client's question?"
            />
          </div>

          {/* Advice */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Practical Advice
            </label>
            <textarea
              value={userInterpretation.advice_given}
              onChange={(e) => setUserInterpretation(prev => ({...prev, advice_given: e.target.value}))}
              className="w-full h-24 p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
              placeholder="What practical guidance would you offer this client?"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('spread-selection')}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Back to Spread Selection
            </button>
            <Button
              onClick={submitInterpretation}
              disabled={loading || !userInterpretation.overall_reading.trim()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Evaluating...' : 'Submit for Feedback'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'feedback' && aiEvaluation) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Practice Session Complete!</h2>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <span className="text-2xl font-bold text-slate-100">Overall Score:</span>
            <span className="text-3xl font-bold text-violet-400">{aiEvaluation.overall_score.toFixed(1)}/100</span>
          </div>
        </div>

        {/* Criteria Scores */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-slate-100 mb-4">Detailed Scores</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(aiEvaluation.criteria_scores).map(([criterion, score]) => (
              <div key={criterion} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-slate-200 capitalize">{criterion.replace('_', ' ')}</span>
                <span className="font-semibold text-violet-400">{score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        {aiEvaluation.strengths.length > 0 && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-green-200 mb-4 flex items-center">
              ✨ Strengths
            </h3>
            <ul className="space-y-2">
              {aiEvaluation.strengths.map((strength, idx) => (
                <li key={idx} className="text-green-100 flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {aiEvaluation.areas_for_improvement.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-amber-200 mb-4 flex items-center">
              🎯 Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {aiEvaluation.areas_for_improvement.map((area, idx) => (
                <li key={idx} className="text-amber-100 flex items-start">
                  <span className="text-amber-400 mr-2">•</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {aiEvaluation.next_steps.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center">
              🚀 Next Steps
            </h3>
            <ul className="space-y-2">
              {aiEvaluation.next_steps.map((step, idx) => (
                <li key={idx} className="text-blue-100 flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center">
          <Button
            onClick={resetSession}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start New Practice Session
          </Button>
        </div>
      </div>
    )
  }

  return null
}