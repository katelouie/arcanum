"""Test the Deck.py module."""

import pytest
from arcanum.deck import Deck
from arcanum.card import ArcanaType


class TestDeck:
    def test_deck_has_correct_number_of_cards(self) -> None:
        """Basic sanity check -- should have 78 cards total."""
        deck = Deck()
        cards = deck.get_cards()

        assert len(cards) == 78

    def test_major_minor_split(self) -> None:
        """Verify correct split of major/minor arcana."""
        deck = Deck()
        cards = deck.get_cards()

        majors = [c for c in cards if c.arcana_type == ArcanaType.MAJOR]
        minors = [c for c in cards if c.arcana_type == ArcanaType.MINOR]

        assert len(majors) == 22
        assert len(minors) == 56

    def test_no_duplicate_cards(self) -> None:
        """Ensure all cards are unique."""
        deck = Deck()
        cards = deck.get_cards()

        # Cards are hashable due to frozen=True in dataclass
        unique_cards = set(cards)

        assert len(unique_cards) == 78

    def test_get_cards_returns_copy(self) -> None:
        """Ensure we can't accidentally modify the deck."""
        deck = Deck()
        cards1 = deck.get_cards()
        cards2 = deck.get_cards()

        # Modify one copy
        cards1.pop()

        # Other copy should be unchanged
        assert len(cards1) == 77
        assert len(cards2) == 78
        assert len(deck.get_cards()) == 78

    def test_contains_expected_cards(self) -> None:
        """Spot check a few key cards exist"""
        deck = Deck()
        cards = deck.get_cards()
        card_names = [c.name for c in cards]

        # Check some major arcana
        assert "The Fool" in card_names
        assert "The World" in card_names

        # Check some minor arcana
        assert "Ace of Cups" in card_names
        assert "King of Swords" in card_names
        assert "10 of Pentacles" in card_names
