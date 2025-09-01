"""
Question Context Retriever - Piece 6 of Context Retrieval Architecture

Retrieves question-specific card interpretations from the question_contexts section
of card JSON data, matching them to classified question types.
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

# Import handling for both module and standalone use
try:
    from .question_classifier import QuestionType
except ImportError:
    from question_classifier import QuestionType


@dataclass
class QuestionContext:
    """Question-specific interpretation for a card"""
    question_type: QuestionType
    card_name: str
    orientation: str  # "upright" or "reversed"
    interpretation: str
    keywords: List[str]
    confidence: float  # How well this matches the question type


@dataclass
class CardQuestionContexts:
    """All available question contexts for a card"""
    card_name: str
    orientation: str
    available_contexts: Dict[QuestionType, str]  # question_type -> interpretation
    primary_context: Optional[QuestionContext] = None
    secondary_context: Optional[QuestionContext] = None


class QuestionContextRetriever:
    """Retrieves question-specific card interpretations"""
    
    def __init__(self, card_loader):
        self.card_loader = card_loader
        
        # Mapping from QuestionType enum to JSON keys
        self.question_type_mapping = {
            QuestionType.LOVE: "love",
            QuestionType.CAREER: "career", 
            QuestionType.SPIRITUAL: "spiritual",
            QuestionType.FINANCIAL: "financial",
            QuestionType.HEALTH: "health",
            QuestionType.GENERAL: "general"  # May not exist in JSON, will fallback
        }
    
    def get_question_context(
        self, 
        card_name: str, 
        orientation: str,
        question_type: QuestionType,
        include_secondary: bool = True
    ) -> Optional[QuestionContext]:
        """
        Get question-specific interpretation for a card
        
        Args:
            card_name: Name of the card
            orientation: "upright" or "reversed"
            question_type: The classified question type
            include_secondary: Whether to look for secondary/related contexts
            
        Returns:
            QuestionContext with the interpretation
        """
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return None
        
        question_contexts = card_data.get("question_contexts", {})
        if not question_contexts:
            return None
        
        # Get the JSON key for this question type
        context_key = self.question_type_mapping.get(question_type)
        if not context_key:
            return None
        
        # Look for the specific context
        context_data = question_contexts.get(context_key, {})
        if not context_data:
            # Try fallback to general if available
            context_data = question_contexts.get("general", {})
            if not context_data:
                return None
            context_key = "general"
        
        # Get interpretation for the orientation
        interpretation = ""
        if isinstance(context_data, dict):
            interpretation = context_data.get(orientation, "")
        elif isinstance(context_data, str):
            # Some contexts might be strings instead of orientation dicts
            interpretation = context_data
        
        if not interpretation:
            return None
        
        # Extract keywords if available
        keywords = context_data.get("keywords", []) if isinstance(context_data, dict) else []
        
        # Calculate confidence based on exact match vs fallback
        confidence = 1.0 if context_key == self.question_type_mapping.get(question_type) else 0.7
        
        return QuestionContext(
            question_type=question_type,
            card_name=card_name,
            orientation=orientation,
            interpretation=interpretation,
            keywords=keywords,
            confidence=confidence
        )
    
    def get_all_available_contexts(
        self, 
        card_name: str, 
        orientation: str
    ) -> Optional[CardQuestionContexts]:
        """Get all available question contexts for a card"""
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return None
        
        question_contexts = card_data.get("question_contexts", {})
        if not question_contexts:
            return None
        
        available_contexts = {}
        
        # Map each available context to a QuestionType
        for context_key, context_data in question_contexts.items():
            # Find the QuestionType for this key
            question_type = None
            for qt, mapped_key in self.question_type_mapping.items():
                if mapped_key == context_key:
                    question_type = qt
                    break
            
            if question_type:
                # Get interpretation for orientation
                interpretation = ""
                if isinstance(context_data, dict):
                    interpretation = context_data.get(orientation, "")
                elif isinstance(context_data, str):
                    interpretation = context_data
                
                if interpretation:
                    available_contexts[question_type] = interpretation
        
        return CardQuestionContexts(
            card_name=card_name,
            orientation=orientation,
            available_contexts=available_contexts
        )
    
    def get_contexts_for_reading(
        self,
        cards_with_orientations: List[Tuple[str, str]],  # [(card_name, orientation)]
        question_type: QuestionType,
        include_fallbacks: bool = True
    ) -> List[QuestionContext]:
        """Get question contexts for an entire reading"""
        contexts = []
        
        for card_name, orientation in cards_with_orientations:
            context = self.get_question_context(
                card_name, orientation, question_type, include_fallbacks
            )
            if context:
                contexts.append(context)
        
        return contexts
    
    def find_best_matching_context(
        self, 
        card_name: str, 
        orientation: str,
        primary_question_type: QuestionType,
        secondary_question_type: Optional[QuestionType] = None
    ) -> Optional[QuestionContext]:
        """
        Find the best matching context, considering primary and secondary question types
        """
        # Try primary first
        primary_context = self.get_question_context(
            card_name, orientation, primary_question_type
        )
        if primary_context and primary_context.confidence >= 0.8:
            return primary_context
        
        # Try secondary if available
        if secondary_question_type:
            secondary_context = self.get_question_context(
                card_name, orientation, secondary_question_type
            )
            if secondary_context and secondary_context.confidence >= 0.8:
                return secondary_context
        
        # Return primary even if lower confidence, or None
        return primary_context
    
    def validate_question_contexts(self, card_name: str) -> Dict[str, Any]:
        """Validate question contexts available for a card"""
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return {"error": "Card not found"}
        
        question_contexts = card_data.get("question_contexts", {})
        
        validation = {
            "card_name": card_name,
            "has_question_contexts": bool(question_contexts),
            "available_contexts": list(question_contexts.keys()),
            "orientations_check": {}
        }
        
        # Check each context for orientation completeness
        for context_key, context_data in question_contexts.items():
            if isinstance(context_data, dict):
                validation["orientations_check"][context_key] = {
                    "has_upright": "upright" in context_data,
                    "has_reversed": "reversed" in context_data,
                    "has_keywords": "keywords" in context_data
                }
            else:
                validation["orientations_check"][context_key] = {
                    "type": "string",
                    "value": context_data[:50] + "..." if len(context_data) > 50 else context_data
                }
        
        return validation
    
    def get_context_summary_for_prompt(
        self,
        card_name: str,
        orientation: str, 
        question_type: QuestionType,
        max_length: int = 200
    ) -> str:
        """Get a concise context summary suitable for prompt injection"""
        context = self.get_question_context(card_name, orientation, question_type)
        if not context:
            return ""
        
        # Truncate if too long for prompt
        interpretation = context.interpretation
        if len(interpretation) > max_length:
            interpretation = interpretation[:max_length-3] + "..."
        
        return f"In {question_type.value} matters: {interpretation}"


# Test function
def test_question_context_retriever():
    """Test the question context retriever"""
    try:
        from card_data_loader import CardDataLoader, CardDataConfig
        from question_classifier import QuestionType
    except ImportError:
        print("❌ Import error - make sure other modules are available")
        return None
    
    # Initialize dependencies
    card_config = CardDataConfig(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json"
    )
    card_loader = CardDataLoader(card_config)
    
    retriever = QuestionContextRetriever(card_loader)
    
    print("🧪 Testing Question Context Retrieval:")
    print("=" * 60)
    
    # Test specific contexts
    test_cases = [
        ("The Fool", "upright", QuestionType.LOVE),
        ("The Fool", "reversed", QuestionType.CAREER),
        ("Ace of Cups", "upright", QuestionType.SPIRITUAL),
        ("Seven of Swords", "reversed", QuestionType.FINANCIAL),
        ("The Fool", "upright", QuestionType.HEALTH),
        ("The Fool", "upright", QuestionType.GENERAL),  # Might not exist
    ]
    
    for card_name, orientation, question_type in test_cases:
        print(f"\n📋 {card_name} ({orientation}) - {question_type.value} context")
        print("-" * 50)
        
        context = retriever.get_question_context(card_name, orientation, question_type)
        if context:
            print(f"Interpretation: {context.interpretation}")
            print(f"Confidence: {context.confidence:.2f}")
            if context.keywords:
                print(f"Keywords: {', '.join(context.keywords)}")
            
            # Test prompt summary
            summary = retriever.get_context_summary_for_prompt(
                card_name, orientation, question_type, max_length=100
            )
            print(f"Prompt Summary: {summary}")
        else:
            print("❌ No context found")
    
    # Test all available contexts for a card
    print(f"\n🔍 All Available Contexts: The Fool (upright)")
    print("-" * 50)
    all_contexts = retriever.get_all_available_contexts("The Fool", "upright")
    if all_contexts:
        for question_type, interpretation in all_contexts.available_contexts.items():
            print(f"{question_type.value}: {interpretation[:100]}...")
    
    # Test validation
    print(f"\n✅ Context Validation: Ace of Cups")
    print("-" * 50)
    validation = retriever.validate_question_contexts("Ace of Cups")
    print(f"Has contexts: {validation['has_question_contexts']}")
    print(f"Available: {validation['available_contexts']}")
    for context, checks in validation['orientations_check'].items():
        print(f"{context}: {checks}")
    
    return retriever


if __name__ == "__main__":
    test_question_context_retriever()