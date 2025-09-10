"""
MLX Model Service with Hot-swapping Support

Manages loading, switching, and inference with MLX models for tarot reading generation.
Provides thread-safe model management with configurable model loading.
"""

import threading
import time
import os
import json
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from pathlib import Path

# Optional MLX imports with fallback for development
try:
    import mlx.core as mx
    import mlx.nn as nn
    from mlx_lm import load, generate

    MLX_AVAILABLE = True
except ImportError:
    MLX_AVAILABLE = False
    print("⚠️  MLX not available - running in mock mode")


@dataclass
class ModelInfo:
    """Information about an available model"""

    id: str
    name: str
    path: str
    description: str
    parameters: str
    type: str  # "local", "huggingface", "custom"
    loaded: bool = False
    load_time: Optional[float] = None
    memory_usage: Optional[int] = None


@dataclass
class InferenceRequest:
    """Request for model inference"""

    system_prompt: str
    user_prompt: str
    max_tokens: int = 2000
    temperature: float = 0.7
    top_p: float = 0.9
    repetition_penalty: float = 1.1
    stop_sequences: List[str] = None


@dataclass
class InferenceResponse:
    """Response from model inference"""

    text: str
    tokens_generated: int
    inference_time: float
    model_id: str
    timestamp: str


class MockMLXModel:
    """Mock model for development when MLX is not available"""

    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model_name = os.path.basename(model_path)

    def generate(
        self, prompt: str, max_tokens: int = 2000, temperature: float = 0.7, **kwargs
    ) -> str:
        """Generate mock response for development"""
        lines = [
            f"**Mock Reading from {self.model_name}**\n",
            f"*Generated for prompt of {len(prompt)} characters*\n",
            "This reading draws upon the ancient wisdom of the tarot to offer guidance for your question. Each card in your spread carries profound meaning that speaks directly to your current situation.\n",
            "**The energies at play:** The cards you've drawn create a powerful narrative about transformation, growth, and the journey ahead. Pay attention to the symbols and archetypes that resonate most strongly with your inner knowing.\n",
            "**Your path forward:** Trust in the process of change and growth. The universe is conspiring to help you achieve your highest good, even when the path seems unclear.\n",
            "**Final wisdom:** Remember that tarot offers guidance, not destiny. You always retain the power to shape your future through conscious choice and intentional action.\n",
            f"\n*This was a mock response generated at {time.strftime('%H:%M:%S')} for testing purposes.*",
        ]

        # Simulate processing time
        time.sleep(0.5 + len(prompt) / 10000)  # Longer prompts take more time

        return "".join(lines)


