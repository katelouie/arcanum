import { useState } from 'react'
import { Button } from '@headlessui/react'
import { ClipboardIcon, CheckIcon, EyeIcon, CodeBracketIcon, SparklesIcon, ClockIcon, CpuChipIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'

interface ReadingData {
  interpretation?: string
  full_prompt?: {
    system_prompt: string
    user_prompt: string
    combined_prompt: string
    metadata: {
      question_type: string
      question_confidence: number
      style: string
      tone: string
      context_tokens: number
      prompt_tokens: number
      total_tokens: number
      completeness: number
    }
  }
  ai_response?: {
    text: string
    tokens_generated: number
    inference_time: number
    model_id: string
    timestamp: string
  }
}

interface MLXIntegrationSectionProps {
  reading: ReadingData
  aiLoading?: boolean
}

type ViewMode = 'interpretation' | 'prompt' | 'combined'

export function MLXIntegrationSection({ reading, aiLoading = false }: MLXIntegrationSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('interpretation')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Add defensive check
  if (!reading) {
    return null
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-violet-300">$1</em>')
      .replace(/---/g, '<hr class="border-slate-600 my-6" />')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.)/gm, '<p class="mb-4">$1')
      .replace(/<p class="mb-4">$/, '')
  }

  return (
    <div className="mt-8 bg-slate-900/30 backdrop-blur border border-slate-700 rounded-xl shadow-xl overflow-hidden">
      {/* Header with Mode Toggles */}
      <div className="border-b border-slate-700 p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-100 mb-2">
            MLX Model Integration
          </h3>
          <div className="w-16 h-0.5 bg-gradient-to-r from-violet-400 to-indigo-400 mx-auto rounded-full"></div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => setViewMode('interpretation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'interpretation'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            AI Reading
          </Button>

          {reading.full_prompt && (
            <Button
              onClick={() => setViewMode('prompt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'prompt'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              <CodeBracketIcon className="w-4 h-4" />
              Model Input
            </Button>
          )}

          {reading.full_prompt && (
            <Button
              onClick={() => setViewMode('combined')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'combined'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              <EyeIcon className="w-4 h-4" />
              Combined View
            </Button>
          )}
        </div>

        {/* Metadata Bar */}
        {reading.full_prompt && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <CpuChipIcon className="w-4 h-4" />
              {reading.full_prompt.metadata.total_tokens.toLocaleString()} tokens
            </div>
            <div className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              {(reading.full_prompt.metadata.completeness * 100).toFixed(1)}% complete
            </div>
            {reading.ai_response && (
              <>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  {reading.ai_response.inference_time.toFixed(2)}s
                </div>
                <div className="flex items-center gap-1">
                  <SparklesIcon className="w-4 h-4" />
                  {reading.ai_response.model_id}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* AI Reading View */}
        {viewMode === 'interpretation' && (
          <div className="space-y-4">
            {aiLoading && !reading.ai_response ? (
              // Loading state
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-slate-100">AI-Generated Reading</h4>
                </div>
                
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-600 border-t-violet-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-violet-300 rounded-full animate-spin" style={{animationDelay: '0.15s'}}></div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-slate-200 mb-2">Generating your reading...</p>
                    <p className="text-sm text-slate-400">The MLX model is analyzing your cards and crafting a personalized interpretation</p>
                  </div>
                  <div className="flex space-x-1 mt-4">
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            ) : reading.interpretation ? (
              // Content when reading is available
              <>
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-slate-100">AI-Generated Reading</h4>
                  <Button
                    onClick={() => copyToClipboard(reading.interpretation!, 'interpretation')}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    {copiedField === 'interpretation' ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <ClipboardIcon className="w-4 h-4" />
                    )}
                    Copy
                  </Button>
                </div>
                
                <div className="prose prose-invert prose-slate max-w-none">
                  <div className="text-slate-200 leading-relaxed text-base space-y-4">
                    <ReactMarkdown>{reading.interpretation || ''}</ReactMarkdown>
                  </div>
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
              // Empty state when no interpretation available
              <div className="text-center py-8">
                <p className="text-slate-400">No AI interpretation available for this reading</p>
              </div>
            )}
          </div>
        )}

        {/* Prompt Input View */}
        {viewMode === 'prompt' && reading.full_prompt && (
          <div className="space-y-6">
            {/* System Prompt */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-slate-100">System Prompt</h4>
                <Button
                  onClick={() => copyToClipboard(reading.full_prompt!.system_prompt, 'system_prompt')}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  {copiedField === 'system_prompt' ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <ClipboardIcon className="w-4 h-4" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                  {reading.full_prompt.system_prompt}
                </pre>
              </div>
            </div>

            {/* User Prompt */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-slate-100">User Prompt</h4>
                <Button
                  onClick={() => copyToClipboard(reading.full_prompt!.user_prompt, 'user_prompt')}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  {copiedField === 'user_prompt' ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <ClipboardIcon className="w-4 h-4" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                  {reading.full_prompt.user_prompt}
                </pre>
              </div>
            </div>

            {/* Prompt Metadata */}
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600">
              <h5 className="text-sm font-medium text-slate-300 mb-3">Prompt Analysis</h5>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                <div>Question Type: <span className="text-slate-300">{reading.full_prompt.metadata.question_type}</span></div>
                <div>Confidence: <span className="text-slate-300">{(reading.full_prompt.metadata.question_confidence * 100).toFixed(1)}%</span></div>
                <div>Style: <span className="text-slate-300">{reading.full_prompt.metadata.style}</span></div>
                <div>Tone: <span className="text-slate-300">{reading.full_prompt.metadata.tone}</span></div>
                <div>Context Tokens: <span className="text-slate-300">{reading.full_prompt.metadata.context_tokens.toLocaleString()}</span></div>
                <div>Prompt Tokens: <span className="text-slate-300">{reading.full_prompt.metadata.prompt_tokens.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Combined View */}
        {viewMode === 'combined' && reading.full_prompt && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-slate-100">Complete Model Input</h4>
              <Button
                onClick={() => copyToClipboard(reading.full_prompt!.combined_prompt, 'combined_prompt')}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                {copiedField === 'combined_prompt' ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <ClipboardIcon className="w-4 h-4" />
                )}
                Copy Full Prompt
              </Button>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                {reading.full_prompt.combined_prompt}
              </pre>
            </div>

            {reading.ai_response && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-slate-100">Model Response</h4>
                <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-600/30">
                  <pre className="text-sm text-emerald-100 whitespace-pre-wrap font-mono">
                    {reading.ai_response.text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}