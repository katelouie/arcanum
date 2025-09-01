"""
Core Card Meaning Extractor - Piece 4 of Context Retrieval Architecture

Extracts core meanings, keywords, and interpretations from card data 
based on card name and orientation (upright/reversed).
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# CardDataLoader import will be handled at runtime to avoid import issues


class CardOrientation(Enum):
    """Card orientation for interpretation"""
    UPRIGHT = "upright"
    REVERSED = "reversed"


@dataclass
class CoreCardMeaning:
    """Structured representation of a card's core meaning"""
    card_name: str
    orientation: CardOrientation
    essence: str
    keywords: List[str]
    psychological: str
    spiritual: str
    practical: str
    shadow: str
    archetype: Optional[str] = None
    suit: Optional[str] = None
    card_number: Optional[int] = None


@dataclass
class CardSymbols:
    """Symbolic information about a card"""
    symbols: Dict[str, str]
    elemental_correspondences: Dict[str, Any]
    colors: List[str]
    crystals: List[str]
    herbs: List[str]


@dataclass
class CardEnrichment:
    """Additional enrichment data for a card"""
    affirmations: List[str]
    journaling_prompts: List[str]
    meditation_focus: str
    card_relationships: Dict[str, Dict[str, Dict[str, Any]]]


class CardMeaningExtractor:
    """Extracts and structures card meanings from JSON data"""
    
    def __init__(self, card_loader):  # Type hint removed to avoid import issues
        self.card_loader = card_loader
    
    def get_core_meaning(
        self, 
        card_name: str, 
        orientation: CardOrientation
    ) -> Optional[CoreCardMeaning]:
        """
        Extract core meaning for a card in specific orientation
        
        Args:
            card_name: Name of the card (e.g., "The Fool", "Ace of Cups")
            orientation: Upright or reversed
            
        Returns:
            CoreCardMeaning object or None if card not found
        """
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return None
        
        # Get core meanings for the orientation
        core_meanings = card_data.get("core_meanings", {})
        orientation_data = core_meanings.get(orientation.value, {})
        
        if not orientation_data:
            return None
        
        return CoreCardMeaning(
            card_name=card_data.get("card_name", card_name),
            orientation=orientation,
            essence=orientation_data.get("essence", ""),
            keywords=orientation_data.get("keywords", []),
            psychological=orientation_data.get("psychological", ""),
            spiritual=orientation_data.get("spiritual", ""),
            practical=orientation_data.get("practical", ""),
            shadow=orientation_data.get("shadow", ""),
            archetype=card_data.get("archetype"),
            suit=card_data.get("suit"),
            card_number=card_data.get("card_number")
        )
    
    def get_card_symbols(self, card_name: str) -> Optional[CardSymbols]:
        """Extract symbolic information for a card"""
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return None
        
        # Extract elemental correspondences
        elem_corr = card_data.get("elemental_correspondences", {})
        
        return CardSymbols(
            symbols=card_data.get("symbols", {}),
            elemental_correspondences=elem_corr,
            colors=elem_corr.get("colors", []),
            crystals=elem_corr.get("crystals", []),
            herbs=elem_corr.get("herbs", [])
        )
    
    def get_card_enrichment(self, card_name: str) -> Optional[CardEnrichment]:
        """Extract enrichment data (affirmations, prompts, etc.)"""
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return None
        
        return CardEnrichment(
            affirmations=card_data.get("affirmations", []),
            journaling_prompts=card_data.get("journaling_prompts", []),
            meditation_focus=card_data.get("meditation_focus", ""),
            card_relationships=card_data.get("card_relationships", {})
        )
    
    def get_meaning_summary(
        self, 
        card_name: str, 
        orientation: CardOrientation,
        include_symbols: bool = False,
        include_enrichment: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Get a comprehensive summary of card meaning and data
        
        Args:
            card_name: Name of the card
            orientation: Upright or reversed
            include_symbols: Whether to include symbolic information
            include_enrichment: Whether to include affirmations, prompts, etc.
            
        Returns:
            Dictionary with all requested card information
        """
        core_meaning = self.get_core_meaning(card_name, orientation)
        if not core_meaning:
            return None
        
        summary = {
            "core_meaning": core_meaning,
            "card_id": self.card_loader.get_card_id(card_name)
        }
        
        if include_symbols:
            summary["symbols"] = self.get_card_symbols(card_name)
        
        if include_enrichment:
            summary["enrichment"] = self.get_card_enrichment(card_name)
        
        return summary
    
    def compare_orientations(self, card_name: str) -> Optional[Dict[str, CoreCardMeaning]]:
        """Get both upright and reversed meanings for comparison"""
        upright = self.get_core_meaning(card_name, CardOrientation.UPRIGHT)
        reversed_meaning = self.get_core_meaning(card_name, CardOrientation.REVERSED)
        
        if not upright or not reversed_meaning:
            return None
        
        return {
            "upright": upright,
            "reversed": reversed_meaning
        }
    
    def get_keywords_for_orientation(
        self, 
        card_name: str, 
        orientation: CardOrientation
    ) -> List[str]:
        """Quick access to just the keywords for a card/orientation"""
        core_meaning = self.get_core_meaning(card_name, orientation)
        return core_meaning.keywords if core_meaning else []
    
    def get_essence_for_orientation(
        self, 
        card_name: str, 
        orientation: CardOrientation
    ) -> str:
        """Quick access to just the essence for a card/orientation"""
        core_meaning = self.get_core_meaning(card_name, orientation)
        return core_meaning.essence if core_meaning else ""
    
    def validate_card_data(self, card_name: str) -> Dict[str, bool]:
        """Validate that a card has all expected data fields"""
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return {"exists": False}
        
        checks = {
            "exists": True,
            "has_core_meanings": "core_meanings" in card_data,
            "has_upright": False,
            "has_reversed": False,
            "has_symbols": "symbols" in card_data,
            "has_correspondences": "elemental_correspondences" in card_data,
            "has_affirmations": "affirmations" in card_data
        }
        
        # Check orientations
        core_meanings = card_data.get("core_meanings", {})
        checks["has_upright"] = "upright" in core_meanings
        checks["has_reversed"] = "reversed" in core_meanings
        
        # Check required fields in orientations
        for orientation in ["upright", "reversed"]:
            if orientation in core_meanings:
                orient_data = core_meanings[orientation]
                checks[f"{orientation}_has_essence"] = "essence" in orient_data
                checks[f"{orientation}_has_keywords"] = "keywords" in orient_data
                checks[f"{orientation}_has_psychological"] = "psychological" in orient_data
        
        return checks


# Test function
def test_card_meaning_extractor():
    """Test the card meaning extractor"""
    try:
        # Try relative import first (when used as module)
        from .card_data_loader import CardDataLoader, CardDataConfig
    except ImportError:
        # Fallback to direct import (when run standalone)
        from card_data_loader import CardDataLoader, CardDataConfig
    
    # Initialize dependencies
    config = CardDataConfig(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json"
    )
    card_loader = CardDataLoader(config)
    extractor = CardMeaningExtractor(card_loader)
    
    print("🧪 Testing Card Meaning Extraction:")
    print("=" * 60)
    
    # Test cards
    test_cards = [
        ("The Fool", CardOrientation.UPRIGHT),
        ("The Fool", CardOrientation.REVERSED),
        ("Ace of Cups", CardOrientation.UPRIGHT),
        ("Seven of Swords", CardOrientation.REVERSED),
    ]
    
    for card_name, orientation in test_cards:
        print(f"\n📋 {card_name} - {orientation.value.title()}")
        print("-" * 40)
        
        core_meaning = extractor.get_core_meaning(card_name, orientation)
        if core_meaning:
            print(f"Essence: {core_meaning.essence}")
            print(f"Keywords: {', '.join(core_meaning.keywords[:5])}...")  # First 5 keywords
            print(f"Psychological: {core_meaning.psychological}")
            print(f"Archetype: {core_meaning.archetype}")
            print(f"Suit: {core_meaning.suit}")
        else:
            print("❌ Core meaning not found")
    
    # Test orientation comparison
    print(f"\n🔄 Orientation Comparison: The Fool")
    print("-" * 40)
    comparison = extractor.compare_orientations("The Fool")
    if comparison:
        print(f"Upright essence: {comparison['upright'].essence[:100]}...")
        print(f"Reversed essence: {comparison['reversed'].essence[:100]}...")
    
    # Test symbols
    print(f"\n🔮 Symbols: The Fool")
    print("-" * 40)
    symbols = extractor.get_card_symbols("The Fool")
    if symbols:
        print(f"Key symbols: {list(symbols.symbols.keys())[:3]}...")
        print(f"Colors: {symbols.colors}")
        print(f"Element: {symbols.elemental_correspondences.get('element', 'Unknown')}")
    
    # Test validation
    print(f"\n✅ Data Validation: Ace of Cups")
    print("-" * 40)
    validation = extractor.validate_card_data("Ace of Cups")
    for check, passed in validation.items():
        status = "✅" if passed else "❌"
        print(f"{status} {check}: {passed}")
    
    return extractor


if __name__ == "__main__":
    test_card_meaning_extractor()