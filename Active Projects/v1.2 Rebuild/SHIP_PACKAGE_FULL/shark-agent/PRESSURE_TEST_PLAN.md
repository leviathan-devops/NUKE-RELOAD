# Token Burn Pressure Test Plan

## Test Harness: shark-agent-v4.7-hotfix

## What We Can Measure
- Memory (RSS) via `ps`
- Command success/failure
- Response times
- System stability

## What We CANNOT Measure (transparently)
- Direct token counts (OpenCode CLI doesn't expose this)

## Test Stages

### Stage 1: Baseline Memory
- Start fresh session
- Measure memory before any commands

### Stage 2: Tool Output Flood
- Run commands that generate large outputs
- Multiple grep, ls, read operations
- Measure memory after

### Stage 3: Conversation Length Stress
- Run 20+ message turns
- Each turn executes tools
- Measure memory growth

### Stage 4: Parallel Agent Stress
- If possible, run multiple shark sessions
- Measure combined memory

---

## Execution

```bash
# STAGE 1: Baseline
# Start opencode session, measure memory of .opencode process

# STAGE 2: Tool Flood
# Execute: multiple grep -r, ls -R, read large files
# Measure memory after each

# STAGE 3: Conversation Length
# Run 20+ iterative commands
# Measure memory per turn

# STAGE 4: Parallel
# Run 3 shark sessions simultaneously
# Measure total memory
```