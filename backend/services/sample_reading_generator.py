"""
Sample Reading Generator

Generates diverse sample tarot readings with full context strings
to demonstrate the complete RAG/context retrieval system.
"""

import random
import json
from datetime import datetime
from typing import List, Tuple, Dict, Any

# Import handling
try:
    from .context_string_builder import ContextStringBuilder
    from .question_classifier import QuestionType
except ImportError:
    from context_string_builder import ContextStringBuilder
    from question_classifier import QuestionType


class SampleReadingGenerator:
    """Generates sample readings for testing and demonstration"""
    
    def __init__(self, cards_json_path: str, spreads_config_path: str):
        self.builder = ContextStringBuilder(cards_json_path, spreads_config_path)
        
        # Sample questions for each type
        self.sample_questions = {
            QuestionType.LOVE: [
                "Will I find love this year?",
                "How can I improve my relationship with my partner?",
                "Should I pursue this romantic interest?",
                "What do I need to know about my love life right now?",
                "Will my current relationship lead to marriage?",
                "How can I heal from my recent breakup?",
                "What blocks me from finding lasting love?",
                "Should I give my ex another chance?"
            ],
            QuestionType.CAREER: [
                "Should I take this new job offer?",
                "What career path is best for me?",
                "How can I advance in my current position?",
                "Should I start my own business?",
                "What's blocking my professional success?",
                "Will I get promoted this year?",
                "Should I change careers entirely?",
                "How can I find more fulfillment at work?"
            ],
            QuestionType.SPIRITUAL: [
                "What is my spiritual purpose in life?",
                "How can I deepen my spiritual practice?",
                "What is my soul trying to teach me?",
                "How can I connect with my higher self?",
                "What spiritual gifts am I meant to develop?",
                "How can I find inner peace?",
                "What is the universe trying to tell me?",
                "How can I align with my life's purpose?"
            ],
            QuestionType.FINANCIAL: [
                "How can I improve my financial situation?",
                "Should I make this investment?",
                "What's the best way to get out of debt?",
                "Will I achieve financial stability this year?",
                "Should I buy a house now?",
                "How can I increase my income?",
                "What money blocks do I need to clear?",
                "Is this financial opportunity worth pursuing?"
            ],
            QuestionType.HEALTH: [
                "How can I improve my overall health?",
                "What do I need to know about my current symptoms?",
                "How can I reduce stress in my life?",
                "What lifestyle changes should I make?",
                "How can I boost my energy levels?",
                "What's causing my anxiety?",
                "How can I achieve better work-life balance?",
                "What does my body need right now?"
            ],
            QuestionType.GENERAL: [
                "What do I most need to focus on right now?",
                "What guidance do you have for me today?",
                "What should I know about my current situation?",
                "How can I move forward in my life?",
                "What opportunities am I missing?",
                "What lesson is life trying to teach me?",
                "How can I make the best decision here?",
                "What do I need to let go of?"
            ]
        }
        
        # Get available cards and spreads
        self.available_cards = list(self.builder.card_loader.cards_data.keys())
        self.available_spreads = list(self.builder.spread_loader.spreads_info.keys())
        
        # Convert card IDs to proper names
        self.card_names = []
        for card_id, card_data in self.builder.card_loader.cards_data.items():
            if 'card_name' in card_data:
                self.card_names.append(card_data['card_name'])
    
    def generate_random_reading(
        self, 
        question_type: QuestionType = None,
        spread_id: str = None
    ) -> Tuple[str, str, List[Tuple[str, bool, str]]]:
        """
        Generate a random reading
        
        Returns:
            Tuple of (question, spread_id, cards_with_positions)
        """
        # Choose question type if not specified
        if question_type is None:
            question_type = random.choice(list(QuestionType))
        
        # Choose question
        question = random.choice(self.sample_questions[question_type])
        
        # Choose spread if not specified
        if spread_id is None:
            spread_id = random.choice(self.available_spreads)
        
        # Get spread info to know how many cards needed
        spread_info = self.builder.spread_loader.get_spread_info(spread_id)
        if not spread_info:
            raise ValueError(f"Invalid spread: {spread_id}")
        
        # Generate random cards
        num_cards = len(spread_info.positions)
        selected_cards = random.sample(self.card_names, num_cards)
        
        # Create cards with positions
        cards_with_positions = []
        for i, card_name in enumerate(selected_cards):
            is_reversed = random.choice([True, False])  # 50% chance of reversal
            position_name = spread_info.positions[i].name
            cards_with_positions.append((card_name, is_reversed, position_name))
        
        return question, spread_id, cards_with_positions
    
    def generate_sample_readings(
        self, 
        num_samples: int = 12,
        include_all_question_types: bool = True,
        include_all_spreads: bool = True
    ) -> List[Dict[str, Any]]:
        """Generate multiple sample readings"""
        readings = []
        
        question_types_to_use = list(QuestionType) if include_all_question_types else [QuestionType.GENERAL]
        spreads_to_use = self.available_spreads if include_all_spreads else [self.available_spreads[0]]
        
        for i in range(num_samples):
            # Ensure we hit all question types and spreads if requested
            if include_all_question_types and i < len(question_types_to_use):
                question_type = question_types_to_use[i]
            else:
                question_type = random.choice(question_types_to_use)
            
            if include_all_spreads and i < len(spreads_to_use):
                spread_id = spreads_to_use[i]
            else:
                spread_id = random.choice(spreads_to_use)
            
            # Generate the reading
            question, spread_id, cards_with_positions = self.generate_random_reading(
                question_type, spread_id
            )
            
            # Build the context
            try:
                context_string, reading_context = self.builder.build_complete_context_for_reading(
                    question, spread_id, cards_with_positions
                )
                
                # Get token statistics
                token_stats = self.builder.get_token_stats(context_string)
                
                reading_data = {
                    "reading_id": i + 1,
                    "question": question,
                    "question_type": question_type.value,
                    "question_confidence": reading_context.question_confidence,
                    "spread_id": spread_id,
                    "spread_name": reading_context.spread_name,
                    "cards": [
                        {
                            "name": card.name,
                            "orientation": card.orientation.value,
                            "position": card.position_name
                        }
                        for card in reading_context.cards
                    ],
                    "context_string": context_string,
                    "context_length": len(context_string),
                    "context_tokens": token_stats.context_tokens,
                    "tokens_per_char": token_stats.tokens_per_char,
                    "estimated_cost_gpt4": token_stats.estimated_cost_gpt4,
                    "estimated_cost_claude": token_stats.estimated_cost_claude,
                    "completeness": reading_context.context_completeness,
                    "generated_at": datetime.now().isoformat()
                }
                
                readings.append(reading_data)
                
            except Exception as e:
                print(f"Error generating reading {i+1}: {e}")
                continue
        
        return readings
    
    def write_samples_to_file(
        self, 
        output_file: str,
        num_samples: int = 12,
        format_type: str = "markdown"  # "markdown" or "json"
    ):
        """Generate samples and write to file"""
        print(f"🎯 Generating {num_samples} sample readings...")
        
        readings = self.generate_sample_readings(num_samples)
        
        if format_type == "markdown":
            self._write_markdown_file(output_file, readings)
        else:
            self._write_json_file(output_file, readings)
        
        print(f"✅ Generated {len(readings)} readings")
        print(f"📄 Written to: {output_file}")
        
        # Print summary statistics
        total_length = sum(r["context_length"] for r in readings)
        total_tokens = sum(r["context_tokens"] for r in readings)
        avg_length = total_length / len(readings) if readings else 0
        avg_tokens = total_tokens / len(readings) if readings else 0
        avg_completeness = sum(r["completeness"] for r in readings) / len(readings) if readings else 0
        avg_tokens_per_char = sum(r["tokens_per_char"] for r in readings) / len(readings) if readings else 0
        total_cost_gpt4 = sum(r["estimated_cost_gpt4"] for r in readings)
        total_cost_claude = sum(r["estimated_cost_claude"] for r in readings)
        
        print(f"📊 Statistics:")
        print(f"   • Average context length: {avg_length:.0f} characters")
        print(f"   • Average tokens: {avg_tokens:.0f}")
        print(f"   • Average tokens per char: {avg_tokens_per_char:.3f}")
        print(f"   • Total estimated GPT-4 cost: ${total_cost_gpt4:.4f}")
        print(f"   • Total estimated Claude cost: ${total_cost_claude:.4f}")
        print(f"   • Average completeness: {avg_completeness:.1%}")
        print(f"   • Question types covered: {len(set(r['question_type'] for r in readings))}")
        print(f"   • Spreads used: {len(set(r['spread_id'] for r in readings))}")
    
    def _write_markdown_file(self, output_file: str, readings: List[Dict]):
        """Write readings to a markdown file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Sample Tarot Readings - Context Generation Examples\n\n")
            f.write(f"Generated {len(readings)} sample readings on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("---\n\n")
            
            for i, reading in enumerate(readings):
                f.write(f"## Reading #{reading['reading_id']}\n\n")
                
                # Metadata
                f.write(f"**Question Type:** {reading['question_type']} (confidence: {reading['question_confidence']:.1f})  \n")
                f.write(f"**Spread:** {reading['spread_name']} (`{reading['spread_id']}`)  \n")
                f.write(f"**Context Length:** {reading['context_length']} characters  \n")
                f.write(f"**Token Count:** {reading['context_tokens']} tokens  \n")
                f.write(f"**Tokens per Char:** {reading['tokens_per_char']:.3f}  \n")
                f.write(f"**Est. GPT-4 Cost:** ${reading['estimated_cost_gpt4']:.4f}  \n")
                f.write(f"**Est. Claude Cost:** ${reading['estimated_cost_claude']:.4f}  \n")
                f.write(f"**Completeness:** {reading['completeness']:.1%}  \n\n")
                
                # Cards summary
                f.write("**Cards Drawn:**\n")
                for card in reading['cards']:
                    f.write(f"- {card['position']}: {card['name']} ({card['orientation']})\n")
                f.write("\n")
                
                # Full context string
                f.write("### Generated Context String\n\n")
                f.write("```\n")
                f.write(reading['context_string'])
                f.write("\n```\n\n")
                
                f.write("---\n\n")
    
    def _write_json_file(self, output_file: str, readings: List[Dict]):
        """Write readings to a JSON file"""
        output_data = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_readings": len(readings),
                "generator_version": "1.0"
            },
            "readings": readings
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)


def main():
    """Generate sample readings and write to files"""
    generator = SampleReadingGenerator(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json",
        spreads_config_path="/Users/katelouie/code/arcanum/backend/config/spreads-config.json"
    )
    
    # Generate comprehensive samples
    print("🎲 Generating diverse sample readings...")
    
    # Markdown format for easy reading
    generator.write_samples_to_file(
        output_file="/Users/katelouie/code/arcanum/sample_readings.md",
        num_samples=15,
        format_type="markdown"
    )
    
    # JSON format for programmatic use
    generator.write_samples_to_file(
        output_file="/Users/katelouie/code/arcanum/sample_readings.json",
        num_samples=10,
        format_type="json"
    )
    
    print("\n🎉 Sample generation complete!")
    print("📖 Check sample_readings.md for formatted examples")
    print("📊 Check sample_readings.json for structured data")


if __name__ == "__main__":
    main()