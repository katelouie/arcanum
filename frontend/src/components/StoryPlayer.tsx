import React, { useState, useEffect, useCallback } from 'react';
import { Story } from 'inkjs';
import { StoryTarotDisplay } from './StoryTarotDisplay';
import { InterpretationPanel } from './InterpretationPanel';
import { DashboardView } from './DashboardView';
import { useCardData } from '../hooks/useCardData';
import { useStorySession } from '../hooks/useStorySession';
import { storyCardService } from '../services/storyCardService';
import { CardCallout } from './story/CardCallout';
import { StoryTooltip, StoryHint } from './story/StoryTooltip';
import { StoryInsight, SessionNote } from './story/StoryInsight';
import {
  parseTag,
  getTaggedContentClass,
  hasCardTag,
  getCardFromTag,
  hasTooltipTag,
  getTooltipFromTag,
  hasNoteTag,
  getNoteFromTag,
  hasHintTag,
  getHintFromTag
} from '../utils/storyTagParser';

// Helper function to parse constraint strings
const parseConstraintString = (constraintStr: string): Record<string, string[]> => {
  const constraints: Record<string, string[]> = {};
  const positionPairs = constraintStr.split(';');

  for (const pair of positionPairs) {
    const [position, cardsStr] = pair.split(':');
    if (position && cardsStr) {
      constraints[position.trim()] = cardsStr.split(',').map(card => card.trim());
    }
  }

  return constraints;
};

// Helper function to parse card name and orientation
const parseCardNameWithOrientation = (cardStr: string): { name: string; reversed: boolean } => {
  const trimmed = cardStr.trim();

  // Check for new (R) format first
  if (trimmed.endsWith(' (R)')) {
    return {
      name: trimmed.slice(0, -4), // Remove ' (R)'
      reversed: true
    };
  }
  // Backward compatibility: Check for :reversed, :r, or :upright suffix
  else if (trimmed.endsWith(':reversed')) {
    return {
      name: trimmed.slice(0, -9), // Remove ':reversed'
      reversed: true
    };
  } else if (trimmed.endsWith(':r')) {
    return {
      name: trimmed.slice(0, -2), // Remove ':r'
      reversed: true
    };
  } else if (trimmed.endsWith(':upright')) {
    return {
      name: trimmed.slice(0, -8), // Remove ':upright'
      reversed: false
    };
  } else {
    // No orientation specified - default to upright
    return {
      name: trimmed,
      reversed: false
    };
  }
};

// Helper function to get card image URL using tarot-images.json mapping
const getCardImageUrl = async (cardName: string): Promise<string> => {
  try {
    const response = await fetch('/static/tarot-images.json');
    const data = await response.json();
    const imageInfo = data.cards.find((c: any) => c.name === cardName);
    return imageInfo ? `/static/cards_wikipedia/${imageInfo.img}` : '';
  } catch (error) {
    console.error('Failed to load card image mapping:', error);
    return '';
  }
};

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
  clientId?: string; // For session tracking
  clientName?: string; // Full client name for API calls
  storyName?: string; // For session tracking
  onSessionComplete?: (variables: Record<string, any>) => void; // Called when session ends
}

interface TaggedParagraph {
  text: string;
  tags: string[];
}

