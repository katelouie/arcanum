from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from models.api_models import ReadingRequest, ReadingResponse, CardInfo
from models.reading import ReadingService
from models.spreads import (
    SpreadPosition,
    GenericSpread,
    SingleCardSpread,
    ThreeCardSpread,
    CelticCrossSpread,
    FiveCardCrossSpread,
    SevenCardHorseshoeSpread,
    FourCardDecisionSpread,
    SixCardRelationshipSpread,
    TwelveCardSpread,
)
from models.practice_models import (
    StartPracticeRequest,
    StartPracticeResponse,
    SelectSpreadRequest,
    SelectSpreadResponse,
    SubmitInterpretationRequest,
    SubmitInterpretationResponse,
    PracticeHistoryResponse,
    DifficultyLevel,
    ScenarioCategory,
)
from services.practice_service import PracticeService
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
import json
import sys
import os
from datetime import datetime

# Add services directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), "services"))
from reading_generator import TarotReadingGenerator, ReadingRequest as GenReadingRequest
from prompt_engineer import ReadingStyle, ReadingTone
from context_string_builder import ContextStringBuilder
from mlx_model_service import get_model_service, ModelInfo, InferenceRequest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

with open("static/tarot-images.json", "r") as f:
    card_data = json.load(f)


# Load spreads configuration to map spread IDs to spread classes
def create_spread_from_config(
    spread_name: str, positions_config: List[Dict]
) -> GenericSpread:
    """Create a GenericSpread from configuration data with validation"""
    positions = []
    for pos in positions_config:
        if not all(key in pos for key in ["name", "description"]):
            raise ValueError(f"Position missing required fields: {pos}")
        positions.append(SpreadPosition(pos["name"], pos["description"]))

    return GenericSpread(spread_name, positions)


def load_spreads_mapping():
    """Load spreads config and create mapping from spread ID to spread instances"""
    try:
        with open("config/spreads-config.json", "r") as f:
            config = json.load(f)

        # Legacy spread classes for compatibility
        legacy_spreads = {
            1: SingleCardSpread,
            3: ThreeCardSpread,
            4: FourCardDecisionSpread,
            5: FiveCardCrossSpread,
            6: SixCardRelationshipSpread,
            7: SevenCardHorseshoeSpread,
            10: CelticCrossSpread,
            12: TwelveCardSpread,
        }

        spreads_mapping = {}
        for spread in config["spreads"]:
            spread_id = spread["id"]
            spread_name = spread["name"]
            layout = config["layouts"][spread["layout"]]
            card_count = len(layout["positions"])

            # Use legacy spread class if available, otherwise create generic spread
            if card_count in legacy_spreads:
                spreads_mapping[spread_id] = legacy_spreads[card_count]
            else:
                try:
                    spreads_mapping[spread_id] = create_spread_from_config(
                        spread_name, layout["positions"]
                    )
                except Exception as pos_error:
                    print(f"Error creating spread {spread_id}: {pos_error}")

        return spreads_mapping
    except Exception as e:
        print(f"Error loading spreads mapping: {e}")
        # Fallback to legacy mapping
        return {
            "single-focus": SingleCardSpread,
            "past-present-future": ThreeCardSpread,
            "celtic-cross": CelticCrossSpread,
        }


spreads = load_spreads_mapping()

reader = ReadingService()

# Initialize the reading generator for AI interpretations
try:
    reading_generator = TarotReadingGenerator(
        cards_json_path="/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json",
        spreads_config_path="/Users/katelouie/code/arcanum/backend/config/spreads-config.json",
    )
    print("✅ Reading generator initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize reading generator: {e}")
    reading_generator = None

# Initialize the practice service
try:
    practice_service = PracticeService()
    print("✅ Practice service initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize practice service: {e}")
    practice_service = None


@app.get("/")
def read_root():
    return {"message": "Hello Arcanum"}


@app.get("/api/cards/{filename}")
def get_card_image(filename: str):
    # This will serve images at /api/cards/m00.jpg, etc.
    return {"image_url": f"static/cards_wikipedia/{filename}"}


@app.get("/api/interpretations")
def get_interpretations():
    """Get card and position interpretations (legacy)"""
    try:
        with open("interpretations.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "Interpretations file not found"}
    except json.JSONDecodeError:
        return {"error": "Invalid interpretations JSON"}


@app.get("/api/enhanced-cards")
def get_enhanced_cards():
    """Get enhanced card interpretations from generated cards data"""
    try:
        with open(
            "/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json",
            "r",
        ) as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "Enhanced cards file not found"}
    except json.JSONDecodeError:
        return {"error": "Invalid enhanced cards JSON"}


