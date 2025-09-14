import React, { useState, useEffect, useCallback } from 'react';
import { Story } from 'inkjs';
import { StoryTarotDisplay } from './StoryTarotDisplay';
import { InterpretationPanel } from './InterpretationPanel';
import { useCardData } from '../hooks/useCardData';

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface StoryPlayerProps {
  storyPath: string;
  className?: string;
  onExternalFunction?: (functionName: string, args: any[]) => Promise<any>;
}

interface StoryState {
  paragraphs: string[];
  choices: Array<{ text: string; index: number }>;
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
}

interface TarotReading {
  cards: CardInfo[];
  spreadId: string;
  title?: string;
  description?: string;
}

export const StoryPlayer: React.FC<StoryPlayerProps> = ({
  storyPath,
  className = '',
  onExternalFunction
}) => {
  const [story, setStory] = useState<Story | null>(null);
  const [storyState, setStoryState] = useState<StoryState>({
    paragraphs: [],
    choices: [],
    isLoading: true,
    error: null,
    isComplete: false
  });

  // Tarot integration state
  const [currentReading, setCurrentReading] = useState<TarotReading | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardInfo | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentSpread, setCurrentSpread] = useState<{id: string, name: string} | null>(null);

  // Get shared card data and utilities from existing system
  const {
    getCardInterpretation,
    getPositionMeaning
  } = useCardData();

  // Handle story external function calls with tarot integration
  const handleStoryExternalFunction = useCallback(async (functionName: string, args: any[]) => {
    console.log(`[StoryPlayer] External function called: ${functionName}`, {
      functionName,
      args,
      argCount: args?.length,
      argTypes: args?.map(arg => typeof arg)
    });

    try {
      // Handle tarot-specific functions
      if (functionName === 'drawCards') {
        console.log(`[StoryPlayer] Processing drawCards with args:`, args);
        const [spread, count, title, options] = args;
        
        console.log(`[StoryPlayer] Extracted parameters:`, { spread, count, title, options });

        // Use our story tarot service
        const { storyTarotService } = await import('../services/storyTarotService');
        console.log(`[StoryPlayer] Calling storyTarotService.drawCards`);
        
        const result = await storyTarotService.drawCards({
          spread,
          cardCount: count,
          spreadType: spread,
          ...(options || {})
        });

        console.log(`[StoryPlayer] drawCards result:`, result);

        // Update reading state
        setCurrentReading({
          cards: result.cards,
          spreadId: spread,
          title: title || `${result.spread} Reading`,
          description: options?.description
        });
        setCurrentSpread({ id: spread, name: result.spread });

        // Return a simple value that Ink can handle
        return result.cards.length;
      }

      if (functionName === 'shuffleDeck') {
        console.log(`[StoryPlayer] Processing shuffleDeck - about to return simple number`);
        const result = 42;
        console.log(`[StoryPlayer] Returning result:`, result, typeof result);
        return result;
      }

      if (functionName === 'getCardInterpretation') {
        console.log(`[StoryPlayer] Processing getCardInterpretation with args:`, args);
        const [cardName, position] = args;
        const { storyTarotService } = await import('../services/storyTarotService');
        const result = await storyTarotService.getCardInterpretation(cardName, position);
        console.log(`[StoryPlayer] getCardInterpretation result:`, result);
        return "interpretation"; // Return a simple string for Ink
      }

      // Fallback to provided external function handler
      if (onExternalFunction) {
        console.log(`[StoryPlayer] Falling back to provided external function handler`);
        return await onExternalFunction(functionName, args);
      }

      throw new Error(`Unknown external function: ${functionName}`);
    } catch (error) {
      console.error(`[StoryPlayer] External function ${functionName} failed:`, error);
      console.error(`[StoryPlayer] Error details:`, {
        functionName,
        args,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      });

      // Update story state to show the error
      setStoryState(prev => ({
        ...prev,
        error: `External function error: ${functionName} - ${error instanceof Error ? error.message : String(error)}`
      }));

      throw error;
    }
  }, [onExternalFunction]);

  // Load story from JSON file
  const loadStory = useCallback(async () => {
    try {
      setStoryState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(storyPath);
      if (!response.ok) {
        throw new Error(`Failed to load story: ${response.statusText}`);
      }
      
      const storyJson = await response.json();
      const newStory = new Story(storyJson);
      
      // Set up external function binding with enhanced tarot integration
      console.log(`[StoryPlayer] Setting up external function bindings`);
      
      newStory.BindExternalFunction('drawCards', (...args: any[]) => {
        console.log(`[StoryPlayer] drawCards binding called with args:`, args);
        const [spread, count, title, options] = args;
        console.log(`[StoryPlayer] drawCards parsed args:`, { spread, count, title, options });
        
        // Do the actual work asynchronously as a side effect (fire and forget)
        (async () => {
          try {
            const { storyTarotService } = await import('../services/storyTarotService');
            const result = await storyTarotService.drawCards({
              spread,
              cardCount: count,
              spreadType: spread,
              ...(options || {})
            });

            // Update reading state
            setCurrentReading({
              cards: result.cards,
              spreadId: spread,
              title: title || `${result.spread} Reading`,
              description: options?.description
            });
            setCurrentSpread({ id: spread, name: result.spread });
            
            console.log(`[StoryPlayer] drawCards completed:`, result);
          } catch (error) {
            console.error(`[StoryPlayer] drawCards failed:`, error);
          }
        })();
        
        // Return synchronous value for Ink (number of cards requested)
        return count;
      });
      
      newStory.BindExternalFunction('shuffleDeck', (...args: any[]) => {
        console.log(`[StoryPlayer] shuffleDeck binding called with args:`, args);
        
        // Do the actual work asynchronously as a side effect (fire and forget)
        (async () => {
          try {
            const { storyTarotService } = await import('../services/storyTarotService');
            const result = await storyTarotService.shuffleDeck();
            console.log(`[StoryPlayer] shuffleDeck completed:`, result);
          } catch (error) {
            console.error(`[StoryPlayer] shuffleDeck failed:`, error);
          }
        })();
        
        // Return synchronous value for Ink
        return 1;
      });
      
      newStory.BindExternalFunction('getCardInterpretation', (...args: any[]) => {
        console.log(`[StoryPlayer] getCardInterpretation binding called with args:`, args);
        const [cardName, position] = args;
        
        // Do the actual work asynchronously as a side effect (fire and forget)
        (async () => {
          try {
            const { storyTarotService } = await import('../services/storyTarotService');
            const result = await storyTarotService.getCardInterpretation(cardName, position);
            console.log(`[StoryPlayer] getCardInterpretation completed:`, result);
          } catch (error) {
            console.error(`[StoryPlayer] getCardInterpretation failed:`, error);
          }
        })();
        
        // Return synchronous value for Ink (just a simple string)
        return "interpretation_retrieved";
      });
      
      setStory(newStory);
      updateStoryContent(newStory);
      
    } catch (err) {
      setStoryState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }));
    }
  }, [storyPath, handleStoryExternalFunction]);

  // Update story content and choices
  const updateStoryContent = useCallback((currentStory: Story) => {
    const paragraphs: string[] = [];
    const choices: Array<{ text: string; index: number }> = [];
    
    try {
      // Continue the story and collect all available text
      while (currentStory.canContinue) {
        const line = currentStory.Continue();
        if (line?.trim()) {
          paragraphs.push(line.trim());
        }
      }
      
      // Get available choices
      if (currentStory.currentChoices.length > 0) {
        currentStory.currentChoices.forEach((choice, index) => {
          choices.push({
            text: choice.text,
            index: index
          });
        });
      }
      
      setStoryState({
        paragraphs,
        choices,
        isLoading: false,
        error: null,
        isComplete: !currentStory.canContinue && choices.length === 0
      });
      
    } catch (err) {
      setStoryState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error processing story'
      }));
    }
  }, []);

  // Handle choice selection
  const makeChoice = useCallback((choiceIndex: number) => {
    if (!story || choiceIndex < 0 || choiceIndex >= story.currentChoices.length) {
      return;
    }
    
    try {
      story.ChooseChoiceIndex(choiceIndex);
      updateStoryContent(story);
    } catch (err) {
      setStoryState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error making choice'
      }));
    }
  }, [story, updateStoryContent]);

  // Restart story
  const restartStory = useCallback(() => {
    if (story) {
      story.ResetState();
      updateStoryContent(story);
      // Clear tarot reading when restarting
      setCurrentReading(null);
      setSelectedCard(null);
      setIsPanelOpen(false);
      setCurrentSpread(null);
    }
  }, [story, updateStoryContent]);

  // Handle card click - open InterpretationPanel
  const handleCardClick = useCallback((card: CardInfo, index: number) => {
    setSelectedCard(card);
    setIsPanelOpen(true);
  }, []);

  // Handle panel close
  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedCard(null);
  }, []);

  // Load story on mount or when path changes
  useEffect(() => {
    loadStory();
  }, [loadStory]);

  // Render loading state
  if (storyState.isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400"></div>
        <span className="ml-3 text-slate-300">Loading story...</span>
      </div>
    );
  }

  // Render error state
  if (storyState.error) {
    return (
      <div className={`p-6 border border-red-500/30 rounded-lg bg-red-950/30 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-300">Story Error</h3>
            <div className="mt-2 text-sm text-red-400">
              <p className="mb-3">{storyState.error}</p>
              <details className="bg-red-950/50 p-3 rounded border border-red-500/20">
                <summary className="cursor-pointer text-red-300 font-medium">Debug Information</summary>
                <div className="mt-2 text-xs text-red-300 space-y-1">
                  <p><strong>Story Path:</strong> {storyPath}</p>
                  <p><strong>Paragraphs Loaded:</strong> {storyState.paragraphs.length}</p>
                  <p><strong>Choices Available:</strong> {storyState.choices.length}</p>
                  <p><strong>Story Complete:</strong> {storyState.isComplete ? 'Yes' : 'No'}</p>
                  <p><strong>Can Continue:</strong> {story?.canContinue ? 'Yes' : 'No'}</p>
                  <p><strong>Check browser console for detailed logs</strong></p>
                </div>
              </details>
            </div>
            <div className="mt-3 space-x-3">
              <button
                onClick={loadStory}
                className="text-sm bg-red-900/50 text-red-300 px-3 py-1 rounded hover:bg-red-900/70 transition-colors border border-red-500/30"
              >
                Retry
              </button>
              <button
                onClick={() => setStoryState(prev => ({ ...prev, error: null }))}
                className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded hover:bg-slate-700 transition-colors border border-slate-600"
              >
                Clear Error
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 bg-slate-900 ${className}`}>
      {/* Tarot Reading Display - appears above story content */}
      {currentReading && (
        <div className="mb-8 p-6 bg-slate-800/50 rounded-lg border border-slate-600">
          <StoryTarotDisplay
            spreadId={currentReading.spreadId}
            cards={currentReading.cards}
            title={currentReading.title}
            description={currentReading.description}
            onCardClick={handleCardClick}
          />
        </div>
      )}

      {/* Story content */}
      <div className="space-y-4 mb-6">
        {storyState.paragraphs.map((paragraph, index) => (
          <p 
            key={index}
            className="text-slate-200 leading-relaxed"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Choices */}
      {storyState.choices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-slate-100 mb-3">
            What would you like to do?
          </h3>
          <div className="space-y-2">
            {storyState.choices.map((choice) => (
              <button
                key={choice.index}
                onClick={() => makeChoice(choice.index)}
                className="w-full text-left p-4 border border-slate-700 rounded-lg hover:border-violet-500 hover:bg-violet-950/30 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <span className="text-slate-200">{choice.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Story complete */}
      {storyState.isComplete && (
        <div className="text-center py-6 border-t border-slate-700">
          <p className="text-slate-300 mb-4">End of story</p>
          <button
            onClick={restartStory}
            className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            Start Over
          </button>
        </div>
      )}

      {/* Interpretation Panel */}
      <InterpretationPanel
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        card={selectedCard}
        interpretation={selectedCard ? getCardInterpretation(selectedCard) : undefined}
        positionMeaning={selectedCard ? getPositionMeaning(selectedCard, currentSpread) : undefined}
      />

      {/* Debug info (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-slate-800 rounded-lg text-sm text-slate-300 border border-slate-700">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-2 space-y-1">
              <p>Paragraphs: {storyState.paragraphs.length}</p>
              <p>Choices: {storyState.choices.length}</p>
              <p>Can Continue: {story?.canContinue ? 'Yes' : 'No'}</p>
              <p>Is Complete: {storyState.isComplete ? 'Yes' : 'No'}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default StoryPlayer;