#!/bin/bash
# Kraken V1.2 — Local Deployment Script
# Deploys from container to local device (AFTER container tests pass)

set -e

IMAGE="kraken-v1.2-test:latest"
LOCAL_DIR="$HOME/.config/opencode/plugins/kraken-agent-v1.2"
BACKUP_DIR="$HOME/.config/opencode/plugins/kraken-agent-v1.2.backup-$(date +%Y%m%d)"

echo "=== KRAKEN V1.2 LOCAL DEPLOYMENT ==="
echo ""

# Check if image exists
if ! docker images "$IMAGE" | grep -q "$IMAGE"; then
    echo "ERROR: Image $IMAGE not found."
    echo "Run build-container.sh first."
    exit 1
fi

# Warning
echo "⚠️  WARNING: This will modify local opencode configuration."
echo "Local directory: $LOCAL_DIR"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Export from container
echo ""
echo "Step 1: Exporting plugin from container..."
docker run --rm "$IMAGE" tar -C /root/.config/opencode/plugins/kraken-agent -cf - . > /tmp/kraken-v1.2.tar
echo "  ✅ Exported to /tmp/kraken-v1.2.tar"

# Step 2: Backup existing
echo ""
echo "Step 2: Backing up existing installation..."
if [ -d "$LOCAL_DIR" ]; then
    mv "$LOCAL_DIR" "$BACKUP_DIR"
    echo "  ✅ Backed up to $BACKUP_DIR"
else
    echo "  ℹ️  No existing installation found, skipping backup"
fi

# Step 3: Install to local
echo ""
echo "Step 3: Installing to local..."
mkdir -p "$LOCAL_DIR"
tar -xf /tmp/kraken-v1.2.tar -C "$LOCAL_DIR"
echo "  ✅ Installed to $LOCAL_DIR"

# Step 4: Verify
echo ""
echo "Step 4: Verifying installation..."
if [ -f "$LOCAL_DIR/dist/index.js" ]; then
    SIZE=$(wc -c < "$LOCAL_DIR/dist/index.js")
    echo "  ✅ Bundle exists: $SIZE bytes"
else
    echo "  ❌ Bundle NOT found"
    exit 1
fi

# Step 5: Update config
echo ""
echo "Step 5: Updating opencode.json..."

CONFIG_FILE="$HOME/.config/opencode/opencode.json"
CONFIG_BACKUP="$HOME/.config/opencode/opencode.json.backup-$(date +%Y%m%d)"

# Backup existing
cp "$CONFIG_FILE" "$CONFIG_BACKUP"
echo "  ✅ Backed up config to $CONFIG_BACKUP"

# Get home path for config
HOME_PATH="$HOME"

# Create new config
cat > "$CONFIG_FILE" << EOF
{
  "plugin": [
    "file://${HOME_PATH}/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js"
  ]
}
EOF

echo "  ✅ Updated $CONFIG_FILE"

# Step 6: Final verification
echo ""
echo "Step 6: Testing local installation..."
echo "  Run: opencode --agent kraken"
echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "Next steps:"
echo "  1. Run: opencode --agent kraken"
echo "  2. In TUI: kraken_brain_status"
echo "  3. Verify all 3 brains initialized"
echo ""
echo "If issues occur, restore with:"
echo "  cp $CONFIG_BACKUP $CONFIG_FILE"