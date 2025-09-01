#!/usr/bin/env python3
"""
MLX Tarot Model Download and Test Script
Downloads Qwen2.5-3B-Instruct-4bit and tests it with a tarot reading prompt
"""

import sys
import time
from pathlib import Path


def check_mlx_installation():
    """Check if MLX is installed, install if needed"""
    import subprocess
    import importlib.util
    
    # Check MLX-LM
    if importlib.util.find_spec("mlx_lm") is not None:
        print("✅ MLX-LM is already installed")
        mlx_installed = True
    else:
        print("❌ MLX-LM not found. Installing...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "mlx-lm"])
            print("✅ MLX-LM installed successfully")
            mlx_installed = True
        except subprocess.CalledProcessError:
            print("❌ Failed to install MLX-LM")
            return False
    
    # Check sentencepiece (required for tokenizer)
    if importlib.util.find_spec("sentencepiece") is not None:
        print("✅ SentencePiece is already installed")
    else:
        print("❌ SentencePiece not found. Installing...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "sentencepiece"])
            print("✅ SentencePiece installed successfully")
        except subprocess.CalledProcessError:
            print("❌ Failed to install SentencePiece")
            return False
    
    return mlx_installed


def download_and_test_model():
    """Download model and run test generation"""
    try:
        from mlx_lm.utils import load
        from mlx_lm.generate import generate

        # WORKING Mistral model (closest to Hermes architecture)
        model_name = "mlx-community/Mistral-7B-Instruct-v0.3-4bit"
        
        # Alternative working models:
        # model_name = "mlx-community/Qwen2.5-3B-Instruct-4bit"  # Smaller, very reliable
        
        # Problematic models (tokenizer bugs in MLX):
        # model_name = "mlx-community/Hermes-2-Pro-Mistral-7B-4bit"  # tokenizer index error
        # model_name = "mlx-community/OpenHermes-2.5-Mistral-7B-4bit"  # repo not found
        print(f"\n🔄 Loading model: {model_name}")
        print("(This will download ~2GB on first run - may take a few minutes)")

        # Load model and tokenizer
        start_time = time.time()
        model, tokenizer = load(model_name)
        load_time = time.time() - start_time
        print(f"✅ Model loaded in {load_time:.1f} seconds")

        # Test with a simple tarot reading prompt
        test_prompt = """Please provide a holistic tarot reading interpretation.

Cards drawn: The Fool (Past), Seven of Swords (Present), The Star (Future)
Positions: Past-Present-Future spread
Question: Should I trust my intuition about this new creative project?
Card meanings: [The Fool: new beginnings, innocence, leap of faith] [Seven of Swords: deception, strategy, getting away with something] [The Star: hope, inspiration, spiritual guidance]
Context: Artist considering a major shift in their creative work

Provide a flowing, insightful interpretation that connects these cards thematically:"""

        print(f"\n🔮 Testing with tarot reading prompt...")
        print(f"Prompt: {test_prompt[:100]}...")

        # Generate response
        start_time = time.time()
        print(f"\n🔮 Generating response...")
        
        response = generate(
            model, 
            tokenizer, 
            test_prompt, 
            verbose=True,
            max_tokens=300
        )
        generation_time = time.time() - start_time

        print(f"\n✨ Generated response in {generation_time:.1f} seconds:")
        print("=" * 60)
        print(response)
        print("=" * 60)

        # Test a simple prompt too
        simple_prompt = "What makes a good tarot reading?"
        print(f"\n🔮 Testing simple prompt: '{simple_prompt}'")

        simple_response = generate(
            model, 
            tokenizer, 
            simple_prompt, 
            verbose=True,
            max_tokens=150
        )

        print("\n✨ Simple response:")
        print("-" * 40)
        print(simple_response)
        print("-" * 40)

        print(f"\n🎉 Model test complete! Ready for fine-tuning.")
        print(f"💾 Model cached at: ~/.cache/huggingface/hub/")

        return True

    except Exception as e:
        print(f"❌ Error during model test: {e}")
        return False


def main():
    """Main function"""
    print("🚀 MLX Tarot Model Setup Script")
    print("=" * 50)

    # Check MLX installation
    if not check_mlx_installation():
        print("❌ Setup failed - couldn't install MLX-LM")
        return

    # Download and test model
    if download_and_test_model():
        print("\n✅ Setup complete! Your model is ready.")
        print("\n📝 Next steps:")
        print("1. Prepare your training data in JSONL format")
        print("2. Use mlx_lm.lora for fine-tuning")
        print("3. Test your fine-tuned model")
    else:
        print("❌ Setup failed during model testing")


if __name__ == "__main__":
    main()
