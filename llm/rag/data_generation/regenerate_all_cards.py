#!/usr/bin/env python3
"""
Regenerate all_cards.json from individual card files after transformation
"""

import json
import os
from pathlib import Path

def regenerate_all_cards():
    """Regenerate the all_cards.json file from individual card files"""
    
    cards_dir = Path("/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards")
    all_cards_path = cards_dir / "all_cards.json"
    
    print("🔄 Regenerating all_cards.json from individual card files")
    print("=" * 60)
    
    # Find all card files
    card_files = []
    for pattern in ["m*.json", "c*.json", "p*.json", "s*.json", "w*.json"]:
        card_files.extend(cards_dir.glob(pattern))
    
    # Sort the files for consistent ordering
    card_files = sorted(card_files)
    
    print(f"📁 Found {len(card_files)} individual card files")
    
    # Load all card data
    all_cards_data = {}
    
    for card_file in card_files:
        if card_file.name == "all_cards.json":
            continue
            
        try:
            with open(card_file, 'r', encoding='utf-8') as f:
                card_data = json.load(f)
            
            card_id = card_data.get("card_id")
            if card_id:
                all_cards_data[card_id] = card_data
                print(f"✅ Loaded: {card_file.name} -> {card_id}")
            else:
                print(f"⚠️  No card_id found in: {card_file.name}")
                
        except Exception as e:
            print(f"❌ Error loading {card_file.name}: {e}")
    
    print(f"\n📊 Total cards loaded: {len(all_cards_data)}")
    
    # Save the compiled file
    try:
        with open(all_cards_path, 'w', encoding='utf-8') as f:
            json.dump(all_cards_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully regenerated: {all_cards_path}")
        print(f"📦 File size: {all_cards_path.stat().st_size / 1024:.1f} KB")
        
        # Verify the new structure
        with open(all_cards_path, 'r', encoding='utf-8') as f:
            sample_data = json.load(f)
        
        # Check if The Fool has the new card_relationships structure
        fool_data = sample_data.get("the_fool", {})
        if "card_relationships" in fool_data:
            print("✅ New card_relationships structure verified!")
            relationships = fool_data["card_relationships"]
            print(f"   Relationship types: {list(relationships.keys())}")
            if "amplifies" in relationships:
                print(f"   Amplifies: {list(relationships['amplifies'].keys())}")
        else:
            print("⚠️  Warning: card_relationships structure not found!")
            
    except Exception as e:
        print(f"❌ Error saving all_cards.json: {e}")

if __name__ == "__main__":
    regenerate_all_cards()