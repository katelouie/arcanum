"""
Position-Specific Meaning Matcher - Piece 5 of Context Retrieval Architecture

Matches spread positions to card interpretations using RAG mappings and fuzzy matching.
Also extracts rich position context data from spread configurations.
"""

import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

# Import handling for both module and standalone use
try:
    from .question_classifier import QuestionType
except ImportError:
    from question_classifier import QuestionType


@dataclass
class PositionContext:
    """Rich context information about a spread position"""
    name: str
    short_description: str
    detailed_description: str
    keywords: List[str]
    question_adaptations: Dict[str, str]
    rag_mapping: Optional[str] = None
    
    def get_description_for_question_type(self, question_type: QuestionType) -> str:
        """Get the most appropriate description for a question type"""
        # First try exact question-specific adaptation
        adaptation = self.question_adaptations.get(question_type.value)
        if adaptation:
            return adaptation
        
        # Try common mapping variations
        question_mappings = {
            QuestionType.LOVE: ["love", "relationship", "romance"],
            QuestionType.CAREER: ["career", "work", "job", "professional"],
            QuestionType.SPIRITUAL: ["spiritual", "soul", "purpose"],
            QuestionType.FINANCIAL: ["financial", "money", "finance"],
            QuestionType.HEALTH: ["health", "wellness", "body"],
            QuestionType.GENERAL: ["general", "default"]
        }
        
        # Try alternate names for this question type
        for alt_name in question_mappings.get(question_type, []):
            if alt_name in self.question_adaptations:
                return self.question_adaptations[alt_name]
        
        # Fallback to general adaptation
        general = self.question_adaptations.get("general")
        if general:
            return general
        
        # Final fallback to detailed description
        return self.detailed_description
    
    def get_relevant_adaptation_only(self, question_type: QuestionType) -> Optional[str]:
        """Get only the specific adaptation for this question type, no fallbacks"""
        return self.question_adaptations.get(question_type.value)


@dataclass
class PositionMeaning:
    """Combined position context and card-specific interpretation"""
    position_context: PositionContext
    card_interpretation: str
    interpretation_source: str  # e.g., "temporal_positions.past", "core_meaning"
    confidence: float  # How confident we are in this mapping


