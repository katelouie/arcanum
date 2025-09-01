#!/usr/bin/env python3
"""
Training Context String Generator

Generates context strings for all planned training readings from JSON files
and saves them as markdown files for reference in the dev training data area.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple

# Add backend services path
sys.path.append('/Users/katelouie/code/arcanum/backend/services')

from context_string_builder import ContextStringBuilder

def load_training_readings(readings_common_path: str, readings_special_path: str) -> List[Dict[str, Any]]:
    """Load all training readings from JSON files"""
    all_readings = []
    
    # Load common readings
    with open(readings_common_path, 'r', encoding='utf-8') as f:
        common_data = json.load(f)
        all_readings.extend(common_data['tarot_reading_dataset']['readings'])
    
    # Load special readings
    with open(readings_special_path, 'r', encoding='utf-8') as f:
        special_data = json.load(f)
        all_readings.extend(special_data['custom_spreads'])
    
    print(f"📚 Loaded {len(all_readings)} total readings")
    return all_readings

def convert_reading_to_context_format(reading: Dict[str, Any]) -> Tuple[str, str, List[Tuple[str, bool, str]]]:
    """Convert reading JSON to context builder format"""
    question = reading['question']
    spread_id = reading['spread_id']
    
    # Convert cards format
    cards_with_positions = []
    for card in reading['cards']:
        card_name = card['card_name']
        is_reversed = card['orientation'].lower() == 'reversed'
        position_name = card['position_name']
        cards_with_positions.append((card_name, is_reversed, position_name))
    
    return question, spread_id, cards_with_positions

def generate_context_for_reading(
    reading: Dict[str, Any],
    context_builder: ContextStringBuilder
) -> Tuple[str, Dict[str, Any]]:
    """Generate context string for a single reading"""
    
    try:
        # Convert to context builder format
        question, spread_id, cards_with_positions = convert_reading_to_context_format(reading)
        
        # Generate context string
        context_string, reading_context = context_builder.build_complete_context_for_reading(
            question, spread_id, cards_with_positions, style="comprehensive"
        )
        
        # Get statistics
        token_stats = context_builder.get_token_stats(context_string)
        
        # Create metadata
        metadata = {
            'reading_id': reading['reading_id'],
            'spread_name': reading['spread_name'],
            'question_category': reading['question_category'],
            'question': question,
            'cards_count': len(cards_with_positions),
            'context_length': len(context_string),
            'context_tokens': token_stats.context_tokens,
            'context_completeness': reading_context.context_completeness,
            'question_type': reading_context.question_type.value,
            'question_confidence': reading_context.question_confidence
        }
        
        return context_string, metadata
        
    except Exception as e:
        print(f"❌ Error generating context for {reading['reading_id']}: {e}")
        return None, None

def create_context_markdown(
    reading_id: str,
    context_string: str,
    metadata: Dict[str, Any],
    output_dir: Path
) -> str:
    """Create markdown file with context string and metadata"""
    
    markdown_content = f"""# Context String for {reading_id}

**Reading Information:**
- **Reading ID:** {metadata['reading_id']}
- **Spread:** {metadata['spread_name']}
- **Question Category:** {metadata['question_category']}
- **Cards Count:** {metadata['cards_count']}

**Question:**
> {metadata['question']}

**Context Statistics:**
- **Length:** {metadata['context_length']:,} characters
- **Tokens:** {metadata['context_tokens']:,}
- **Completeness:** {metadata['context_completeness']:.1%}
- **Question Type:** {metadata['question_type']} (confidence: {metadata['question_confidence']:.2f})

---

## Generated Context String

```
{context_string}
```

---

