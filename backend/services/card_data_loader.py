"""
Card Data Loader - Piece 1 of Context Retrieval Architecture

Handles loading and normalizing card data from the generated JSON files.
"""

import json
import re
from pathlib import Path
from typing import Dict, Optional, Any
from dataclasses import dataclass


@dataclass
class CardDataConfig:
    """Configuration for card data loading"""
    cards_json_path: str
    validate_on_load: bool = True


class CardDataLoader:
    """Loads and normalizes card data from JSON files"""
    
    def __init__(self, config: CardDataConfig):
        self.config = config
        self.cards_data: Dict[str, Any] = {}
        self.name_to_id_map: Dict[str, str] = {}
        self._load_data()
    
    def _load_data(self) -> None:
        """Load card data from JSON file"""
        try:
            cards_path = Path(self.config.cards_json_path)
            if not cards_path.exists():
                raise FileNotFoundError(f"Cards data file not found: {cards_path}")
            
            with open(cards_path, 'r', encoding='utf-8') as f:
                self.cards_data = json.load(f)
            
            # Build name-to-ID mapping for quick lookups
            self._build_name_mapping()
            
            if self.config.validate_on_load:
                self._validate_data()
                
            print(f"✅ Loaded {len(self.cards_data)} cards from {cards_path}")
            
        except Exception as e:
            print(f"❌ Error loading card data: {e}")
            raise
    
    def _build_name_mapping(self) -> None:
        """Build mapping from card names to card IDs for normalization"""
        self.name_to_id_map = {}
        
        for card_id, card_data in self.cards_data.items():
            if 'card_name' in card_data:
                card_name = card_data['card_name']
                # Store both the original name and normalized version
                self.name_to_id_map[card_name] = card_id
                self.name_to_id_map[self.normalize_card_name(card_name)] = card_id
    
    def normalize_card_name(self, card_name: str) -> str:
        """
        Normalize card name to match JSON keys
        
        Examples:
        - "The Fool" -> "the_fool"
        - "Ace of Cups" -> "ace_of_cups"
        - "Two of Pentacles" -> "two_of_pentacles"
        """
        # Convert to lowercase
        normalized = card_name.lower()
        
        # Replace spaces and special characters with underscores
        normalized = re.sub(r'[^a-z0-9]+', '_', normalized)
        
        # Remove leading/trailing underscores
        normalized = normalized.strip('_')
        
        return normalized
    
    def get_card_data(self, card_name: str) -> Optional[Dict[str, Any]]:
        """
        Get card data by card name (handles normalization automatically)
        
        Args:
            card_name: Card name (e.g., "The Fool", "Ace of Cups")
            
        Returns:
            Card data dictionary or None if not found
        """
        # Try direct lookup first
        if card_name in self.name_to_id_map:
            card_id = self.name_to_id_map[card_name]
            return self.cards_data.get(card_id)
        
        # Try normalized lookup
        normalized_name = self.normalize_card_name(card_name)
        if normalized_name in self.name_to_id_map:
            card_id = self.name_to_id_map[normalized_name]
            return self.cards_data.get(card_id)
        
        # If still not found, try direct ID lookup
        if normalized_name in self.cards_data:
            return self.cards_data[normalized_name]
        
        return None
    
    def get_card_id(self, card_name: str) -> Optional[str]:
        """Get the card ID for a given card name"""
        if card_name in self.name_to_id_map:
            return self.name_to_id_map[card_name]
        
        normalized_name = self.normalize_card_name(card_name)
        return self.name_to_id_map.get(normalized_name)
    
    def list_available_cards(self) -> Dict[str, str]:
        """Return mapping of card names to card IDs"""
        result = {}
        for card_id, card_data in self.cards_data.items():
            if 'card_name' in card_data:
                result[card_data['card_name']] = card_id
        return result
    
    def _validate_data(self) -> None:
        """Validate that card data has expected structure"""
        required_fields = ['card_id', 'card_name', 'core_meanings']
        
        for card_id, card_data in self.cards_data.items():
            # Check required fields
            for field in required_fields:
                if field not in card_data:
                    raise ValueError(f"Card {card_id} missing required field: {field}")
            
            # Check core meanings structure
            core_meanings = card_data.get('core_meanings', {})
            for orientation in ['upright', 'reversed']:
                if orientation not in core_meanings:
                    raise ValueError(f"Card {card_id} missing {orientation} core meaning")
                
                orientation_data = core_meanings[orientation]
                if 'essence' not in orientation_data:
                    raise ValueError(f"Card {card_id} {orientation} missing essence")
                if 'keywords' not in orientation_data:
                    raise ValueError(f"Card {card_id} {orientation} missing keywords")


# Test function to validate the loader
def test_card_loader():
    """Test the card data loader with sample data"""
    config = CardDataConfig(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json"
    )
    
    try:
        loader = CardDataLoader(config)
        
        # Test some lookups
        test_cards = ["The Fool", "Ace of Cups", "Seven of Swords"]
        
        print("\n🧪 Testing card lookups:")
        for card_name in test_cards:
            card_data = loader.get_card_data(card_name)
            if card_data:
                print(f"✅ {card_name} -> {card_data['card_id']}")
                print(f"   Essence: {card_data['core_meanings']['upright']['essence'][:100]}...")
            else:
                print(f"❌ {card_name} not found")
        
        # Test normalization
        print("\n🔄 Testing name normalization:")
        test_names = ["The Fool", "ace of cups", "SEVEN OF SWORDS"]
        for name in test_names:
            normalized = loader.normalize_card_name(name)
            print(f"'{name}' -> '{normalized}'")
        
        # Show available cards
        available = loader.list_available_cards()
        print(f"\n📋 Total cards available: {len(available)}")
        
        return loader
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return None


if __name__ == "__main__":
    test_card_loader()