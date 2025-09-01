"""
Spread Configuration Loader - Piece 2 of Context Retrieval Architecture

Handles loading and parsing spread configurations to extract position meanings and layouts.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class SpreadPosition:
    """Represents a position in a tarot spread"""
    name: str
    short_description: str
    detailed_description: str
    keywords: List[str]
    question_adaptations: Dict[str, str]
    rag_mapping: Optional[str] = None
    x: float = 0.0
    y: float = 0.0
    rotation: int = 0
    z_index: int = 0


@dataclass
class SpreadInfo:
    """Complete information about a tarot spread"""
    id: str
    name: str
    description: str
    layout_id: str
    card_size: str
    aspect_ratio: float
    category: str
    difficulty: str
    positions: List[SpreadPosition]


class SpreadConfigLoader:
    """Loads and parses spread configuration data"""
    
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.spreads_data: Dict[str, Any] = {}
        self.spreads_info: Dict[str, SpreadInfo] = {}
        self._load_data()
    
    def _load_data(self) -> None:
        """Load spread configuration from JSON file"""
        try:
            config_path = Path(self.config_path)
            if not config_path.exists():
                raise FileNotFoundError(f"Spreads config file not found: {config_path}")
            
            with open(config_path, 'r', encoding='utf-8') as f:
                self.spreads_data = json.load(f)
            
            # Parse spread information
            self._parse_spreads()
            
            print(f"✅ Loaded {len(self.spreads_info)} spreads from {config_path}")
            
        except Exception as e:
            print(f"❌ Error loading spread config: {e}")
            raise
    
    def _parse_spreads(self) -> None:
        """Parse spreads data into structured SpreadInfo objects"""
        spreads = self.spreads_data.get('spreads', [])
        layouts = self.spreads_data.get('layouts', {})
        
        for spread_data in spreads:
            try:
                spread_info = self._parse_single_spread(spread_data, layouts)
                self.spreads_info[spread_info.id] = spread_info
            except Exception as e:
                print(f"⚠️ Error parsing spread {spread_data.get('id', 'unknown')}: {e}")
    
    def _parse_single_spread(self, spread_data: Dict, layouts: Dict) -> SpreadInfo:
        """Parse a single spread configuration"""
        spread_id = spread_data['id']
        layout_id = spread_data['layout']
        
        # Get layout information
        layout = layouts.get(layout_id, {})
        layout_positions = layout.get('positions', [])
        
        # Parse positions
        positions = []
        spread_positions = spread_data.get('positions', [])
        
        for i, pos_data in enumerate(spread_positions):
            # Get layout coordinates if available
            layout_pos = layout_positions[i] if i < len(layout_positions) else {}
            
            position = SpreadPosition(
                name=pos_data['name'],
                short_description=pos_data.get('short_description', ''),
                detailed_description=pos_data.get('detailed_description', ''),
                keywords=pos_data.get('keywords', []),
                question_adaptations=pos_data.get('question_adaptations', {}),
                rag_mapping=pos_data.get('rag_mapping'),
                x=layout_pos.get('x', 0.0),
                y=layout_pos.get('y', 0.0),
                rotation=layout_pos.get('rotation', 0),
                z_index=layout_pos.get('zIndex', 0)
            )
            positions.append(position)
        
        return SpreadInfo(
            id=spread_id,
            name=spread_data['name'],
            description=spread_data['description'],
            layout_id=layout_id,
            card_size=spread_data.get('cardSize', 'medium'),
            aspect_ratio=spread_data.get('aspectRatio', 16/9),
            category=spread_data.get('category', 'general'),
            difficulty=spread_data.get('difficulty', 'beginner'),
            positions=positions
        )
    
    def get_spread_info(self, spread_id: str) -> Optional[SpreadInfo]:
        """Get complete spread information by ID"""
        return self.spreads_info.get(spread_id)
    
    def get_position_names(self, spread_id: str) -> List[str]:
        """Get list of position names for a spread"""
        spread_info = self.get_spread_info(spread_id)
        if spread_info:
            return [pos.name for pos in spread_info.positions]
        return []
    
    def get_position_description(self, spread_id: str, position_name: str, detailed: bool = False) -> Optional[str]:
        """Get description for a specific position in a spread"""
        spread_info = self.get_spread_info(spread_id)
        if spread_info:
            for position in spread_info.positions:
                if position.name.lower() == position_name.lower():
                    return position.detailed_description if detailed else position.short_description
        return None
    
    def get_position_keywords(self, spread_id: str, position_name: str) -> List[str]:
        """Get keywords for a specific position in a spread"""
        spread_info = self.get_spread_info(spread_id)
        if spread_info:
            for position in spread_info.positions:
                if position.name.lower() == position_name.lower():
                    return position.keywords
        return []
    
    def list_available_spreads(self) -> Dict[str, str]:
        """Return mapping of spread IDs to spread names"""
        return {spread_id: spread_info.name 
                for spread_id, spread_info in self.spreads_info.items()}
    
    def get_spreads_by_category(self, category: str) -> List[SpreadInfo]:
        """Get all spreads in a specific category"""
        return [spread_info for spread_info in self.spreads_info.values() 
                if spread_info.category.lower() == category.lower()]
    
    def get_spreads_by_difficulty(self, difficulty: str) -> List[SpreadInfo]:
        """Get all spreads of a specific difficulty level"""
        return [spread_info for spread_info in self.spreads_info.values() 
                if spread_info.difficulty.lower() == difficulty.lower()]
    
    def validate_spread_card_count(self, spread_id: str, card_count: int) -> bool:
        """Validate that card count matches spread position count"""
        spread_info = self.get_spread_info(spread_id)
        if spread_info:
            return len(spread_info.positions) == card_count
        return False


# Test function to validate the loader
def test_spread_loader():
    """Test the spread configuration loader"""
    try:
        loader = SpreadConfigLoader("/Users/katelouie/code/arcanum/backend/spreads-config.json")
        
        # Test spread lookup
        print("\n🧪 Testing spread lookups:")
        available_spreads = loader.list_available_spreads()
        
        for spread_id, spread_name in list(available_spreads.items())[:3]:  # Test first 3
            print(f"\n📋 Spread: {spread_name} (ID: {spread_id})")
            
            spread_info = loader.get_spread_info(spread_id)
            if spread_info:
                print(f"   Description: {spread_info.description}")
                print(f"   Positions ({len(spread_info.positions)}):")
                
                for i, position in enumerate(spread_info.positions):
                    print(f"     {i+1}. {position.name}: {position.short_description}")
                    if position.keywords:
                        print(f"        Keywords: {', '.join(position.keywords)}")
                    if position.rag_mapping:
                        print(f"        RAG Mapping: {position.rag_mapping}")
        
        # Test position lookup
        print(f"\n🎯 Testing position lookups:")
        if available_spreads:
            first_spread_id = list(available_spreads.keys())[0]
            position_names = loader.get_position_names(first_spread_id)
            
            if position_names:
                first_position = position_names[0]
                description = loader.get_position_description(first_spread_id, first_position)
                keywords = loader.get_position_keywords(first_spread_id, first_position)
                
                print(f"Spread: {first_spread_id}")
                print(f"Position: {first_position}")
                print(f"Description: {description}")
                print(f"Keywords: {keywords}")
        
        # Test categorization
        print(f"\n📊 Available spreads by category:")
        categories = set(spread.category for spread in loader.spreads_info.values())
        for category in categories:
            spreads = loader.get_spreads_by_category(category)
            print(f"   {category}: {len(spreads)} spreads")
        
        return loader
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return None


if __name__ == "__main__":
    test_spread_loader()