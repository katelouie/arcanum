#!/usr/bin/env python3
"""
Enhanced Training Context String Generator

Handles both regular spreads and special spreads with embedded configurations.
Generates context strings for all planned training readings from JSON files
and saves them as markdown files for reference in the dev training data area.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
import tempfile
import os

# Add backend services path
sys.path.append('/Users/katelouie/code/arcanum/backend/services')

from context_string_builder import ContextStringBuilder

class EnhancedContextGenerator:
    """Enhanced context generator that handles both regular and custom spreads"""
    
    def __init__(self, cards_json_path: str, spreads_config_path: str):
        self.cards_json_path = cards_json_path
        self.spreads_config_path = spreads_config_path
        self.temp_spread_configs = {}  # Store temporary spread configs
        
    def create_temp_spread_config(self, reading: Dict[str, Any]) -> str:
        """Create a temporary spread config file for custom spreads"""
        if 'spread_config' not in reading:
            return self.spreads_config_path  # Use default for regular spreads
            
        spread_config = reading['spread_config']
        spread_id = reading['spread_id']
        
        # Check if we've already created this temp config
        if spread_id in self.temp_spread_configs:
            return self.temp_spread_configs[spread_id]
        
        # Load the base spreads config
        with open(self.spreads_config_path, 'r') as f:
            base_config = json.load(f)
        
        # Add the custom spread to the config
        custom_spread = {
            "id": spread_id,
            "name": spread_config.get("name", "Custom Spread"),
            "description": spread_config.get("description", "Custom spread configuration"),
            "layout": spread_config.get("layout", "custom"),
            "cardSize": spread_config.get("cardSize", "medium"),
            "aspectRatio": spread_config.get("aspectRatio", 1.4),
            "category": spread_config.get("category", "custom"),
            "difficulty": spread_config.get("difficulty", "intermediate"),
            "positions": []
        }
        
        # Convert position format from spread_config to spreads-config format
        for position in spread_config.get("positions", []):
            custom_position = {
                "name": position.get("name", "Unknown"),
                "short_description": position.get("short_description", ""),
                "detailed_description": position.get("detailed_description", ""),
                "keywords": position.get("keywords", []),
                "question_types": {
                    "general": position.get("detailed_description", position.get("short_description", "")),
                    "love": position.get("detailed_description", position.get("short_description", "")),
                    "career": position.get("detailed_description", position.get("short_description", "")),
                    "health": position.get("detailed_description", position.get("short_description", "")),
                    "spiritual": position.get("detailed_description", position.get("short_description", ""))
                }
            }
            custom_spread["positions"].append(custom_position)
        
        # Add to base config
        base_config["spreads"].append(custom_spread)
        
        # Create temporary file
        temp_fd, temp_path = tempfile.mkstemp(suffix='.json', prefix=f'spread_config_{spread_id}_')
        try:
            with os.fdopen(temp_fd, 'w') as temp_file:
                json.dump(base_config, temp_file, indent=2)
            
            self.temp_spread_configs[spread_id] = temp_path
            return temp_path
        except:
            os.close(temp_fd)  # Close if json.dump failed
            raise
    
    def cleanup_temp_files(self):
        """Clean up temporary spread config files"""
        for temp_path in self.temp_spread_configs.values():
            try:
                os.unlink(temp_path)
            except:
                pass
        self.temp_spread_configs.clear()
    
    def generate_context_for_reading(self, reading: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """Generate context string for a reading, handling both regular and custom spreads"""
        
        try:
            # Get the appropriate spreads config (create temp one for custom spreads)
            spreads_config_path = self.create_temp_spread_config(reading)
            
            # Create context builder with appropriate config
            context_builder = ContextStringBuilder(
                cards_json_path=self.cards_json_path,
                spreads_config_path=spreads_config_path,
                max_context_length=12000,
                max_context_tokens=4000
            )
            
            # Convert reading to context builder format
            question = reading['question']
            spread_id = reading['spread_id']
            
            # Convert cards format
            cards_with_positions = []
            for card in reading['cards']:
                card_name = card['card_name']
                is_reversed = card['orientation'].lower() == 'reversed'
                position_name = card['position_name']
                cards_with_positions.append((card_name, is_reversed, position_name))
            
            # Generate context string
            context_string, reading_context = context_builder.build_complete_context_for_reading(
                question, spread_id, cards_with_positions, style="comprehensive"
            )
            
            # Get statistics
            token_stats = context_builder.get_token_stats(context_string)
            
            # Create metadata
            metadata = {
                'reading_id': reading['reading_id'],
                'spread_name': reading.get('spread_name', reading.get('spread_config', {}).get('name', 'Unknown')),
                'question_category': reading['question_category'],
                'question': question,
                'cards_count': len(cards_with_positions),
                'context_length': len(context_string),
                'context_tokens': token_stats.context_tokens,
                'context_completeness': reading_context.context_completeness,
                'question_type': reading_context.question_type.value,
                'question_confidence': reading_context.question_confidence,
                'is_custom_spread': 'spread_config' in reading
            }
            
            return context_string, metadata
            
        except Exception as e:
            print(f"❌ Error generating context for {reading['reading_id']}: {e}")
            return None, None

def load_training_readings_unified(all_readings_path: str) -> List[Dict[str, Any]]:
    """Load all training readings from unified JSON file"""
    with open(all_readings_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        all_readings = data['tarot_reading_dataset']['readings']
    
    print(f"📚 Loaded {len(all_readings)} total readings from unified file")
    return all_readings

def create_context_markdown(
    reading_id: str,
    context_string: str,
    metadata: Dict[str, Any],
    output_dir: Path
) -> str:
    """Create markdown file with context string and metadata"""
    
    spread_type = "Custom Spread" if metadata.get('is_custom_spread') else "Standard Spread"
    
    markdown_content = f"""# Context String for {reading_id}