class MLXModelService:
    """Service for managing MLX models with hot-swapping capability"""

    def __init__(self, models_directory: str = "/Users/katelouie/code/arcanum/models"):
        self.models_directory = Path(models_directory)
        self.models_directory.mkdir(exist_ok=True)

        # Thread safety
        self._lock = threading.RLock()
        self._current_model = None
        self._current_model_id = None
        self._available_models: Dict[str, ModelInfo] = {}
        self._loading = False

        # Configuration
        self.default_model_id = None

        # Initialize logger
        self.logger = logging.getLogger(__name__)

        # Discover available models
        self._discover_models()

    def _discover_models(self):
        """Discover available models in the models directory and Hugging Face cache"""
        with self._lock:
            self._available_models = {}

            # Default mock model
            mock_model = ModelInfo(
                id="mock-tarot-model",
                name="Mock Tarot Model (Development)",
                path="mock://development",
                description="Mock model for development and testing",
                parameters="N/A (Mock)",
                type="mock",
                loaded=False,
            )
            self._available_models[mock_model.id] = mock_model

            # Scan for actual models if MLX is available
            if MLX_AVAILABLE:
                # Scan local models directory
                if self.models_directory.exists():
                    for model_dir in self.models_directory.iterdir():
                        if model_dir.is_dir():
                            config_file = model_dir / "config.json"
                            if config_file.exists():
                                try:
                                    with open(config_file) as f:
                                        config = json.load(f)

                                    model_info = ModelInfo(
                                        id=model_dir.name,
                                        name=config.get("name", model_dir.name),
                                        path=str(model_dir),
                                        description=config.get("description", ""),
                                        parameters=config.get("parameters", "Unknown"),
                                        type="local",
                                        loaded=False,
                                    )
                                    self._available_models[model_info.id] = model_info

                                except Exception as e:
                                    self.logger.warning(
                                        f"Could not load model config from {config_file}: {e}"
                                    )

                # Scan Hugging Face cache for MLX models
                self._discover_huggingface_models()

            # Set default model
            if not self.default_model_id and self._available_models:
                self.default_model_id = list(self._available_models.keys())[0]

    def _discover_huggingface_models(self):
        """Discover MLX models in Hugging Face cache"""
        hf_cache_dir = Path.home() / ".cache/huggingface/hub"

        if not hf_cache_dir.exists():
            return

        try:
            # Look for MLX community models
            for model_dir in hf_cache_dir.glob("models--mlx-community--*"):
                if model_dir.is_dir():
                    # Extract model name from directory
                    model_name = model_dir.name.replace("models--mlx-community--", "")

                    # Look for the actual model files in snapshots
                    snapshots_dir = model_dir / "snapshots"
                    if snapshots_dir.exists():
                        # Find the latest snapshot (most recent directory)
                        snapshots = sorted(
                            snapshots_dir.iterdir(),
                            key=lambda x: x.stat().st_mtime,
                            reverse=True,
                        )
                        if snapshots:
                            latest_snapshot = snapshots[0]
                            config_file = latest_snapshot / "config.json"

                            # Check if this looks like an MLX model
                            if config_file.exists():
                                try:
                                    with open(config_file) as f:
                                        config = json.load(f)

                                    # Determine model parameters from config
                                    hidden_size = config.get("hidden_size", "Unknown")
                                    num_layers = config.get(
                                        "num_hidden_layers", "Unknown"
                                    )
                                    vocab_size = config.get("vocab_size", "Unknown")

                                    # Estimate parameters (rough calculation)
                                    if isinstance(hidden_size, int) and isinstance(
                                        num_layers, int
                                    ):
                                        approx_params = (
                                            (hidden_size * num_layers * vocab_size)
                                            // 1_000_000
                                            if isinstance(vocab_size, int)
                                            else "Unknown"
                                        )
                                        param_str = (
                                            f"~{approx_params}M parameters"
                                            if approx_params != "Unknown"
                                            else "Unknown parameters"
                                        )
                                    else:
                                        param_str = "Unknown parameters"

                                    # Add 4-bit quantization info if it's in the name
                                    if "4bit" in model_name.lower():
                                        param_str += " (4-bit quantized)"

                                    model_info = ModelInfo(
                                        id=f"hf-{model_name}",
                                        name=f"{model_name.replace('-', ' ').title()}",
                                        path=str(latest_snapshot),
                                        description=f"MLX Community model from Hugging Face",
                                        parameters=param_str,
                                        type="huggingface",
                                        loaded=False,
                                    )
                                    self._available_models[model_info.id] = model_info

                                except Exception as e:
                                    self.logger.warning(
                                        f"Could not load HF model config from {config_file}: {e}"
                                    )

        except Exception as e:
            self.logger.warning(f"Error scanning Hugging Face cache: {e}")

    def get_available_models(self) -> List[ModelInfo]:
        """Get list of available models"""
        with self._lock:
            return list(self._available_models.values())

    def get_current_model_info(self) -> Optional[ModelInfo]:
        """Get information about currently loaded model"""
        with self._lock:
            if self._current_model_id:
                return self._available_models.get(self._current_model_id)
            return None

    def is_model_loaded(self, model_id: str) -> bool:
        """Check if a model is currently loaded"""
        with self._lock:
            return (
                self._current_model_id == model_id and self._current_model is not None
            )

    def load_model(self, model_id: str) -> bool:
        """Load a specific model (with hot-swapping)"""
        with self._lock:
            # Check if model is already loaded
            if self._current_model_id == model_id and self._current_model is not None:
                return True

            # Check if model exists
            if model_id not in self._available_models:
                raise ValueError(f"Model {model_id} not found")

            model_info = self._available_models[model_id]

            # Set loading flag
            self._loading = True

            try:
                load_start = time.time()

                if model_info.type == "mock":
                    # Load mock model
                    self._current_model = MockMLXModel(model_info.path)

                elif MLX_AVAILABLE and model_info.type in ["local", "huggingface"]:
                    # Load actual MLX model
                    self.logger.info(f"Loading MLX model from {model_info.path}")
                    self._current_model, self._tokenizer = load(model_info.path)

                else:
                    raise RuntimeError("MLX not available for non-mock models")

                load_time = time.time() - load_start

                # Update model info
                model_info.loaded = True
                model_info.load_time = load_time

                # Set as current model
                self._current_model_id = model_id

                self.logger.info(
                    f"Successfully loaded model {model_id} in {load_time:.2f}s"
                )
                return True

            except Exception as e:
                self.logger.error(f"Failed to load model {model_id}: {e}")
                model_info.loaded = False
                return False

            finally:
                self._loading = False

    def unload_model(self):
        """Unload the currently loaded model"""
        with self._lock:
            if self._current_model:
                self.logger.info(f"Unloading model {self._current_model_id}")

                # Clear model references
                self._current_model = None
                if hasattr(self, "_tokenizer"):
                    self._tokenizer = None

                # Update model info
                if self._current_model_id in self._available_models:
                    self._available_models[self._current_model_id].loaded = False

                self._current_model_id = None

    def generate_text(self, request: InferenceRequest) -> InferenceResponse:
        """Generate text using the currently loaded model"""
        with self._lock:
            if not self._current_model:
                if self.default_model_id:
                    if not self.load_model(self.default_model_id):
                        raise RuntimeError(
                            "No model loaded and failed to load default model"
                        )
                else:
                    raise RuntimeError("No model loaded")

            # Prepare the full prompt
            full_prompt = (
                f"{request.system_prompt}\n\nUser: {request.user_prompt}\n\nAssistant:"
            )

            start_time = time.time()

            try:
                if isinstance(self._current_model, MockMLXModel):
                    # Mock model generation
                    response_text = self._current_model.generate(
                        full_prompt,
                        max_tokens=request.max_tokens,
                        temperature=request.temperature,
                    )
                    tokens_generated = len(response_text.split())

                else:
                    # Real MLX model generation using proper MLX sampling
                    from mlx_lm.sample_utils import make_sampler, make_logits_processors

                    # Create sampler for temperature and top_p
                    sampler = make_sampler(
                        temp=request.temperature, top_p=request.top_p
                    )

                    # Create logits processors for repetition penalty
                    logits_processors = make_logits_processors(
                        repetition_penalty=request.repetition_penalty
                    )

                    response_text = generate(
                        model=self._current_model,
                        tokenizer=self._tokenizer,
                        prompt=full_prompt,
                        max_tokens=request.max_tokens,
                        sampler=sampler,
                        logits_processors=logits_processors,
                        verbose=False,
                    )
                    tokens_generated = len(response_text.split())

                inference_time = time.time() - start_time

                return InferenceResponse(
                    text=response_text.strip(),
                    tokens_generated=tokens_generated,
                    inference_time=inference_time,
                    model_id=self._current_model_id,
                    timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
                )

            except Exception as e:
                self.logger.error(f"Generation failed: {e}")
                raise RuntimeError(f"Text generation failed: {e}")

    def add_model(self, model_info: ModelInfo) -> bool:
        """Add a new model to the available models"""
        with self._lock:
            if model_info.id in self._available_models:
                return False  # Model already exists

            self._available_models[model_info.id] = model_info
            return True

    def remove_model(self, model_id: str) -> bool:
        """Remove a model from available models"""
        with self._lock:
            if model_id not in self._available_models:
                return False

            # Unload if currently loaded
            if self._current_model_id == model_id:
                self.unload_model()

            del self._available_models[model_id]
            return True

    def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        with self._lock:
            return {
                "mlx_available": MLX_AVAILABLE,
                "current_model": self._current_model_id,
                "loading": self._loading,
                "available_models": len(self._available_models),
                "models_directory": str(self.models_directory),
                "model_info": [
                    asdict(model) for model in self._available_models.values()
                ],
            }


