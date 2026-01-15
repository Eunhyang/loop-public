#!/bin/bash
# Start API Server for LOOP Dashboard
# Usage: ./scripts/start_api_server.sh

set -e

VAULT_DIR="/Volumes/LOOP_CORE/vault/LOOP"
PORT=8081

cd "$VAULT_DIR"

echo "🚀 Starting LOOP Dashboard API Server..."
echo "📁 Vault: $VAULT_DIR"
echo "🌐 Port: $PORT"
echo ""

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry not found. Installing..."
    curl -sSL https://install.python-poetry.org | python3 -
fi

# Check if dependencies are installed
if ! poetry run python -c "import fastapi" &> /dev/null; then
    echo "⚠️  API dependencies not installed. Installing..."
    poetry install --extras api
fi

echo "✅ Starting server..."
echo "   API: http://localhost:$PORT"
echo "   Docs: http://localhost:$PORT/docs"
echo ""
echo "Press CTRL+C to stop"
echo ""

poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port $PORT
