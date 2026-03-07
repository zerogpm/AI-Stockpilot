#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS_FILE="$SCRIPT_DIR/.pids"

if [ -f "$PIDS_FILE" ]; then
  echo "App appears to be running already. Run ./stop.sh first."
  exit 1
fi

# Start backend
cd "$SCRIPT_DIR/backend"
node server.js &
BACKEND_PID=$!

# Start frontend
cd "$SCRIPT_DIR/frontend"
npx vite --host &
FRONTEND_PID=$!

# Save PIDs
echo "$BACKEND_PID" > "$PIDS_FILE"
echo "$FRONTEND_PID" >> "$PIDS_FILE"

echo ""
echo "Stock Analysis Dashboard started!"
echo "  Backend:  http://localhost:3001  (PID: $BACKEND_PID)"
echo "  Frontend: http://localhost:5173  (PID: $FRONTEND_PID)"
echo ""
echo "Run ./stop.sh to stop both servers."