@app.get("/api/spreads")
def get_spreads_config():
    """Get available tarot spreads and layouts configuration"""
    try:
        with open("config/spreads-config.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "Spreads configuration file not found"}
    except json.JSONDecodeError:
        return {"error": "Invalid spreads configuration JSON"}


@app.get("/api/stories")
def get_available_stories():
    """Get list of available Twine story files with basic metadata"""
    from pathlib import Path

    stories = []
    # Use absolute path from backend directory
    stories_dir = Path(__file__).parent.parent / "frontend" / "public" / "stories"

    try:
        if not stories_dir.exists():
            return {"stories": [], "error": f"Stories directory not found: {stories_dir}"}

        for html_file in stories_dir.glob("*.html"):
            try:
                # Get basic file info only
                stat = html_file.stat()

                story_info = {
                    "id": html_file.stem,
                    "title": html_file.stem.replace("-", " ").title(),
                    "path": f"/stories/{html_file.name}",
                    "format": "HTML Story",  # Simple default
                    "description": f"Interactive story: {html_file.stem.replace('-', ' ')}",
                    "file_size": stat.st_size,
                    "modified": stat.st_mtime,
                    "category": "Story"  # Simple default
                }

                stories.append(story_info)

            except Exception as e:
                print(f"Error processing story file {html_file}: {e}")
                continue

        # Sort by modification time (newest first)
        stories.sort(key=lambda x: x["modified"], reverse=True)

        return {"stories": stories}

    except Exception as e:
        return {"stories": [], "error": f"Error reading stories directory: {str(e)}"}


# Removed complex metadata extraction functions to avoid API hanging


@app.post("/api/reading/cards", response_model=ReadingResponse)
def create_reading_cards_only(request: ReadingRequest):
    """Create a reading with cards and prompts, but without MLX AI generation"""
    # Get the spread class and position names from config
    if request.spread_type not in spreads:
        raise HTTPException(
            status_code=400, detail=f"Unknown spread type: {request.spread_type}"
        )

    spread_class = spreads[request.spread_type]
    spread = spread_class()

    # Load position names from spreads config
    try:
        with open("config/spreads-config.json", "r") as f:
            config = json.load(f)

        # Find the spread configuration
        spread_config = None
        for s in config["spreads"]:
            if s["id"] == request.spread_type:
                spread_config = s
                break

        if spread_config:
            # Override position names with the ones from config
            custom_positions = [pos["name"] for pos in spread_config["positions"]]
        else:
            custom_positions = None
    except Exception as e:
        print(f"Error loading spread config: {e}")
        custom_positions = None

    # Perform the reading
    reading = reader.perform_reading(
        question=request.question,
        spread=spread,
        shuffle_count=request.shuffle_count,
        include_date=request.include_date,
        rhythm=request.rhythm,
    )

    # Create the set of drawn card information
    cards_info = []

    for index, drawn_card in enumerate(reading.cards):
        # Find the image filename for this card
        card_filename = None
        print(f"Looking for card: '{drawn_card.card.name}'")
        for card_entry in card_data["cards"]:
            if card_entry["name"] == drawn_card.card.name:
                card_filename = card_entry["img"]
                print(f"Found match: {card_filename}")
                break

        # If we couldn't find the card, use a fallback filename
        if card_filename is None:
            card_filename = "placeholder.jpg"  # Or some default

        cards_info.append(
            {
                "name": drawn_card.card.name,
                "position": custom_positions[index]
                if custom_positions
                else drawn_card.position.name,
                "reversed": drawn_card.reversed,
                "image_url": f"/static/cards_wikipedia/{card_filename}",
            }
        )

    # Always generate the prompt and full context (no MLX inference)
    try:
        # Create card tuples in the format expected by the generator
        cards_with_positions = [
            (card_info["name"], card_info["reversed"], card_info["position"])
            for card_info in cards_info
        ]

        # Create reading request for generator
        gen_request = GenReadingRequest(
            question=request.question,
            spread_id=request.spread_type,
            cards_with_positions=cards_with_positions,
            style=ReadingStyle.DEFAULT,
            tone=ReadingTone.DEFAULT,
        )

        generated_reading = reading_generator.generate_reading_prompt(gen_request)

        # Prepare full prompt data
        full_prompt = {
            "system_prompt": generated_reading.system_prompt,
            "user_prompt": generated_reading.user_prompt,
            "combined_prompt": f"{generated_reading.system_prompt}\n\nUser: {generated_reading.user_prompt}\n\nAssistant:",
            "metadata": {
                "question_type": generated_reading.question_type.value,
                "question_confidence": generated_reading.question_confidence,
                "style": generated_reading.style.value,
                "tone": generated_reading.tone.value,
                "context_tokens": generated_reading.context_tokens,
                "prompt_tokens": generated_reading.prompt_tokens,
                "total_tokens": generated_reading.total_tokens,
                "completeness": generated_reading.completeness,
            },
        }

        interpretation = None  # Cards-only endpoint doesn't generate interpretation
    except Exception as e:
        print(f"Failed to generate interpretation: {e}")
        interpretation = "Error generating reading interpretation."
        full_prompt = None

    return ReadingResponse(
        question=request.question,
        spread_name=spread_config["name"] if spread_config else request.spread_type,
        cards=cards_info,
        timestamp=reading.timestamp,
        shuffle_count=request.shuffle_count,
        seed=reading.seed,
        interpretation=interpretation,
        full_prompt=full_prompt,
        ai_response=None,  # No AI response yet
    )


@app.post("/api/reading", response_model=ReadingResponse)
def create_reading(request: ReadingRequest):
    # Get the spread class and position names from config
    if request.spread_type not in spreads:
        raise HTTPException(
            status_code=400, detail=f"Unknown spread type: {request.spread_type}"
        )

    spread_class = spreads[request.spread_type]
    spread = spread_class()

    # Load position names from spreads config
    try:
        with open("config/spreads-config.json", "r") as f:
            config = json.load(f)

        # Find the spread configuration
        spread_config = None
        for s in config["spreads"]:
            if s["id"] == request.spread_type:
                spread_config = s
                break

        if spread_config:
            # Override position names with the ones from config
            custom_positions = [pos["name"] for pos in spread_config["positions"]]
        else:
            custom_positions = None
    except Exception as e:
        print(f"Error loading spread config: {e}")
        custom_positions = None

    # Perform the reading
    reading = reader.perform_reading(
        question=request.question,
        spread=spread,
        shuffle_count=request.shuffle_count,
        include_date=request.include_date,
        rhythm=request.rhythm,
    )

    # Create the set of drawn card information
    cards_info = []

    for index, drawn_card in enumerate(reading.cards):
        # Find the image filename for this card
        card_filename = None
        print(f"Looking for card: '{drawn_card.card.name}'")
        for card_entry in card_data["cards"]:
            if card_entry["name"] == drawn_card.card.name:
                card_filename = card_entry["img"]
                print(f"Found match: {card_filename}")
                break
        if not card_filename:
            print(f"No match found for: '{drawn_card.card.name}'")

        # Use custom position name if available, otherwise use default
        position_name = drawn_card.position or "Unknown"
        if custom_positions and index < len(custom_positions):
            position_name = custom_positions[index]

        # Create the Card info
        card_info = CardInfo(
            name=drawn_card.card.name,
            position=position_name,
            reversed=drawn_card.reversed,
            image_url=f"/static/cards_wikipedia/{card_filename}"
            if card_filename
            else "",
        )

        cards_info.append(card_info)

    # Generate AI interpretation
    interpretation = None
    if reading_generator:
        try:
            # Prepare cards for the reading generator
            cards_with_positions = [
                (card.name, card.reversed, card.position) for card in cards_info
            ]

            # Create reading request for generator
            gen_request = GenReadingRequest(
                question=request.question,
                spread_id=request.spread_type,
                cards_with_positions=cards_with_positions,
                style=ReadingStyle.COMPASSIONATE,
                tone=ReadingTone.WARM,
            )

            # Generate the reading with context and prompts
            generated_reading = reading_generator.generate_reading_prompt(gen_request)

            # Prepare full prompt data
            full_prompt = {
                "system_prompt": generated_reading.system_prompt,
                "user_prompt": generated_reading.user_prompt,
                "combined_prompt": f"{generated_reading.system_prompt}\n\nUser: {generated_reading.user_prompt}\n\nAssistant:",
                "metadata": {
                    "question_type": generated_reading.question_type.value,
                    "question_confidence": generated_reading.question_confidence,
                    "style": generated_reading.style.value,
                    "tone": generated_reading.tone.value,
                    "context_tokens": generated_reading.context_tokens,
                    "prompt_tokens": generated_reading.prompt_tokens,
                    "total_tokens": generated_reading.total_tokens,
                    "completeness": generated_reading.completeness,
                },
            }

            # Attempt MLX inference
            ai_response = None
            try:
                inference_request = InferenceRequest(
                    system_prompt=generated_reading.system_prompt,
                    user_prompt=generated_reading.user_prompt,
                    max_tokens=1500,
                    temperature=0.8,
                    stop_sequences=["That concludes the reading.", "###END###", "~~~"],
                )

                response = model_service.generate_text(inference_request)
                ai_response = {
                    "text": response.text,
                    "tokens_generated": response.tokens_generated,
                    "inference_time": response.inference_time,
                    "model_id": response.model_id,
                    "timestamp": response.timestamp,
                }

                # Use AI response as interpretation
                interpretation = response.text

            except Exception as e:
                print(f"MLX inference failed: {e}")
                # Fallback to context preview
                interpretation = f"""**Generated Reading Context:**

{generated_reading.context_string}

---

**AI Reading Prompt Preview:**

*This is the rich context that would be sent to an AI model to generate a personalized interpretation. The full system prompt and user prompt contain {generated_reading.total_tokens:,} tokens and achieve {generated_reading.completeness:.1%} context completeness.*

**Question Type:** {generated_reading.question_type.value} (confidence: {generated_reading.question_confidence:.1%})
**Style:** {generated_reading.style.value} + {generated_reading.tone.value}

To see the full AI-generated reading, this would be processed by the MLX tarot model with our sophisticated prompt engineering system."""

        except Exception as e:
            print(f"Failed to generate interpretation: {e}")
            interpretation = "Interpretation generation is currently unavailable. Please try again later."

    # Convert to response format
    return ReadingResponse(
        question=reading.question,
        spread_name=reading.spread.name,
        cards=cards_info,
        timestamp=reading.timestamp,
        shuffle_count=reading.shuffle_count,
        seed=reading.seed,
        interpretation=interpretation,
        full_prompt=full_prompt if "full_prompt" in locals() else None,
        ai_response=ai_response if "ai_response" in locals() else None,
    )


# Practice System Endpoints


@app.get("/api/practice/scenarios")
def get_practice_scenarios(
    difficulty: Optional[DifficultyLevel] = None,
    category: Optional[ScenarioCategory] = None,
):
    """Get available practice scenarios, optionally filtered"""
    if not practice_service:
        raise HTTPException(status_code=503, detail="Practice service not available")

    scenarios = practice_service.get_available_scenarios(difficulty, category)
    return {"scenarios": [scenario.dict() for scenario in scenarios]}


@app.post("/api/practice/start", response_model=StartPracticeResponse)
def start_practice_session(request: StartPracticeRequest):
    """Start a new practice session"""
    if not practice_service:
        raise HTTPException(status_code=503, detail="Practice service not available")

    try:
        return practice_service.start_practice_session(
            request.user_id,
            request.difficulty_preference,
            request.category_preference,
            request.scenario_id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/practice/select-spread", response_model=SelectSpreadResponse)
def select_spread_and_draw_cards(request: SelectSpreadRequest):
    """Select spread and draw cards for practice session"""
    if not practice_service:
        raise HTTPException(status_code=503, detail="Practice service not available")

    try:
        return practice_service.select_spread_and_draw_cards(
            request.session_id, request.selected_spread
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/practice/submit", response_model=SubmitInterpretationResponse)
def submit_interpretation(request: SubmitInterpretationRequest):
    """Submit interpretation and get AI evaluation"""
    if not practice_service:
        raise HTTPException(status_code=503, detail="Practice service not available")

    try:
        return practice_service.submit_interpretation(
            request.session_id, request.interpretation
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/practice/history/{user_id}", response_model=PracticeHistoryResponse)
def get_practice_history(user_id: str):
    """Get practice session history for a user"""
    if not practice_service:
        raise HTTPException(status_code=503, detail="Practice service not available")

    sessions = practice_service.get_user_sessions(user_id)
    average_score = None

    if sessions:
        scores = [s.ai_evaluation.overall_score for s in sessions if s.ai_evaluation]
        if scores:
            average_score = sum(scores) / len(scores)

    return PracticeHistoryResponse(
        user_id=user_id,
        sessions=sessions,
        total_sessions=len(sessions),
        average_score=average_score,
    )


@app.get("/api/practice/progress/{user_id}")
def get_user_progress(user_id: str):
    """Get progress tracking for a user"""
    if not practice_service:
        raise HTTPException(status_code=503, detail="Practice service not available")

    progress = practice_service.get_user_progress(user_id)
    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")

    return progress.dict()


@app.get("/api/practice/session/{session_id}")
def get_practice_session(session_id: str):
    """Get a specific practice session"""
    if not practice_service:
        raise HTTPException(status_code=503, detail="Practice service not available")

    session = practice_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session.dict()


# Development Interface Endpoints


@app.get("/api/dev/training-readings")
def get_training_readings():
    """Get all training readings from both common and special datasets"""
    try:
        readings = []
        interpretations_dir = "/Users/katelouie/code/arcanum/llm/tuning_data/readings"
        interpretations_metadata_dir = (
            "/Users/katelouie/code/arcanum/llm/tuning_data/interpretations"
        )

        # Get list of existing interpretation files and their status
        existing_interpretations = set()
        interpretation_status = {}

        if os.path.exists(interpretations_dir):
            for filename in os.listdir(interpretations_dir):
                if filename.endswith(".md") and filename.startswith("reading_"):
                    # Extract reading ID (e.g., "reading_001.md" -> "R001")
                    reading_num = filename.replace("reading_", "").replace(".md", "")
                    reading_id = f"R{reading_num.zfill(3)}"
                    existing_interpretations.add(reading_id)

        # Load status from interpretation metadata files
        if os.path.exists(interpretations_metadata_dir):
            for filename in os.listdir(interpretations_metadata_dir):
                if filename.endswith(".json") and filename.startswith("R"):
                    reading_id = filename.replace(".json", "")
                    try:
                        interpretation_file = os.path.join(
                            interpretations_metadata_dir, filename
                        )
                        with open(interpretation_file, "r") as f:
                            metadata = json.load(f)
                            interpretation_status[reading_id] = metadata.get(
                                "status", "not_started"
                            )
                    except:
                        interpretation_status[reading_id] = "not_started"

        # Load unified readings file
        all_readings_path = (
            "/Users/katelouie/code/arcanum/llm/tuning_data/readings/all_readings.json"
        )
        try:
            with open(all_readings_path, "r") as f:
                all_data = json.load(f)
                for reading in all_data["tarot_reading_dataset"]["readings"]:
                    # Source is already set from migration, but ensure it exists
                    if "source" not in reading:
                        reading["source"] = (
                            "special" if reading.get("spread_config") else "common"
                        )
                    reading["has_interpretation"] = (
                        reading["reading_id"] in existing_interpretations
                    )

                    # Add status from interpretation metadata, default to not_started
                    reading_id = reading["reading_id"]
                    if reading_id in interpretation_status:
                        reading["status"] = interpretation_status[reading_id]
                    else:
                        reading["status"] = "not_started"

                    readings.append(reading)
        except FileNotFoundError:
            print(f"Unified readings file not found: {all_readings_path}")
            # Fallback to old files if unified doesn't exist yet
            return _load_legacy_readings_files(existing_interpretations)

        return {
            "readings": readings,
            "total_count": len(readings),
            "common_count": len([r for r in readings if r["source"] == "common"]),
            "special_count": len([r for r in readings if r["source"] == "special"]),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error loading training readings: {str(e)}"
        )


@app.get("/api/dev/training-readings/{reading_id}")
def get_training_reading(reading_id: str):
    """Get a specific training reading by ID"""
    try:
        # Load from unified readings file
        all_readings_path = (
            "/Users/katelouie/code/arcanum/llm/tuning_data/readings/all_readings.json"
        )
        try:
            with open(all_readings_path, "r") as f:
                all_data = json.load(f)
                for reading in all_data["tarot_reading_dataset"]["readings"]:
                    if reading["reading_id"] == reading_id:
                        # Ensure source is set
                        if "source" not in reading:
                            reading["source"] = (
                                "special" if reading.get("spread_config") else "common"
                            )
                        reading["has_interpretation"] = False
                        return reading
        except FileNotFoundError:
            print(f"Unified readings file not found: {all_readings_path}")
            # Fallback to legacy loading if needed
            pass

        raise HTTPException(status_code=404, detail="Reading not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading reading: {str(e)}")


@app.post("/api/dev/training-readings/{reading_id}/interpretation")
def save_reading_interpretation(reading_id: str, interpretation_data: Dict):
    """Save an interpretation for a training reading"""
    try:
        interpretation = interpretation_data.get("interpretation", "")
        notes = interpretation_data.get("notes", "")
        status = interpretation_data.get("status", "draft")

        # Save as markdown file in readings directory (your preferred format)
        readings_dir = "/Users/katelouie/code/arcanum/llm/tuning_data/readings"
        os.makedirs(readings_dir, exist_ok=True)

        reading_num = reading_id.replace("R", "").lstrip("0")  # R001 -> 1
        md_file = os.path.join(readings_dir, f"reading_{reading_num.zfill(3)}.md")

        with open(md_file, "w") as f:
            f.write(interpretation)

        # Also create backup in interpretations directory
        interpretations_dir = (
            "/Users/katelouie/code/arcanum/llm/tuning_data/interpretations"
        )
        os.makedirs(interpretations_dir, exist_ok=True)

        interpretation_entry = {
            "reading_id": reading_id,
            "interpretation": interpretation,
            "notes": notes,
            "status": status,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "markdown_file": md_file,
        }

        # Save metadata to JSON file
        json_file = os.path.join(interpretations_dir, f"{reading_id}.json")
        with open(json_file, "w") as f:
            json.dump(interpretation_entry, f, indent=2)

        # Also append to master interpretations file for backup
        master_file = os.path.join(interpretations_dir, "all_interpretations.jsonl")
        with open(master_file, "a") as f:
            f.write(json.dumps(interpretation_entry) + "\n")

        return {
            "message": "Interpretation saved successfully",
            "reading_id": reading_id,
            "markdown_file": md_file,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving interpretation: {str(e)}"
        )


@app.get("/api/dev/training-readings/{reading_id}/interpretation")
def get_reading_interpretation(reading_id: str):
    """Get existing interpretation for a training reading"""
    try:
        # Check for existing markdown file first
        readings_dir = "/Users/katelouie/code/arcanum/llm/tuning_data/readings"
        reading_num = reading_id.replace("R", "").lstrip("0")  # R001 -> 1
        md_file = os.path.join(readings_dir, f"reading_{reading_num.zfill(3)}.md")

        if os.path.exists(md_file):
            with open(md_file, "r") as f:
                content = f.read()

                # Check for existing JSON metadata to get the real status
                interpretations_dir = (
                    "/Users/katelouie/code/arcanum/llm/tuning_data/interpretations"
                )
                interpretation_file = os.path.join(
                    interpretations_dir, f"{reading_id}.json"
                )
                actual_status = "not_started"  # Default status

                if os.path.exists(interpretation_file):
                    with open(interpretation_file, "r") as json_f:
                        metadata = json.load(json_f)
                        actual_status = metadata.get("status", "not_started")

                return {
                    "reading_id": reading_id,
                    "interpretation": content,
                    "notes": f"Loaded from {os.path.basename(md_file)}",
                    "status": actual_status,
                    "source_file": md_file,
                }

        # Fall back to JSON interpretation files
        interpretations_dir = (
            "/Users/katelouie/code/arcanum/llm/tuning_data/interpretations"
        )
        interpretation_file = os.path.join(interpretations_dir, f"{reading_id}.json")

        if os.path.exists(interpretation_file):
            with open(interpretation_file, "r") as f:
                return json.load(f)
        else:
            return {
                "reading_id": reading_id,
                "interpretation": "",
                "notes": "",
                "status": "not_started",
            }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error loading interpretation: {str(e)}"
        )


@app.patch("/api/dev/training-readings/{reading_id}/status")
def update_reading_status(reading_id: str, status_data: Dict):
    """Update the status of a training reading"""
    try:
        new_status = status_data.get("status")
        if new_status not in ["not_started", "draft", "completed"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid status. Must be one of: not_started, draft, completed",
            )

        interpretations_dir = (
            "/Users/katelouie/code/arcanum/llm/tuning_data/interpretations"
        )
        interpretation_file = os.path.join(interpretations_dir, f"{reading_id}.json")

        # Check if interpretation file exists
        if os.path.exists(interpretation_file):
            # Load existing interpretation data
            with open(interpretation_file, "r") as f:
                interpretation_entry = json.load(f)

            # Update status and timestamp
            interpretation_entry["status"] = new_status
            interpretation_entry["updated_at"] = datetime.now().isoformat()

            # Save updated data
            with open(interpretation_file, "w") as f:
                json.dump(interpretation_entry, f, indent=2)

            return {
                "message": f"Status updated to {new_status}",
                "reading_id": reading_id,
                "status": new_status,
            }
        else:
            # Create new interpretation entry with just status
            os.makedirs(interpretations_dir, exist_ok=True)
            interpretation_entry = {
                "reading_id": reading_id,
                "interpretation": "",
                "notes": "",
                "status": new_status,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            with open(interpretation_file, "w") as f:
                json.dump(interpretation_entry, f, indent=2)

            return {
                "message": f"Status set to {new_status}",
                "reading_id": reading_id,
                "status": new_status,
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating status: {str(e)}")


@app.get("/api/dev/interpretation-progress")
def get_interpretation_progress():
    """Get progress statistics for interpretation writing"""
    try:
        readings_dir = "/Users/katelouie/code/arcanum/llm/tuning_data/readings"

        # Get total readings count from unified file
        total_readings = 0
        all_readings_path = (
            "/Users/katelouie/code/arcanum/llm/tuning_data/readings/all_readings.json"
        )
        try:
            with open(all_readings_path, "r") as f:
                all_data = json.load(f)
                total_readings = len(all_data["tarot_reading_dataset"]["readings"])
        except FileNotFoundError:
            print(f"Unified readings file not found: {all_readings_path}")
            # Fallback to old calculation if unified file doesn't exist
            total_readings = 0

        # Count existing markdown interpretations
        completed_count = 0
        if os.path.exists(readings_dir):
            for filename in os.listdir(readings_dir):
                if filename.endswith(".md") and filename.startswith("reading_"):
                    completed_count += 1

        # For now, assume non-completed readings are "not started"
        # Could enhance this by checking JSON metadata files for draft status
        draft_count = 0
        not_started_count = total_readings - completed_count - draft_count

        return {
            "total_readings": total_readings,
            "completed": completed_count,
            "draft": draft_count,
            "not_started": not_started_count,
            "completion_percentage": (completed_count / total_readings * 100)
            if total_readings > 0
            else 0,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting progress: {str(e)}")


@app.post("/api/dev/training-readings")
def create_training_reading(reading_data: Dict):
    """Create a new training reading and add it to the dataset"""
    try:
        # Load current readings
        all_readings_path = (
            "/Users/katelouie/code/arcanum/llm/tuning_data/readings/all_readings.json"
        )
        with open(all_readings_path, "r") as f:
            data = json.load(f)

        # Generate new reading ID
        existing_ids = {
            reading["reading_id"]
            for reading in data["tarot_reading_dataset"]["readings"]
        }
        next_id_num = 1
        while f"R{next_id_num:03d}" in existing_ids:
            next_id_num += 1
        new_reading_id = f"R{next_id_num:03d}"

        # Validate required fields
        required_fields = ["question", "question_category", "spread_id", "cards"]
        for field in required_fields:
            if field not in reading_data:
                raise HTTPException(
                    status_code=400, detail=f"Missing required field: {field}"
                )

        # Validate cards structure
        cards = reading_data["cards"]
        if not isinstance(cards, list) or len(cards) == 0:
            raise HTTPException(
                status_code=400, detail="Cards must be a non-empty array"
            )

        for i, card in enumerate(cards):
            card_required = ["position_name", "card_name", "orientation"]
            for field in card_required:
                if field not in card:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Card {i} missing required field: {field}",
                    )

            # Add position_index if not provided
            if "position_index" not in card:
                card["position_index"] = i

        # Create new reading object
        new_reading = {
            "reading_id": new_reading_id,
            "spread_id": reading_data["spread_id"],
            "spread_name": reading_data.get("spread_name", "Custom Spread"),
            "question_category": reading_data["question_category"],
            "question": reading_data["question"],
            "cards": cards,
            "spread_config": reading_data.get(
                "spread_config"
            ),  # null for standard spreads
            "source": "special" if reading_data.get("spread_config") else "common",
        }

        # Add to dataset
        data["tarot_reading_dataset"]["readings"].append(new_reading)

        # Update metadata
        data["tarot_reading_dataset"]["metadata"]["total_readings"] = len(
            data["tarot_reading_dataset"]["readings"]
        )
        if new_reading["source"] == "common":
            data["tarot_reading_dataset"]["metadata"]["common_readings"] += 1
        else:
            data["tarot_reading_dataset"]["metadata"]["special_readings"] += 1

        # Save updated file
        with open(all_readings_path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        # Generate context string for new reading
        try:
            from pathlib import Path

            # Use the existing context builder directly (simpler and more reliable)
            cards_json_path = "/Users/katelouie/code/arcanum/llm/rag/data_generation/generated_cards/all_cards.json"
            spreads_config_path = (
                "/Users/katelouie/code/arcanum/backend/config/spreads-config.json"
            )

            context_builder = ContextStringBuilder(
                cards_json_path=cards_json_path,
                spreads_config_path=spreads_config_path,
                max_context_length=12000,
                max_context_tokens=4000,
            )

            # Convert cards to context builder format
            cards_with_positions = []
            for card in new_reading["cards"]:
                card_name = card["card_name"]
                is_reversed = card["orientation"].lower() == "reversed"
                position_name = card["position_name"]
                cards_with_positions.append((card_name, is_reversed, position_name))

            # Generate context string
            context_string, reading_context = (
                context_builder.build_complete_context_for_reading(
                    new_reading["question"],
                    new_reading["spread_id"],
                    cards_with_positions,
                    style="comprehensive",
                )
            )

            if context_string:
                # Get token stats
                token_stats = context_builder.get_token_stats(context_string)

                # Create metadata
                metadata = {
                    "reading_id": new_reading_id,
                    "spread_name": new_reading.get("spread_name", "Unknown"),
                    "question_category": new_reading["question_category"],
                    "question": new_reading["question"],
                    "cards_count": len(cards_with_positions),
                    "context_length": len(context_string),
                    "context_tokens": token_stats.context_tokens,
                    "context_completeness": reading_context.context_completeness,
                    "question_type": reading_context.question_type.value,
                    "question_confidence": reading_context.question_confidence,
                    "is_custom_spread": new_reading.get("spread_config") is not None,
                }

                # Create context markdown file
                output_dir = Path(
                    "/Users/katelouie/code/arcanum/llm/tuning_data/context_strings"
                )
                output_dir.mkdir(exist_ok=True)

                spread_type = (
                    "Custom Spread"
                    if metadata.get("is_custom_spread")
                    else "Standard Spread"
                )

                markdown_content = f"""# Context String for {new_reading_id}

**Reading Information:**
- **Reading ID:** {metadata["reading_id"]}
- **Spread:** {metadata["spread_name"]} ({spread_type})
- **Question Category:** {metadata["question_category"]}
- **Cards Count:** {metadata["cards_count"]}

**Question:**
> {metadata["question"]}

**Context Statistics:**
- **Length:** {metadata["context_length"]:,} characters
- **Tokens:** {metadata["context_tokens"]:,}
- **Completeness:** {metadata["context_completeness"]:.1%}
- **Question Type:** {metadata["question_type"]} (confidence: {metadata["question_confidence"]:.2f})

---

## Generated Context String

```
{context_string}
```

---

*Generated for training data reference*
"""

                # Write context file
                context_file = output_dir / f"{new_reading_id}_context.md"
                with open(context_file, "w", encoding="utf-8") as f:
                    f.write(markdown_content)

                print(
                    f"✅ Generated context string for {new_reading_id}: {len(context_string):,} chars, {metadata['context_tokens']:,} tokens"
                )
            else:
                print(f"❌ Context generation returned empty for {new_reading_id}")

        except Exception as e:
            print(f"❌ Failed to generate context string for {new_reading_id}: {e}")
            import traceback

            traceback.print_exc()

        # Create placeholder interpretation file
        try:
            readings_dir = "/Users/katelouie/code/arcanum/llm/tuning_data/readings"
            reading_num = new_reading_id.replace("R", "").lstrip("0")
            md_file = os.path.join(readings_dir, f"reading_{reading_num.zfill(3)}.md")

            placeholder_content = f"""# Reading {new_reading_id}: {reading_data["question_category"]}

**Question:** {reading_data["question"]}

**Cards:**
{chr(10).join(f"- {card['position_name']}: {card['card_name']} ({card['orientation']})" for card in cards)}

---

*Write your interpretation here...*
"""

            with open(md_file, "w") as f:
                f.write(placeholder_content)

        except Exception as e:
            print(
                f"Warning: Failed to create placeholder interpretation for {new_reading_id}: {e}"
            )

        return {
            "message": "Reading created successfully",
            "reading_id": new_reading_id,
            "reading": new_reading,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating reading: {str(e)}")


@app.get("/api/dev/spreads")
def get_spreads():
    """Get available spreads configuration"""
    try:
        spreads_config_path = (
            "/Users/katelouie/code/arcanum/backend/config/spreads-config.json"
        )
        with open(spreads_config_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"spreads": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading spreads: {str(e)}")


@app.get("/api/dev/training-readings/{reading_id}/context")
def get_reading_context_string(reading_id: str):
    """Get the generated context string for a training reading"""
    try:
        # Look for the context string markdown file
        context_dir = "/Users/katelouie/code/arcanum/llm/tuning_data/context_strings"
        context_file = os.path.join(context_dir, f"{reading_id}_context.md")

        if os.path.exists(context_file):
            with open(context_file, "r", encoding="utf-8") as f:
                content = f.read()
                # Extract just the context string from the markdown
                # Look for the context string between the ``` markers
                import re

                match = re.search(r"```\n(.*?)\n```", content, re.DOTALL)
                if match:
                    return match.group(1)
                else:
                    # If no code block found, return the whole content
                    return content
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Context string not found for reading {reading_id}",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error loading context string: {str(e)}"
        )


# Initialize model service
model_service = get_model_service()


# MLX Model Management Endpoints
@app.get("/api/models")
def get_available_models():
    """Get list of available MLX models"""
    try:
        models = model_service.get_available_models()
        return {
            "models": [
                {
                    "id": model.id,
                    "name": model.name,
                    "description": model.description,
                    "type": model.type,
                    "parameters": model.parameters,
                    "loaded": model.loaded,
                    "load_time": model.load_time,
                }
                for model in models
            ],
            "current_model": model_service._current_model_id,
            "service_status": model_service.get_service_status(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting models: {str(e)}")


@app.post("/api/models/{model_id}/load")
def load_model(model_id: str):
    """Load a specific model"""
    try:
        success = model_service.load_model(model_id)
        if success:
            return {
                "success": True,
                "message": f"Model {model_id} loaded successfully",
                "current_model": model_service._current_model_id,
            }
        else:
            return {"success": False, "message": f"Failed to load model {model_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")


@app.post("/api/models/unload")
def unload_current_model():
    """Unload the currently loaded model"""
    try:
        model_service.unload_model()
        return {
            "success": True,
            "message": "Model unloaded successfully",
            "current_model": None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unloading model: {str(e)}")


def clean_reading_text(text: str) -> str:
    """Extract the actual reading from model output, removing thinking/preprocessing"""
    import re

    # Handle new format with "# Reading" start marker and "That concludes the reading.###END###" end marker
    reading_start_marker = "# Reading"
    reading_end_marker = "That concludes the reading.###END###"
    reading_end_marker_alt = "That concludes the reading."

    # Check if text contains the new format markers
    if reading_start_marker in text:
        # Split on "# Reading" - everything before is "thinking"
        parts = text.split(reading_start_marker, 1)
        if len(parts) > 1:
            # Take everything from "# Reading" onwards
            text = reading_start_marker + parts[1]

            # If there's an end marker, trim everything after it (including the marker itself)
            if reading_end_marker in text:
                text = text.split(reading_end_marker)[0].strip()
            elif reading_end_marker_alt in text:
                text = text.split(reading_end_marker_alt)[0].strip()

            return text.strip()

    # Handle Qwen3 specific thinking pattern: (thinking) ... </think> ... actual response
    # The thinking section starts with "(thinking)" and ends with line breaks after </think> token
    if text.startswith("(thinking)"):
        # Look for the end of thinking section - typically after multiple line breaks
        # The actual response usually starts after 2+ consecutive newlines
        lines = text.split("\n")

        # Find where the actual reading starts (after thinking section)
        reading_start = 0
        found_thinking_end = False

        for i, line in enumerate(lines):
            # Skip the thinking section
            if not found_thinking_end:
                # Look for transition from thinking to response
                # Usually indicated by empty lines followed by content
                if line.strip() == "" and i > 0:
                    # Check if next few lines have actual content (not just empty)
                    next_content_lines = 0
                    for j in range(i + 1, min(i + 4, len(lines))):
                        if j < len(lines) and lines[j].strip():
                            next_content_lines += 1

                    # If we have substantial content after empty lines, this is likely the start
                    if next_content_lines >= 1:
                        reading_start = i + 1
                        found_thinking_end = True
                        break

        # Extract everything from the reading start
        if found_thinking_end and reading_start < len(lines):
            text = "\n".join(lines[reading_start:]).strip()
        else:
            # Fallback: remove everything before first substantial paragraph
            # Look for first line that doesn't start with "(thinking)" or seem like thinking
            for i, line in enumerate(lines):
                if (
                    line.strip()
                    and not line.startswith("(thinking)")
                    and not line.strip().startswith("I need to")
                    and not line.strip().startswith("Let me")
                    and len(line.strip()) > 20
                ):  # Substantial content
                    text = "\n".join(lines[i:]).strip()
                    break

    # Remove everything after [[END OF READING]] marker if present
    end_marker = "[[END OF READING]]"
    if end_marker in text:
        text = text.split(end_marker)[0].strip()

    # Clean up any remaining thinking artifacts
    thinking_patterns = [
        r"<thinking>.*?</thinking>",
        r"\*\*Thinking:\*\*.*?(?=\*\*(?:Response|Reading|Answer):\*\*)",
        r"Let me think.*?(?=\n\n[A-Z])",
    ]

    for pattern in thinking_patterns:
        text = re.sub(pattern, "", text, flags=re.DOTALL | re.IGNORECASE)

    # Look for common response markers and extract everything after them
    response_markers = [
        r"\*\*Response:\*\*\s*",
        r"\*\*Reading:\*\*\s*",
        r"\*\*Answer:\*\*\s*",
        r"Here is your tarot reading:\s*",
        r"Your reading:\s*",
    ]

    for marker in response_markers:
        match = re.search(marker, text, re.IGNORECASE)
        if match:
            text = text[match.end() :].strip()
            break

    return text.strip()


class MLXInferenceRequest(BaseModel):
    system_prompt: str
    user_prompt: str
    max_tokens: int = 2000
    temperature: float = 0.7
    top_p: float = 0.9


@app.post("/api/reading/ai-interpretation")
def generate_ai_interpretation(request: MLXInferenceRequest):
    """Generate AI interpretation for an existing reading using MLX model"""
    try:
        inference_request = InferenceRequest(
            system_prompt=request.system_prompt,
            user_prompt=request.user_prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
        )

        response = model_service.generate_text(inference_request)

        # Clean the response text to remove anything after [[END OF READING]]
        cleaned_text = clean_reading_text(response.text)

        return {
            "text": cleaned_text,
            "raw_text": response.text,  # Include the original unmodified text
            "tokens_generated": response.tokens_generated,
            "inference_time": response.inference_time,
            "model_id": response.model_id,
            "timestamp": response.timestamp,
        }

    except Exception as e:
        return {"error": f"AI interpretation failed: {str(e)}"}


@app.post("/api/inference")
def generate_with_mlx(request: MLXInferenceRequest):
    """Generate text using the currently loaded MLX model"""
    try:
        inference_request = InferenceRequest(
            system_prompt=request.system_prompt,
            user_prompt=request.user_prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        response = model_service.generate_text(inference_request)

        return {
            "text": response.text,
            "tokens_generated": response.tokens_generated,
            "inference_time": response.inference_time,
            "model_id": response.model_id,
            "timestamp": response.timestamp,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


# Story Mode Client Management Endpoints

# Load client configuration
def load_client_config():
    try:
        with open('backend/config/clients_config.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: clients_config.json not found, using empty config")
        return {"clients": {}, "default_session_settings": {"initial_session": 1, "initial_confidence": 0}}

client_config = load_client_config()

def add_new_client(client_name: str, story_file: str, story_name: str, total_sessions: int = 4, initial_notes: str = "", initial_date: str = ""):
    """Add a new client to the configuration and session store"""
    global client_config, client_session_store

    # Add to configuration
    client_config["clients"][client_name] = {
        "story_file": story_file,
        "story_name": story_name,
        "total_sessions": total_sessions,
        "initial_notes": initial_notes,
        "initial_date": initial_date,
        "client_id": client_name.lower().replace(" ", "_")
    }

    # Add to session store
    client_session_store[client_name] = {
        "session": client_config["default_session_settings"]["initial_session"],
        "notes": initial_notes,
        "last_session_date": initial_date,
        "confidence_level": client_config["default_session_settings"]["initial_confidence"]
    }

# Simple in-memory store for client session data
# Initialize with configured clients
client_session_store = {}
for client_name, config in client_config["clients"].items():
    client_session_store[client_name] = {
        "session": client_config["default_session_settings"]["initial_session"],
        "notes": config["initial_notes"],
        "last_session_date": config["initial_date"],
        "confidence_level": client_config["default_session_settings"]["initial_confidence"]
    }

# Client management is now handled entirely within the unified Ink story system

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
