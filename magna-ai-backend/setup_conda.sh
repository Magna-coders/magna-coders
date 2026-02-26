#!/bin/bash

# Conda Environment Setup Script for Magna AI Agent

echo "=========================================="
echo "  Magna AI Agent - Conda Setup"
echo "=========================================="
echo ""

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "   Error: conda not found"
    echo "   Please install Miniconda or Anaconda first"
    echo "   https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

echo "✓ Conda found: $(conda --version)"
echo ""

# Check if environment already exists
if conda env list | grep -q "magna_ai"; then
    echo " Environment 'magna_ai' already exists"
    read -p "Do you want to remove and recreate it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo " Removing existing environment..."
        conda env remove -n magna_ai -y
    else
        echo "Using existing environment"
        conda activate magna_ai
        echo "✓ Environment activated"
        exit 0
    fi
fi

echo " Creating conda environment 'magna_ai'..."
conda create -n magna_ai python=3.11 -y

if [ $? -ne 0 ]; then
    echo " Failed to create conda environment"
    exit 1
fi

echo "✓ Environment created"
echo ""

echo "Activating environment..."
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate magna_ai

if [ $? -ne  Failed to activate environment"
    exit 1
fi

echo "✓ Environment activated"
echo ""

echo "Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo " Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

echo "=========================================="
echo " Setup Complete!"
echo "=========================================="
echo ""
echo "To use the Magna AI Agent:"
echo ""
echo "1. Activate the environment:"
echo "   conda activate magna_ai"
echo ""
echo "2. Start the backend:"
echo "   ./start.sh"
echo ""
echo "Or simply run:"
echo "   ./start.sh"
echo ""
echo "The script will automatically activate the environment."
echo ""
