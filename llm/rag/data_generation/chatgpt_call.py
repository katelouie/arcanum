#!/usr/bin/env python3
"""
Complete Tarot Card Generation Script
Uses OpenAI Responses API with saved playground prompt
"""

import json
import os
import time
import re
from pathlib import Path
from datetime import datetime
from openai import OpenAI
from tqdm import tqdm

# Your card list
TAROT_CARDS = [
    # Major Arcana
    {"name": "The Fool", "number": 0, "suit": "major_arcana"},
    {"name": "The Magician", "number": 1, "suit": "major_arcana"},
    {"name": "The High Priestess", "number": 2, "suit": "major_arcana"},
    {"name": "The Empress", "number": 3, "suit": "major_arcana"},
    {"name": "The Emperor", "number": 4, "suit": "major_arcana"},
    {"name": "The Hierophant", "number": 5, "suit": "major_arcana"},
    {"name": "The Lovers", "number": 6, "suit": "major_arcana"},
    {"name": "The Chariot", "number": 7, "suit": "major_arcana"},
    {"name": "Strength", "number": 8, "suit": "major_arcana"},
    {"name": "The Hermit", "number": 9, "suit": "major_arcana"},
    {"name": "Wheel of Fortune", "number": 10, "suit": "major_arcana"},
    {"name": "Justice", "number": 11, "suit": "major_arcana"},
    {"name": "The Hanged Man", "number": 12, "suit": "major_arcana"},
    {"name": "Death", "number": 13, "suit": "major_arcana"},
    {"name": "Temperance", "number": 14, "suit": "major_arcana"},
    {"name": "The Devil", "number": 15, "suit": "major_arcana"},
    {"name": "The Tower", "number": 16, "suit": "major_arcana"},
    {"name": "The Star", "number": 17, "suit": "major_arcana"},
    {"name": "The Moon", "number": 18, "suit": "major_arcana"},
    {"name": "The Sun", "number": 19, "suit": "major_arcana"},
    {"name": "Judgement", "number": 20, "suit": "major_arcana"},
    {"name": "The World", "number": 21, "suit": "major_arcana"},
    # Cups
    {"name": "Ace of Cups", "number": 1, "suit": "cups"},
    {"name": "Two of Cups", "number": 2, "suit": "cups"},
    {"name": "Three of Cups", "number": 3, "suit": "cups"},
    {"name": "Four of Cups", "number": 4, "suit": "cups"},
    {"name": "Five of Cups", "number": 5, "suit": "cups"},
    {"name": "Six of Cups", "number": 6, "suit": "cups"},
    {"name": "Seven of Cups", "number": 7, "suit": "cups"},
    {"name": "Eight of Cups", "number": 8, "suit": "cups"},
    {"name": "Nine of Cups", "number": 9, "suit": "cups"},
    {"name": "Ten of Cups", "number": 10, "suit": "cups"},
    {"name": "Page of Cups", "number": 11, "suit": "cups"},
    {"name": "Knight of Cups", "number": 12, "suit": "cups"},
    {"name": "Queen of Cups", "number": 13, "suit": "cups"},
    {"name": "King of Cups", "number": 14, "suit": "cups"},
    # Wands
    {"name": "Ace of Wands", "number": 1, "suit": "wands"},
    {"name": "Two of Wands", "number": 2, "suit": "wands"},
    {"name": "Three of Wands", "number": 3, "suit": "wands"},
    {"name": "Four of Wands", "number": 4, "suit": "wands"},
    {"name": "Five of Wands", "number": 5, "suit": "wands"},
    {"name": "Six of Wands", "number": 6, "suit": "wands"},
    {"name": "Seven of Wands", "number": 7, "suit": "wands"},
    {"name": "Eight of Wands", "number": 8, "suit": "wands"},
    {"name": "Nine of Wands", "number": 9, "suit": "wands"},
    {"name": "Ten of Wands", "number": 10, "suit": "wands"},
    {"name": "Page of Wands", "number": 11, "suit": "wands"},
    {"name": "Knight of Wands", "number": 12, "suit": "wands"},
    {"name": "Queen of Wands", "number": 13, "suit": "wands"},
    {"name": "King of Wands", "number": 14, "suit": "wands"},
    # Swords
    {"name": "Ace of Swords", "number": 1, "suit": "swords"},
    {"name": "Two of Swords", "number": 2, "suit": "swords"},
    {"name": "Three of Swords", "number": 3, "suit": "swords"},
    {"name": "Four of Swords", "number": 4, "suit": "swords"},
    {"name": "Five of Swords", "number": 5, "suit": "swords"},
    {"name": "Six of Swords", "number": 6, "suit": "swords"},
    {"name": "Seven of Swords", "number": 7, "suit": "swords"},
    {"name": "Eight of Swords", "number": 8, "suit": "swords"},
    {"name": "Nine of Swords", "number": 9, "suit": "swords"},
    {"name": "Ten of Swords", "number": 10, "suit": "swords"},
    {"name": "Page of Swords", "number": 11, "suit": "swords"},
    {"name": "Knight of Swords", "number": 12, "suit": "swords"},
    {"name": "Queen of Swords", "number": 13, "suit": "swords"},
    {"name": "King of Swords", "number": 14, "suit": "swords"},
    # Pentacles
    {"name": "Ace of Pentacles", "number": 1, "suit": "pentacles"},
    {"name": "Two of Pentacles", "number": 2, "suit": "pentacles"},
    {"name": "Three of Pentacles", "number": 3, "suit": "pentacles"},
    {"name": "Four of Pentacles", "number": 4, "suit": "pentacles"},
    {"name": "Five of Pentacles", "number": 5, "suit": "pentacles"},
    {"name": "Six of Pentacles", "number": 6, "suit": "pentacles"},
    {"name": "Seven of Pentacles", "number": 7, "suit": "pentacles"},
    {"name": "Eight of Pentacles", "number": 8, "suit": "pentacles"},
    {"name": "Nine of Pentacles", "number": 9, "suit": "pentacles"},
    {"name": "Ten of Pentacles", "number": 10, "suit": "pentacles"},
    {"name": "Page of Pentacles", "number": 11, "suit": "pentacles"},
    {"name": "Knight of Pentacles", "number": 12, "suit": "pentacles"},
    {"name": "Queen of Pentacles", "number": 13, "suit": "pentacles"},
    {"name": "King of Pentacles", "number": 14, "suit": "pentacles"},
]


