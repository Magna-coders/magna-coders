#!/bin/bash

# Magna AI Agent Startup Script (Conda Version)

echo "=========================================="
echo "  Magna AI Agent - Starting Backend"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    echo "  Error: Please run this script from the magna-ai-backend directory"
    echo "   cd magna-coders/magna-ai-backend"
    exit 1
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "  Error: backend/.env file not found"
    echo "   Please create it with your configuration"
    echo "   See QUICK_START.md for details"
    exit 1
fi

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "   Error: conda not found"
    echo "   Please install Miniconda or Anaconda"
    echo "   Or run with Python venv instead"
    exit 1
fi

# Check if magna_ai environment exists
if ! conda env list | grep -q "magna_ai"; then
    echo "  Error: conda environment 'magna_ai' not found"
    echo ""
    echo "Please run the setup script first:"
    echo "   ./setup_conda.sh"
    echo ""
    exit 1
fi

# Activate conda environment
echo "Activating conda environment 'magna_ai'..."
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate magna_ai

if [ $? -ne 0 ]; then
    echo " Failed to activate conda environment"
    exit 1
fi

echo "✓ Environment activated: $(which python)"
echo ""

# Install aiosqlite if not present (needed for SQLite async support)
if ! python -c "import aiosqlite" 2>/dev/null; then
    echo " Installing aiosqlite..."
    pip install aiosqlite==0.20.0 -q
    echo "✓ aiosqlite installed"
    echo ""
fi

# Check if Gemini API key is configured
if grep -q "your_gemini_api_key_here" backend/.env; then
    echo " WARNING: Gemini API key not configured"
    echo "   Please update backend/.env with your actual API key"
    echo "   Get one from: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "  Starting Magna AI Agent backend..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/api/docs"
echo "   Health: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run using uvicorn (proper way for FastAPI)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
