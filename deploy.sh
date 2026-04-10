#!/bin/bash
# DSIP MapManager - Deploy Script
# Run as: sudo -u djooga bash /home/djooga/maps/deploy.sh

set -e

APP_DIR="/home/djooga/maps"
cd "$APP_DIR"

echo "=== DSIP Deploy ==="
echo "$(date)"

# Pull latest code
echo ">> Pulling from git..."
git pull origin main

# Rebuild and restart container
echo ">> Building Docker image..."
docker compose build --no-cache

echo ">> Restarting container..."
docker compose down
docker compose up -d

echo ">> Waiting for health check..."
sleep 5
if docker compose ps | grep -q "healthy\|running"; then
  echo "✓ DSIP is running!"
  docker compose logs --tail 5
else
  echo "✗ Something went wrong:"
  docker compose logs --tail 20
  exit 1
fi

echo "=== Deploy complete ==="
