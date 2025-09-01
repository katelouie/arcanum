# Arcanum - Tarot Reading Application

## Project Overview
Arcanum is a tarot reading application with a Python FastAPI backend and React TypeScript frontend. It provides various tarot spreads and card interpretations.

## Architecture
- **Backend**: FastAPI (Python) at `/backend/`
- **Frontend**: React + TypeScript + Vite at `/frontend/`
- **CLI Tool**: Python package at `/src/arcanum/`
- **LLM Integration**: MLX models and RAG data at `/llm/`

## Key Components
- Tarot card models and spreads
- Card interpretation system
- Multiple spread layouts (Celtic Cross, Three Card, etc.)
- Static card images and metadata
- Generated card interpretations via LLM

## Python Environment Setup
**IMPORTANT**: Before running any Python commands, always run:
```bash
source ~/.zshrc
pyenv activate arcanum
```

## Development Commands

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend
```bash
cd backend
python main.py       # Start FastAPI server
```

### Python Package
```bash
pip install -e .     # Install in development mode
arcanum             # Run CLI tool
pytest              # Run tests
```

## File Structure
- `backend/` - FastAPI server and API models
- `frontend/` - React TypeScript application
- `src/arcanum/` - Core Python package
- `llm/` - LLM integration and RAG data
- `tests/` - Test files and notebooks
- `docs/` - Project documentation

## Important Files
- `backend/main.py` - FastAPI application entry point
- `frontend/src/App.tsx` - React application root
- `src/arcanum/cli.py` - CLI entry point
- `pyproject.toml` - Python package configuration
- `backend/spreads-config.json` - Spread configurations
- `backend/interpretations.json` - Card interpretations

## Testing
- Frontend: Uses standard npm test setup
- Backend: Uses pytest with pythonpath configured
- Test notebooks available in `tests/notebooks/`

## Technologies
- **Backend**: FastAPI, Pydantic, Uvicorn
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI
- **LLM**: MLX, custom RAG implementation
- **Build**: setuptools, npm/vite