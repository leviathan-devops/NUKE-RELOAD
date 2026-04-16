#!/bin/bash
# Kraken V1.2 — Container Build Script
# Builds self-contained Docker image for TUI testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== KRAKEN V1.2 CONTAINER BUILD ==="
echo "Project: $PROJECT_DIR"
echo ""

# Verify prerequisites
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found. Install Docker first."
    exit 1
fi

# Verify bundle exists
if [ ! -f "$PROJECT_DIR/dist/index.js" ]; then
    echo "ERROR: Bundle not found at $PROJECT_DIR/dist/index.js"
    echo "Run 'bun run build' first."
    exit 1
fi

echo "Bundle found: $(ls -lh "$PROJECT_DIR/dist/index.js" | awk '{print $5}')"
echo ""

# Verify container-plugins exists
if [ ! -d "$PROJECT_DIR/container-plugins" ]; then
    echo "ERROR: container-plugins not found at $PROJECT_DIR/container-plugins"
    echo "Copy required plugins first."
    exit 1
fi

echo "Plugins found:"
ls -la "$PROJECT_DIR/container-plugins/"
echo ""

# Build Docker image
echo "Building Docker image..."
cd "$PROJECT_DIR"

docker build \
    -t kraken-v1.2-test:latest \
    -f container/Dockerfile \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo "=== BUILD SUCCESSFUL ==="
    echo "Image: kraken-v1.2-test:latest"
    echo ""
    echo "To run TUI test:"
    echo "  docker run -it kraken-v1.2-test:latest"
    echo ""
    echo "To run headless test:"
    echo "  docker run --rm kraken-v1.2-test:latest opencode run \"hello\""
else
    echo ""
    echo "=== BUILD FAILED ==="
    exit 1
fi