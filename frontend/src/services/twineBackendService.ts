/**
 * Service for integrating Twine stories with the existing FastAPI backend
 * This maintains compatibility with existing session tracking, AI interpretations, etc.
 */

interface TwineSessionEvent {
  clientId: string;
  event: string;
  data: any;
  timestamp: number;
}

interface TarotCard {
  name: string;
  suit: string;
  number: number;
  img: string;
  reversed: boolean;
  upright: string;
  reversed_meaning?: string;
}

interface AIInterpretationRequest {
  cards: TarotCard[];
  spread: string;
  question?: string;
}

interface AIInterpretationResponse {
  interpretation: string;
  card_meanings: any[];
  timestamp: string;
}

export class TwineBackendService {
  private baseURL = 'http://127.0.0.1:8000';

  /**
   * Track session events for Twine stories (disabled until backend endpoint exists)
   */
  async trackSessionEvent(event: TwineSessionEvent): Promise<void> {
    // TODO: Implement /api/sessions/track endpoint in backend
    console.log('[TwineBackendService] Session event (not tracked yet):', event);
    // Don't throw - session tracking shouldn't break story flow
  }

  /**
   * Get AI interpretation for drawn cards (existing FastAPI endpoint)
   */
  async getAIInterpretation(request: AIInterpretationRequest): Promise<AIInterpretationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/interpretation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cards: request.cards.map(card => ({
            name: card.name,
            position: 'Story Generated',
            reversed: card.reversed,
            image_url: `/static/cards_wikipedia/${card.img}`
          })),
          spread_type: request.spread,
          question: request.question || 'Story-driven reading'
        })
      });

      if (!response.ok) {
        throw new Error(`AI interpretation request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get AI interpretation:', error);
      throw error;
    }
  }

  /**
   * Get enhanced card data (existing enhanced-cards endpoint)
   */
  async getEnhancedCardData(): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/enhanced-cards`);

      if (!response.ok) {
        throw new Error(`Enhanced cards request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get enhanced card data:', error);
      throw error;
    }
  }

  /**
   * Get card image mapping (existing static file)
   */
  async getCardImageMapping(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/static/tarot-images.json`);

      if (!response.ok) {
        throw new Error(`Card images request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get card image mapping:', error);
      throw error;
    }
  }

  /**
   * Create or update client session (existing client management)
   */
  async updateClientSession(clientId: string, data: any): Promise<void> {
    try {
      await fetch(`${this.baseURL}/api/clients/${encodeURIComponent(clientId)}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to update client session:', error);
      // Don't throw - client updates shouldn't break story flow
    }
  }

  /**
   * Get client session info (existing client management)
   */
  async getClientSession(clientId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/clients/${encodeURIComponent(clientId)}`);

      if (!response.ok) {
        throw new Error(`Client session request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get client session:', error);
      return null;
    }
  }

  /**
   * Helper function to convert Twine card format to backend card format
   */
  static formatCardForBackend(twineCard: TarotCard): any {
    return {
      name: twineCard.name,
      position: 'Story Generated',
      reversed: twineCard.reversed,
      image_url: `/static/cards_wikipedia/${twineCard.img}`
    };
  }

  /**
   * Helper function to track card drawing events
   */
  async trackCardDrawing(
    clientId: string,
    cards: TarotCard[],
    spread: string,
    context?: string
  ): Promise<void> {
    await this.trackSessionEvent({
      clientId,
      event: 'cards_drawn',
      data: {
        cards: cards.map(TwineBackendService.formatCardForBackend),
        spread,
        context,
        count: cards.length
      },
      timestamp: Date.now()
    });
  }

  /**
   * Helper function to track story choices
   */
  async trackChoice(
    clientId: string,
    choice: string,
    context?: string
  ): Promise<void> {
    await this.trackSessionEvent({
      clientId,
      event: 'choice_made',
      data: {
        choice,
        context
      },
      timestamp: Date.now()
    });
  }
}

// Singleton instance for use across components
export const twineBackendService = new TwineBackendService();

// Helper functions that can be injected into Twine stories
export const createTwineBackendFunctions = (clientId: string) => ({
  trackEvent: (event: string, data: any) =>
    twineBackendService.trackSessionEvent({ clientId, event, data, timestamp: Date.now() }),

  trackCards: (cards: TarotCard[], spread: string, context?: string) =>
    twineBackendService.trackCardDrawing(clientId, cards, spread, context),

  trackChoice: (choice: string, context?: string) =>
    twineBackendService.trackChoice(clientId, choice, context),

  getAI: (cards: TarotCard[], spread: string, question?: string) =>
    twineBackendService.getAIInterpretation({ cards, spread, question }),

  updateSession: (data: any) =>
    twineBackendService.updateClientSession(clientId, data)
});