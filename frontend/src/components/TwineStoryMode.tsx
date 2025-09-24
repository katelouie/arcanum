import React, { useState, useCallback, useEffect } from 'react';
import TwineStoryPlayer from './TwineStoryPlayer';
import type { TarotCard, TwineMessage } from './TwineStoryPlayer';
import { CardCallout } from './story/CardCallout';
import { useStories } from '../hooks/useStories';

interface TwineStoryModeProps {
  className?: string;
}

export const TwineStoryMode: React.FC<TwineStoryModeProps> = ({
  className = ''
}) => {
  const [currentCards, setCurrentCards] = useState<TarotCard[]>([]);
  const [lastSpread, setLastSpread] = useState<string>('');
  const [sessionLog, setSessionLog] = useState<string[]>([]);

  // Use dynamic story discovery
  const { stories, loading, error, formatFileSize, formatModifiedDate, getCategoryColor } = useStories();
  const [selectedStory, setSelectedStory] = useState(null);

  // Update selected story when stories load
  useEffect(() => {
    if (stories.length > 0 && !selectedStory) {
      // Default to simple test story if available, otherwise first story
      const defaultStory = stories.find(s => s.id.includes('simple')) || stories[0];
      setSelectedStory(defaultStory);
    }
  }, [stories, selectedStory]);

  // Handle card draws from Twine stories
  const handleCardDrawn = useCallback((cards: TarotCard[], spread: string) => {
    console.log('[TwineStoryMode] Cards drawn:', cards, 'Spread:', spread);

    // Filter out invalid cards and log issues
    const validCards = (cards || []).filter(card => {
      if (!card) {
        console.warn('[TwineStoryMode] Received undefined card');
        return false;
      }
      if (!card.name) {
        console.warn('[TwineStoryMode] Received card without name:', card);
        return false;
      }
      return true;
    });

    setCurrentCards(validCards);
    setLastSpread(spread);

    // Add to session log
    const logEntry = `${new Date().toLocaleTimeString()}: Drew ${validCards.length} cards for ${spread} spread`;
    setSessionLog(prev => [...prev, logEntry]);
  }, []);

  // Handle choices made in Twine stories
  const handleChoiceMade = useCallback((choice: string) => {
    console.log('[TwineStoryMode] Choice made:', choice);
    const logEntry = `${new Date().toLocaleTimeString()}: Made choice: ${choice}`;
    setSessionLog(prev => [...prev, logEntry]);
  }, []);

  // Handle other story events
  const handleStoryEvent = useCallback((event: TwineMessage) => {
    console.log('[TwineStoryMode] Story event:', event);

    switch (event.type) {
      case 'CONSTRAINTS_TESTED':
        const logEntry = `${new Date().toLocaleTimeString()}: Tested constraints`;
        setSessionLog(prev => [...prev, logEntry]);
        break;
      // Add other event types as needed
    }
  }, []);

  return (
    <div className={`twine-story-mode ${className} h-full`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Story Player - Main Area */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-900/95 via-violet-950/30 to-slate-900/95 rounded-lg border border-gray-700/50 h-full flex flex-col">
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Interactive Twine Stories</h2>
                  <p className="text-gray-300 text-sm">
                    Experience interactive stories with tarot integration
                  </p>
                </div>

                {/* Story Selector */}
                <div className="min-w-64">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Story:
                  </label>

                  {loading ? (
                    <div className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-gray-400 text-sm">
                      Loading stories...
                    </div>
                  ) : error ? (
                    <div className="w-full px-3 py-2 bg-red-900/50 border border-red-500/50 rounded-md text-red-300 text-sm">
                      Error: {error}
                    </div>
                  ) : (
                    <select
                      value={selectedStory?.id || ''}
                      onChange={(e) => {
                        const story = stories.find(s => s.id === e.target.value);
                        if (story) {
                          setSelectedStory(story);
                          // Clear session data when switching stories
                          setCurrentCards([]);
                          setSessionLog([]);
                          setLastSpread('');
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      disabled={!selectedStory}
                    >
                      {stories.map(story => (
                        <option key={story.id} value={story.id}>
                          {story.title} ({story.format})
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedStory && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-400">
                        {selectedStory.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded text-white ${getCategoryColor(selectedStory.category)}`}>
                          {selectedStory.category}
                        </span>
                        <span className="text-gray-500">
                          {formatFileSize(selectedStory.file_size)}
                        </span>
                        <span className="text-gray-500">
                          {formatModifiedDate(selectedStory.modified)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 flex-1 min-h-0">
              {selectedStory ? (
                <TwineStoryPlayer
                  key={selectedStory.id} // Force reload when story changes
                  storyPath={selectedStory.path}
                  onCardDrawn={handleCardDrawn}
                  onChoiceMade={handleChoiceMade}
                  onStoryEvent={handleStoryEvent}
                  clientId={`twine-${selectedStory.id}`}
                  clientName={`Twine ${selectedStory.title} Client`}
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {loading ? 'Loading stories...' : error ? 'Error loading stories' : 'No story selected'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Cards & Session Info */}
        <div className="space-y-6 h-full overflow-y-auto">
          {/* Current Story & Cards Display */}
          <div className="bg-gradient-to-br from-slate-900/95 via-violet-950/30 to-slate-900/95 rounded-lg border border-gray-700/50">
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white">
                Current Cards
                {lastSpread && (
                  <span className="text-sm text-violet-300 font-normal ml-2">
                    ({lastSpread})
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Story: {selectedStory?.title || 'No story selected'}
              </p>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {currentCards.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No cards drawn yet.</p>
                  <p className="text-sm mt-1">Draw cards in the story to see them here!</p>
                </div>
              ) : (
                currentCards
                  .filter(card => card && card.name) // Filter out undefined/invalid cards
                  .map((card, index) => (
                    <CardCallout
                      key={`${card.name}-${index}`}
                      card={card.name}
                      reversed={card.reversed || false}
                      className="text-sm"
                    />
                  ))
              )}
            </div>
          </div>

          {/* Session Log */}
          <div className="bg-gradient-to-br from-slate-900/95 via-violet-950/30 to-slate-900/95 rounded-lg border border-gray-700/50">
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white">Session Log</h3>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto">
              {sessionLog.length === 0 ? (
                <p className="text-gray-400 text-sm">No session activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessionLog.map((entry, index) => (
                    <div key={index} className="text-sm text-gray-300 font-mono">
                      {entry}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sessionLog.length > 0 && (
              <div className="p-4 border-t border-gray-700/50">
                <button
                  onClick={() => setSessionLog([])}
                  className="text-sm text-violet-400 hover:text-violet-300"
                >
                  Clear Log
                </button>
              </div>
            )}
          </div>

          {/* System Comparison */}
          <div className="bg-gradient-to-br from-green-900/20 via-emerald-950/30 to-green-900/20 rounded-lg border border-green-700/50">
            <div className="p-4 border-b border-green-700/50">
              <h3 className="text-lg font-semibold text-white">System Comparison</h3>
            </div>

            <div className="p-4 text-sm">
              <div className="space-y-3">
                <div>
                  <div className="text-green-300 font-semibold">SugarCube System</div>
                  <div className="text-gray-300">
                    ✅ ~100 lines of code<br/>
                    ✅ Simple JavaScript objects<br/>
                    ✅ Easy constraints<br/>
                    ✅ Native React integration
                  </div>
                </div>

                <div>
                  <div className="text-red-300 font-semibold">Previous Ink System</div>
                  <div className="text-gray-300">
                    ❌ 600+ lines of code<br/>
                    ❌ 156 LIST definitions<br/>
                    ❌ Complex external functions<br/>
                    ❌ String parsing overhead
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwineStoryMode;