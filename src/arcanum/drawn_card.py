from dataclasses import dataclass
from typing import Optional
from arcanum.card import Card


@dataclass
class DrawnCard:
    card: Card
    reversed: bool = False
    position: Optional[str] = None

    @property
    def display_name(self) -> str:
        """Get the display name including reversal status"""
        name = self.card.name
        if self.reversed:
            name += " (Reversed)"
        return name

    def __str__(self) -> str:
        """Pretty string representation"""
        result = self.display_name
        if self.position:
            result = f"{self.position}: {result}"
        return result
