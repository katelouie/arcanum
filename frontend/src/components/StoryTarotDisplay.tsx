import React, { useState, useEffect } from 'react';
import { DynamicSpreadRenderer } from './SpreadRenderer';
import { useCardData } from '../hooks/useCardData';
import { storyTarotService } from '../services/storyTarotService';

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface StoryTarotDisplayProps {
  spreadId?: string;
  cards?: CardInfo[];
  title?: string;
  description?: string;
  onCardClick?: (card: CardInfo, index: number) => void;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export const StoryTarotDisplay: React.FC<StoryTarotDisplayProps> = ({
  spreadId,
  cards = [],
  title,
  description,
  onCardClick,
  className = '',
  showTitle = true,
  compact = false
}) => {
  const { spreadsConfig, getCategoryColor } = useCardData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no cards provided but we have a spreadId, we could auto-generate cards
  // For now, we'll just render what we have

  if (!spreadsConfig || !spreadId) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="text-slate-400">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-400"></div>
              <span>Preparing the cards...</span>
            </div>
          ) : error ? (
            <div className="text-red-400">
              <p className="font-medium">Error loading reading</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <p>Reading configuration loading...</p>
          )}
        </div>
      </div>
    );
  }

  const spread = spreadsConfig.spreads.find(s => s.id === spreadId);
  
  if (!spread) {
    return (
      <div className={`text-center p-6 text-red-400 ${className}`}>
        <p>Unknown spread: {spreadId}</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className={`text-center p-6 text-slate-400 ${className}`}>
        <p>No cards drawn yet...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div className="text-center space-y-2">
          {title && (
            <h3 className="text-xl font-bold text-slate-100">{title}</h3>
          )}
          
          <div className="flex items-center justify-center space-x-3">
            <h4 className="text-lg font-semibold text-violet-300">{spread.name}</h4>
            <span className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(spread.category)}`}>
              {spread.category}
            </span>
          </div>
          
          {description && (
            <p className="text-slate-300 max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      )}

      <div className={`${compact ? 'scale-90' : ''} transform transition-transform`}>
        <DynamicSpreadRenderer
          spreadId={spreadId}
          spreadsConfig={spreadsConfig}
          cards={cards}
          onCardClick={onCardClick}
        />
      </div>

      {/* Card summary for story context */}
      <div className="mt-6 space-y-2">
        <h5 className="text-sm font-medium text-slate-300 text-center">Cards Drawn</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {cards.map((card, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
              onClick={() => onCardClick?.(card, index)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-xs text-slate-300">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">
                    {card.name}
                    {card.reversed && <span className="text-red-400 ml-1">(Reversed)</span>}
                  </p>
                  <p className="text-xs text-slate-400">{card.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Hook for stories to easily create and manage readings
export const useStoryReading = () => {
  const [currentReading, setCurrentReading] = useState<{
    cards: CardInfo[];
    spreadId: string;
    title?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const drawCards = async (options: {
    spread: string;
    question?: string;
    cardCount?: number;
    constrainedCards?: { position: number; cardName: string; reversed?: boolean }[];
    allowedCards?: string[];
    excludedCards?: string[];
    title?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await storyTarotService.drawCards({
        spread: options.spread,
        question: options.question,
        constrainedCards: options.constrainedCards,
        allowedCards: options.allowedCards,
        excludedCards: options.excludedCards,
      });

      setCurrentReading({
        cards: result.cards,
        spreadId: options.spread,
        title: options.title
      });

      return result.cards;
    } catch (error) {
      console.error('Failed to draw cards:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearReading = () => {
    setCurrentReading(null);
  };

  const getSpecificCard = async (cardName: string, position: string, reversed = false) => {
    try {
      return await storyTarotService.getSpecificCard(cardName, position, reversed);
    } catch (error) {
      console.error('Failed to get specific card:', error);
      throw error;
    }
  };

  return {
    currentReading,
    isLoading,
    drawCards,
    clearReading,
    getSpecificCard
  };
};

export default StoryTarotDisplay;