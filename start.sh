#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

green()  { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

# Trap Ctrl+C to kill both background processes
cleanup() {
  yellow "\nStopping all services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  green "All services stopped."
}
trap cleanup INT TERM

green "Starting PublisherOS..."
echo ""
echo "  Backend   →  http://localhost:8000"
echo "  Frontend  →  http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Start backend
cd "$ROOT/PublisherOS-Backend"
npm run dev &
BACKEND_PID=$!

# Start frontend
cd "$ROOT/PublisherOS-Frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for both
wait "$BACKEND_PID" "$FRONTEND_PID"
