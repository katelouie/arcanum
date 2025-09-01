// TypeScript interfaces for the spreads configuration schema

export interface CardPosition {
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  rotation?: number; // Degrees to rotate (0, 90, 180, 270)
  zIndex?: number; // Stacking order (higher numbers on top)
}

export interface Layout {
  name: string;
  positions: CardPosition[];
}

export interface SpreadPosition {
  name: string;
  description: string;
  keywords: string[];
}

export interface Spread {
  id: string;
  name: string;
  description: string;
  layout: string; // References a layout ID
  cardSize: 'small' | 'medium' | 'large';
  aspectRatio: number;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  positions: SpreadPosition[];
}

export interface Category {
  name: string;
  description: string;
}

export interface SpreadMetadata {
  version: string;
  lastUpdated: string;
  description: string;
}

export interface SpreadsConfig {
  layouts: Record<string, Layout>;
  spreads: Spread[];
  categories: Record<string, Category>;
  metadata: SpreadMetadata;
}

// Helper types for working with spreads
export type SpreadDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CardSize = 'small' | 'medium' | 'large';

// Validation helpers
export function validateSpread(spread: Spread, layouts: Record<string, Layout>): boolean {
  // Check if referenced layout exists
  if (!layouts[spread.layout]) {
    console.error(`Spread ${spread.id} references non-existent layout: ${spread.layout}`);
    return false;
  }

  // Check if position count matches layout
  const layout = layouts[spread.layout];
  if (spread.positions.length !== layout.positions.length) {
    console.error(`Spread ${spread.id} has ${spread.positions.length} positions but layout ${spread.layout} has ${layout.positions.length}`);
    return false;
  }

  return true;
}

export function validateSpreadsConfig(config: SpreadsConfig): boolean {
  return config.spreads.every(spread => validateSpread(spread, config.layouts));
}