**Reading Information:**
- **Reading ID:** {metadata['reading_id']}
- **Spread:** {metadata['spread_name']} ({spread_type})
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
    print("🎯 Enhanced Training Context String Generator")
    print("=" * 60)
    
    # Paths
    all_readings_path = "/Users/katelouie/code/arcanum/llm/tuning_data/readings/all_readings.json"
    cards_json_path = "/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json"
    spreads_config_path = "/Users/katelouie/code/arcanum/backend/spreads-config.json"
    
    # Output directory
    output_dir = Path("/Users/katelouie/code/arcanum/llm/tuning_data/context_strings")
    output_dir.mkdir(exist_ok=True)
    
    # Initialize enhanced generator
    print("🔧 Initializing enhanced context string generator...")
    generator = EnhancedContextGenerator(cards_json_path, spreads_config_path)
    
    # Load all readings
    print("📖 Loading training readings...")
    all_readings = load_training_readings_unified(all_readings_path)
    
    # Generate context strings
    print("🔄 Generating context strings...")
    generated_files = []
    failed_readings = []
    total_tokens = 0
    custom_spread_success = 0
    
    try:
        for i, reading in enumerate(all_readings, 1):
            reading_id = reading['reading_id']
            is_custom = 'spread_config' in reading
            spread_type = "Custom" if is_custom else "Standard"
            
            print(f"   [{i:2d}/{len(all_readings)}] Processing {reading_id} ({spread_type})...")
            
            context_string, metadata = generator.generate_context_for_reading(reading)
            
            if context_string and metadata:
                # Create markdown file
                output_file = create_context_markdown(
                    reading_id, context_string, metadata, output_dir
                )
                generated_files.append(output_file)
                total_tokens += metadata['context_tokens']
                
                if is_custom:
                    custom_spread_success += 1
                    
                print(f"       ✅ Generated {len(context_string):,} chars, {metadata['context_tokens']:,} tokens")
            else:
                failed_readings.append(reading_id)
                print(f"       ❌ Failed to generate context")
    
    finally:
        # Clean up temporary files
        generator.cleanup_temp_files()
    
    # Summary
    print(f"\n📊 Enhanced Generation Summary:")
    print(f"   ✅ Successfully generated: {len(generated_files)}")
    print(f"   ❌ Failed: {len(failed_readings)}")
    print(f"   🎨 Custom spreads processed: {custom_spread_success}")
    print(f"   📁 Output directory: {output_dir}")
    print(f"   🔢 Total tokens: {total_tokens:,}")
    print(f"   💰 Estimated training cost: ${(total_tokens * 2) / 1000 * 0.008:.2f} (rough estimate)")
    
    if failed_readings:
        print(f"\n⚠️  Failed readings: {', '.join(failed_readings)}")
    
    # Create index file
    create_index_file(generated_files, output_dir, len(all_readings), total_tokens, custom_spread_success)
    
    print(f"\n🎉 Enhanced context string generation complete!")
    print(f"💡 Files saved to: {output_dir}")

def create_index_file(generated_files: List[str], output_dir: Path, total_readings: int, total_tokens: int, custom_spreads: int):
    """Create an index file listing all generated context strings"""
    
    index_content = f"""# Enhanced Training Data Context Strings Index

This directory contains context strings generated for all {len(generated_files)}/{total_readings} planned training readings, including custom spreads.

**Statistics:**
- **Total Readings:** {total_readings}
- **Successfully Generated:** {len(generated_files)}
- **Custom Spreads Processed:** {custom_spreads}
- **Total Context Tokens:** {total_tokens:,}
- **Average Tokens per Reading:** {total_tokens // len(generated_files) if generated_files else 0:,}

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

## Enhanced Features

This enhanced generator now supports:

1. **Regular Spreads** - Uses spreads-config.json definitions
2. **Custom Spreads** - Uses embedded spread_config from readings
3. **Temporary Configuration** - Creates temporary spread configs for custom spreads
4. **Automatic Cleanup** - Removes temporary files after processing

## Usage in Dev Training Data Area

These context string files are referenced in the dev training data area to show exactly what context is sent to the model for each reading, including custom spreads with their unique position definitions.

*Generated automatically by enhanced_training_context_generator.py*
"""
    
    # Write index file
    index_file = output_dir / "README.md"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(index_content)
    
    print(f"📋 Created enhanced index file: {index_file}")

if __name__ == "__main__":
    main()