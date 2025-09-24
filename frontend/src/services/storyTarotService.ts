import axios from 'axios';

interface CardInfo {
  name: string;
  position: string;
  reversed: boolean;
  image_url: string;
}

interface ReadingRequest {
  question: string;
  spread_type: string;
  shuffle_count: number;
  include_date: boolean;
  rhythm?: number[]; // Optional array of integers to match backend expectation
}

interface ReadingResponse {
  question: string;
  spread_name: string;
  cards: CardInfo[];
  timestamp: string;
  shuffle_count: number;
  seed: number;
  interpretation?: string;
  full_prompt?: any;
  ai_response?: any;
}

interface StoryReadingOptions {
  spread?: string;
  spreadType?: string; // Alternative name for spread (for compatibility)
  question?: string;
  cardCount?: number;
  constrainedCards?: { position: number; cardName: string; reversed?: boolean }[];
  allowedCards?: string[];
  excludedCards?: string[];
  shuffleCount?: number;
  positionConstraints?: Record<string, string[]>; // New: position-specific card constraints
}

// Helper interface for parsed constraint cards
interface ConstraintCard {
  name: string;
  orientation?: 'upright' | 'reversed'; // undefined means any orientation
}

// Helper functions for constraint parsing
const parseConstraintCard = (cardStr: string): ConstraintCard => {
  const trimmed = cardStr.trim();

  // Check for new (R) format first
  if (trimmed.endsWith(' (R)')) {
    return {
      name: trimmed.slice(0, -4), // Remove ' (R)'
      orientation: 'reversed'
    };
  }
  // Backward compatibility: Check for :reversed, :r suffix
  else if (trimmed.endsWith(':reversed')) {
    return {
      name: trimmed.slice(0, -9), // Remove ':reversed'
      orientation: 'reversed'
    };
  } else if (trimmed.endsWith(':r')) {
    return {
      name: trimmed.slice(0, -2), // Remove ':r'
      orientation: 'reversed'
    };
  } else if (trimmed.endsWith(':upright')) {
    return {
      name: trimmed.slice(0, -8), // Remove ':upright'
      orientation: 'upright'
    };
  } else {
    // No orientation specified - any orientation is allowed
    return {
      name: trimmed,
      orientation: undefined
    };
  }
};

const cardMatchesConstraint = (card: CardInfo, constraintCard: ConstraintCard): boolean => {
  // Name must match
  if (card.name !== constraintCard.name) {
    return false;
  }

  // If orientation is specified, it must match
  if (constraintCard.orientation !== undefined) {
    const cardOrientation = card.reversed ? 'reversed' : 'upright';
    return cardOrientation === constraintCard.orientation;
  }

  // If no orientation specified, any orientation is allowed
  return true;
};

export class StoryTarotService {
  private baseURL = 'http://127.0.0.1:8000';

  /**
   * Parse constraint string and return card filter criteria
   */
  private parseConstraintString(constraint: string): {
    type: 'named' | 'explicit',
    filter?: any,
    cards?: string[]
  } {
    // Check for explicit card list (contains comma, :r marker, or (R) marker)
    if (constraint.includes(',') || constraint.includes(':r') || constraint.includes('(R)')) {
      const cards = constraint.split(',').map(c => c.trim());
      return { type: 'explicit', cards };
    }

    // Named constraints
    const lowerConstraint = constraint.toLowerCase().trim();

    // Suit constraints
    if (lowerConstraint === 'cups only' || lowerConstraint === 'cups') {
      return { type: 'named', filter: { suit: 'cups' } };
    }
    if (lowerConstraint === 'wands only' || lowerConstraint === 'wands') {
      return { type: 'named', filter: { suit: 'wands' } };
    }
    if (lowerConstraint === 'swords only' || lowerConstraint === 'swords') {
      return { type: 'named', filter: { suit: 'swords' } };
    }
    if (lowerConstraint === 'pentacles only' || lowerConstraint === 'pentacles') {
      return { type: 'named', filter: { suit: 'pentacles' } };
    }

    // Category constraints
    if (lowerConstraint === 'major arcana' || lowerConstraint === 'major') {
      return { type: 'named', filter: { category: 'major' } };
    }
    if (lowerConstraint === 'minor arcana' || lowerConstraint === 'minor') {
      return { type: 'named', filter: { category: 'minor' } };
    }
    if (lowerConstraint === 'court cards' || lowerConstraint === 'court') {
      return { type: 'named', filter: { category: 'court' } };
    }

    // Orientation constraints
    if (lowerConstraint === 'reversed only' || lowerConstraint === 'reversed') {
      return { type: 'named', filter: { reversed: true } };
    }
    if (lowerConstraint === 'upright only' || lowerConstraint === 'upright') {
      return { type: 'named', filter: { reversed: false } };
    }

    // Special thematic constraints
    if (lowerConstraint === 'challenging' || lowerConstraint === 'difficult') {
      return {
        type: 'explicit',
        cards: ['The Tower:r', 'Death:r', 'Three of Swords', 'Five of Cups', 'Ten of Swords', 'Five of Pentacles']
      };
    }
    if (lowerConstraint === 'positive' || lowerConstraint === 'hopeful') {
      return {
        type: 'explicit',
        cards: ['The Sun', 'The Star', 'Ten of Cups', 'The World', 'Three of Cups', 'Nine of Cups']
      };
    }

    // Default to any card
    if (lowerConstraint === 'any' || lowerConstraint === '') {
      return { type: 'named', filter: {} };
    }

    // Compound constraints (cups reversed, major arcana no tower, etc)
    // These could be parsed more sophisticatedly, but for now treat as 'any'
    console.warn(`[StoryTarotService] Unknown constraint: ${constraint}, using 'any'`);
    return { type: 'named', filter: {} };
  }

