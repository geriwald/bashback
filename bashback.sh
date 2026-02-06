#!/bin/bash
# bashback launcher for Linux
# Place this anywhere and run it, or create a .desktop shortcut

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start container
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d

# Wait for server
echo "Starting bashback..."
for i in $(seq 1 10); do
  curl -s http://localhost:3001/api/health >/dev/null 2>&1 && break
  sleep 0.5
done

# Open browser
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:3001
elif command -v open >/dev/null 2>&1; then
  open http://localhost:3001
else
  echo "Open http://localhost:3001 in your browser"
fi

echo "bashback is running on http://localhost:3001"
echo "To stop: docker compose -f $SCRIPT_DIR/docker-compose.yml down"
