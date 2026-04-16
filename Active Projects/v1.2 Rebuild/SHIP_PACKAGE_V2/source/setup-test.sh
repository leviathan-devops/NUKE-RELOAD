#!/bin/bash
# Kraken V1.2 TUI Test Setup
# Creates isolated test config for container TUI testing

set -e

PROJECT_DIR="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild"
TEST_DIR="/tmp/kraken-tui-test-$(date +%s)"

echo "=========================================="
echo "KRAKEN V1.2 TUI TEST SETUP"
echo "=========================================="
echo ""

# Create test directory
mkdir -p "$TEST_DIR/config/plugins"
echo "[1/6] Created test directory: $TEST_DIR"

# Create opencode.json with ONLY kraken plugin
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-agent/dist/index.js"
  ]
}
EOF
echo "[2/6] Created opencode.json"

# Copy plugin
PLUGIN_DIR="$PROJECT_DIR"
mkdir -p "$TEST_DIR/config/plugins/kraken-agent"
cp -r "$PROJECT_DIR/dist" "$TEST_DIR/config/plugins/kraken-agent/"
cp -r "$PROJECT_DIR/identity" "$TEST_DIR/config/plugins/kraken-agent/"
cp -r "$PROJECT_DIR/subagent-manager" "$TEST_DIR/config/plugins/kraken-agent/" 2>/dev/null || true
cp -r "$PROJECT_DIR/wrappers" "$TEST_DIR/config/plugins/kraken-agent/" 2>/dev/null || true
echo "[3/6] Copied plugin files"

# Create evidence directory
mkdir -p "$TEST_DIR/config/.shark/evidence"
mkdir -p "$TEST_DIR/workspace"
echo "[4/6] Created evidence and workspace directories"

# Verify config
echo "[5/6] Config structure:"
find "$TEST_DIR" -type f | head -20

echo "[6/6] Test directory: $TEST_DIR"
echo ""
echo "=========================================="
echo "TO RUN TUI TEST:"
echo "=========================================="
echo ""
echo "docker run -it --rm \\"
echo "  --name kraken-tui-test \\"
echo "  -v \"$TEST_DIR/config:/root/.config/opencode\" \\"
echo "  -v \"$TEST_DIR/workspace:/workspace\" \\"
echo "  opencode-test:1.4.6"
echo ""
echo "Then in TUI, select 'kraken' agent and test:"
echo "- Does it say 'You ARE the Kraken orchestrator'?"
echo "- Does it use spawn_shark_agent for multi-file tasks?"
echo ""
echo "=========================================="