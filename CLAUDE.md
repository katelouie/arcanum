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

### Story System Development
```bash
# Compile Ink stories to JSON for web consumption
inklecate -o frontend/public/stories/story_name.json ink/story_name.ink

# When adding EXTERNAL function calls to Ink files:
# 1. Add EXTERNAL declarations at top of .ink file
# 2. Recompile to JSON 
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
- `backend/main.py` - FastAPI app configuration and route definitions

### Frontend Configuration  
- `frontend/src/App.tsx` - Main application router and mode management
- `frontend/package.json` - Dependencies including inkjs for story system
- `frontend/public/stories/` - Compiled Ink story JSON files

### Story System Files
- `ink/*.ink` - Source Ink language story files
- `frontend/public/stories/*.json` - Compiled story files for web consumption
- `frontend/src/services/storyTarotService.ts` - Backend integration for story functions

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