interface StoryState {
  paragraphs: TaggedParagraph[];
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
  onExternalFunction,
  clientId,
  clientName,
  storyName,
  onSessionComplete
}) => {
  const [story, setStory] = useState<Story | null>(null);
  const [storyState, setStoryState] = useState<StoryState>({
    paragraphs: [],
    choices: [],
    isLoading: true,
    error: null,
    isComplete: false
  });
  const [isDashboard, setIsDashboard] = useState(true);

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

  // Initialize session tracking
  const {
    trackStoryProgress,
    trackCardDrawing,
    trackVariableChange,
    trackChoice,
    trackStoryCompletion,
    addInsight,
    markForFollowUp
  } = useStorySession({ clientId, storyName });

  // Initialize card service once
  useEffect(() => {
    storyCardService.initialize().catch(error => {
      console.error('[StoryPlayer] Failed to initialize card service:', error);
    });
  }, []);

  // Save story state to localStorage
  const saveStoryState = useCallback(() => {
    if (!story || !storyPath) return;

    try {
      const storyStateJson = story.state.ToJson();
      const saveKey = `story_save_${storyPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

      localStorage.setItem(saveKey, storyStateJson);
      localStorage.setItem(`${saveKey}_timestamp`, Date.now().toString());

      console.log('[StoryPlayer] Story state saved to:', saveKey);
      console.log('[StoryPlayer] Save data size:', storyStateJson.length, 'characters');
    } catch (error) {
      console.error('[StoryPlayer] Failed to save story state:', error);
    }
  }, [story, storyPath]);

  // Load story state from localStorage
  const loadStoryState = useCallback((newStory: Story): boolean => {
    if (!storyPath) return false;

    try {
      const saveKey = `story_save_${storyPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const savedState = localStorage.getItem(saveKey);
      const savedTimestamp = localStorage.getItem(`${saveKey}_timestamp`);

      if (savedState) {
        // Check if save is not too old (optional - 7 days max)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const saveAge = savedTimestamp ? Date.now() - parseInt(savedTimestamp) : 0;

        if (saveAge > maxAge) {
          console.log('[StoryPlayer] Save too old, starting fresh');
          localStorage.removeItem(saveKey);
          localStorage.removeItem(`${saveKey}_timestamp`);
          return false;
        }

        newStory.state.LoadJson(savedState);
        console.log('[StoryPlayer] Story state loaded from save:', saveKey);
        console.log('[StoryPlayer] Save age:', Math.round(saveAge / 1000 / 60), 'minutes old');
        return true;
      }
    } catch (error) {
      console.error('[StoryPlayer] Failed to load story state:', error);
      // If loading fails, start fresh
      return false;
    }

    return false;
  }, [storyPath]);

  // Clear save data (useful for testing or fresh starts)
  const clearSaveData = useCallback(() => {
    if (!storyPath) return;

    const saveKey = `story_save_${storyPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    localStorage.removeItem(saveKey);
    localStorage.removeItem(`${saveKey}_timestamp`);
    console.log('[StoryPlayer] Save data cleared');
  }, [storyPath]);

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
        const [spread, count, title, positionConstraintsStr] = args;

        // Parse position constraints if provided
        let positionConstraints = undefined;
        if (positionConstraintsStr && typeof positionConstraintsStr === 'string') {
          try {
            // Try JSON first
            positionConstraints = JSON.parse(positionConstraintsStr);
          } catch (e) {
            // Fall back to custom format: "0:Card1,Card2|1:Card3,Card4"
            try {
              positionConstraints = parseConstraintString(positionConstraintsStr);
            } catch (e2) {
              console.error('[StoryPlayer] Failed to parse position constraints:', e2);
            }
          }
        } else if (positionConstraintsStr && typeof positionConstraintsStr === 'object') {
          positionConstraints = positionConstraintsStr;
        }

        console.log(`[StoryPlayer] Extracted parameters:`, { spread, count, title, positionConstraints });

        // Use our story tarot service
        const { storyTarotService } = await import('../services/storyTarotService');
        console.log(`[StoryPlayer] Calling storyTarotService.drawCards`);

        const result = await storyTarotService.drawCards({
          spread,
          cardCount: count,
          spreadType: spread,
          positionConstraints: positionConstraints || undefined // New: pass position constraints
        });

        console.log(`[StoryPlayer] drawCards result:`, result);

        // Update reading state
        setCurrentReading({
          cards: result.cards,
          spreadId: spread,
          title: title || `${result.spread} Reading`,
          description: positionConstraints ? 'Constrained reading with specific cards' : undefined
        });
        setCurrentSpread({ id: spread, name: result.spread });

        // Track card drawing for session notes
        if (clientId) {
          trackCardDrawing(
            result.cards.map(c => c.name),
            spread,
            title,
            positionConstraints ? 'Yes' : undefined
          );
        }

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

      // IMPORTANT: Set up external function bindings BEFORE any story execution
      console.log(`[StoryPlayer] Setting up external function bindings before story execution`);

      // Bind GetCard function - now uses synchronous card service
      try {
        newStory.BindExternalFunction('GetCard', (constraint: string) => {
          console.log(`[StoryPlayer] GetCard called with constraint:`, constraint);

          // Use the new synchronous card service
          const card = storyCardService.getCard(constraint);
          console.log(`[StoryPlayer] GetCard returning:`, card);

          return card;
        });
        console.log(`[StoryPlayer] GetCard function bound successfully`);
      } catch (bindError) {
        console.error(`[StoryPlayer] Failed to bind GetCard function:`, bindError);
        throw new Error(`Failed to bind GetCard function: ${bindError}`);
      }


      newStory.BindExternalFunction('drawCards', (...args: any[]) => {
        console.log(`[StoryPlayer] drawCards binding called with args:`, args);
        const [spread, count, title, positionConstraintsStr] = args;

        // Parse position constraints if provided
        let positionConstraints = undefined;
        if (positionConstraintsStr && typeof positionConstraintsStr === 'string') {
          try {
            // Try JSON first
            positionConstraints = JSON.parse(positionConstraintsStr);
          } catch (e) {
            // Fall back to custom format: "0:Card1,Card2|1:Card3,Card4"
            try {
              positionConstraints = parseConstraintString(positionConstraintsStr);
            } catch (e2) {
              console.error('[StoryPlayer] Failed to parse position constraints in binding:', e2);
            }
          }
        } else if (positionConstraintsStr && typeof positionConstraintsStr === 'object') {
          positionConstraints = positionConstraintsStr;
        }

        console.log(`[StoryPlayer] drawCards parsed args:`, { spread, count, title, positionConstraints });

        // Do the actual work asynchronously as a side effect (fire and forget)
        (async () => {
          try {
            const { storyTarotService } = await import('../services/storyTarotService');
            const result = await storyTarotService.drawCards({
              spread,
              cardCount: count,
              spreadType: spread,
              positionConstraints: positionConstraints || undefined // New: support position constraints
            });

            // Update reading state
            setCurrentReading({
              cards: result.cards,
              spreadId: spread,
              title: title || `${result.spread} Reading`,
              description: positionConstraints ? 'Constrained reading with specific cards' : undefined
            });
            setCurrentSpread({ id: spread, name: result.spread });

            // Track card drawing for session notes
            if (clientId) {
              trackCardDrawing(
                result.cards.map(c => c.name),
                spread,
                title,
                positionConstraints ? 'Yes' : undefined
              );
            }

            console.log(`[StoryPlayer] drawCards completed:`, result);
          } catch (error) {
            console.error(`[StoryPlayer] drawCards failed:`, error);
            // Update story state to show error
            setStoryState(prev => ({
              ...prev,
              error: `Card drawing failed: ${error instanceof Error ? error.message : String(error)}`
            }));
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

      newStory.BindExternalFunction('displayReading', (...args: any[]) => {
        console.log(`[StoryPlayer] displayReading binding called with args:`, args);
        const [cardListStr, spreadType, title] = args;

        // Parse the comma-separated card list
        if (!cardListStr || typeof cardListStr !== 'string') {
          console.error('[StoryPlayer] displayReading: Invalid card list provided');
          return "error";
        }

        const cardNames = cardListStr.split(',').map(name => name.trim()).filter(name => name.length > 0);

        if (cardNames.length === 0) {
          console.error('[StoryPlayer] displayReading: No cards provided');
          return "error";
        }

        // Helper function to get position names from spread config
        const getPositionNames = async (spreadId: string, cardCount: number): Promise<string[]> => {
          try {
            // Fetch spread configuration
            const response = await fetch('http://127.0.0.1:8000/api/spreads');
            const spreadsConfig = await response.json();

            // Find the spread
            const spread = spreadsConfig.spreads.find((s: any) => s.id === spreadId);
            if (!spread || !spread.positions) {
              console.warn(`[StoryPlayer] Spread '${spreadId}' not found, using generic positions`);
              return Array.from({ length: cardCount }, (_, i) => `Position ${i + 1}`);
            }

            // Check if card count matches spread positions
            if (spread.positions.length !== cardCount) {
              console.warn(`[StoryPlayer] Card count (${cardCount}) doesn't match spread positions (${spread.positions.length}) for ${spreadId}`);
              // Use spread positions up to card count, then fallback to generic
              const positions: string[] = [];
              for (let i = 0; i < cardCount; i++) {
                if (i < spread.positions.length) {
                  positions.push(spread.positions[i].name);
                } else {
                  positions.push(`Position ${i + 1}`);
                }
              }
              return positions;
            }

            // Return the position names from the spread
            return spread.positions.map((pos: any) => pos.name);
          } catch (error) {
            console.error(`[StoryPlayer] Failed to load spread config:`, error);
            return Array.from({ length: cardCount }, (_, i) => `Position ${i + 1}`);
          }
        };

        // Do the actual work asynchronously as a side effect (fire and forget)
        (async () => {
          try {
            const { storyTarotService } = await import('../services/storyTarotService');

            // Get proper position names for this spread
            const positionNames = await getPositionNames(spreadType || 'custom', cardNames.length);

            // Create card objects with proper structure
            const cards = await Promise.all(cardNames.map(async (cardStr, index) => {
              const { name, reversed } = parseCardNameWithOrientation(cardStr);
              const image_url = await getCardImageUrl(name);

              return {
                name: name,
                position: positionNames[index] || `Position ${index + 1}`,
                reversed: reversed,
                image_url: image_url
              };
            }));

            // Update reading state - same as drawCards does
            setCurrentReading({
              cards: cards,
              spreadId: spreadType || 'custom',
              title: title || `${spreadType} Reading`,
              description: 'Reading with pre-selected cards'
            });
            setCurrentSpread({ id: spreadType || 'custom', name: spreadType || 'Custom Spread' });

            // Track card drawing for session notes
            if (clientId) {
              trackCardDrawing(
                cardNames,
                spreadType || 'custom',
                title,
                'Pre-selected'
              );
            }

            console.log(`[StoryPlayer] displayReading completed:`, { cards, spreadType, title, positionNames });
          } catch (error) {
            console.error(`[StoryPlayer] displayReading failed:`, error);
            // Update story state to show error
            setStoryState(prev => ({
              ...prev,
              error: `Display reading failed: ${error instanceof Error ? error.message : String(error)}`
            }));
          }
        })();

        // Return synchronous value for Ink (number of cards displayed)
        return cardNames.length;
      });

      // Watch for dashboard state changes
      newStory.ObserveVariable('is_dashboard', (name, value) => {
        setIsDashboard(value);
        console.log('Dashboard state changed:', value);
      });

      // Initialize story variables with current session state if available
      // (Only for old separate stories, not needed for main.ink)
      if ((clientName || clientId) && !storyPath.includes('main.json')) {
        try {
          const clientIdentifier = encodeURIComponent(clientName || clientId);
          const response = await fetch(`/api/clients/${clientIdentifier}/continue`, {
            method: 'POST'
          });
          if (response.ok) {
            const sessionData = await response.json();
            if (sessionData.session_data) {
              // Set all story variables to match saved session state
              newStory.variablesState['session_number'] = sessionData.session_data.session;
              newStory.variablesState['client_notes'] = sessionData.session_data.notes || '';
              newStory.variablesState['last_reading_date'] = sessionData.session_data.last_session_date || '';
              newStory.variablesState['sarah_confidence'] = sessionData.session_data.confidence_level || 0;

              console.log(`Initialized story with session data:`, sessionData.session_data);
              console.log(`Starting at session ${sessionData.session_data.session}`);
              console.log(`Current session_number variable:`, newStory.variablesState['session_number']);
            }
          }
        } catch (error) {
          console.log('Could not load session state, starting from beginning:', error);
        }
      }

      // Try to load saved story state (overrides session management)
      const stateLoaded = loadStoryState(newStory);
      if (stateLoaded) {
        console.log('[StoryPlayer] Loaded story from saved state, skipping session initialization');
      }

      // Log completion of all bindings
      console.log(`[StoryPlayer] All external function bindings completed successfully`);
      console.log(`[StoryPlayer] Available external functions:`, [
        'GetCard', 'drawCards', 'shuffleDeck', 'getCardInterpretation', 'displayReading'
      ]);

      setStory(newStory);

      // Add a small delay to ensure variables are set before continuing
      setTimeout(() => {
        console.log(`[StoryPlayer] Starting story execution with bound external functions`);
        updateStoryContent(newStory);
      }, 100);
      
    } catch (err) {
      setStoryState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }));
    }
  }, [storyPath, handleStoryExternalFunction, loadStoryState]);

  // Update story content and choices
  const updateStoryContent = useCallback((currentStory: Story) => {
    const paragraphs: TaggedParagraph[] = [];
    const choices: Array<{ text: string; index: number }> = [];

    try {
      // Continue the story and collect all available text with tags
      while (currentStory.canContinue) {
        const line = currentStory.Continue();
        if (line?.trim()) {
          const tags = currentStory.currentTags || [];
          paragraphs.push({
            text: line.trim(),
            tags: tags
          });
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
      
      const isComplete = !currentStory.canContinue && choices.length === 0;

      setStoryState({
        paragraphs,
        choices,
        isLoading: false,
        error: null,
        isComplete
      });

      // If session is complete, extract variables and notify parent
      if (isComplete && onSessionComplete) {
        const variables: Record<string, any> = {};

        // Extract key story variables
        try {
          if (currentStory.variablesState) {
            variables.session_number = currentStory.variablesState.$('session_number');
            variables.client_notes = currentStory.variablesState.$('client_notes');
            variables.last_reading_date = currentStory.variablesState.$('last_reading_date');
            variables.sarah_confidence = currentStory.variablesState.$('sarah_confidence');
            variables.reading_style = currentStory.variablesState.$('reading_style');
            variables.cards_drawn = currentStory.variablesState.$('cards_drawn');
          }
        } catch (err) {
          console.error('Error extracting story variables:', err);
        }

        // Notify parent component with extracted variables
        onSessionComplete(variables);
      }

      // Auto-save after story content updates (but not if it's the initial load)
      if (paragraphs.length > 0 || choices.length > 0) {
        saveStoryState();
      }

    } catch (err) {
      setStoryState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error processing story'
      }));
    }
  }, [onSessionComplete, saveStoryState]);

  // Handle choice selection
  const makeChoice = useCallback((choiceIndex: number) => {
    if (!story || choiceIndex < 0 || choiceIndex >= story.currentChoices.length) {
      return;
    }

    try {
      // Track the choice for session notes
      if (clientId && story.currentChoices[choiceIndex]) {
        const choiceText = story.currentChoices[choiceIndex].text;
        trackChoice(choiceText, story.currentFlowName || undefined);
      }

      story.ChooseChoiceIndex(choiceIndex);
      updateStoryContent(story);

      // Auto-save after choice is made
      saveStoryState();
    } catch (err) {
      setStoryState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error making choice'
      }));
    }
  }, [story, updateStoryContent, clientId, trackChoice, saveStoryState]);

  // Restart story
  const restartStory = useCallback(() => {
    if (story) {
      // Clear saved state first
      clearSaveData();

      // Reset story state
      story.ResetState();
      updateStoryContent(story);

      // Clear tarot reading when restarting
      setCurrentReading(null);
      setSelectedCard(null);
      setIsPanelOpen(false);
      setCurrentSpread(null);
    }
  }, [story, updateStoryContent, clearSaveData]);

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

  // Save story state when component unmounts or story changes
  useEffect(() => {
    return () => {
      // Save on unmount
      if (story && storyPath) {
        saveStoryState();
      }
    };
  }, [story, storyPath, saveStoryState]);

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

  // Render dashboard or story view based on state
  if (isDashboard) {
    return (
      <div className={`h-full overflow-y-auto ${className}`}>
        <div className="max-w-7xl mx-auto p-6">
          <DashboardView
            choices={storyState.choices}
            storyContent={storyState.paragraphs}
            onChoiceClick={makeChoice}
            className=""
          />
          {/* Restart button on dashboard */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                if (confirm('Restart story and clear all saved progress?')) {
                  restartStory();
                }
              }}
              className="px-3 py-1.5 text-sm bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 transition-colors"
            >
              Restart Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      <div className="max-w-4xl mx-auto p-6">
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
        {storyState.paragraphs.map((paragraph, index) => {
          const parsedTags = paragraph.tags.map(parseTag);

          // Check for special component rendering
          if (hasCardTag(parsedTags)) {
            const card = getCardFromTag(parsedTags);
            if (card) {
              return (
                <div key={index}>
                  <p className="text-slate-200 leading-relaxed mb-2">
                    {paragraph.text}
                  </p>
                  <CardCallout card={card.name} reversed={card.reversed} />
                </div>
              );
            }
          }

          if (hasTooltipTag(parsedTags)) {
            const tooltip = getTooltipFromTag(parsedTags);
            if (tooltip) {
              return (
                <p key={index} className="text-slate-200 leading-relaxed">
                  <StoryTooltip text={paragraph.text} tooltip={tooltip} />
                </p>
              );
            }
          }

          if (hasHintTag(parsedTags)) {
            const hint = getHintFromTag(parsedTags);
            if (hint) {
              return (
                <p key={index} className="text-slate-200 leading-relaxed">
                  <StoryHint text={paragraph.text} hint={hint} />
                </p>
              );
            }
          }

          if (hasNoteTag(parsedTags)) {
            const note = getNoteFromTag(parsedTags);
            if (note) {
              return (
                <SessionNote
                  key={index}
                  text={paragraph.text}
                  category={note.category}
                  detail={note.detail}
                  onSave={(noteData) => {
                    if (clientId) {
                      addInsight(`${noteData.category}: ${noteData.text}`);
                    }
                  }}
                />
              );
            }
          }

          // Check for insight tags
          const insightTag = parsedTags.find(tag => tag.type === 'insight');
          if (insightTag) {
            return (
              <StoryInsight
                key={index}
                text={paragraph.text}
                type="insight"
                category={insightTag.params[0]}
              />
            );
          }

          // Apply styling classes based on tags
          const tagClasses = getTaggedContentClass(parsedTags);

          return (
            <p
              key={index}
              className={`text-slate-200 leading-relaxed ${tagClasses}`}
            >
              {paragraph.text}
            </p>
          );
        })}
      </div>

      {/* Restart button during gameplay */}
      {!storyState.isComplete && story && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => {
              if (confirm('Restart story and clear all saved progress?')) {
                restartStory();
              }
            }}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ↺ Restart
          </button>
        </div>
      )}

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
          <p className="text-slate-300 mb-4">Session Complete</p>
          <div className="flex gap-3 justify-center">
            {onSessionComplete && (
              <button
                onClick={() => {
                  // Extract variables and return to dashboard
                  if (story?.variablesState) {
                    const variables: Record<string, any> = {};
                    try {
                      variables.session_number = story.variablesState.$('session_number');
                      variables.client_notes = story.variablesState.$('client_notes');
                      variables.last_reading_date = story.variablesState.$('last_reading_date');
                      variables.sarah_confidence = story.variablesState.$('sarah_confidence');
                      variables.reading_style = story.variablesState.$('reading_style');
                      variables.cards_drawn = story.variablesState.$('cards_drawn');
                    } catch (err) {
                      console.error('Error extracting variables:', err);
                    }
                    onSessionComplete(variables);
                  }
                }}
                className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                Return to Dashboard
              </button>
            )}
            <button
              onClick={restartStory}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Restart Session
            </button>
          </div>
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
    </div>
  );
};

export default StoryPlayer;