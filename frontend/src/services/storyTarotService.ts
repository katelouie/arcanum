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
  rhythm: string;
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
  spread: string;
  question?: string;
  cardCount?: number;
  constrainedCards?: { position: number; cardName: string; reversed?: boolean }[];
  allowedCards?: string[];
  excludedCards?: string[];
  shuffleCount?: number;
}

export class StoryTarotService {
  private baseURL = 'http://127.0.0.1:8000';

  /**
   * Draw cards for story integration with optional constraints
   */
  async drawCards(options: StoryReadingOptions): Promise<{ 
    cards: CardInfo[]; 
    spread: string; 
    seed?: number 
  }> {
    try {
      // For stories, we'll use the /api/reading/cards endpoint (no AI interpretation)
      const request: ReadingRequest = {
        question: options.question || "Story-driven reading",
        spread_type: options.spread || options.spreadType || "past-present-future",
        shuffle_count: options.shuffleCount || 3,
        include_date: false,
        rhythm: null  // rhythm should be null or a list of integers
      };

      const response = await axios.post<ReadingResponse>(`${this.baseURL}/api/reading/cards`, request);
      
      let cards = response.data.cards;

      // Apply constraints if specified
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
        include_date: false,
        rhythm: "steady"
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