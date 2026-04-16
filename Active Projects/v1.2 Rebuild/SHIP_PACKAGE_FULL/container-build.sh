#!/bin/bash
# Kraken V1.2 Container Build Script
# Builds self-contained Docker image for TUI testing

set -e

PROJECT_DIR="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild"
BUILD_CONTEXT="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects"

echo "=== KRAKEN V1.2 CONTAINER BUILD ==="
echo "Project: $PROJECT_DIR"
echo "Build context: $BUILD_CONTEXT"
echo ""

# Verify required files exist
echo "Checking bundle..."
if [ ! -f "$PROJECT_DIR/dist/index.js" ]; then
    echo "ERROR: Bundle not found at $PROJECT_DIR/dist/index.js"
    exit 1
fi
echo "Bundle found: $(ls -lh "$PROJECT_DIR/dist/index.js" | awk '{print $5}')"

echo ""
echo "Checking container-plugins..."
if [ ! -d "$PROJECT_DIR/container-plugins" ]; then
    echo "ERROR: container-plugins not found"
    exit 1
fi
echo "Plugins found:"
ls -la "$PROJECT_DIR/container-plugins/"

echo ""
echo "Building Docker image..."
cd "$BUILD_CONTEXT"

# Use -f flag to specify Dockerfile location
docker build \
    -t kraken-v1.2-test:latest \
    -f "v1.2 Rebuild/container/Dockerfile" \
    .

echo ""
echo "=== BUILD COMPLETE ==="
echo "Image: kraken-v1.2-test:latest"
echo ""
echo "To run TUI test:"
echo "  docker run -it --rm kraken-v1.2-test:latest sh -c 'opencode --agent kraken'"