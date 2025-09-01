import random
from typing import Optional
from arcanum.card import Card
from arcanum.drawn_card import DrawnCard


class DrawingService:
    def __init__(self, reversal_chance: float = 0.5):
        """
        Args:
            reversal_chance: Probability a card will be drawn reversed (0.0 to 1.0)
        """
        self.reversal_chance = reversal_chance

    def draw_cards(
        self,
        shuffled_cards: list[Card],
        count: int,
        positions: Optional[list[str]] = None,
    ) -> list[DrawnCard]:
        """
        Draw cards from shuffled deck, applying reversal logic

        Args:
            shuffled_cards: Pre-shuffled list of cards
            count: Number of cards to draw
            positions: Optional position names (e.g., ["Past", "Present", "Future"])
        """
        if count > len(shuffled_cards):
            raise ValueError(
                f"Cannot draw {count} cards from {len(shuffled_cards)} available"
            )

        drawn = []
        for i in range(count):
            card = shuffled_cards[i]

            # Determine if reversed (uses existing random state from shuffle)
            is_reversed = random.random() < self.reversal_chance

            # Get position name if provided
            position = positions[i] if positions and i < len(positions) else None

            drawn_card = DrawnCard(card, is_reversed, position)
            drawn.append(drawn_card)

        return drawn