  /**
   * Draw cards with a constraint string (NEW FUNCTION)
   */
  async drawCardsWithConstraint(constraint: string, count: number = 1): Promise<{
    cards: CardInfo[];
    spread: string;
    seed?: number
  }> {
    const parsed = this.parseConstraintString(constraint);

    if (parsed.type === 'explicit' && parsed.cards) {
      // For explicit card lists, we need to pick from the specified cards
      // This is a simplified implementation - in production, you'd want proper randomization
      const selectedCards: CardInfo[] = [];
      const availableCards = [...parsed.cards];

      for (let i = 0; i < count && availableCards.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const cardStr = availableCards[randomIndex];
        availableCards.splice(randomIndex, 1);

        const reversed = cardStr.endsWith(':r');
        const name = reversed ? cardStr.slice(0, -2) : cardStr;

        selectedCards.push({
          name: name,
          reversed: reversed,
          position: i.toString(),
          image_url: '' // Will be filled by enrichCardData
        });
      }

      return {
        cards: await this.enrichCardData(selectedCards),
        spread: 'custom',
        seed: Math.random()
      };
    } else {
      // For named constraints, we need to handle them client-side
      // since the backend doesn't support these filter properties directly
      // For now, just draw cards normally and filter client-side
      return this.drawCards({
        spread: 'past-present-future', // Use a valid spread type that the backend knows
        cardCount: count
        // Note: Filter properties like 'suit', 'category', 'reversed' are not supported by the backend
        // We would need to implement client-side filtering or extend the backend API
      });
    }
  }

  /**
   * Enrich card data with full information (NEW FUNCTION)
   */
  async enrichCardData(cards: CardInfo[]): Promise<CardInfo[]> {
    // Get card image mapping
    try {
      const response = await fetch('/static/tarot-images.json');
      const data = await response.json();

      return cards.map(card => {
        const imageInfo = data.cards.find((c: any) => c.name === card.name);
        return {
          ...card,
          image_url: imageInfo ? `/static/cards_wikipedia/${imageInfo.img}` : '',
          // Could also fetch interpretations here if needed
        };
      });
    } catch (error) {
      console.error('Failed to enrich card data:', error);
      return cards;
    }
  }

  /**
   * Draw cards for story integration with optional constraints
   */
  async drawCards(options: StoryReadingOptions): Promise<{
    cards: CardInfo[];
    spread: string;
    seed?: number
  }> {
    try {
      // Validate position constraints first
      if (options.positionConstraints) {
        this.validatePositionConstraints(options.positionConstraints, options.cardCount || 3);
      }

      // For stories, we'll use the /api/reading/cards endpoint (no AI interpretation)
      const request: ReadingRequest = {
        question: options.question || "Story-driven reading",
        spread_type: options.spread || options.spreadType || "past-present-future",
        shuffle_count: options.shuffleCount || 3,
        include_date: false
        // rhythm field omitted when not needed (undefined is acceptable for Optional fields)
      };

      const response = await axios.post<ReadingResponse>(`${this.baseURL}/api/reading/cards`, request);

      let cards = response.data.cards;

      // Apply position-specific constraints (new functionality)
      if (options.positionConstraints) {
        cards = await this.applyPositionConstraints(cards, options.positionConstraints, request);
      }

      // Apply legacy constraints if specified
      if (options.constrainedCards && options.constrainedCards.length > 0) {
        cards = await this.applyCardConstraints(cards, options.constrainedCards);
      }

      // Filter by allowed/excluded cards if specified
      if (options.allowedCards && options.allowedCards.length > 0) {
        cards = await this.filterByAllowedCards(cards, options.allowedCards);
      }

      if (options.excludedCards && options.excludedCards.length > 0) {
        cards = await this.filterByExcludedCards(cards, options.excludedCards);
      }

      return {
        cards,
        spread: response.data.spread_name,
        seed: response.data.seed
      };
    } catch (error) {
      console.error('Failed to draw cards for story:', error);
      throw new Error('Failed to draw cards. Please try again.');
    }
  }