def create_card_filename(card_name, suit, number):
    """Create a consistent filename for each card using suit prefixes and numbers"""
    suit_prefixes = {
        "major_arcana": "m",
        "cups": "c",
        "wands": "w",
        "swords": "s",
        "pentacles": "p",
    }

    prefix = suit_prefixes.get(suit, "x")  # 'x' as fallback

    # Format number with leading zero
    if suit == "major_arcana":
        # Major arcana: m00 to m21
        number_str = f"{number:02d}"
    else:
        # Minor arcana: 01 to 14 (Ace=1, Page=11, Knight=12, Queen=13, King=14)
        number_str = f"{number:02d}"

    return f"{prefix}{number_str}.json"


def clean_json_output(text):
    """Clean the API output to extract valid JSON"""
    # Remove any markdown formatting
    text = text.strip()

    # Remove ```json and ``` if present
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


def generate_all_cards():
    """Main generation function with progress tracking"""

    # Setup
    client = OpenAI()
    output_dir = Path("generated_cards")
    output_dir.mkdir(exist_ok=True)

    # Check for existing files (resume functionality)
    existing_cards = []
    for card in TAROT_CARDS:
        filename = create_card_filename(card["name"], card["suit"], card["number"])
        if (output_dir / filename).exists():
            existing_cards.append(card["name"])

    # Progress tracking
    total_cards = len(TAROT_CARDS)
    successful_cards = existing_cards.copy()  # Start with existing cards
    failed_cards = []
    start_time = time.time()

    print(f"🃏 Starting generation of {total_cards} tarot cards...")
    print(f"📁 Output directory: {output_dir.absolute()}")
    print(f"📋 Found {len(existing_cards)} existing cards")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 80)

    # Test with first few cards (change this to TAROT_CARDS for full run)
    test_cards = TAROT_CARDS  # Start with 5 cards for testing

    # Only generate cards that don't already exist
    cards_to_generate = [c for c in test_cards if c["name"] not in existing_cards]

    if not cards_to_generate:
        print("✅ All cards already exist!")
        return

    print(f"🎯 Generating {len(cards_to_generate)} remaining cards")
    print("-" * 80)

    # Create progress bar with tqdm
    progress_bar = tqdm(
        cards_to_generate,
        desc="Generating cards",
        unit="card",
        bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]",
    )

    for card in progress_bar:
        card_name = card["name"]
        card_start_time = time.time()

        # Update progress bar description
        progress_bar.set_description(f"Processing: {card_name[:20]}")

        try:
            # Generate the card
            response = client.responses.create(
                prompt={
                    "id": "pmpt_689c37d3b3848196ab767e44015cf6350d91a321f1c7115c",
                    "version": "8",
                    "variables": {"card_name": card_name},
                }
            )

            # Clean and parse the JSON
            raw_output = response.output_text
            cleaned_json = clean_json_output(raw_output)

            # Validate JSON
            try:
                card_data = json.loads(cleaned_json)
            except json.JSONDecodeError as e:
                tqdm.write(f"❌ JSON parse error for {card_name}: {e}")
                tqdm.write(f"Raw output preview: {raw_output[:200]}...")
                failed_cards.append(card_name)
                continue

            # Create filename and save
            filename = create_card_filename(card_name, card["suit"], card["number"])
            filepath = output_dir / filename

            # Add metadata
            card_data["_metadata"] = {
                "generated_at": datetime.now().isoformat(),
                "card_info": card,
                "filename": filename,
            }

            # Save to file
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(card_data, f, indent=2, ensure_ascii=False)

            successful_cards.append(card_name)

            # Show timing for this card
            card_time = time.time() - card_start_time
            tqdm.write(f"✅ {card_name} completed in {card_time:.1f}s")

            # Rate limiting - reduced delay
            if card != cards_to_generate[-1]:  # Don't wait after the last card
                time.sleep(1)  # Reduced from 3 seconds to 1 second

        except Exception as e:
            tqdm.write(f"❌ Error generating {card_name}: {e}")
            failed_cards.append(card_name)
            continue

    # Close progress bar
    progress_bar.close()

    # Final progress update
    print()  # New line after progress bar

    # Generate summary
    print("\n" + "=" * 80)
    print("🎯 GENERATION COMPLETE!")
    print("=" * 80)
    print(f"✅ Successful: {len(successful_cards)} cards")
    print(f"❌ Failed: {len(failed_cards)} cards")
    print(f"⏰ Total time: {(time.time() - start_time) / 60:.1f} minutes")

    if successful_cards:
        print(f"\n📂 Files saved in: {output_dir.absolute()}")
        print("✅ Successfully generated:")
        for card in successful_cards:
            card_info = next(c for c in TAROT_CARDS if c["name"] == card)
            filename = create_card_filename(
                card, card_info["suit"], card_info["number"]
            )
            print(f"   • {card} → {filename}")

    if failed_cards:
        print(f"\n❌ Failed cards:")
        for card in failed_cards:
            print(f"   • {card}")

    # Create combined file
    if successful_cards:
        print(f"\n📦 Creating combined file...")
        combined_data = {}

        for card_name in successful_cards:
            # Find the original card info
            card_info = next(c for c in TAROT_CARDS if c["name"] == card_name)
            filename = create_card_filename(
                card_name, card_info["suit"], card_info["number"]
            )
            filepath = output_dir / filename

            with open(filepath, "r", encoding="utf-8") as f:
                card_data = json.load(f)
                # Use card_id as key, or create one if missing
                card_id = card_data.get("card_id", filename.replace(".json", ""))
                combined_data[card_id] = card_data

        # Save combined file
        combined_path = output_dir / "all_cards.json"
        with open(combined_path, "w", encoding="utf-8") as f:
            json.dump(combined_data, f, indent=2, ensure_ascii=False)

        print(f"📦 Combined file: {combined_path}")

    print(f"\n🎉 Generation complete! Check {output_dir} for your files.")


if __name__ == "__main__":
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Please set your OPENAI_API_KEY environment variable")
        print("   export OPENAI_API_KEY='your-api-key-here'")
        exit(1)

    generate_all_cards()
