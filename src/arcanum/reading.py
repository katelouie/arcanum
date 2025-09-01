from dataclasses import dataclass
from datetime import datetime
from arcanum.deck import Deck
from arcanum.shuffle import ShuffleService
from arcanum.drawing import DrawingService
from arcanum.drawn_card import DrawnCard
from arcanum.spreads import SpreadLayout


@dataclass
class Reading:
    question: str
    spread: SpreadLayout
    cards: list[DrawnCard]
    timestamp: datetime
    shuffle_count: int
    seed: int

    def __str__(self) -> str:
        """Pretty formatted reading"""
        lines = []
        lines.append(f"Question: {self.question}")
        lines.append(f"Spread: {self.spread.name}")
        lines.append(f"Date: {self.timestamp.strftime('%Y-%m-%d %H:%M')}")
        lines.append("")

        for card in self.cards:
            lines.append(str(card))

        return "\n".join(lines)


class ReadingService:
    def __init__(self, reversal_chance: float = 0.5):
        self.deck = Deck()
        self.drawing_service = DrawingService(reversal_chance)

    def perform_reading(
        self,
        question: str,
        spread: SpreadLayout,
        shuffle_count: int = 7,
        include_date: bool = False,
    ) -> Reading:
        """
        Perform a complete tarot reading

        Args:
            question: The question being asked
            spread: The spread layout to use
            shuffle_count: Number of shuffles (affects randomness)
            include_date: Whether to include today's date in the seed
        """
        # Generate seed from question and shuffle count
        seed = ShuffleService.generate_seed(question, shuffle_count, include_date)

        # Get and shuffle the cards
        cards = self.deck.get_cards()
        shuffled_cards = ShuffleService.shuffle_cards(cards, seed)

        # Draw cards for the spread
        position_names = [pos.name for pos in spread.positions]
        drawn_cards = self.drawing_service.draw_cards(
            shuffled_cards, spread.card_count, position_names
        )

        # Create the reading
        reading = Reading(
            question=question,
            spread=spread,
            cards=drawn_cards,
            timestamp=datetime.now(),
            shuffle_count=shuffle_count,
            seed=seed,
        )

        return reading
