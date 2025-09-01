import { SpreadContainer } from './SpreadContainer';

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface SpreadLayoutProps {
  cards: CardInfo[];
  onCardClick?: (card: CardInfo, index: number) => void;
}

// Coordinate definitions for each spread type
// Note: y-coordinates adjusted for top-alignment (coordinate = top of card)
const SPREAD_LAYOUTS = {
  single: [
    { x: 50, y: 30 } // Center
  ],

  threeCard: [
    { x: 25, y: 30 }, // Past (left)
    { x: 50, y: 30 }, // Present (center)
    { x: 75, y: 30 }  // Future (right)
  ],

  fiveCardCross: [
    { x: 50, y: 35 }, // Present Situation (center)
    { x: 50, y: 5 }, // Challenge (top)
    { x: 25, y: 35 }, // Past Influences (left)
    { x: 75, y: 35 }, // Future Potential (right)
    { x: 50, y: 70 }  // Advice (bottom)
  ],

  fourCardDecision: [
    { x: 30, y: 10 }, // Option A (top-left)
    { x: 70, y: 10 }, // Option B (top-right)
    { x: 30, y: 55 }, // What Helps (bottom-left)
    { x: 70, y: 55 }  // What Hinders (bottom-right)
  ],

  sixCardRelationship: [
    { x: 20, y: 15 }, // You (top-left)
    { x: 80, y: 15 }, // The Other (top-right)
    { x: 50, y: 15 }, // The Relationship (top-center)
    { x: 20, y: 55 }, // Past Foundation (bottom-left)
    { x: 50, y: 55 }, // Present State (bottom-center)
    { x: 80, y: 55 }  // Future Potential (bottom-right)
  ],

  horseshoe: [
    { x: 20, y: 55 }, // Past (bottom-left)
    { x: 30, y: 25 }, // Present (left side, rising)
    { x: 45, y: 10 }, // Hidden Influences (left top of arc)
    { x: 55, y: 10 }, // Your Approach (right top of arc)
    { x: 70, y: 25 }, // Others Around You (right side, rising)
    { x: 80, y: 55 }, // Hopes and Fears (bottom-right)
    { x: 50, y: 65 }  // Final Outcome (bottom center)
  ],

  celticCross: [
    { x: 35, y: 35, zIndex: 1 }, // Present Situation (center of cross)
    { x: 35, y: 35, rotation: 90, zIndex: 2 }, // Challenge (crosses over center, rotated 90°)
    { x: 35, y: 60 }, // Distant Past (bottom of cross)
    { x: 20, y: 35 }, // Recent Past (left of cross)
    { x: 35, y: 10 }, // Possible Outcome (top of cross)
    { x: 50, y: 35 }, // Near Future (right of cross)
    { x: 80, y: 75 }, // Your Approach (bottom of staff)
    { x: 80, y: 50 }, // External Influences (staff, second from bottom)
    { x: 80, y: 27 }, // Hopes and Fears (staff, second from top)
    { x: 80, y: 5 }  // Final Outcome (top of staff)
  ]
};

export function SingleCardLayout({ cards, onCardClick }: SpreadLayoutProps) {
  return (
    <SpreadContainer
      cards={cards}
      positions={SPREAD_LAYOUTS.single}
      cardSize="large"
      aspectRatio={2}
      onCardClick={onCardClick}
    />
  );
}

export function ThreeCardLayout({ cards, onCardClick }: SpreadLayoutProps) {
  return (
    <SpreadContainer
      cards={cards}
      positions={SPREAD_LAYOUTS.threeCard}
      cardSize="large"
      aspectRatio={3}
      onCardClick={onCardClick}
    />
  );
}

export function FiveCardCrossLayout({ cards, onCardClick }: SpreadLayoutProps) {
  return (
    <SpreadContainer
      cards={cards}
      positions={SPREAD_LAYOUTS.fiveCardCross}
      cardSize="medium"
      aspectRatio={1.0}
      onCardClick={onCardClick}
    />
  );
}

export function FourCardDecisionLayout({ cards, onCardClick }: SpreadLayoutProps) {
  return (
    <SpreadContainer
      cards={cards}
      positions={SPREAD_LAYOUTS.fourCardDecision}
      cardSize="large"
      aspectRatio={1.5}
      onCardClick={onCardClick}
    />
  );
}

export function SixCardRelationshipLayout({ cards, onCardClick }: SpreadLayoutProps) {
  return (
    <SpreadContainer
      cards={cards}
      positions={SPREAD_LAYOUTS.sixCardRelationship}
      cardSize="medium"
      aspectRatio={1.5}
      onCardClick={onCardClick}
    />
  );
}

export function SevenCardHorseshoeLayout({ cards, onCardClick }: SpreadLayoutProps) {
  return (
    <SpreadContainer
      cards={cards}
      positions={SPREAD_LAYOUTS.horseshoe}
      cardSize="small"
      aspectRatio={1.5}
      onCardClick={onCardClick}
    />
  );
}

export function CelticCrossLayout({ cards, onCardClick }: SpreadLayoutProps) {
  return (
    <SpreadContainer
      cards={cards}
      positions={SPREAD_LAYOUTS.celticCross}
      cardSize="small"
      aspectRatio={0.8}
      onCardClick={onCardClick}
    />
  );
}