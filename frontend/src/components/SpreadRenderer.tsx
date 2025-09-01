import { SpreadContainer } from './SpreadContainer';
import type { Spread, Layout, SpreadsConfig } from '../types/spreads';

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface SpreadRendererProps {
  spread: Spread;
  layout: Layout;
  cards: CardInfo[];
  onCardClick?: (card: CardInfo, index: number) => void;
}

export function SpreadRenderer({ spread, layout, cards, onCardClick }: SpreadRendererProps) {
  return (
    <SpreadContainer
      cards={cards}
      positions={layout.positions}
      cardSize={spread.cardSize}
      aspectRatio={spread.aspectRatio}
      onCardClick={onCardClick}
    />
  );
}

// Helper component for when we need to render a spread by ID
interface DynamicSpreadRendererProps {
  spreadId: string;
  spreadsConfig: SpreadsConfig;
  cards: CardInfo[];
  onCardClick?: (card: CardInfo, index: number) => void;
}

export function DynamicSpreadRenderer({ 
  spreadId, 
  spreadsConfig, 
  cards, 
  onCardClick 
}: DynamicSpreadRendererProps) {
  const spread = spreadsConfig.spreads.find(s => s.id === spreadId);
  
  if (!spread) {
    console.error(`Spread not found: ${spreadId}`);
    return <div className="text-red-400">Spread not found: {spreadId}</div>;
  }

  const layout = spreadsConfig.layouts[spread.layout];
  
  if (!layout) {
    console.error(`Layout not found: ${spread.layout} for spread ${spreadId}`);
    return <div className="text-red-400">Layout not found: {spread.layout}</div>;
  }

  // Validate card count matches layout
  if (cards.length !== layout.positions.length) {
    console.error(`Card count mismatch: ${cards.length} cards but layout has ${layout.positions.length} positions`);
    return <div className="text-red-400">Card count mismatch for spread {spread.name}</div>;
  }

  return (
    <SpreadRenderer
      spread={spread}
      layout={layout}
      cards={cards}
      onCardClick={onCardClick}
    />
  );
}