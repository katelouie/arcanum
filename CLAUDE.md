# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arcanum is a comprehensive tarot reading application featuring AI-powered interpretations, practice scenarios, and interactive story mode. The system integrates a Python FastAPI backend, React TypeScript frontend, story system using Ink language, and local AI/ML capabilities.

## Architecture Overview

### Multi-Mode Application Structure

The application provides five distinct modes accessed through the main navigation:

- **Reading Mode**: Generate tarot readings with various spreads and AI interpretations
- **Practice Mode**: Learn with structured scenarios and AI feedback evaluation
- **Story Mode**: Interactive narrative experiences that integrate live tarot readings
- **Layout Creator**: Visual spread configuration system
- **Dev Mode**: Training data management and LLM integration tools

### Core System Integration

- **Backend**: FastAPI with comprehensive tarot services, practice evaluation, and MLX integration
- **Frontend**: React 19 with TypeScript, featuring mode-based routing and shared component architecture
- **Story System**: Ink language stories compiled to JSON, with bidirectional backend integration via external functions
- **AI/LLM**: Custom RAG implementation, MLX local models, and prompt engineering pipeline

## Python Environment Setup

**CRITICAL**: Before running any Python commands, always run:

```bash
source ~/.zshrc
pyenv activate arcanum
```

## Frontend and Backend Servers

**Instruction:** Before starting your own shells for the frontend and backend servers, ask the user if they already have their own running. If so, don't start your own unless necessary for testing.

## Development Commands

### Frontend Development

```bash
cd frontend
npm run dev          # Start development server (runs on port 5173+)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend Development

```bash
cd backend
python main.py       # Start FastAPI server (port 8000)
```

### Story Client Management

```bash
# Create a new client via API
curl -X POST http://localhost:8000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Client Name",
    "story_file": "story.json",
    "story_name": "story",
    "total_sessions": 4,
    "initial_notes": "Initial client notes",
    "initial_date": "March 15th"
  }'

# List all clients
curl -X GET http://localhost:8000/api/clients

# Get client session info
curl -X POST http://localhost:8000/api/clients/Client%20Name/continue
```

### Story System Development

**IMPORTANT**: Use the comprehensive Twine build scripts in `scripts/` directory. See `scripts/README.md` for complete documentation and usage examples.

**Twine Stories (Current System):**
```bash
# Build all stories with automatic Arcanum styling
./scripts/build-twine.sh build-all

# Build single story
./scripts/build-twine.sh build twine-poc/story-name.twee

# Watch for changes (auto-rebuild during development)
./scripts/build-twine.sh watch

# Python version with advanced features and validation
python scripts/build_twine.py build-all
python scripts/build_twine.py validate    # Validate .twee files
python scripts/build_twine.py watch       # Advanced watch mode

# Clean compiled files
./scripts/build-twine.sh clean

# View build script configuration and status
./scripts/build-twine.sh version

# The build scripts automatically include twine-poc/arcanum-stylesheet.twee
# which applies the site's violet/slate design system to all compiled stories
```

**Ink Stories (Legacy System):**
```bash
# Compile Ink stories to JSON for web consumption
python build_stories.py                    # Build all .ink files
python build_stories.py sarah              # Build only sarah.ink
python build_stories.py sarah demo         # Build multiple specific stories

# Manual compilation (alternative method):
inklecate -o frontend/public/stories/story_name.json ink/story_name.ink

