#!/usr/bin/env python3
"""
Story Builder Script for Arcanum

Compiles Ink stories from ink/ directory to JSON files in frontend/public/stories/

Usage:
    python build_stories.py                    # Build all .ink files
    python build_stories.py sarah              # Build only sarah.ink
    python build_stories.py sarah demo         # Build sarah.ink and demo.ink
"""

import os
import sys
import subprocess
import glob
from pathlib import Path

def get_ink_files():
    """Get all .ink files in the ink/ directory"""
    ink_dir = Path("ink")
    if not ink_dir.exists():
        print("❌ Error: ink/ directory not found")
        return []

    ink_files = list(ink_dir.glob("*.ink"))
    return [f.stem for f in ink_files]  # Return just the names without extension

def compile_story(story_name):
    """Compile a single story from .ink to .json"""
    ink_file = Path(f"ink/{story_name}.ink")
    output_dir = Path("frontend/public/stories")
    output_file = output_dir / f"{story_name}.json"

    # Check if ink file exists
    if not ink_file.exists():
        print(f"❌ Error: {ink_file} not found")
        return False

    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)

    # Run inklecate compiler
    try:
        print(f"🔨 Compiling {story_name}.ink...")
        result = subprocess.run([
            "inklecate",
            "-o", str(output_file),
            str(ink_file)
        ], capture_output=True, text=True)

        if result.returncode == 0:
            print(f"✅ Successfully compiled {story_name}.ink → {output_file}")

            # Show any warnings
            if result.stderr and "WARNING" in result.stderr:
                warnings = [line for line in result.stderr.split('\n') if 'WARNING' in line]
                for warning in warnings:
                    print(f"⚠️  {warning}")

            return True
        else:
            print(f"❌ Failed to compile {story_name}.ink")
            if result.stderr:
                print(f"Error: {result.stderr}")
            return False

    except FileNotFoundError:
        print("❌ Error: inklecate not found. Please install inklecate:")
        print("   npm install -g inklecate")
        return False
    except Exception as e:
        print(f"❌ Error compiling {story_name}.ink: {e}")
        return False

def main():
    """Main function"""
    print("📚 Arcanum Story Builder")
    print("=" * 40)

    # Check if we're in the right directory
    if not Path("ink").exists():
        print("❌ Error: Please run this script from the project root directory")
        sys.exit(1)

    # Get available stories
    available_stories = get_ink_files()

    if not available_stories:
        print("❌ No .ink files found in ink/ directory")
        sys.exit(1)

    print(f"📂 Found {len(available_stories)} story files: {', '.join(available_stories)}")

    # Determine which stories to build
    if len(sys.argv) == 1:
        # No arguments - build all stories
        stories_to_build = available_stories
        print(f"🔨 Building all {len(stories_to_build)} stories...")
    else:
        # Specific stories requested
        requested_stories = sys.argv[1:]
        stories_to_build = []

        for story in requested_stories:
            if story in available_stories:
                stories_to_build.append(story)
            else:
                print(f"❌ Warning: {story}.ink not found, skipping...")

        if not stories_to_build:
            print("❌ No valid stories to build")
            sys.exit(1)

        print(f"🔨 Building {len(stories_to_build)} stories: {', '.join(stories_to_build)}")

    # Build the stories
    print()
    successful = 0
    failed = 0

    for story in stories_to_build:
        if compile_story(story):
            successful += 1
        else:
            failed += 1

    # Summary
    print()
    print("=" * 40)
    print(f"📊 Build Summary:")
    print(f"   ✅ Successful: {successful}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📁 Output: frontend/public/stories/")

    if failed > 0:
        sys.exit(1)
    else:
        print("🎉 All stories built successfully!")

if __name__ == "__main__":
    main()