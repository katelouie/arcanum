import React, { useMemo, useState, useEffect } from 'react';
import { useCardData } from '../../hooks/useCardData';

interface CardCalloutProps {
  card: string;
  reversed?: boolean;
  className?: string;
}

export const CardCallout: React.FC<CardCalloutProps> = ({
  card,
  reversed = false,
  className = ''
}) => {
  const { enhancedCards, getCardInterpretation } = useCardData();
  const [cardImageData, setCardImageData] = useState<any>(null);

  // Fetch the tarot images mapping
  useEffect(() => {
    const fetchCardImages = async () => {
      try {
        const response = await fetch('/static/tarot-images.json');
        const data = await response.json();
        setCardImageData(data);
      } catch (error) {
        console.error('Failed to load card images:', error);
      }
    };

    fetchCardImages();
  }, []);

  const cardData = useMemo(() => {
    if (!enhancedCards) return null;

    // Convert card name to the key format used in enhanced cards
    const cardKey = card.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '').replace(/&/g, 'and');
    const data = enhancedCards[cardKey];

    if (data) {
      // Find the correct image filename using the tarot-images.json mapping
      let imageUrl = '';
      if (cardImageData && cardImageData.cards) {
        const imageInfo = cardImageData.cards.find((c: any) => c.name === card);
        imageUrl = imageInfo ? `/static/cards_wikipedia/${imageInfo.img}` : '';
      }

      return {
        name: card,
        image_url: imageUrl,
        keywords: data.core_meanings?.upright?.keywords || [],
        upright_meaning: data.core_meanings?.upright?.essence || 'No meaning available',
        reversed_meaning: data.core_meanings?.reversed?.essence || 'No reversed meaning available'
      };
    }

    return null;
  }, [enhancedCards, card, cardImageData]);

  if (!enhancedCards) {
    return (
      <div className={`my-4 p-4 bg-slate-800/50 border border-slate-600/30 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-400"></div>
          <p className="text-slate-400">Loading card data...</p>
        </div>
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className={`my-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg ${className}`}>
        <p className="text-yellow-300">Card "{card}" not found in deck</p>
      </div>
    );
  }

  const meaning = reversed ? cardData.reversed_meaning : cardData.upright_meaning;
  const keywords = cardData.keywords;

  return (
    <div className={`my-4 p-4 bg-gradient-to-r from-violet-900/20 to-indigo-900/20
                     border border-violet-500/30 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-start gap-3">
        {cardData.image_url && (
          <div className="flex-shrink-0">
            <img
              src={cardData.image_url}
              alt={card}
              className={`w-16 h-24 object-cover rounded shadow-md
                         ${reversed ? 'transform rotate-180' : ''}`}
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-violet-300 font-semibold text-lg">
              {card}
            </h4>
            {reversed && (
              <span className="px-2 py-0.5 bg-violet-800/50 text-violet-200 text-xs rounded">
                Reversed
              </span>
            )}
          </div>
          {keywords && keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {keywords.slice(0, 4).map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-indigo-800/30 text-indigo-200 text-xs rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
          <p className="text-slate-200 text-sm leading-relaxed">
            {meaning}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardCallout;