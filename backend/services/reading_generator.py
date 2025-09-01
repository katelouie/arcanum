"""
Complete Tarot Reading Generator

Integrates context building with prompt engineering to create full reading generation system.
Ready for LLM integration with sophisticated prompts and rich context.
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import json

# Import handling for both module and standalone use
try:
    from .context_string_builder import ContextStringBuilder, ReadingContext, ReadingCard, CardOrientation
    from .prompt_engineer import TarotPromptEngineer, ReadingStyle, ReadingTone
    from .question_classifier import QuestionType
except ImportError:
    from context_string_builder import ContextStringBuilder, ReadingContext, ReadingCard, CardOrientation
    from prompt_engineer import TarotPromptEngineer, ReadingStyle, ReadingTone
    from question_classifier import QuestionType


@dataclass
class ReadingRequest:
    """A request for a tarot reading"""
    question: str
    spread_id: str
    cards_with_positions: List[Tuple[str, bool, str]]  # [(card_name, is_reversed, position_name)]
    style: ReadingStyle = ReadingStyle.COMPASSIONATE
    tone: ReadingTone = ReadingTone.WARM
    custom_instructions: Optional[str] = None


@dataclass
class GeneratedReading:
    """A complete generated reading with all metadata"""
    # Input details
    question: str
    question_type: QuestionType
    question_confidence: float
    spread_id: str
    spread_name: str
    cards: List[ReadingCard]
    
    # Generation details
    style: ReadingStyle
    tone: ReadingTone
    context_string: str
    system_prompt: str
    user_prompt: str
    
    # Metadata
    context_tokens: int
    prompt_tokens: int
    total_tokens: int
    completeness: float
    generated_at: str
    
    # Placeholder for actual LLM response
    reading_text: Optional[str] = None
    llm_tokens: Optional[int] = None


class TarotReadingGenerator:
    """Complete system for generating tarot readings"""
    
    def __init__(
        self,
        cards_json_path: str,
        spreads_config_path: str,
        max_context_tokens: int = 3000,
        max_total_tokens: int = 8000
    ):
        self.context_builder = ContextStringBuilder(
            cards_json_path=cards_json_path,
            spreads_config_path=spreads_config_path,
            max_context_tokens=max_context_tokens
        )
        self.prompt_engineer = TarotPromptEngineer()
        self.max_total_tokens = max_total_tokens
    
    def generate_reading_prompt(
        self,
        reading_request: ReadingRequest,
        use_token_limit: bool = True
    ) -> GeneratedReading:
        """
        Generate a complete reading with context and prompts ready for LLM
        
        Args:
            reading_request: The reading request details
            use_token_limit: Whether to use token-aware context building
            
        Returns:
            GeneratedReading with all prompts and metadata
        """
        # Build reading context
        reading_context = self.context_builder.build_reading_context(
            reading_request.question,
            reading_request.spread_id,
            reading_request.cards_with_positions
        )
        
        # Build context string (with or without token limits)
        if use_token_limit:
            context_string, token_stats = self.context_builder.build_context_string_with_token_limit(
                reading_context,
                max_tokens=self.context_builder.max_context_tokens
            )
            context_tokens = token_stats.context_tokens
        else:
            context_string = self.context_builder.build_context_string(reading_context)
            context_tokens = self.context_builder.count_tokens(context_string)
        
        # Generate prompts
        system_prompt, user_prompt = self.prompt_engineer.create_reading_prompt(
            context_string,
            reading_context,
            reading_request.style,
            reading_request.tone,
            reading_request.custom_instructions
        )
        
        # Calculate token usage
        prompt_tokens = self.context_builder.count_tokens(system_prompt + user_prompt)
        total_tokens = context_tokens + prompt_tokens
        
        return GeneratedReading(
            # Input details
            question=reading_context.question,
            question_type=reading_context.question_type,
            question_confidence=reading_context.question_confidence,
            spread_id=reading_context.spread_id,
            spread_name=reading_context.spread_name,
            cards=reading_context.cards,
            
            # Generation details
            style=reading_request.style,
            tone=reading_request.tone,
            context_string=context_string,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            
            # Metadata
            context_tokens=context_tokens,
            prompt_tokens=prompt_tokens,
            total_tokens=total_tokens,
            completeness=reading_context.context_completeness,
            generated_at=datetime.now().isoformat()
        )
    
    def generate_multiple_style_prompts(
        self,
        reading_request: ReadingRequest,
        styles_to_generate: Optional[List[Tuple[ReadingStyle, ReadingTone]]] = None
    ) -> Dict[str, GeneratedReading]:
        """Generate prompts in multiple styles for comparison"""
        if styles_to_generate is None:
            styles_to_generate = [
                (ReadingStyle.COMPASSIONATE, ReadingTone.WARM),
                (ReadingStyle.DIRECT, ReadingTone.PROFESSIONAL),
                (ReadingStyle.MYSTICAL, ReadingTone.WISE),
                (ReadingStyle.PRACTICAL, ReadingTone.GROUNDING)
            ]
        
        results = {}
        
        for style, tone in styles_to_generate:
            request = ReadingRequest(
                question=reading_request.question,
                spread_id=reading_request.spread_id,
                cards_with_positions=reading_request.cards_with_positions,
                style=style,
                tone=tone,
                custom_instructions=reading_request.custom_instructions
            )
            
            generated = self.generate_reading_prompt(request)
            key = f"{style.value}_{tone.value}"
            results[key] = generated
        
        return results
    
    def export_prompt_for_llm(
        self,
        generated_reading: GeneratedReading,
        format_type: str = "openai"  # "openai", "anthropic", "raw"
    ) -> Dict[str, Any]:
        """Export the prompt in format suitable for LLM APIs"""
        if format_type == "openai":
            return {
                "model": "gpt-4",
                "messages": [
                    {"role": "system", "content": generated_reading.system_prompt},
                    {"role": "user", "content": generated_reading.user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }
        elif format_type == "anthropic":
            return {
                "model": "claude-3-sonnet-20240229",
                "system": generated_reading.system_prompt,
                "messages": [
                    {"role": "user", "content": generated_reading.user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }
        else:  # raw
            return {
                "system_prompt": generated_reading.system_prompt,
                "user_prompt": generated_reading.user_prompt,
                "metadata": {
                    "question": generated_reading.question,
                    "spread": generated_reading.spread_name,
                    "style": generated_reading.style.value,
                    "tone": generated_reading.tone.value,
                    "context_tokens": generated_reading.context_tokens,
                    "prompt_tokens": generated_reading.prompt_tokens,
                    "total_tokens": generated_reading.total_tokens
                }
            }
    
    def save_prompt_examples(
        self,
        output_file: str,
        num_examples: int = 5,
        include_multiple_styles: bool = True
    ):
        """Generate and save example prompts for testing/development"""
        try:
            from .sample_reading_generator import SampleReadingGenerator
        except ImportError:
            from sample_reading_generator import SampleReadingGenerator
        
        # Generate sample readings  
        sample_generator = SampleReadingGenerator(
            cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json",
            spreads_config_path="/Users/katelouie/code/arcanum/backend/config/spreads-config.json"
        )
        
        examples = []
        
        for i in range(num_examples):
            # Generate random reading data
            question, spread_id, cards_with_positions = sample_generator.generate_random_reading()
            
            if include_multiple_styles:
                # Generate multiple styles for this reading
                request = ReadingRequest(
                    question=question,
                    spread_id=spread_id,
                    cards_with_positions=cards_with_positions
                )
                
                style_results = self.generate_multiple_style_prompts(request)
                
                example = {
                    "example_id": i + 1,
                    "reading_data": {
                        "question": question,
                        "spread_id": spread_id,
                        "cards": [
                            {"name": name, "reversed": is_reversed, "position": position}
                            for name, is_reversed, position in cards_with_positions
                        ]
                    },
                    "styles": {}
                }
                
                for style_key, generated in style_results.items():
                    example["styles"][style_key] = {
                        "system_prompt": generated.system_prompt,
                        "user_prompt": generated.user_prompt,
                        "tokens": {
                            "context": generated.context_tokens,
                            "prompt": generated.prompt_tokens,
                            "total": generated.total_tokens
                        },
                        "completeness": generated.completeness,
                        "openai_format": self.export_prompt_for_llm(generated, "openai"),
                        "anthropic_format": self.export_prompt_for_llm(generated, "anthropic")
                    }
                
                examples.append(example)
            
            else:
                # Generate single style
                request = ReadingRequest(
                    question=question,
                    spread_id=spread_id,
                    cards_with_positions=cards_with_positions,
                    style=ReadingStyle.COMPASSIONATE,
                    tone=ReadingTone.WARM
                )
                
                generated = self.generate_reading_prompt(request)
                
                example = {
                    "example_id": i + 1,
                    "question": question,
                    "spread_id": spread_id,
                    "cards": [
                        {"name": name, "reversed": is_reversed, "position": position}
                        for name, is_reversed, position in cards_with_positions
                    ],
                    "system_prompt": generated.system_prompt,
                    "user_prompt": generated.user_prompt,
                    "context_string": generated.context_string,
                    "tokens": {
                        "context": generated.context_tokens,
                        "prompt": generated.prompt_tokens,
                        "total": generated.total_tokens
                    },
                    "completeness": generated.completeness,
                    "llm_formats": {
                        "openai": self.export_prompt_for_llm(generated, "openai"),
                        "anthropic": self.export_prompt_for_llm(generated, "anthropic")
                    }
                }
                
                examples.append(example)
        
        # Save to file
        output_data = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_examples": len(examples),
                "include_multiple_styles": include_multiple_styles,
                "generator_version": "1.0"
            },
            "examples": examples
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Generated {len(examples)} prompt examples")
        print(f"📄 Saved to: {output_file}")
        
        # Print summary
        if include_multiple_styles:
            total_styles = sum(len(ex["styles"]) for ex in examples)
            print(f"📊 Total style variations: {total_styles}")
        
        avg_tokens = sum(
            sum(style["tokens"]["total"] for style in ex.get("styles", {}).values()) 
            if "styles" in ex else ex["tokens"]["total"]
            for ex in examples
        ) / len(examples)
        print(f"📊 Average total tokens per prompt: {avg_tokens:.0f}")


def test_reading_generator():
    """Test the complete reading generation system"""
    generator = TarotReadingGenerator(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json",
        spreads_config_path="/Users/katelouie/code/arcanum/backend/config/spreads-config.json"
    )
    
    print("🧪 Testing Complete Reading Generation System:")
    print("=" * 60)
    
    # Test single reading generation
    test_request = ReadingRequest(
        question="How can I find more balance in my life?",
        spread_id="mind-body-spirit",
        cards_with_positions=[
            ("The Fool", False, "Mind"),
            ("Ace of Cups", True, "Body"),
            ("Seven of Swords", False, "Spirit")
        ],
        style=ReadingStyle.COMPASSIONATE,
        tone=ReadingTone.WARM
    )
    
    generated = generator.generate_reading_prompt(test_request)
    
    print(f"Question: {generated.question}")
    print(f"Question Type: {generated.question_type.value} (confidence: {generated.question_confidence:.1f})")
    print(f"Spread: {generated.spread_name}")
    print(f"Style: {generated.style.value} + {generated.tone.value}")
    print(f"Tokens - Context: {generated.context_tokens}, Prompt: {generated.prompt_tokens}, Total: {generated.total_tokens}")
    print(f"Completeness: {generated.completeness:.1%}")
    
    print(f"\n📝 System Prompt Preview (first 200 chars):")
    print(f"'{generated.system_prompt[:200]}...'")
    
    print(f"\n📝 User Prompt Preview (first 300 chars):")
    print(f"'{generated.user_prompt[:300]}...'")
    
    # Test multiple styles
    print(f"\n🎨 Testing Multiple Styles:")
    print("-" * 40)
    
    style_results = generator.generate_multiple_style_prompts(test_request)
    for style_key, result in style_results.items():
        print(f"{style_key}: {result.total_tokens} tokens")
    
    return generator


def main():
    """Generate example prompts for LLM testing"""
    generator = TarotReadingGenerator(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json",
        spreads_config_path="/Users/katelouie/code/arcanum/backend/config/spreads-config.json"
    )
    
    print("🎯 Generating LLM-Ready Prompt Examples...")
    
    # Generate examples with multiple styles
    generator.save_prompt_examples(
        output_file="/Users/katelouie/code/arcanum/llm_prompt_examples.json",
        num_examples=3,
        include_multiple_styles=True
    )
    
    # Generate simpler examples for testing
    generator.save_prompt_examples(
        output_file="/Users/katelouie/code/arcanum/simple_prompt_examples.json",
        num_examples=5,
        include_multiple_styles=False
    )
    
    print("\n🎉 Prompt generation complete!")
    print("📖 Check llm_prompt_examples.json for multi-style examples")
    print("📊 Check simple_prompt_examples.json for single-style examples")


if __name__ == "__main__":
    if __name__ == "__main__":
        test_reading_generator()
    else:
        main()