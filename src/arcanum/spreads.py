from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class SpreadPosition:
    name: str
    description: str


class SpreadLayout(ABC):
    """Abstract base for different spread types"""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def positions(self) -> list[SpreadPosition]:
        pass

    @property
    def card_count(self) -> int:
        return len(self.positions)


class SingleCardSpread(SpreadLayout):
    @property
    def name(self) -> str:
        return "Single Card"

    @property
    def positions(self) -> list[SpreadPosition]:
        return [SpreadPosition("Focus", "The main energy or message for you")]


class ThreeCardSpread(SpreadLayout):
    @property
    def name(self) -> str:
        return "3 Cards (Past, Present, Future)"

    @property
    def positions(self) -> list[SpreadPosition]:
        return [
            SpreadPosition("Past", "Influences from your past affecting the situation"),
            SpreadPosition("Present", "Current energies and circumstances"),
            SpreadPosition("Future", "Likely outcome or direction"),
        ]


class CelticCrossSpread(SpreadLayout):
    @property
    def name(self) -> str:
        return "Celtic Cross"

    @property
    def positions(self) -> list[SpreadPosition]:
        return [
            SpreadPosition("Present Situation", "The heart of the matter"),
            SpreadPosition("Challenge", "What crosses you or challenges you"),
            SpreadPosition("Distant Past", "Foundation of the situation"),
            SpreadPosition("Recent Past", "Recent events affecting the situation"),
            SpreadPosition("Possible Outcome", "What may come to pass"),
            SpreadPosition("Near Future", "What will happen in the immediate future"),
            SpreadPosition("Your Approach", "How you see yourself in this situation"),
            SpreadPosition(
                "External Influences", "How others see you or external factors"
            ),
            SpreadPosition("Hopes and Fears", "Your inner emotions about the outcome"),
            SpreadPosition("Final Outcome", "The ultimate result of the situation"),
        ]
