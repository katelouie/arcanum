import { useState, useEffect, useRef } from 'react'
import { Button } from '@headlessui/react'

interface TappingRhythmProps {
  onRhythmCapture: (rhythm: number[]) => void
  disabled?: boolean
}

export function TappingRhythm({ onRhythmCapture, disabled = false }: TappingRhythmProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [taps, setTaps] = useState<number[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recordingDuration = 8000 // 8 seconds max recording
  const autoStopDelay = 2000 // Stop 2 seconds after last tap

  const startRecording = () => {
    setIsRecording(true)
    setTaps([])
    setStartTime(Date.now())
    
    // Auto-stop after max duration
    timeoutRef.current = setTimeout(() => {
      stopRecording()
    }, recordingDuration)
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (taps.length > 0) {
      const intervals = []
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1])
      }
      onRhythmCapture(intervals)
    }
  }

  const handleTap = () => {
    if (!isRecording || !startTime) return
    
    const now = Date.now()
    const relativeTime = now - startTime
    setTaps(prev => [...prev, relativeTime])

    // Reset auto-stop timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      stopRecording()
    }, autoStopDelay)
  }

  const reset = () => {
    setTaps([])
    setIsRecording(false)
    setStartTime(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    onRhythmCapture([])
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const tapCount = taps.length
  const hasRhythm = tapCount > 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-200 mb-2">
            Add Your Energy
          </div>
          <p className="text-xs text-slate-400 mb-4">
            In lieu of manual shuffling a real deck of cards, tapping a rhythm provides a human element to the randomization of the deck
          </p>
        </div>

        {/* Tap Button */}
        <div className="mb-4">
          {isRecording ? (
            <Button
              onClick={handleTap}
              disabled={disabled}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 pulse-animation"
            >
              <div className="text-center">
                <div className="text-lg">Tap</div>
                <div className="text-xs opacity-75">{tapCount} taps</div>
              </div>
            </Button>
          ) : (
            <Button
              onClick={startRecording}
              disabled={disabled}
              className="w-32 h-32 rounded-full bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 hover:border-violet-500 text-slate-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <div className="text-center">
                <div className="text-lg">Start</div>
                <div className="text-xs opacity-75">Tapping</div>
              </div>
            </Button>
          )}
        </div>

        {/* Status and Controls */}
        <div className="flex justify-center gap-3">
          {isRecording && (
            <Button
              onClick={stopRecording}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
            >
              Finish
            </Button>
          )}
          
          {hasRhythm && !isRecording && (
            <Button
              onClick={reset}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded-lg transition-colors"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Rhythm Visualization */}
        {hasRhythm && !isRecording && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-2">Captured Rhythm:</div>
            <div className="flex justify-center items-end gap-1 h-12">
              {taps.slice(0, 20).map((_, index) => {
                const height = Math.random() * 0.6 + 0.4 // Random height between 40-100%
                return (
                  <div
                    key={index}
                    className="w-2 bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-sm"
                    style={{ height: `${height * 100}%` }}
                  />
                )
              })}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {tapCount} taps captured
            </div>
          </div>
        )}

        {isRecording && (
          <div className="mt-4 text-xs text-amber-400 animate-pulse">
            Recording... Tap the button to create your rhythm
          </div>
        )}
      </div>

      <style jsx>{`
        .pulse-animation {
          animation: pulse-glow 1.5s infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 4px 30px rgba(139, 92, 246, 0.6);
          }
        }
      `}</style>
    </div>
  )
}