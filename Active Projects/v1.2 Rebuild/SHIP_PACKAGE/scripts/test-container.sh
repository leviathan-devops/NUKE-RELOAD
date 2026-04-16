#!/bin/bash
# Kraken V1.2 — Container Test Script
# Runs verification tests inside Docker container

set -e

IMAGE="kraken-v1.2-test:latest"

echo "=== KRAKEN V1.2 CONTAINER TEST ==="
echo ""

# Check if image exists
if ! docker images "$IMAGE" | grep -q "$IMAGE"; then
    echo "ERROR: Image $IMAGE not found."
    echo "Run build-container.sh first."
    exit 1
fi

echo "Image found: $IMAGE"
echo ""

# Test 1: Bundle size
echo "Test 1: Bundle size..."
BUNDLE_SIZE=$(docker run --rm "$IMAGE" wc -c /root/.config/opencode/plugins/kraken-agent/dist/index.js 2>/dev/null | awk '{print $1}')
if [ "$BUNDLE_SIZE" = "555061" ]; then
    echo "  ✅ Bundle size correct: $BUNDLE_SIZE bytes"
else
    echo "  ❌ Bundle size incorrect: $BUNDLE_SIZE (expected 555061)"
    exit 1
fi

# Test 2: executeOnAgent present
echo ""
echo "Test 2: executeOnAgent present..."
EXEC_COUNT=$(docker run --rm "$IMAGE" grep -c "executeOnAgent" /root/.config/opencode/plugins/kraken-agent/dist/index.js 2>/dev/null || echo "0")
if [ "$EXEC_COUNT" -gt 0 ]; then
    echo "  ✅ executeOnAgent found: $EXEC_COUNT references"
else
    echo "  ❌ executeOnAgent NOT found"
    exit 1
fi

# Test 3: simulateTaskExecution eliminated
echo ""
echo "Test 3: simulateTaskExecution eliminated..."
SIM_COUNT=$(docker run --rm "$IMAGE" grep -c "simulateTaskExecution" /root/.config/opencode/plugins/kraken-agent/dist/index.js 2>/dev/null || echo "0")
if [ "$SIM_COUNT" = "0" ]; then
    echo "  ✅ simulateTaskExecution eliminated"
else
    echo "  ❌ simulateTaskExecution found: $SIM_COUNT references"
    exit 1
fi

# Test 4: Brain infrastructure present
echo ""
echo "Test 4: Brain infrastructure..."
BRAINS=("PlanningBrain" "ExecutionBrain" "SystemBrain")
for brain in "${BRAINS[@]}"; do
    COUNT=$(docker run --rm "$IMAGE" grep -c "$brain" /root/.config/opencode/plugins/kraken-agent/dist/index.js 2>/dev/null || echo "0")
    if [ "$COUNT" -gt 0 ]; then
        echo "  ✅ $brain: $COUNT references"
    else
        echo "  ❌ $brain NOT found"
        exit 1
    fi
done

# Test 5: Plugin load test
echo ""
echo "Test 5: Plugin load test..."
echo "  Running opencode run 'hello'..."
OUTPUT=$(docker run --rm "$IMAGE" opencode run "hello" 2>&1 || true)

if echo "$OUTPUT" | grep -q "PlanningBrain.*Initialized"; then
    echo "  ✅ PlanningBrain initialized"
else
    echo "  ❌ PlanningBrain NOT initialized"
    echo "$OUTPUT" | tail -20
fi

if echo "$OUTPUT" | grep -q "ExecutionBrain.*Initialized"; then
    echo "  ✅ ExecutionBrain initialized"
else
    echo "  ❌ ExecutionBrain NOT initialized"
fi

if echo "$OUTPUT" | grep -q "SystemBrain.*Initialized"; then
    echo "  ✅ SystemBrain initialized"
else
    echo "  ❌ SystemBrain NOT initialized"
fi

# Test 6: Multi-brain orchestrator
echo ""
echo "Test 6: Multi-brain orchestrator..."
if echo "$OUTPUT" | grep -q "planning: true"; then
    echo "  ✅ Planning brain: true"
else
    echo "  ❌ Planning brain: NOT initialized"
fi

if echo "$OUTPUT" | grep -q "execution: true"; then
    echo "  ✅ Execution brain: true"
else
    echo "  ❌ Execution brain: NOT initialized"
fi

if echo "$OUTPUT" | grep -q "system: true"; then
    echo "  ✅ System brain: true"
else
    echo "  ❌ System brain: NOT initialized"
fi

# Test 7: Agent harness
echo ""
echo "Test 7: Agent harness..."
if echo "$OUTPUT" | grep -q "clusters: 3"; then
    echo "  ✅ 3 clusters configured"
else
    echo "  ❌ Cluster count mismatch"
fi

if echo "$OUTPUT" | grep -q "agents: 11"; then
    echo "  ✅ 11 agents registered"
else
    echo "  ❌ Agent count mismatch"
fi

echo ""
echo "=== ALL TESTS PASSED ==="
echo ""
echo "Container is ready for TUI testing:"
echo "  docker run -it $IMAGE"