import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface TarotCard {
  name: string;
  suit: string;
  number: number;
  img: string;
  reversed: boolean;
  upright: string;
  // reversed meaning is stored in the 'reversed' field when card.reversed is true
}

export interface TwineMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface TwineStoryPlayerProps {
  storyPath: string;
  className?: string;
  onCardDrawn?: (cards: TarotCard[], spread: string) => void;
  onChoiceMade?: (choice: string) => void;
  onStoryEvent?: (event: TwineMessage) => void;
  clientId?: string;
  clientName?: string;
}

export const TwineStoryPlayer: React.FC<TwineStoryPlayerProps> = ({
  storyPath,
  className = '',
  onCardDrawn,
  onChoiceMade,
  onStoryEvent,
  clientId,
  clientName
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle messages from Twine story
  const handleMessage = useCallback((event: MessageEvent) => {
    // Security: Only accept messages from same origin or file:// protocol for local testing
    if (event.origin !== window.location.origin &&
        event.origin !== 'null' &&
        !event.origin.startsWith('file://')) {
      console.warn('Rejected message from untrusted origin:', event.origin);
      return;
    }

    try {
      const message: TwineMessage = event.data;

      // Filter out React DevTools and other non-story messages
      if (!message || typeof message !== 'object' || !message.type) {
        // Don't log React DevTools bridge messages
        if (message && message.source === 'react-devtools-bridge') {
          return;
        }
        console.warn('Received message without type:', message);
        return;
      }

      console.log('[TwineStoryPlayer] Received message:', message);

      // Handle specific message types
      switch (message.type) {
        case 'CARD_DRAWN':
        case 'CARDS_DRAWN':
          if (onCardDrawn && message.data.cards) {
            onCardDrawn(message.data.cards, message.data.spread || 'unknown');
          }
          break;

        case 'CHOICE_MADE':
          if (onChoiceMade && message.data.choice) {
            onChoiceMade(message.data.choice);
          }
          break;

        case 'STORY_READY':
          setIsLoaded(true);
          setError(null);
          console.log('[TwineStoryPlayer] Story loaded successfully');
          break;

        case 'STORY_ERROR':
          setError(message.data.error || 'Unknown story error');
          console.error('[TwineStoryPlayer] Story error:', message.data);
          break;

        default:
          // Pass through all other events to the generic handler
          if (onStoryEvent) {
            onStoryEvent(message);
          }
          break;
      }
    } catch (err) {
      console.error('[TwineStoryPlayer] Error processing message:', err, event.data);
    }
  }, [onCardDrawn, onChoiceMade, onStoryEvent]);

  // Set up message listener
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Send message to Twine story
  const sendToTwine = useCallback((message: any) => {
    if (!iframeRef.current?.contentWindow) {
      console.warn('[TwineStoryPlayer] Cannot send message - iframe not ready');
      return;
    }

    try {
      console.log('[TwineStoryPlayer] Sending message to Twine:', message);
      iframeRef.current.contentWindow.postMessage(message, '*');
    } catch (err) {
      console.error('[TwineStoryPlayer] Error sending message to Twine:', err);
    }
  }, []);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    console.log('[TwineStoryPlayer] Iframe loaded');

    // Send initial configuration to story
    setTimeout(() => {
      sendToTwine({
        type: 'INIT',
        clientId: clientId,
        clientName: clientName,
        timestamp: Date.now()
      });
    }, 100); // Small delay to ensure story is fully initialized
  }, [sendToTwine, clientId, clientName]);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setError('Failed to load story');
    setIsLoaded(false);
  }, []);

  // Note: useImperativeHandle removed as it's not needed for this component

  return (
    <div className={`twine-story-container ${className} flex flex-col h-full`}>
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
          <h3 className="text-red-300 font-semibold mb-2">Story Error</h3>
          <p className="text-red-200">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (iframeRef.current) {
                iframeRef.current.src = iframeRef.current.src;
              }
            }}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoaded && !error && (
        <div className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-400"></div>
            <p className="text-slate-400">Loading story...</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={storyPath}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        className="w-full border-none rounded-lg flex-1 min-h-0"
        style={{
          height: '100%',
          display: error ? 'none' : 'block'
        }}
        title="Interactive Tarot Story"
        sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
        // Added allow-modals for SugarCube alerts and allow-same-origin for localStorage
        // Note: allow-same-origin needed for SugarCube storage adapters to work
      />
    </div>
  );
};

export default TwineStoryPlayer;