# When adding EXTERNAL function calls to Ink files:
# 1. Add EXTERNAL declarations at top of .ink file
# 2. Recompile to JSON using build_stories.py
# 3. Ensure JavaScript bindings match function signatures in StoryPlayer.tsx
```

### Python Package & Testing

```bash
pip install -e .     # Install in development mode
arcanum             # Run CLI tool
pytest              # Run tests with configured pythonpath
```

## Key Architectural Components

### Story System Integration

The story system creates interactive narratives that call live backend services:

- **StoryPlayer.tsx**: React component that loads compiled Ink JSON and binds external functions
- **StoryTarotService**: Frontend service providing backend integration for story-triggered tarot functions
- **External Function Binding**: Ink stories call JavaScript functions that trigger real API calls
- **Version Compatibility**: Ink compiler version must match inkjs runtime (currently v19)

### Backend Service Architecture

- **FastAPI Main**: Central application with CORS configuration for frontend ports
- **Service Layer**: Modular services for readings, practice evaluation, MLX integration
- **Configuration System**: JSON-based configuration for spreads, scenarios, and evaluation rubrics
- **Static Assets**: Card images and metadata served from `/static/` endpoints

### Frontend Component Architecture

- **Mode-Based Routing**: Single-page app with mode switching via state management
- **Shared Hooks**: `useCardData` provides common tarot functionality across components
- **Component Libraries**: Radix UI and custom components with Tailwind CSS theming
- **InterpretationPanel**: Shared slide-out panel for card details across all modes

## Important Configuration Files

### Backend Configuration

- `backend/config/spreads-config.json` - Tarot spread layouts and position definitions
- `backend/config/practice_scenarios.json` - Learning scenarios with client contexts
- `backend/config/evaluation_rubric.json` - AI feedback scoring criteria
- `backend/config/clients_config.json` - Story mode client configurations and session settings
- `backend/main.py` - FastAPI app configuration and route definitions

### Frontend Configuration

- `frontend/src/App.tsx` - Main application router and mode management
- `frontend/package.json` - Dependencies including inkjs for story system
- `frontend/public/stories/` - Compiled Ink story JSON files

### Story System Files

**Twine Stories:**
- `twine-poc/*.twee` - Source Twine story files (Twee format)
- `twine-poc/arcanum-stylesheet.twee` - Shared stylesheet with design system (auto-included)
- `scripts/build-twine.sh` - Shell build script for Twine stories
- `scripts/build_twine.py` - Python build script with advanced features
- `scripts/README.md` - Comprehensive documentation for build system
- `frontend/public/stories/*.html` - Compiled Twine story HTML files
- `frontend/src/components/TwineStoryPlayer.tsx` - React component for Twine stories

**Ink Stories (Legacy):**
- `ink/*.ink` - Source Ink language story files
- `frontend/public/stories/*.json` - Compiled story files for web consumption
- `frontend/src/services/storyTarotService.ts` - Backend integration for story functions

## Position Interpretation RAG Mappings

When configuring spreads in `backend/config/spreads-config.json`, use these position interpretation options for the `rag_mapping` field of each position. These correspond to the detailed interpretations available in the generated card files.

### Temporal Positions
- `temporal_positions.past` - Past influences and events
- `temporal_positions.distant_past` - Long-ago influences, foundational experiences
- `temporal_positions.recent_past` - Recent events affecting the present
- `temporal_positions.present` - Current moment and immediate circumstances
- `temporal_positions.present_situation` - Core of the current situation
- `temporal_positions.future` - Future possibilities and outcomes
- `temporal_positions.near_future` - Immediate future developments
- `temporal_positions.distant_future` - Long-term outcomes and destiny

### Challenge and Growth
- `challenge_and_growth.challenge` - Main challenge to overcome
- `challenge_and_growth.cross` - What crosses or opposes you
- `challenge_and_growth.obstacle` - Barriers and blockages
- `challenge_and_growth.lesson` - What needs to be learned
- `challenge_and_growth.shadow` - Shadow aspects to integrate
- `challenge_and_growth.what_hinders` - What holds you back

### Guidance and Action
- `guidance_and_action.advice` - Direct guidance and recommendations
- `guidance_and_action.action` - Specific actions to take
- `guidance_and_action.your_approach` - Your current approach or attitude
- `guidance_and_action.what_helps` - Resources and support available
- `guidance_and_action.guidance` - Spiritual or higher guidance
- `guidance_and_action.best_course` - Optimal path forward

### Emotional and Internal
- `emotional_and_internal.hopes_fears` - Combined hopes and fears
- `emotional_and_internal.hopes` - Aspirations and desires
- `emotional_and_internal.fears` - Worries and anxieties
- `emotional_and_internal.subconscious` - Hidden influences and unconscious patterns
- `emotional_and_internal.conscious` - Conscious awareness and thoughts
- `emotional_and_internal.emotional_state` - Current emotional landscape
- `emotional_and_internal.heart` - Heart's desires and emotional truth
- `emotional_and_internal.mind` - Mental state and thought patterns

### External Influences
- `external_influences.external_influences` - General outside forces
- `external_influences.others` - How others affect the situation
- `external_influences.environment` - Environmental and contextual factors
- `external_influences.others_see_you` - How you are perceived
- `external_influences.hidden_influences` - Unseen forces at work

### Outcome and Result
- `outcome_and_result.outcome` - General outcome
- `outcome_and_result.final_outcome` - Ultimate resolution
- `outcome_and_result.possible_outcome` - Potential developments
- `outcome_and_result.best_case` - Most positive outcome
- `outcome_and_result.worst_case` - Most challenging outcome

## LLM/AI Integration Architecture

### RAG System

- **Context String Builder**: Constructs prompts with card meanings and spread context
- **Card Data Loader**: Manages enhanced card interpretations and meanings
- **Position Meaning Matcher**: Maps spread positions to interpretive context

### MLX Integration

- **Model Service**: Local model loading and inference management
- **Prompt Engineer**: Advanced prompt construction with style/tone controls
- **Reading Generator**: Orchestrates AI-powered interpretation generation

### Practice System

- **Scenario Management**: Realistic client contexts with background stories
- **Evaluation Engine**: AI-powered feedback across 7 assessment criteria
- **Progress Tracking**: Session history and improvement analytics

## Development Workflow Patterns

### Story Development Process

1. Write story in Ink language with EXTERNAL function declarations
2. Compile to JSON using inklecate command
3. Implement JavaScript function bindings in StoryPlayer.tsx
4. Test integration with live backend services
5. Verify external function argument counts match between Ink and JavaScript

### Backend API Development

- Models in `/models/` define request/response schemas
- Services in `/services/` implement business logic
- Configuration files drive spread and scenario behavior
- CORS is configured for development frontend ports

### Frontend Component Development

- Components use shared theming with violet/indigo gradients
- Integration with backend via axios services
- Shared state management through React hooks
- Consistent dark theme across all modes

## Testing Strategy

- Frontend: Standard npm test framework
- Backend: pytest with configured pythonpath pointing to `src/`
- Integration: Test notebooks available in `tests/notebooks/`
- Story System: Manual testing of Ink compilation and external function integration

## Technologies & Dependencies

- **Backend**: FastAPI, Pydantic, Uvicorn, MLX, custom RAG implementation
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI, inkjs
- **Story System**: Ink language compiler (inklecate), compiled JSON stories
- **AI/ML**: MLX framework, custom prompt engineering, local model inference
- **Build Tools**: setuptools for Python package, npm/vite for frontend

## External Integration Points

- **Card Images**: Wikipedia-sourced tarot deck served from `backend/static/`
- **AI Models**: Local MLX models for interpretation generation
- **Story Assets**: Compiled Ink JSON stories loaded dynamically by frontend
- **Configuration**: JSON-based configuration system for spreads, scenarios, and evaluation