  /**
   * Get a specific card by name (useful for hard-coded story moments)
   */
  async getSpecificCard(cardName: string, position: string, reversed = false): Promise<CardInfo> {
    try {
      // For hardcoded cards, we'll need to construct the card info
      // In a real implementation, you might want to add an endpoint for this
      const enhancedCards = await axios.get(`${this.baseURL}/api/enhanced-cards`);
      const cardData = enhancedCards.data;
      
      // Find the card in the data
      const cardKey = cardName.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '').replace(/&/g, 'and');
      const found = cardData[cardKey];
      
      if (!found) {
        throw new Error(`Card not found: ${cardName}`);
      }

      // Get image info
      const cardImages = await axios.get(`${this.baseURL}/static/tarot-images.json`);
      const imageInfo = cardImages.data.cards.find((c: any) => c.name === cardName);

      return {
        name: cardName,
        position,
        reversed,
        image_url: imageInfo ? `/static/cards_wikipedia/${imageInfo.img}` : ''
      };
    } catch (error) {
      console.error(`Failed to get specific card ${cardName}:`, error);
      // Return a fallback card
      return {
        name: cardName,
        position,
        reversed,
        image_url: '/static/cards_wikipedia/placeholder.jpg'
      };
    }
  }

  /**
   * Shuffle deck (for story narrative purposes)
   */
  async shuffleDeck(): Promise<{ success: boolean; message: string }> {
    // This is more of a narrative function - in the backend, shuffling happens automatically
    // But we can simulate it for story purposes
    return {
      success: true,
      message: "The deck has been shuffled with mystical energy, ready for your reading."
    };
  }

  /**
   * Get card interpretation (leveraging existing enhanced cards system)
   */
  async getCardInterpretation(cardName: string, position: string): Promise<{
    card: string;
    position: string;
    interpretation: string;
    details?: any;
  }> {
    try {
      const enhancedCards = await axios.get(`${this.baseURL}/api/enhanced-cards`);
      const cardData = enhancedCards.data;
      
      const cardKey = cardName.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '').replace(/&/g, 'and');
      const found = cardData[cardKey];
      
      if (found && found.core_meanings) {
        const meanings = found.core_meanings;
        const interpretation = `${meanings.upright.essence}\n\nKeywords: ${meanings.upright.keywords.join(', ')}`;
        
        return {
          card: cardName,
          position,
          interpretation,
          details: found
        };
      }
      
      return {
        card: cardName,
        position,
        interpretation: `${cardName} brings powerful energy to the ${position} position, offering guidance and insight for your journey.`
      };
    } catch (error) {
      console.error(`Failed to get interpretation for ${cardName}:`, error);
      return {
        card: cardName,
        position,
        interpretation: `${cardName} in the ${position} position represents an important aspect of your reading.`
      };
    }
  }

  /**
   * Create a full reading with AI interpretation (for deeper story moments)
   */
  async createFullReading(options: StoryReadingOptions & { question: string }): Promise<ReadingResponse> {
    try {
      const request: ReadingRequest = {
        question: options.question,
        spread_type: options.spread,
        shuffle_count: options.shuffleCount || 3,
        include_date: false
        // rhythm field omitted for story readings (the backend doesn't use it for story contexts)
      };

      const response = await axios.post<ReadingResponse>(`${this.baseURL}/api/reading`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to create full reading:', error);
      throw new Error('Failed to create reading. Please try again.');
    }
  }

  private async applyCardConstraints(
    cards: CardInfo[], 
    constraints: { position: number; cardName: string; reversed?: boolean }[]
  ): Promise<CardInfo[]> {
    const modifiedCards = [...cards];
    
    for (const constraint of constraints) {
      if (constraint.position < modifiedCards.length) {
        const specificCard = await this.getSpecificCard(
          constraint.cardName, 
          modifiedCards[constraint.position].position,
          constraint.reversed ?? false
        );
        modifiedCards[constraint.position] = specificCard;
      }
    }
    
    return modifiedCards;
  }

  private async filterByAllowedCards(cards: CardInfo[], allowedCards: string[]): Promise<CardInfo[]> {
    // For now, if cards don't match allowed list, we'll keep the original
    // In a more sophisticated implementation, you might re-draw cards
    return cards.filter(card => allowedCards.includes(card.name) || allowedCards.length === 0);
  }

  private async filterByExcludedCards(cards: CardInfo[], excludedCards: string[]): Promise<CardInfo[]> {
    // Similarly, for excluded cards, we keep non-excluded cards
    return cards.filter(card => !excludedCards.includes(card.name));
  }

  /**
   * Validate position constraints to prevent impossible scenarios
   */
  private validatePositionConstraints(constraints: Record<string, string[]>, expectedCardCount: number): void {
    for (const [position, allowedCards] of Object.entries(constraints)) {
      const positionIndex = parseInt(position);

      // Check position is valid
      if (isNaN(positionIndex) || positionIndex < 0 || positionIndex >= expectedCardCount) {
        throw new Error(`Invalid position ${position}. Must be between 0 and ${expectedCardCount - 1}.`);
      }

      // Check constraint is not empty
      if (!allowedCards || allowedCards.length === 0) {
        throw new Error(`Position ${position} constraint cannot be empty. Specify at least one card name.`);
      }

      // Check for too restrictive constraints (less than 1 card allowed)
      if (allowedCards.length === 0) {
        throw new Error(`Position ${position} has no allowed cards. This makes drawing impossible.`);
      }
    }
  }

  /**
   * Apply position-specific card constraints by redrawing positions that don't match
   */
  private async applyPositionConstraints(
    originalCards: CardInfo[],
    constraints: Record<string, string[]>,
    originalRequest: ReadingRequest
  ): Promise<CardInfo[]> {
    const constrainedCards = [...originalCards];
    const maxRetries = 50; // Prevent infinite loops

    for (const [position, allowedCardStrs] of Object.entries(constraints)) {
      const positionIndex = parseInt(position);

      if (positionIndex >= constrainedCards.length) {
        continue; // Skip invalid positions
      }

      const currentCard = constrainedCards[positionIndex];

      // Parse the constraint cards to check for orientation requirements
      const allowedConstraints = allowedCardStrs.map(parseConstraintCard);

      // Check if current card matches any of the allowed constraints
      if (allowedConstraints.some(constraint => cardMatchesConstraint(currentCard, constraint))) {
        continue; // Current card is valid, keep it
      }

      // Otherwise, redraw until we get an allowed card for this position
      let retries = 0;
      let foundValidCard = false;

      while (retries < maxRetries && !foundValidCard) {
        try {
          // Draw new cards to get alternatives
          const redrawResponse = await axios.post<ReadingResponse>(
            `${this.baseURL}/api/reading/cards`,
            originalRequest
          );

          const newCards = redrawResponse.data.cards;

          // Check if any of the newly drawn cards match the constraints for this position
          for (const newCard of newCards) {
            // Check if the new card matches any of the allowed constraints
            const matchingConstraint = allowedConstraints.find(constraint =>
              constraint.name === newCard.name
            );

            if (matchingConstraint) {
              // If orientation is specified in constraint, override the card's orientation
              const finalCard = {
                ...newCard,
                position: currentCard.position, // Keep original position name
                reversed: matchingConstraint.orientation === 'reversed' ? true :
                         matchingConstraint.orientation === 'upright' ? false :
                         newCard.reversed // Keep original if no orientation specified
              };

              constrainedCards[positionIndex] = finalCard;
              foundValidCard = true;
              break;
            }
          }

          retries++;
        } catch (error) {
          console.error(`Error redrawing for position ${position}:`, error);
          retries++;
        }
      }

      if (!foundValidCard) {
        throw new Error(
          `Could not find a valid card for position ${position} after ${maxRetries} attempts. ` +
          `Allowed constraints: ${allowedCardStrs.join(', ')}. ` +
          `Consider expanding the allowed cards list for this position.`
        );
      }
    }

    return constrainedCards;
  }

  /**
   * Get available spreads for story selection
   */
  async getAvailableSpreads(): Promise<{ id: string; name: string; category: string; cardCount: number }[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/spreads`);
      const spreadsConfig = response.data;
      
      return spreadsConfig.spreads.map((spread: any) => {
        const layout = spreadsConfig.layouts[spread.layout];
        return {
          id: spread.id,
          name: spread.name,
          category: spread.category,
          cardCount: layout ? layout.positions.length : 0
        };
      });
    } catch (error) {
      console.error('Failed to get available spreads:', error);
      return [];
    }
  }
}

// Singleton instance for use across the app
export const storyTarotService = new StoryTarotService();