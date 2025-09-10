import { useState, useEffect } from 'react'
import { Listbox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, CpuChipIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface Model {
  id: string
  name: string
  description: string
  type: string
  parameters: string
  loaded: boolean
  load_time?: number
}

interface ModelSelectorProps {
  onModelChange?: (modelId: string) => void
  className?: string
}

export function ModelSelector({ onModelChange, className = "" }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([])
  const [currentModel, setCurrentModel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available models
  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/models')
      setModels(response.data.models)
      setCurrentModel(response.data.current_model)
      setError(null)
    } catch (err) {
      setError('Failed to load models')
      console.error('Error loading models:', err)
    }
  }

  const handleModelChange = async (model: Model) => {
    if (model.id === currentModel) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(`http://127.0.0.1:8000/api/models/${model.id}/load`)
      
      if (response.data.success) {
        setCurrentModel(model.id)
        // Update the loaded status in our local state
        setModels(prev => prev.map(m => ({
          ...m,
          loaded: m.id === model.id
        })))
        
        if (onModelChange) {
          onModelChange(model.id)
        }
      } else {
        setError(response.data.message || 'Failed to load model')
      }
    } catch (err) {
      setError('Failed to load model')
      console.error('Error loading model:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedModel = models.find(m => m.id === currentModel)

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-slate-200">
        MLX Model
      </label>
      
      <Listbox value={selectedModel} onChange={handleModelChange} disabled={loading}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-slate-800 border border-slate-700 py-3 pl-4 pr-10 text-left text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50">
            {selectedModel ? (
              <div className="flex items-center justify-between pr-6">
                <div>
                  <div className="flex items-center gap-2">
                    <CpuChipIcon className="w-4 h-4 text-slate-400" />
                    <span className="block truncate font-medium">{selectedModel.name}</span>
                    {selectedModel.loaded && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {selectedModel.type} • {selectedModel.parameters}
                    {selectedModel.load_time && (
                      <span className="ml-2">• Loaded in {selectedModel.load_time.toFixed(2)}s</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <span className="block truncate text-slate-400">
                {loading ? 'Loading...' : 'No model selected'}
              </span>
            )}
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Listbox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-lg bg-slate-800 border border-slate-700 py-1 shadow-xl">
            {models.map((model) => (
              <Listbox.Option
                key={model.id}
                className={({ active }) =>
                  `relative cursor-default select-none py-3 pl-10 pr-4 ${
                    active ? 'bg-violet-600 text-white' : 'text-slate-100'
                  }`
                }
                value={model}
              >
                {({ selected }) => (
                  <>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {model.name}
                        </span>
                        {model.loaded && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {model.description || `${model.type} model`}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {model.parameters}
                        {model.load_time && (
                          <span className="ml-2">• {model.load_time.toFixed(2)}s load time</span>
                        )}
                      </div>
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

      {/* Status/Error Messages */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <ExclamationTriangleIcon className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {loading && (
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <ClockIcon className="w-4 h-4 animate-spin" />
          Loading model...
        </div>
      )}

      {selectedModel && (
        <div className="text-xs text-slate-500">
          Ready for inference • {selectedModel.type === 'mock' ? 'Development mode' : 'Production ready'}
        </div>
      )}
    </div>
  )
}