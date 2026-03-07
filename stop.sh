#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS_FILE="$SCRIPT_DIR/.pids"

if [ ! -f "$PIDS_FILE" ]; then
  echo "No .pids file found. App may not be running."
  exit 1
fi

while read -r PID; do
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    echo "Stopped process $PID"
  else
    echo "Process $PID already stopped"
  fi
done < "$PIDS_FILE"

rm -f "$PIDS_FILE"
echo "App stopped."