*Generated for training data reference*
"""
    
    # Write to file
    output_file = output_dir / f"{reading_id}_context.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    return str(output_file)

def main():
    """Main execution function"""
    print("🎯 Training Context String Generator")
    print("=" * 60)
    
    # Paths
    readings_common_path = "/Users/katelouie/code/arcanum/llm/tuning_data/readings/readings_common.json"
    readings_special_path = "/Users/katelouie/code/arcanum/llm/tuning_data/readings/readings_special.json"
    cards_json_path = "/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json"
    spreads_config_path = "/Users/katelouie/code/arcanum/backend/spreads-config.json"
    
    # Output directory
    output_dir = Path("/Users/katelouie/code/arcanum/llm/tuning_data/context_strings")
    output_dir.mkdir(exist_ok=True)
    
    # Initialize context builder
    print("🔧 Initializing context string builder...")
    context_builder = ContextStringBuilder(
        cards_json_path=cards_json_path,
        spreads_config_path=spreads_config_path,
        max_context_length=12000,
        max_context_tokens=4000
    )
    
    # Load all readings
    print("📖 Loading training readings...")
    all_readings = load_training_readings(readings_common_path, readings_special_path)
    
    # Generate context strings
    print("🔄 Generating context strings...")
    generated_files = []
    failed_readings = []
    total_tokens = 0
    
    for i, reading in enumerate(all_readings, 1):
        reading_id = reading['reading_id']
        print(f"   [{i:2d}/{len(all_readings)}] Processing {reading_id}...")
        
        context_string, metadata = generate_context_for_reading(reading, context_builder)
        
        if context_string and metadata:
            # Create markdown file
            output_file = create_context_markdown(
                reading_id, context_string, metadata, output_dir
            )
            generated_files.append(output_file)
            total_tokens += metadata['context_tokens']
            print(f"       ✅ Generated {len(context_string):,} chars, {metadata['context_tokens']:,} tokens")
        else:
            failed_readings.append(reading_id)
            print(f"       ❌ Failed to generate context")
    
    # Summary
    print(f"\n📊 Generation Summary:")
    print(f"   ✅ Successfully generated: {len(generated_files)}")
    print(f"   ❌ Failed: {len(failed_readings)}")
    print(f"   📁 Output directory: {output_dir}")
    print(f"   🔢 Total tokens: {total_tokens:,}")
    print(f"   💰 Estimated training cost: ${(total_tokens * 2) / 1000 * 0.008:.2f} (rough estimate)")
    
    if failed_readings:
        print(f"\n⚠️  Failed readings: {', '.join(failed_readings)}")
    
    # Create index file
    create_index_file(generated_files, output_dir, len(all_readings), total_tokens)
    
    print(f"\n🎉 Context string generation complete!")
    print(f"💡 Files saved to: {output_dir}")

def create_index_file(generated_files: List[str], output_dir: Path, total_readings: int, total_tokens: int):
    """Create an index file listing all generated context strings"""
    
    index_content = f"""# Training Data Context Strings Index

This directory contains context strings generated for all {total_readings} planned training readings.

**Statistics:**
- **Total Readings:** {total_readings}
- **Total Context Tokens:** {total_tokens:,}
- **Average Tokens per Reading:** {total_tokens // total_readings:,}

## Generated Files

"""
    
    # Sort files by reading ID
    sorted_files = sorted(generated_files)
    
    for file_path in sorted_files:
        filename = Path(file_path).name
        reading_id = filename.replace('_context.md', '')
        index_content += f"- [{reading_id}]({filename})\n"
    
    index_content += f"""
---

## Usage in Dev Training Data Area

These context string files are referenced in the dev training data area to show exactly what context is sent to the model for each reading. This helps with:

1. **Training Data Validation** - Verify context completeness and accuracy
2. **Token Counting** - Monitor context size for training efficiency  
3. **Context Debugging** - Troubleshoot context generation issues
4. **Training Analysis** - Understand what information the model receives

To use these in the frontend, update the dev training data component to load and display the corresponding context file for each reading.

*Generated automatically by training_context_generator.py*
"""
    
    # Write index file
    index_file = output_dir / "README.md"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(index_content)
    
    print(f"📋 Created index file: {index_file}")

if __name__ == "__main__":
    main()