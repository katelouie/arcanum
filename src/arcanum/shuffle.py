import hashlib
import random

from arcanum.card import Card
from datetime import date


class ShuffleService:
    @staticmethod
    def generate_seed(
        question: str, shuffle_count: int, include_date: bool = False
    ) -> int:
        """Generate deterministic seed from question and shuffle count."""
        # Clean the question for consistency
        clean_question = question.lower().strip()

        # Combine with shuffle count
        combined = f"{clean_question}|{shuffle_count}"

        if include_date:
            today = date.today().isoformat()
            combined = f"{combined}|{today}"

        # Create hash and convert to integer seed
        hash_object = hashlib.sha256(combined.encode("utf-8"))
        # Use first 8 hex characters and convert to int
        seed = int(hash_object.hexdigest()[:8], 16)

        return seed

    @staticmethod
    def shuffle_cards(cards: list[Card], seed: int) -> list[Card]:
        """Shuffle cards using the given seed. Deterministic."""
        # Copy so we don't modify the original
        shuffled = cards.copy()

        # Set the seed for reproducable shuffling
        random.seed(seed)
        random.shuffle(shuffled)

        return shuffled
