"""
Context String Builder - Piece 7 of Context Retrieval Architecture

Orchestrates all components to build comprehensive, structured context strings
for LLM prompt injection. This is the main entry point that ties everything together.
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import tiktoken

# Import handling for both module and standalone use
try:
    from .card_data_loader import CardDataLoader, CardDataConfig
    from .spread_config_loader import SpreadConfigLoader  
    from .question_classifier import QuestionClassifier, QuestionType, ClassificationResult
    from .card_meaning_extractor import CardMeaningExtractor, CardOrientation
    from .position_meaning_matcher import PositionMeaningMatcher, PositionMeaning
    from .question_context_retriever import QuestionContextRetriever, QuestionContext
except ImportError:
    from card_data_loader import CardDataLoader, CardDataConfig
    from spread_config_loader import SpreadConfigLoader
    from question_classifier import QuestionClassifier, QuestionType, ClassificationResult
    from card_meaning_extractor import CardMeaningExtractor, CardOrientation
    from position_meaning_matcher import PositionMeaningMatcher, PositionMeaning
    from question_context_retriever import QuestionContextRetriever, QuestionContext


@dataclass
class ReadingCard:
    """Represents a card in a reading with its position"""
    name: str
    orientation: CardOrientation  # UPRIGHT or REVERSED
    position_name: str
    position_index: int


@dataclass
class ReadingContext:
    """Complete context for a tarot reading"""
    question: str
    question_type: QuestionType
    question_confidence: float
    spread_id: str
    spread_name: str
    spread_description: str
    cards: List[ReadingCard]
    
    # Rich context data
    position_meanings: List[PositionMeaning]
    question_contexts: List[QuestionContext]
    
    # Metadata
    total_cards: int
    context_completeness: float  # 0-1 score of how complete the context is


@dataclass
class TokenStats:
    """Token counting statistics for context strings"""
    context_tokens: int
    context_chars: int
    tokens_per_char: float
    estimated_cost_gpt4: float  # Rough estimate in USD
    estimated_cost_claude: float  # Rough estimate in USD


class ContextStringBuilder:
    """Main orchestrator that builds comprehensive context strings"""
    
    def __init__(
        self, 
        cards_json_path: str,
        spreads_config_path: str,
        max_context_length: int = 8000,  # Character limit for context (roughly 2000 tokens)
        max_context_tokens: int = 3000,  # Token limit for context
        model_encoding: str = "cl100k_base"  # GPT-4/Claude encoding
    ):
        # Initialize all components
        card_config = CardDataConfig(cards_json_path=cards_json_path)
        self.card_loader = CardDataLoader(card_config)
        self.spread_loader = SpreadConfigLoader(spreads_config_path)
        self.question_classifier = QuestionClassifier()
        self.meaning_extractor = CardMeaningExtractor(self.card_loader)
        self.position_matcher = PositionMeaningMatcher(self.card_loader, self.spread_loader)
        self.question_retriever = QuestionContextRetriever(self.card_loader)
        
        self.max_context_length = max_context_length
        self.max_context_tokens = max_context_tokens
        
        # Initialize tokenizer
        try:
            self.tokenizer = tiktoken.get_encoding(model_encoding)
        except Exception as e:
            print(f"⚠️  Warning: Could not load tokenizer {model_encoding}, falling back to character counting")
            self.tokenizer = None
    
    def build_reading_context(
        self,
        question: str,
        spread_id: str,
        cards_with_positions: List[Tuple[str, bool, str]]  # [(card_name, is_reversed, position_name)]
    ) -> ReadingContext:
        """
        Build complete reading context from raw input data
        
        Args:
            question: The tarot question being asked
            spread_id: ID of the spread being used
            cards_with_positions: List of (card_name, is_reversed, position_name)
            
        Returns:
            ReadingContext with all gathered information
        """
        # 1. Classify the question
        classification = self.question_classifier.classify_question(question)
        
        # 2. Get spread information
        spread_info = self.spread_loader.get_spread_info(spread_id)
        if not spread_info:
            raise ValueError(f"Spread not found: {spread_id}")
        
        # 3. Process cards
        reading_cards = []
        for i, (card_name, is_reversed, position_name) in enumerate(cards_with_positions):
            orientation = CardOrientation.REVERSED if is_reversed else CardOrientation.UPRIGHT
            reading_cards.append(ReadingCard(
                name=card_name,
                orientation=orientation,
                position_name=position_name,
                position_index=i
            ))
        
        # 4. Get position meanings
        position_meanings = []
        for card in reading_cards:
            meaning = self.position_matcher.get_position_meaning(
                card.name,
                card.orientation.value,
                card.position_name,
                spread_id,
                classification.primary_type
            )
            if meaning:
                position_meanings.append(meaning)
        
        # 5. Get question contexts
        question_contexts = []
        for card in reading_cards:
            context = self.question_retriever.get_question_context(
                card.name,
                card.orientation.value,
                classification.primary_type
            )
            if context:
                question_contexts.append(context)
        
        # 6. Calculate completeness
        completeness = self._calculate_completeness(
            len(reading_cards), len(position_meanings), len(question_contexts)
        )
        
        return ReadingContext(
            question=question,
            question_type=classification.primary_type,
            question_confidence=classification.confidence,
            spread_id=spread_id,
            spread_name=spread_info.name,
            spread_description=spread_info.description,
            cards=reading_cards,
            position_meanings=position_meanings,
            question_contexts=question_contexts,
            total_cards=len(reading_cards),
            context_completeness=completeness
        )
    
    def build_context_string(
        self,
        reading_context: ReadingContext,
        include_symbols: bool = False,
        include_keywords: bool = True,
        style: str = "comprehensive"  # "comprehensive", "concise", "detailed"
    ) -> str:
        """
        Build the final context string for LLM prompt injection
        
        Args:
            reading_context: The complete reading context
            include_symbols: Whether to include symbolic information
            include_keywords: Whether to include keywords
            style: How detailed the context should be
            
        Returns:
            Formatted context string ready for prompt injection
        """
        sections = []
        current_length = 0
        
        # 1. Question and spread overview
        overview = self._build_overview_section(reading_context)
        sections.append(overview)
        current_length += len(overview)
        
        # 2. Cards summary
        cards_summary = self._build_cards_summary_section(reading_context)
        sections.append(cards_summary)
        current_length += len(cards_summary)
        
        # 3. Position meanings (most important section)
        position_section = self._build_position_meanings_section(
            reading_context, style, include_keywords
        )
        sections.append(position_section)
        current_length += len(position_section)
        
        # 4. Question-specific contexts (if space allows)
        if current_length < self.max_context_length * 0.8:
            question_section = self._build_question_contexts_section(
                reading_context, style
            )
            if question_section:
                sections.append(question_section)
                current_length += len(question_section)
        
        # 5. Journaling prompts (if space allows)
        if current_length < self.max_context_length * 0.85:
            journaling_section = self._build_journaling_section(reading_context)
            if journaling_section:
                sections.append(journaling_section)
                current_length += len(journaling_section)
        
        # 6. Card combinations (if space allows)
        if current_length < self.max_context_length * 0.9:
            combinations_section = self._build_combinations_section(reading_context)
            if combinations_section:
                sections.append(combinations_section)
                current_length += len(combinations_section)
        
        # 7. Symbolic information (if requested and space allows)
        if include_symbols and current_length < self.max_context_length * 0.95:
            symbols_section = self._build_symbols_section(reading_context)
            if symbols_section:
                sections.append(symbols_section)
        
        # Join all sections
        full_context = "\n\n".join(sections)
        
        # Truncate if necessary (but warn - this shouldn't happen often now)
        if len(full_context) > self.max_context_length:
            truncated_length = self.max_context_length - 100
            full_context = full_context[:truncated_length] + "\n\n[Context truncated for length - consider increasing max_context_length]"
            print(f"⚠️  Warning: Context truncated from {len(full_context)} to {self.max_context_length} characters")
        
        return full_context
    
    def _build_overview_section(self, context: ReadingContext) -> str:
        """Build the overview section"""
        return f"""READING OVERVIEW:
Question: "{context.question}"
Question Type: {context.question_type.value} (confidence: {context.question_confidence:.1f})
Spread: {context.spread_name} - {context.spread_description}
Cards Drawn: {context.total_cards}"""
    
    def _build_cards_summary_section(self, context: ReadingContext) -> str:
        """Build the cards summary section"""
        lines = ["CARDS DRAWN:"]
        
        for card in context.cards:
            orientation_text = "Reversed" if card.orientation == CardOrientation.REVERSED else "Upright"
            lines.append(f"• {card.position_name}: {card.name} ({orientation_text})")
        
        return "\n".join(lines)
    
    def _build_position_meanings_section(
        self, 
        context: ReadingContext, 
        style: str,
        include_keywords: bool
    ) -> str:
        """Build the detailed position meanings section"""
        lines = ["POSITION INTERPRETATIONS:"]
        
        for i, card in enumerate(context.cards):
            # Find corresponding position meaning
            position_meaning = None
            for pm in context.position_meanings:
                if (pm.position_context.name == card.position_name and 
                    pm.card_interpretation):
                    position_meaning = pm
                    break
            
            if not position_meaning:
                continue
            
            lines.append(f"\n{card.position_name}: {card.name} ({card.orientation.value})")
            
            # Position context
            position_desc = position_meaning.position_context.get_description_for_question_type(
                context.question_type
            )
            lines.append(f"Position Meaning: {position_desc}")
            
            # Card interpretation for this position
            lines.append(f"Card in Position: {position_meaning.card_interpretation}")
            
            # Question-specific interpretation (if available and not general)
            question_context = self._find_question_context_for_card(card, context.question_contexts)
            if question_context and question_context.question_type != QuestionType.GENERAL:
                lines.append(f"{context.question_type.value.title()} Context: {question_context.interpretation}")
            
            # Get multi-dimensional meanings for this card
            multi_meanings = self._get_multi_dimensional_meanings(card.name, card.orientation.value)
            if multi_meanings:
                lines.append(f"Psychological: {multi_meanings.get('psychological', '')}")
                lines.append(f"Spiritual: {multi_meanings.get('spiritual', '')}")
                lines.append(f"Practical: {multi_meanings.get('practical', '')}")
                if style == "detailed" and multi_meanings.get('shadow'):
                    lines.append(f"Shadow: {multi_meanings.get('shadow', '')}")
            
            # All keywords (both card and position)
            if include_keywords:
                all_keywords = self._get_all_keywords_for_card_position(card, position_meaning)
                if all_keywords:
                    lines.append(f"Keywords: {', '.join(all_keywords[:12])}")  # Limit to 12 total keywords
            
            # Source and confidence for debugging
            if style == "detailed":
                lines.append(f"Source: {position_meaning.interpretation_source} (confidence: {position_meaning.confidence:.1f})")
        
        return "\n".join(lines)
    
    def _build_question_contexts_section(self, context: ReadingContext, style: str) -> str:
        """Build the general question contexts section (only for general contexts now)"""
        if not context.question_contexts:
            return ""
        
        # Only include general question contexts here, since specific ones are in position meanings
        general_contexts = []
        for i, card in enumerate(context.cards):
            question_context = self._find_question_context_for_card(card, context.question_contexts)
            if question_context and question_context.question_type == QuestionType.GENERAL:
                general_contexts.append((card, question_context))
        
        if not general_contexts:
            return ""
        
        lines = ["GENERAL INTERPRETATIONS:"]
        
        for card, question_context in general_contexts:
            lines.append(f"\n{card.name} ({card.orientation.value}):")
            lines.append(f"{question_context.interpretation}")
        
        return "\n".join(lines)
    
    def _build_symbols_section(self, context: ReadingContext) -> str:
        """Build symbolic information section"""
        lines = ["SYMBOLIC ELEMENTS:"]
        
        for card in context.cards:
            symbols = self.meaning_extractor.get_card_symbols(card.name)
            if symbols and symbols.symbols:
                lines.append(f"\n{card.name}:")
                # Limit to most important symbols
                for symbol, meaning in list(symbols.symbols.items())[:3]:
                    lines.append(f"• {symbol}: {meaning}")
        
        return "\n".join(lines) if len(lines) > 1 else ""
    
    def _build_journaling_section(self, context: ReadingContext) -> str:
        """Build journaling prompts section"""
        lines = ["JOURNALING PROMPTS:"]
        
        for card in context.cards:
            prompt = self._get_journaling_prompt(card.name)
            if prompt:
                lines.append(f"\n{card.name}: {prompt}")
        
        return "\n".join(lines) if len(lines) > 1 else ""
    
    def _build_combinations_section(self, context: ReadingContext) -> str:
        """Build card combinations section"""
        combinations = self._get_card_combinations_in_spread(context)
        if not combinations:
            return ""
        
        lines = ["CARD COMBINATIONS:"]
        
        for card_name, combo_list in combinations.items():
            lines.append(f"\n{card_name}:")
            for combo in combo_list:
                lines.append(f"• {combo}")
        
        return "\n".join(lines)
    
    def _calculate_completeness(
        self, 
        total_cards: int, 
        position_meanings: int, 
        question_contexts: int
    ) -> float:
        """Calculate how complete the context is (0-1 score)"""
        if total_cards == 0:
            return 0.0
        
        position_completeness = position_meanings / total_cards
        question_completeness = question_contexts / total_cards
        
        # Weight position meanings more heavily as they're more important
        return (position_completeness * 0.7) + (question_completeness * 0.3)
    
    def build_complete_context_for_reading(
        self,
        question: str,
        spread_id: str,
        cards_with_positions: List[Tuple[str, bool, str]],
        style: str = "comprehensive"
    ) -> Tuple[str, ReadingContext]:
        """
        One-stop method to build complete context from raw inputs
        
        Returns:
            Tuple of (context_string, reading_context)
        """
        # Build the reading context
        reading_context = self.build_reading_context(question, spread_id, cards_with_positions)
        
        # Build the context string
        context_string = self.build_context_string(reading_context, style=style)
        
        return context_string, reading_context
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken"""
        if not self.tokenizer:
            # Fallback: rough estimate (4 chars per token average)
            return len(text) // 4
        
        try:
            return len(self.tokenizer.encode(text))
        except Exception:
            # Fallback on error
            return len(text) // 4
    
    def get_token_stats(self, context_string: str) -> TokenStats:
        """Get comprehensive token statistics for a context string"""
        tokens = self.count_tokens(context_string)
        chars = len(context_string)
        tokens_per_char = tokens / chars if chars > 0 else 0
        
        # Rough cost estimates (as of 2024, input tokens)
        # GPT-4: ~$0.01 per 1K tokens
        # Claude: ~$0.008 per 1K tokens  
        estimated_cost_gpt4 = (tokens / 1000) * 0.01
        estimated_cost_claude = (tokens / 1000) * 0.008
        
        return TokenStats(
            context_tokens=tokens,
            context_chars=chars,
            tokens_per_char=tokens_per_char,
            estimated_cost_gpt4=estimated_cost_gpt4,
            estimated_cost_claude=estimated_cost_claude
        )
    
    def build_context_string_with_token_limit(
        self,
        reading_context: ReadingContext,
        max_tokens: int = None,
        include_symbols: bool = False,
        include_keywords: bool = True,
        style: str = "comprehensive"
    ) -> Tuple[str, TokenStats]:
        """
        Build context string with token-aware truncation
        
        Returns:
            Tuple of (context_string, token_stats)
        """
        if max_tokens is None:
            max_tokens = self.max_context_tokens
        
        sections = []
        current_tokens = 0
        
        # 1. Overview (always include - most important)
        overview = self._build_overview_section(reading_context)
        overview_tokens = self.count_tokens(overview)
        sections.append(overview)
        current_tokens += overview_tokens
        
        # 2. Cards summary (always include)
        cards_summary = self._build_cards_summary_section(reading_context)
        cards_tokens = self.count_tokens(cards_summary)
        if current_tokens + cards_tokens <= max_tokens:
            sections.append(cards_summary)
            current_tokens += cards_tokens
        
        # 3. Position meanings (highest priority)
        position_section = self._build_position_meanings_section(
            reading_context, style, include_keywords
        )
        position_tokens = self.count_tokens(position_section)
        if current_tokens + position_tokens <= max_tokens:
            sections.append(position_section)
            current_tokens += position_tokens
        else:
            # Try to fit partial position meanings
            remaining_tokens = max_tokens - current_tokens - 50  # Buffer
            if remaining_tokens > 200:  # Minimum viable position section
                truncated_section = self._truncate_section_by_tokens(
                    position_section, remaining_tokens
                )
                sections.append(truncated_section)
                current_tokens += self.count_tokens(truncated_section)
        
        # 4. Question contexts (if space allows)
        if current_tokens < max_tokens * 0.75:
            question_section = self._build_question_contexts_section(reading_context, style)
            if question_section:
                question_tokens = self.count_tokens(question_section)
                if current_tokens + question_tokens <= max_tokens:
                    sections.append(question_section)
                    current_tokens += question_tokens
        
        # 5. Journaling prompts (if space allows)
        if current_tokens < max_tokens * 0.85:
            journaling_section = self._build_journaling_section(reading_context)
            if journaling_section:
                journaling_tokens = self.count_tokens(journaling_section)
                if current_tokens + journaling_tokens <= max_tokens:
                    sections.append(journaling_section)
                    current_tokens += journaling_tokens
        
        # 6. Card combinations (if space allows)
        if current_tokens < max_tokens * 0.9:
            combinations_section = self._build_combinations_section(reading_context)
            if combinations_section:
                combinations_tokens = self.count_tokens(combinations_section)
                if current_tokens + combinations_tokens <= max_tokens:
                    sections.append(combinations_section)
                    current_tokens += combinations_tokens
        
        # 7. Symbols (lowest priority)
        if include_symbols and current_tokens < max_tokens * 0.95:
            symbols_section = self._build_symbols_section(reading_context)
            if symbols_section:
                symbols_tokens = self.count_tokens(symbols_section)
                if current_tokens + symbols_tokens <= max_tokens:
                    sections.append(symbols_section)
        
        # Join sections
        full_context = "\n\n".join(sections)
        final_tokens = self.count_tokens(full_context)
        
        # Final check and truncation warning
        if final_tokens > max_tokens:
            print(f"⚠️  Warning: Context still exceeds token limit ({final_tokens} > {max_tokens})")
        
        # Get comprehensive stats
        token_stats = self.get_token_stats(full_context)
        
        return full_context, token_stats
    
    def _truncate_section_by_tokens(self, section: str, max_tokens: int) -> str:
        """Truncate a section to fit within token limit"""
        if not self.tokenizer:
            # Fallback: character-based truncation
            chars_per_token = 4
            max_chars = max_tokens * chars_per_token
            if len(section) <= max_chars:
                return section
            return section[:max_chars-20] + "\n[Truncated...]"
        
        # Token-based truncation
        tokens = self.tokenizer.encode(section)
        if len(tokens) <= max_tokens:
            return section
        
        # Truncate to fit
        truncated_tokens = tokens[:max_tokens-10]  # Leave room for truncation message
        truncated_text = self.tokenizer.decode(truncated_tokens)
        return truncated_text + "\n[Truncated for token limit...]"
    
    def _get_multi_dimensional_meanings(self, card_name: str, orientation: str) -> Dict[str, str]:
        """Extract psychological, spiritual, practical, and shadow meanings"""
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return {}
        
        core_meanings = card_data.get("core_meanings", {})
        orientation_data = core_meanings.get(orientation, {})
        
        return {
            "psychological": orientation_data.get("psychological", ""),
            "spiritual": orientation_data.get("spiritual", ""),
            "practical": orientation_data.get("practical", ""),
            "shadow": orientation_data.get("shadow", "")
        }
    
    def _get_all_keywords_for_card_position(self, card: ReadingCard, position_meaning) -> List[str]:
        """Combine keywords from both card meanings and position context"""
        all_keywords = []
        
        # Get card keywords
        card_data = self.card_loader.get_card_data(card.name)
        if card_data:
            core_meanings = card_data.get("core_meanings", {})
            orientation_data = core_meanings.get(card.orientation.value, {})
            card_keywords = orientation_data.get("keywords", [])
            all_keywords.extend(card_keywords)
        
        # Get position keywords
        if position_meaning and position_meaning.position_context.keywords:
            all_keywords.extend(position_meaning.position_context.keywords)
        
        # Get position-specific keywords if available
        position_specific_keywords = self._get_position_specific_keywords(card)
        all_keywords.extend(position_specific_keywords)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_keywords = []
        for keyword in all_keywords:
            if keyword.lower() not in seen:
                seen.add(keyword.lower())
                unique_keywords.append(keyword)
        
        return unique_keywords
    
    def _get_position_specific_keywords(self, card: ReadingCard) -> List[str]:
        """Extract keywords from position-specific interpretations"""
        card_data = self.card_loader.get_card_data(card.name)
        if not card_data:
            return []
        
        position_interps = card_data.get("position_interpretations", {})
        keywords = []
        
        # Search through position categories for matching position
        for category, positions in position_interps.items():
            if isinstance(positions, dict):
                for pos_name, pos_data in positions.items():
                    if self._position_name_matches(card.position_name, pos_name):
                        if isinstance(pos_data, dict):
                            pos_keywords = pos_data.get("keywords", [])
                            keywords.extend(pos_keywords)
        
        return keywords
    
    def _position_name_matches(self, position_name: str, card_position_key: str) -> bool:
        """Check if position names match (handles variations like 'Past' vs 'past')"""
        return position_name.lower().replace(" ", "_") == card_position_key.lower().replace(" ", "_")
    
    def _get_position_dependent_interpretation(self, card: ReadingCard, position_meaning) -> str:
        """Get the specific position interpretation for this card/orientation combination"""
        card_data = self.card_loader.get_card_data(card.name)
        if not card_data:
            return ""
        
        position_interps = card_data.get("position_interpretations", {})
        
        # Search through position categories for matching position
        for category, positions in position_interps.items():
            if isinstance(positions, dict):
                for pos_name, pos_data in positions.items():
                    if self._position_name_matches(card.position_name, pos_name):
                        if isinstance(pos_data, dict):
                            specific_meaning = pos_data.get(card.orientation.value, "")
                            if specific_meaning:
                                return specific_meaning
        
        return ""
    
    def _get_journaling_prompt(self, card_name: str) -> str:
        """Get one journaling prompt for the card"""
        card_data = self.card_loader.get_card_data(card_name)
        if not card_data:
            return ""
        
        prompts = card_data.get("journaling_prompts", [])
        if prompts:
            # Return the first prompt
            return prompts[0]
        
        return ""
    
    def _get_card_combinations_in_spread(self, context: ReadingContext) -> Dict[str, List[str]]:
        """Find card combinations when multiple cards from the spread are related"""
        card_names_in_spread = [card.name for card in context.cards]
        combinations = {}
        
        for card in context.cards:
            card_data = self.card_loader.get_card_data(card.name)
            if not card_data:
                continue
            
            # Use new card_relationships structure
            card_relationships = card_data.get("card_relationships", {})
            
            card_combinations = []
            
            # Check all relationship types in the new structure
            for relation_type, relation_cards in card_relationships.items():
                if isinstance(relation_cards, dict):
                    for other_card_id, relationship_data in relation_cards.items():
                        # Try to get card data by ID first, then by name
                        other_card_data = self.card_loader.get_card_data(other_card_id)
                        if not other_card_data:
                            # Try treating other_card_id as a card name directly
                            other_card_data = self.card_loader.get_card_data(other_card_id.replace("_", " ").title())
                        
                        if other_card_data:
                            other_card_name = other_card_data.get("card_name", "")
                            if other_card_name in card_names_in_spread and other_card_name != card.name:
                                # Get interpretation from the relationship data
                                interpretation = relationship_data.get("interpretation", "")
                                # Skip placeholder interpretations in combinations
                                if interpretation and not interpretation.startswith("[TO BE WRITTEN"):
                                    card_combinations.append(f"{relation_type.title()} with {other_card_name}: {interpretation}")
                                elif not interpretation.startswith("[TO BE WRITTEN"):
                                    # Fallback for missing interpretations
                                    card_combinations.append(f"{relation_type.replace('_', ' ').title()}: {other_card_name}")
            
            if card_combinations:
                combinations[card.name] = card_combinations
        
        return combinations
    
    def _find_question_context_for_card(self, card: ReadingCard, question_contexts: List) -> Optional['QuestionContext']:
        """Find the question context for a specific card"""
        for qc in question_contexts:
            if qc.card_name == card.name and qc.orientation == card.orientation.value:
                return qc
        return None