# Global service instance
_model_service_instance = None


def get_model_service() -> MLXModelService:
    """Get the global model service instance"""
    global _model_service_instance
    if _model_service_instance is None:
        _model_service_instance = MLXModelService()
    return _model_service_instance


def test_model_service():
    """Test the MLX model service"""
    print("🧪 Testing MLX Model Service")
    print("=" * 50)

    service = get_model_service()

    # Show available models
    models = service.get_available_models()
    print(f"Available models: {len(models)}")
    for model in models:
        print(f"  - {model.id}: {model.name} ({model.type})")

    # Load default model
    if models:
        model_id = models[0].id
        print(f"\n📥 Loading model: {model_id}")
        success = service.load_model(model_id)
        print(f"Load success: {success}")

        if success:
            # Test inference
            print(f"\n🔮 Testing inference...")
            request = InferenceRequest(
                system_prompt="You are a wise tarot reader who provides insightful interpretations.",
                user_prompt="The user drew The Fool, The Magician, and The World. What does this mean?",
                max_tokens=300,
            )

            response = service.generate_text(request)
            print(
                f"Response ({response.tokens_generated} tokens in {response.inference_time:.2f}s):"
            )
            print(f"'{response.text[:200]}...'")

    # Show service status
    print(f"\n📊 Service Status:")
    status = service.get_service_status()
    for key, value in status.items():
        if key != "model_info":
            print(f"  {key}: {value}")


if __name__ == "__main__":
    test_model_service()