class PositionMeaningMatcher:
    """Matches spread positions to card-specific interpretations"""
    
    def __init__(self, card_loader, spread_loader):
        self.card_loader = card_loader
        self.spread_loader = spread_loader
        
        # Mapping patterns for fuzzy matching when RAG mapping is missing
        self.position_patterns = {
            # Temporal patterns
            "temporal_positions": {
                "past": [
                    r'\b(past|history|foundation|background|origin|previous|before|earlier|distant.?past|recent.?past)\b',
                    r'\b(influences?|experiences?|decisions?|patterns?|roots?)\b.*\b(past|previous)\b'
                ],
                "present": [
                    r'\b(present|current|now|today|situation|circumstances|reality|here|immediate)\b',
                    r'\b(current|present).?(state|situation|energy|circumstances)\b'
                ],
                "future": [
                    r'\b(future|outcome|result|potential|direction|trajectory|ahead|coming|next|emerging)\b',
                    r'\b(likely|possible|probable).?(outcome|future|result)\b'
                ],
                "near_future": [
                    r'\b(near|immediate|soon|next|upcoming|imminent).?(future|steps?|phase|period)\b'
                ],
                "distant_future": [
                    r'\b(distant|long.?term|ultimate|final).?(future|outcome|result|destiny)\b'
                ]
            },
            
            # Challenge and growth patterns
            "challenge_and_growth": {
                "challenge": [
                    r'\b(challenge|obstacle|difficulty|problem|issue|barrier|block|hindrance)\b',
                    r'\b(what.?(challenges?|crosses?|opposes?|hinders?))\b'
                ],
                "cross": [
                    r'\b(cross|crosses?|opposition|conflict|tension|what.?crosses?)\b'
                ],
                "obstacle": [
                    r'\b(obstacle|barrier|block|impediment|hindrance|resistance)\b'
                ],
                "lesson": [
                    r'\b(lesson|learning|growth|development|wisdom|insight|understanding)\b'
                ],
                "shadow": [
                    r'\b(shadow|hidden|unconscious|repressed|denied|dark|secret)\b'
                ]
            },
            
            # Guidance and action patterns
            "guidance_and_action": {
                "advice": [
                    r'\b(advice|guidance|recommendation|suggestion|counsel|wisdom)\b',
                    r'\b(what.?(should|need|must|ought))\b'
                ],
                "action": [
                    r'\b(action|step|move|do|take|approach|strategy|plan)\b',
                    r'\b(what.?to.?do|how.?to.?proceed|next.?step)\b'
                ],
                "guidance": [
                    r'\b(guidance|direction|path|way|course|route|journey)\b'
                ],
                "your_approach": [
                    r'\b(your.?(approach|perspective|view|attitude|stance|position))\b',
                    r'\b(how.?you.?(see|view|approach|handle))\b'
                ]
            },
            
            # Emotional and internal patterns
            "emotional_and_internal": {
                "hopes_fears": [
                    r'\b(hopes?.?(and|&).?fears?|fears?.?(and|&).?hopes?)\b',
                    r'\b(hopes?|fears?|desires?|anxieties?|worries?)\b'
                ],
                "hopes": [
                    r'\b(hopes?|dreams?|aspirations?|wishes?|desires?|wants?)\b'
                ],
                "fears": [
                    r'\b(fears?|anxieties?|worries?|concerns?|doubts?|insecurities?)\b'
                ],
                "heart": [
                    r'\b(heart|emotional|feelings?|emotions?|love|passion)\b'
                ],
                "mind": [
                    r'\b(mind|mental|thoughts?|thinking|cognitive|intellectual)\b'
                ],
                "subconscious": [
                    r'\b(subconscious|unconscious|hidden|beneath|deeper|inner)\b'
                ],
                "emotional_state": [
                    r'\b(emotional.?state|feelings?|emotions?|mood|sentiment)\b'
                ]
            },
            
            # External influences patterns
            "external_influences": {
                "external_influences": [
                    r'\b(external|outside|others?|environment|influences?|factors?)\b'
                ],
                "others": [
                    r'\b(others?|people|someone|they|them|family|friends?|colleagues?)\b',
                    r'\b(how.?others?.?(see|view|perceive))\b'
                ],
                "environment": [
                    r'\b(environment|surroundings?|context|setting|situation|circumstances?)\b'
                ],
                "others_see_you": [
                    r'\b(others?.?(see|view|perceive|think.?of).?you)\b',
                    r'\b(how.?(you.?appear|you.?look|you.?seem))\b'
                ]
            },
            
            # Outcome patterns
            "outcome_and_result": {
                "outcome": [
                    r'\b(outcome|result|consequence|effect|end|conclusion)\b'
                ],
                "final_outcome": [
                    r'\b(final|ultimate|end|overall).?(outcome|result|conclusion)\b'
                ],
                "possible_outcome": [
                    r'\b(possible|potential|likely|probable).?(outcome|result)\b'
                ]
            }
        }
        
        # Compile regex patterns for efficiency
        self.compiled_patterns = self._compile_patterns()
    
    def _compile_patterns(self) -> Dict[str, Dict[str, List[re.Pattern]]]:
        """Compile all regex patterns for efficient matching"""
        compiled = {}
        for category, subcategories in self.position_patterns.items():
            compiled[category] = {}
            for subcat, patterns in subcategories.items():
                compiled[category][subcat] = [
                    re.compile(pattern, re.IGNORECASE) for pattern in patterns
                ]
        return compiled
    
    def get_position_meaning(
        self, 
        card_name: str, 
        orientation: str,  # "upright" or "reversed"
        position_name: str,
        spread_id: str,
        question_type: QuestionType
    ) -> Optional[PositionMeaning]:
        """
        Get comprehensive position meaning combining spread context and card interpretation
        
        Args:
            card_name: Name of the card
            orientation: "upright" or "reversed"
            position_name: Name of the position (e.g., "Past", "Present")
            spread_id: ID of the spread
            question_type: Type of question being asked
            
        Returns:
            PositionMeaning with both context and interpretation
        """
        # Get position context from spread config
        position_context = self._get_position_context(spread_id, position_name)
        if not position_context:
            return None
        
        # Get card interpretation for this position
        card_interpretation, source, confidence = self._get_card_interpretation_for_position(
            card_name, orientation, position_context
        )
        
        return PositionMeaning(
            position_context=position_context,
            card_interpretation=card_interpretation,
            interpretation_source=source,
            confidence=confidence
        )
    
    def _get_position_context(self, spread_id: str, position_name: str) -> Optional[PositionContext]:
        """Extract rich position context from spread configuration"""
        spread_info = self.spread_loader.get_spread_info(spread_id)
        if not spread_info:
            return None
        
        # Find the position
        for position in spread_info.positions:
            if position.name.lower() == position_name.lower():
                return PositionContext(
                    name=position.name,
                    short_description=position.short_description,
                    detailed_description=position.detailed_description,
                    keywords=position.keywords,
                    question_adaptations=position.question_adaptations,
                    rag_mapping=position.rag_mapping
                )
        
        return None
    
    def _get_card_interpretation_for_position(
        self, 
        card_name: str, 
        orientation: str,
        position_context: PositionContext
    ) -> Tuple[str, str, float]:
        """
        Get card interpretation for specific position using RAG mapping or fuzzy matching
        
        Returns:
            Tuple of (interpretation, source, confidence)
        """
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return "Card data not found", "error", 0.0
        
        # First try direct RAG mapping
        if position_context.rag_mapping:
            interpretation, confidence = self._get_interpretation_by_rag_mapping(
                card_data, orientation, position_context.rag_mapping
            )
            if interpretation:
                return interpretation, position_context.rag_mapping, confidence
        
        # Fallback to fuzzy matching
        interpretation, source, confidence = self._fuzzy_match_position(
            card_data, orientation, position_context
        )
        
        if interpretation:
            return interpretation, source, confidence
        
        # Final fallback to core meaning
        core_meaning = card_data.get("core_meanings", {}).get(orientation, {})
        essence = core_meaning.get("essence", "")
        if essence:
            return essence, "core_meanings.essence", 0.5
        
        return "No interpretation found", "none", 0.0
    
    def _get_interpretation_by_rag_mapping(
        self, 
        card_data: Dict, 
        orientation: str, 
        rag_mapping: str
    ) -> Tuple[str, float]:
        """Get interpretation using direct RAG mapping path"""
        try:
            # Navigate the path (e.g., "temporal_positions.past")
            parts = rag_mapping.split('.')
            current = card_data.get("position_interpretations", {})
            
            for part in parts:
                if isinstance(current, dict) and part in current:
                    current = current[part]
                else:
                    return "", 0.0
            
            # Should now be at the orientation level
            if isinstance(current, dict) and orientation in current:
                return current[orientation], 1.0
            
            return "", 0.0
            
        except Exception:
            return "", 0.0
    
    def _fuzzy_match_position(
        self, 
        card_data: Dict, 
        orientation: str,
        position_context: PositionContext
    ) -> Tuple[str, str, float]:
        """Use fuzzy matching to find appropriate interpretation"""
        position_interpretations = card_data.get("position_interpretations", {})
        
        # Create search text from position context
        search_text = f"{position_context.name} {position_context.short_description} {position_context.detailed_description}"
        search_text += " " + " ".join(position_context.keywords)
        
        best_match = ""
        best_source = ""
        best_confidence = 0.0
        
        # Try each category
        for category, subcategories in self.compiled_patterns.items():
            if category not in position_interpretations:
                continue
                
            for subcat, patterns in subcategories.items():
                # Check if any pattern matches
                for pattern in patterns:
                    if pattern.search(search_text):
                        # Found a match, get the interpretation
                        subcat_data = position_interpretations[category].get(subcat, {})
                        if isinstance(subcat_data, dict) and orientation in subcat_data:
                            interpretation = subcat_data[orientation]
                            if interpretation and len(interpretation) > best_confidence * 100:  # Prefer longer interpretations
                                best_match = interpretation
                                best_source = f"{category}.{subcat}"
                                best_confidence = 0.8  # High confidence for pattern match
        
        return best_match, best_source, best_confidence
    
    def get_all_position_meanings_for_reading(
        self,
        cards_with_positions: List[Tuple[str, str, str]],  # [(card_name, orientation, position_name)]
        spread_id: str,
        question_type: QuestionType
    ) -> List[PositionMeaning]:
        """Get position meanings for an entire reading"""
        meanings = []
        
        for card_name, orientation, position_name in cards_with_positions:
            meaning = self.get_position_meaning(
                card_name, orientation, position_name, spread_id, question_type
            )
            if meaning:
                meanings.append(meaning)
        
        return meanings
    
    def validate_rag_mappings(self, spread_id: str) -> Dict[str, Any]:
        """Validate that RAG mappings in spread config point to valid card data paths"""
        spread_info = self.spread_loader.get_spread_info(spread_id)
        if not spread_info:
            return {"error": "Spread not found"}
        
        validation_results = {}
        
        for position in spread_info.positions:
            if position.rag_mapping:
                # Test with a sample card
                sample_card_data = next(iter(self.card_loader.cards_data.values()))
                interpretation, confidence = self._get_interpretation_by_rag_mapping(
                    sample_card_data, "upright", position.rag_mapping
                )
                
                validation_results[position.name] = {
                    "rag_mapping": position.rag_mapping,
                    "valid": confidence > 0,
                    "sample_found": bool(interpretation)
                }
            else:
                validation_results[position.name] = {
                    "rag_mapping": None,
                    "valid": True,  # No mapping is okay, will use fuzzy matching
                    "note": "Will use fuzzy matching"
                }
        
        return validation_results


