import { useState, useEffect } from 'react'
import { ReadingEditor } from './ReadingEditor'
import { ReadingCreator } from './ReadingCreator'
import { StyledListbox } from './ui/StyledListbox'
import { StatusListbox, type StatusOption } from './ui/StatusListbox'

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
  status?: string
  spread_config?: any
}

interface ProgressStats {
  total_readings: number
  completed: number
  draft: number
  not_started: number
  completion_percentage: number
}

export function DevMode() {
  const [readings, setReadings] = useState<TrainingReading[]>([])
  const [progress, setProgress] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReading, setSelectedReading] = useState<TrainingReading | null>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadReadings()
    loadProgress()
  }, [])

  const loadReadings = async () => {
    try {
      const response = await fetch('/api/dev/training-readings')
      const data = await response.json()
      setReadings(data.readings)
    } catch (error) {
      console.error('Failed to load readings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await fetch('/api/dev/interpretation-progress')
      const data = await response.json()
      setProgress(data)
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const handleReadingSelect = (reading: TrainingReading) => {
    setSelectedReading(reading)
  }

  const handleReadingClose = () => {
    setSelectedReading(null)
    loadProgress() // Refresh progress after editing
  }

  const handleCreatorClose = () => {
    setShowCreator(false)
    loadReadings() // Refresh readings list after creation
    loadProgress() // Refresh progress
  }

  const statusOptions: StatusOption[] = [
    { value: 'not_started', label: 'Not Started', color: 'bg-red-900 text-red-200' },
    { value: 'draft', label: 'Draft', color: 'bg-yellow-900 text-yellow-200' },
    { value: 'completed', label: 'Completed', color: 'bg-green-900 text-green-200' }
  ]

  const filterStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'draft', label: 'Draft' },
    { value: 'not_started', label: 'Not Started' }
  ]

  const filterSourceOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'common', label: 'Common' },
    { value: 'special', label: 'Special' }
  ]

  const handleStatusUpdate = async (readingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dev/training-readings/${readingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Refresh data
      await loadReadings()
      await loadProgress()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const filteredReadings = readings.filter(reading => {
    const matchesSearch = reading.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reading.question_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reading.reading_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || reading.question_category === filterCategory
    const matchesSource = filterSource === 'all' || reading.source === filterSource
    
    // Status filtering using actual status field
    const readingStatus = reading.status || (reading.has_interpretation ? 'completed' : 'not_started')
    const matchesStatus = filterStatus === 'all' || filterStatus === readingStatus

    return matchesSearch && matchesCategory && matchesSource && matchesStatus
  })

  const categories = [...new Set(readings.map(r => r.question_category))]
  const filterCategoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading training data...</div>
      </div>
    )
  }

  if (selectedReading) {
    return (
      <ReadingEditor 
        reading={selectedReading} 
        onClose={handleReadingClose}
      />
    )
  }

  if (showCreator) {
    return (
      <ReadingCreator 
        onClose={handleCreatorClose}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-3xl font-bold text-orange-400 mb-2">
            Training Data Manager
          </h2>
          <p className="text-slate-400">
            Write interpretations for LLM fine-tuning dataset
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowCreator(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Reading
          </button>
        </div>
      </div>

      {/* Progress Stats */}
      {progress && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Progress Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-100">{progress.total_readings}</div>
              <div className="text-sm text-slate-400">Total Readings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{progress.completed}</div>
              <div className="text-sm text-slate-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{progress.draft}</div>
              <div className="text-sm text-slate-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{progress.not_started}</div>
              <div className="text-sm text-slate-400">Not Started</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.completion_percentage}%` }}
            />
          </div>
          <div className="text-center mt-2 text-sm text-slate-400">
            {progress.completion_percentage.toFixed(1)}% Complete
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search readings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <StyledListbox
              value={filterCategory}
              onChange={setFilterCategory}
              options={filterCategoryOptions}
              size="md"
            />
          </div>
          <div>
            <StyledListbox
              value={filterSource}
              onChange={setFilterSource}
              options={filterSourceOptions}
              size="md"
            />
          </div>
          <div>
            <StyledListbox
              value={filterStatus}
              onChange={setFilterStatus}
              options={filterStatusOptions}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Readings List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          Readings ({filteredReadings.length})
        </h3>
        {filteredReadings.map((reading) => (
          <div
            key={reading.reading_id}
            onClick={() => handleReadingSelect(reading)}
            className="bg-slate-800 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700 hover:border-slate-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-slate-400">
                    {reading.reading_id}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    reading.source === 'common' 
                      ? 'bg-blue-900 text-blue-200' 
                      : 'bg-purple-900 text-purple-200'
                  }`}>
                    {reading.source}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                    {reading.spread_name}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusListbox
                      value={reading.status || (reading.has_interpretation ? 'completed' : 'not_started')}
                      onChange={(newStatus) => handleStatusUpdate(reading.reading_id, newStatus)}
                      options={statusOptions}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="text-sm text-orange-300 font-medium mb-1">
                  {reading.question_category}
                </div>
                <div className="text-slate-100 line-clamp-2">
                  {reading.question}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  {reading.cards.length} cards: {reading.cards.map(c => 
                    `${c.card_name} ${c.orientation === 'Reversed' ? '(R)' : ''}`
                  ).join(', ')}
                </div>
              </div>
              <div className="text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReadings.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No readings match your current filters.
        </div>
      )}
    </div>
  )
}