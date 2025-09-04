import React from 'react';

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface CardPosition {
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  rotation?: number; // Degrees to rotate (0, 90, 180, 270)
  zIndex?: number; // Stacking order (higher numbers on top)
}

interface SpreadContainerProps {
  cards: CardInfo[];
  positions: CardPosition[];
  aspectRatio?: number; // width/height ratio, defaults to 16/9
  cardSize?: 'small' | 'medium' | 'large';
  onCardClick?: (card: CardInfo, index: number) => void;
}

export function SpreadContainer({ 
  cards, 
  positions, 
  aspectRatio = 16/9,
  cardSize = 'medium',
  onCardClick
}: SpreadContainerProps) {
  
  // Card size configurations
  const cardSizes = {
    small: { width: 'w-16', height: 'h-28', text: 'text-xs' },
    medium: { width: 'w-20', height: 'h-32', text: 'text-sm' },
    large: { width: 'w-24', height: 'h-40', text: 'text-base' }
  };
  
  const currentSize = cardSizes[cardSize];
  
  // Calculate the vertical spread of the positions to determine if we need extra height
  const maxY = positions.length > 0 ? Math.max(...positions.map(p => p.y)) : 0;
  const minY = positions.length > 0 ? Math.min(...positions.map(p => p.y)) : 0;
  const verticalSpread = maxY - minY;
  
  // Calculate container height based on width and aspect ratio
  const containerHeight = `${(100 / aspectRatio)}vw`;
  
  // Dynamic max height based on aspect ratio and vertical spread
  let maxHeight;
  if (verticalSpread > 80 || cards.length >= 10) {
    // Large spreads that use most of the vertical space (like wheel layouts)
    maxHeight = '1000px';
  } else if (aspectRatio < 1) {
    // Portrait aspect ratios
    maxHeight = '900px';
  } else {
    // Landscape aspect ratios
    maxHeight = '700px';
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div 
        className="relative w-full bg-gradient-to-br from-slate-900/20 to-slate-800/20 rounded-xl border border-slate-700/50"
        style={{ 
          height: containerHeight,
          maxHeight: maxHeight,
          minHeight: '400px'
        }}
      >
        {cards.map((card, index) => {
          const position = positions[index];
          if (!position) return null;
          
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                zIndex: position.zIndex || 0,
              }}
            >
              <div className="text-center">
                <div className="mb-2">
                  <img 
                    src={`http://127.0.0.1:8000${card.image_url}`}
                    alt={card.name}
                    className={`${currentSize.width} ${currentSize.height} object-cover rounded-lg shadow-xl border border-slate-600 mx-auto transition-all duration-200 hover:shadow-2xl hover:border-violet-400 ${
                      onCardClick ? 'cursor-pointer' : ''
                    }`}
                    style={{
                      transform: `${card.reversed ? 'rotate(180deg)' : ''} ${position.rotation ? `rotate(${position.rotation}deg)` : ''}`.trim()
                    }}
                    onMouseEnter={(e) => {
                      const currentTransform = e.currentTarget.style.transform;
                      e.currentTarget.style.transform = `${currentTransform} scale(1.05)`;
                    }}
                    onMouseLeave={(e) => {
                      const transforms = [];
                      if (card.reversed) transforms.push('rotate(180deg)');
                      if (position.rotation) transforms.push(`rotate(${position.rotation}deg)`);
                      e.currentTarget.style.transform = transforms.join(' ');
                    }}
                    onClick={() => onCardClick?.(card, index)}
                  />
                </div>
                <div className="max-w-24" style={{ 
                  transform: position.rotation ? `rotate(-${position.rotation}deg)` : undefined 
                }}>
                  <h4 className={`${currentSize.text} font-bold text-slate-100 mb-1 leading-tight`}>
                    {card.name}
                  </h4>
                  <p className={`text-violet-400 font-medium ${currentSize.text === 'text-xs' ? 'text-xs' : 'text-xs'} leading-tight`}>
                    {card.position}
                  </p>
                  {card.reversed && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800 mt-1">
                      Rev
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}