# Test function
def test_position_meaning_matcher():
    """Test the position meaning matcher"""
    try:
        from card_data_loader import CardDataLoader, CardDataConfig
        from spread_config_loader import SpreadConfigLoader
        from question_classifier import QuestionType
    except ImportError:
        print("❌ Import error - make sure other modules are available")
        return None
    
    # Initialize dependencies
    card_config = CardDataConfig(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json"
    )
    card_loader = CardDataLoader(card_config)
    spread_loader = SpreadConfigLoader("/Users/katelouie/code/arcanum/backend/spreads-config.json")
    
    matcher = PositionMeaningMatcher(card_loader, spread_loader)
    
    print("🧪 Testing Position Meaning Matching:")
    print("=" * 60)
    
    # Test with a specific reading
    test_cases = [
        ("The Fool", "upright", "Past", "past-present-future", QuestionType.LOVE),
        ("Ace of Cups", "reversed", "Present", "past-present-future", QuestionType.LOVE),
        ("Seven of Swords", "upright", "Future", "past-present-future", QuestionType.CAREER),
        ("The Fool", "upright", "Focus", "single-focus", QuestionType.SPIRITUAL),
    ]
    
    for card_name, orientation, position_name, spread_id, question_type in test_cases:
        print(f"\n📋 {card_name} ({orientation}) in '{position_name}' position")
        print(f"Spread: {spread_id}, Question Type: {question_type.value}")
        print("-" * 50)
        
        meaning = matcher.get_position_meaning(
            card_name, orientation, position_name, spread_id, question_type
        )
        
        if meaning:
            print(f"Position Context: {meaning.position_context.short_description}")
            print(f"Question Adaptation: {meaning.position_context.get_description_for_question_type(question_type)}")
            print(f"Keywords: {', '.join(meaning.position_context.keywords[:5])}...")
            print(f"Card Interpretation: {meaning.card_interpretation[:150]}...")
            print(f"Source: {meaning.interpretation_source} (confidence: {meaning.confidence:.2f})")
        else:
            print("❌ No meaning found")
    
    # Test RAG mapping validation
    print(f"\n✅ RAG Mapping Validation: past-present-future")
    print("-" * 50)
    validation = matcher.validate_rag_mappings("past-present-future")
    for position, result in validation.items():
        status = "✅" if result["valid"] else "❌"
        print(f"{status} {position}: {result}")
    
    return matcher


if __name__ == "__main__":
    test_position_meaning_matcher()