# Test function
def test_context_string_builder():
    """Test the complete context string builder"""
    
    builder = ContextStringBuilder(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json",
        spreads_config_path="/Users/katelouie/code/arcanum/backend/config/spreads-config.json"
    )
    
    print("🧪 Testing Complete Context String Builder:")
    print("=" * 60)
    
    # Test reading
    test_question = "Will my relationship with my partner improve this year?"
    test_spread = "past-present-future"
    test_cards = [
        ("The Fool", False, "Past"),          # The Fool upright in Past
        ("Ace of Cups", True, "Present"),     # Ace of Cups reversed in Present  
        ("Seven of Swords", False, "Future")  # Seven of Swords upright in Future
    ]
    
    print(f"Question: {test_question}")
    print(f"Spread: {test_spread}")
    print(f"Cards: {test_cards}")
    print("\n" + "=" * 60)
    
    # Build complete context
    context_string, reading_context = builder.build_complete_context_for_reading(
        test_question, test_spread, test_cards, style="comprehensive"
    )
    
    print("GENERATED CONTEXT STRING:")
    print("-" * 40)
    print(context_string)
    print("-" * 40)
    
    # Get token statistics
    token_stats = builder.get_token_stats(context_string)
    
    print(f"\nContext Statistics:")
    print(f"• Length: {len(context_string)} characters")
    print(f"• Tokens: {token_stats.context_tokens}")
    print(f"• Tokens per char: {token_stats.tokens_per_char:.3f}")
    print(f"• Est. GPT-4 cost: ${token_stats.estimated_cost_gpt4:.4f}")
    print(f"• Est. Claude cost: ${token_stats.estimated_cost_claude:.4f}")
    print(f"• Completeness: {reading_context.context_completeness:.1%}")
    print(f"• Question classified as: {reading_context.question_type.value}")
    print(f"• Position meanings found: {len(reading_context.position_meanings)}")
    print(f"• Question contexts found: {len(reading_context.question_contexts)}")
    
    # Test token-aware building
    print(f"\n🎛️ Testing Token-Aware Context Building:")
    print("-" * 40)
    
    for max_tokens in [1000, 2000, 3000]:
        token_context, token_stats = builder.build_context_string_with_token_limit(
            reading_context, max_tokens=max_tokens
        )
        print(f"Max {max_tokens} tokens: {token_stats.context_tokens} tokens, {len(token_context)} chars")
    
    # Test different styles
    print(f"\n🎨 Testing Different Styles:")
    print("-" * 40)
    
    for style in ["comprehensive", "concise"]:
        style_context = builder.build_context_string(reading_context, style=style)
        style_tokens = builder.count_tokens(style_context)
        print(f"{style.title()} style: {len(style_context)} chars, {style_tokens} tokens")
    
    return builder, reading_context


if __name__ == "__main__":
    test_context_string_builder()