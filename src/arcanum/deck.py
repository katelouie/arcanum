from arcanum.card import Card, ArcanaType


class Deck:
    def __init__(self) -> None:
        self.cards = self._create_standard_deck()

    def get_cards(self) -> list[Card]:
        """Return a copy of all cards. Keeps deck immutable."""
        return self.cards.copy()

    @staticmethod
    def _create_standard_deck() -> list[Card]:
        cards = []

        # Major Arcana (22 Cards)
        majors = [
            "The Fool",
            "The Magician",
            "The High Priestess",
            "The Empress",
            "The Emperor",
            "The Hierophant",
            "The Lovers",
            "The Chariot",
            "Strength",
            "The Hermit",
            "Wheel of Fortune",
            "Justice",
            "The Hanged Man",
            "Death",
            "Temperance",
            "The Devil",
            "The Tower",
            "The Star",
            "The Moon",
            "The Sun",
            "Judgement",
            "The World",
        ]

        for number, name in enumerate(majors):
            # Numbered 0-21
            cards.append(Card(name, ArcanaType.MAJOR, number))

        # Minor Arcana (56 cards)
        suits = ["Wands", "Cups", "Swords", "Pentacles"]
        num_names = [
            "Ace",
            "Two",
            "Three",
            "Four",
            "Five",
            "Six",
            "Seven",
            "Eight",
            "Nine",
            "Ten",
        ]

        for suit in suits:
            # Numbered cards (Ace through 10)
            for num in range(1, 11):
                name = f"{num_names[num - 1]} of {suit}"
                cards.append(Card(name, ArcanaType.MINOR, num, suit))

            # Court Cards
            courts = ["Page", "Knight", "Queen", "King"]
            for raw_number, court in enumerate(courts):
                name = f"{court} of {suit}"
                # Numbers are technically 11-14
                cards.append(Card(name, ArcanaType.MINOR, raw_number + 11, suit))

        return cards
