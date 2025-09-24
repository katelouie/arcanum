/**
 * Synchronous card drawing service for Ink stories
 * Provides constraint-based card filtering and random selection
 * without requiring async API calls
 */

interface Card {
  name: string;
  img?: string;
  number?: number;
  suit?: string;
}

interface DrawnCard extends Card {
  reversed: boolean;
}

export class StoryCardService {
  private fullDeck: Card[] = [];
  private isInitialized = false;

  /**
   * Initialize the service by loading card data
   * This should be called once when the story component mounts
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const response = await fetch('/static/tarot-images.json');
      const data = await response.json();
      this.fullDeck = data.cards || [];
      this.isInitialized = true;
      console.log('[StoryCardService] Initialized with', this.fullDeck.length, 'cards');
    } catch (error) {
      console.error('[StoryCardService] Failed to initialize:', error);
      // Fallback to empty deck - GetCard will return placeholder
      this.fullDeck = [];
    }
  }

  /**
   * Synchronously draw cards based on constraint
   * @param constraint - Either a named constraint (e.g., "major arcana") or explicit card list
   * @param count - Number of cards to draw
   * @returns Array of card names with (R) suffix for reversed cards
   */
  drawCardsSync(constraint: string, count: number = 1): string[] {
    if (!this.isInitialized || this.fullDeck.length === 0) {
      console.warn('[StoryCardService] Not initialized, returning placeholder');
      return ['The Fool']; // Fallback placeholder
    }

    const cards = this.getCardsForConstraint(constraint, count);

    // Return formatted strings with (R) for reversed
    return cards.map(card =>
      card.name + (card.reversed ? ' (R)' : '')
    );
  }

  /**
   * Get a single card based on constraint (convenience method)
   */
  getCard(constraint: string): string {
    return this.drawCardsSync(constraint, 1)[0] || 'The Fool';
  }

  private getCardsForConstraint(constraint: string, count: number): DrawnCard[] {
    // Check if it's an explicit card list first
    if (constraint.includes(',')) {
      return this.handleExplicitCardList(constraint, count);
    }

    // Otherwise handle named constraints
    return this.handleNamedConstraint(constraint, count);
  }

  private handleExplicitCardList(cardList: string, count: number): DrawnCard[] {
    // Parse explicit list: "Ace of Cups,Five of Pentacles (R),The Star"
    const requestedCards = cardList.split(',').map(c => c.trim());

    // Shuffle the list for randomness
    const shuffled = this.shuffle([...requestedCards]);

    // Take up to 'count' cards
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Convert to card objects
    return selected.map(cardStr => {
      // Check for (R) suffix for reversed
      const isReversed = cardStr.endsWith(' (R)');
      const cardName = isReversed ? cardStr.slice(0, -4) : cardStr;

      // Find the base card in our deck (or create a placeholder)
      const baseCard = this.fullDeck.find(c => c.name === cardName) || {
        name: cardName,
        img: 'placeholder.jpg'
      };

      return {
        ...baseCard,
        name: cardName,
        reversed: isReversed
      };
    });
  }

  private handleNamedConstraint(constraint: string, count: number): DrawnCard[] {
    // Filter deck based on named constraint
    const filtered = this.filterByConstraint(constraint);

    if (filtered.length === 0) {
      console.warn(`[StoryCardService] No cards match constraint: ${constraint}`);
      return [{ name: 'The Fool', reversed: false, img: 'placeholder.jpg' }];
    }

    // Shuffle the filtered deck
    const shuffled = this.shuffle([...filtered]);

    // Draw cards and apply reversals
    const drawn: DrawnCard[] = [];
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const reversed = this.determineReversal(constraint);
      drawn.push({
        ...shuffled[i],
        reversed
      });
    }

    return drawn;
  }

  private determineReversal(constraint: string): boolean {
    const lower = constraint.toLowerCase().trim();

    if (lower === 'reversed only' || lower === 'reversed') {
      return true;
    }
    if (lower === 'upright only' || lower === 'upright') {
      return false;
    }

    // Default 50% chance
    return Math.random() < 0.5;
  }

  private filterByConstraint(constraint: string): Card[] {
    const lower = constraint.toLowerCase().trim();

    switch(lower) {
      case 'major arcana':
      case 'major':
        return this.fullDeck.filter(card => this.isMajorArcana(card));

      case 'cups only':
      case 'cups':
        return this.fullDeck.filter(card => this.getSuit(card) === 'cups');

      case 'wands only':
      case 'wands':
        return this.fullDeck.filter(card => this.getSuit(card) === 'wands');

      case 'swords only':
      case 'swords':
        return this.fullDeck.filter(card => this.getSuit(card) === 'swords');

      case 'pentacles only':
      case 'pentacles':
        return this.fullDeck.filter(card => this.getSuit(card) === 'pentacles');

      case 'court cards':
      case 'court':
        return this.fullDeck.filter(card => this.isCourtCard(card));

      case 'minor arcana':
      case 'minor':
        return this.fullDeck.filter(card => !this.isMajorArcana(card));

      case 'reversed only':
      case 'reversed':
      case 'upright only':
      case 'upright':
        // All cards available, reversal handled separately
        return this.fullDeck;

      case 'challenging':
      case 'difficult':
        // Return traditionally challenging cards
        return this.fullDeck.filter(card =>
          card.name === 'The Tower' ||
          card.name === 'Death' ||
          card.name === 'Three of Swords' ||
          card.name === 'Five of Cups' ||
          card.name === 'Ten of Swords' ||
          card.name === 'Five of Pentacles'
        );

      case 'positive':
      case 'hopeful':
        // Return traditionally positive cards
        return this.fullDeck.filter(card =>
          card.name === 'The Sun' ||
          card.name === 'The Star' ||
          card.name === 'Ten of Cups' ||
          card.name === 'The World' ||
          card.name === 'Three of Cups' ||
          card.name === 'Nine of Cups' ||
          card.name === 'Ace of Cups'
        );

      case 'any':
      case '':
      default:
        return this.fullDeck; // No constraint = any card
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Helper methods for card categorization
  private isMajorArcana(card: Card): boolean {
    // Major Arcana are traditionally numbered 0-21
    // Or we can check by name patterns
    const majorNames = [
      'The Fool', 'The Magician', 'The High Priestess', 'The Empress',
      'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot',
      'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice',
      'The Hanged Man', 'Death', 'Temperance', 'The Devil',
      'The Tower', 'The Star', 'The Moon', 'The Sun',
      'Judgement', 'The World'
    ];

    return majorNames.includes(card.name);
  }

  private getSuit(card: Card): string | null {
    // Check card name for suit
    if (card.name.includes('Cups')) return 'cups';
    if (card.name.includes('Wands')) return 'wands';
    if (card.name.includes('Swords')) return 'swords';
    if (card.name.includes('Pentacles')) return 'pentacles';
    return null;
  }

  private isCourtCard(card: Card): boolean {
    return card.name.includes('Page') ||
           card.name.includes('Knight') ||
           card.name.includes('Queen') ||
           card.name.includes('King');
  }
}

// Export singleton instance for convenience
export const storyCardService = new StoryCardService();