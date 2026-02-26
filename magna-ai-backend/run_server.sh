#!/bin/bash
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate magna_ai
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
