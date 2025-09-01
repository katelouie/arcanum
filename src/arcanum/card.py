from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ArcanaType(Enum):
    MAJOR = "major"
    MINOR = "minor"


@dataclass(frozen=True)
class Card:
    name: str
    arcana_type: ArcanaType
    number: int
    suit: Optional[str] = None
