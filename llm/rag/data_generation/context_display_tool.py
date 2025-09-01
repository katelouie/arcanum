#!/usr/bin/env python3
"""
Context String Display Tool

Shows the complete context string that would be generated for a given spread,
useful for understanding what training data is being sent to the model.
"""

import json
from pathlib import Path
import sys
sys.path.append('/Users/katelouie/code/arcanum/backend/services')

from context_string_builder import ContextStringBuilder, CardOrientation

def display_context_for_reading(
    question: str,
    spread_id: str,
    cards_with_positions: list,
    cards_json_path: str = "/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json",
    spreads_config_path: str = "/Users/katelouie/code/arcanum/backend/spreads-config.json",
    style: str = "comprehensive"
):
    """Display complete context string for a reading"""
    
    print("🔮 Tarot Reading Context String Generator")
    print("=" * 60)
    
    # Initialize the context builder
    builder = ContextStringBuilder(
        cards_json_path=cards_json_path,
        spreads_config_path=spreads_config_path,
        max_context_length=12000,
        max_context_tokens=4000
    )
    
    print(f"📝 Input Question: \"{question}\"")
    print(f"🃏 Spread: {spread_id}")
    print(f"🎴 Cards:")
    for card_name, is_reversed, position_name in cards_with_positions:
        orientation = "Reversed" if is_reversed else "Upright"
        print(f"   • {position_name}: {card_name} ({orientation})")
    print()
    
    try:
        # Build complete context
        context_string, reading_context = builder.build_complete_context_for_reading(
            question, spread_id, cards_with_positions, style=style
        )
        
        print("📊 GENERATED CONTEXT STRING:")
        print("=" * 80)
        print(context_string)
        print("=" * 80)
        
        # Get statistics
        token_stats = builder.get_token_stats(context_string)
        
        print(f"\n📈 Context Statistics:")
        print(f"   • Total Length: {len(context_string):,} characters")
        print(f"   • Token Count: {token_stats.context_tokens:,} tokens")
        print(f"   • Tokens/Char Ratio: {token_stats.tokens_per_char:.3f}")
        print(f"   • Est. GPT-4 Input Cost: ${token_stats.estimated_cost_gpt4:.4f}")
        print(f"   • Est. Claude Input Cost: ${token_stats.estimated_cost_claude:.4f}")
        print(f"   • Context Completeness: {reading_context.context_completeness:.1%}")
        print(f"   • Question Type: {reading_context.question_type.value}")
        print(f"   • Question Confidence: {reading_context.question_confidence:.2f}")
        print(f"   • Position Meanings Found: {len(reading_context.position_meanings)}/{len(reading_context.cards)}")
        print(f"   • Question Contexts Found: {len(reading_context.question_contexts)}/{len(reading_context.cards)}")
        
        return context_string, reading_context, token_stats
        
    except Exception as e:
        print(f"❌ Error generating context: {e}")
        return None, None, None

def main():
    """Main function with example readings"""
    
    print("🎯 Example Context String Generation")
    print("=" * 60)
    
    # Example 1: Love relationship reading (3-card spread)
    example_readings = [
        {
            "name": "Love Relationship Reading",
            "question": "How can I improve my relationship with my partner?",
            "spread_id": "past-present-future",
            "cards": [
                ("The Fool", False, "Past"),
                ("Two of Cups", True, "Present"),
                ("The Sun", False, "Future")
            ]
        },
        {
            "name": "Career Decision Reading", 
            "question": "Should I accept this new job offer?",
            "spread_id": "situation-action-outcome",
            "cards": [
                ("Eight of Pentacles", False, "Situation"),
                ("The Magician", False, "Action"),
                ("Ten of Pentacles", False, "Outcome")
            ]
        },
        {
            "name": "Personal Growth Reading",
            "question": "What do I need to focus on for spiritual growth?",
            "spread_id": "past-present-future",
            "cards": [
                ("The Hermit", False, "Past"),
                ("Death", True, "Present"),
                ("The Star", False, "Future")
            ]
        }
    ]
    
    for i, reading in enumerate(example_readings, 1):
        print(f"\n{'='*80}")
        print(f"EXAMPLE READING #{i}: {reading['name']}")
        print(f"{'='*80}")
        
        context_string, reading_context, token_stats = display_context_for_reading(
            question=reading["question"],
            spread_id=reading["spread_id"],
            cards_with_positions=reading["cards"]
        )
        
        if i < len(example_readings):
            print(f"\n⏸️  Continuing to Example #{i+1}...")

def custom_reading():
    """Interactive mode for custom readings"""
    print("\n🔧 Custom Reading Mode")
    print("-" * 40)
    
    question = input("Enter your question: ").strip()
    if not question:
        question = "What guidance do I need right now?"
    
    spread_id = input("Enter spread ID (or press Enter for 'past-present-future'): ").strip()
    if not spread_id:
        spread_id = "past-present-future"
    
    print("\nEnter cards (format: card_name, reversed(y/n), position):")
    print("Example: The Fool, n, Past")
    
    cards = []
    for i in range(3):  # Assuming 3-card spread
        positions = ["Past", "Present", "Future"] if spread_id == "past-present-future" else [f"Position {i+1}"]
        default_pos = positions[i] if i < len(positions) else f"Position {i+1}"
        
        card_input = input(f"Card {i+1}: ").strip()
        if not card_input:
            break
            
        try:
            parts = [p.strip() for p in card_input.split(',')]
            card_name = parts[0]
            is_reversed = parts[1].lower() == 'y' if len(parts) > 1 else False
            position_name = parts[2] if len(parts) > 2 else default_pos
            cards.append((card_name, is_reversed, position_name))
        except:
            print(f"Invalid format, skipping card {i+1}")
    
    if cards:
        display_context_for_reading(question, spread_id, cards)
    else:
        print("No valid cards entered.")

if __name__ == "__main__":
    # Check if we should run examples or custom
    if len(sys.argv) > 1 and sys.argv[1] == "--custom":
        custom_reading()
    else:
        main()
        
        # Offer custom reading option
        custom_opt = input(f"\n🤔 Would you like to try a custom reading? (y/n): ").lower()
        if custom_opt == 'y':
            custom_reading()