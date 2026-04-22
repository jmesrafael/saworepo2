#!/bin/bash
# Auto-sync images and products.json from working directory to git repo and commit

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$REPO_DIR/../saworepo1/saworepo2"
ADMIN_DATA_DIR="$REPO_DIR/../saworepo1/sawo-main/frontend/src/Administrator/Local/data"

cd "$REPO_DIR" || exit 1

# Function to check if there are changes
has_changes() {
  git status --porcelain | grep -q .
  return $?
}

# Sync images from working directory
if [ -d "$WORK_DIR/images" ]; then
  echo "📸 Syncing images..."
  cp -u "$WORK_DIR/images"/*.webp images/ 2>/dev/null || true
fi

# Sync products.json if it exists
if [ -f "$ADMIN_DATA_DIR/products.json" ]; then
  echo "📋 Syncing products.json..."
  cp -u "$ADMIN_DATA_DIR/products.json" products.json
fi

# Stage all changes
if has_changes; then
  echo "🔄 Found changes, staging..."
  git add -A

  # Create commit with timestamp
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git commit -m "Auto-sync: Product images and data [$TIMESTAMP]" --quiet

  if [ $? -eq 0 ]; then
    echo "✅ Committed changes successfully"
    echo "📤 Pushing to remote..."
    git push origin main --quiet
    if [ $? -eq 0 ]; then
      echo "✅ Pushed to remote"
    else
      echo "⚠️  Push failed (network issue?)"
    fi
  else
    echo "⚠️  No new changes to commit"
  fi
else
  echo "✅ No changes detected"
fi
