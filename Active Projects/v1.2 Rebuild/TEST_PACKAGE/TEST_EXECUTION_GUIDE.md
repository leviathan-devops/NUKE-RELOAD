# KRAKEN V1.2 — TEST EXECUTION GUIDE

## Prerequisites

1. Kraken v1.2 deployed: `~/.config/opencode/plugins/kraken-v1.2/`
2. Identity files present: `~/.config/opencode/plugins/kraken-v1.2/identity/`
3. All supporting plugins installed

## Critical: Use TUI Mode

**ALWAYS use TUI mode: `opencode --agent kraken`**

`opencode run` does NOT fire hooks - results will be invalid.

## Quick Start

```bash
# 1. Start TUI
opencode --agent kraken

# 2. Run each test from TEST_SUITE.md
#    Enter the prompt/command listed
#    Record actual output
#    Mark PASS/FAIL

# 3. Update this results file
```

## Test Execution Order

### Phase 1: Boot Tests (10 tests)
Run these first - if these fail, nothing else matters.

```bash
opencode debug config 2>&1 | grep "kraken-agent"
opencode debug config 2>&1 | grep "PlanningBrain"
opencode debug config 2>&1 | grep "ExecutionBrain"
opencode debug config 2>&1 | grep "SystemBrain"
opencode debug config 2>&1 | grep "Agents registered"
```

### Phase 2: Identity Tests (10 tests)
These verify identity is loaded and active.

```bash
opencode --agent kraken
# Then enter prompts from KRAKEN-101 through KRAKEN-110
```

### Phase 3: Tool Tests (15 tests)
Basic functionality tests.

### Phase 4: Delegation Tests (15 tests)
Critical for verifying orchestration works.

### Phase 5: Cluster Tests (10 tests)
### Phase 6: HiveMind Tests (10 tests)
### Phase 7: Parallel Tests (10 tests)
### Phase 8: Brain Coordination Tests (10 tests)
### Phase 9: Behavioral Tests (15 tests)
### Phase 10: Integration Tests (20 tests)
### Phase 11: Regression Tests (10 tests)

## Recording Results

For each test:

1. **Copy** the test block from TEST_SUITE.md
2. **Execute** the command/prompt in TUI
3. **Record** actual output
4. **Compare** to expected
5. **Mark** PASS/FAIL/BLOCKED/CANNOT_TEST
6. **Sign** with tester name and date

## Expected Time

| Phase | Tests | Est. Time |
|-------|-------|-----------|
| 1. Boot | 10 | 5 min |
| 2. Identity | 10 | 15 min |
| 3. Tool | 15 | 20 min |
| 4. Delegation | 15 | 30 min |
| 5. Cluster | 10 | 15 min |
| 6. HiveMind | 10 | 15 min |
| 7. Parallel | 10 | 20 min |
| 8. Brain | 10 | 15 min |
| 9. Behavioral | 15 | 30 min |
| 10. Integration | 20 | 45 min |
| 11. Regression | 10 | 20 min |
| **TOTAL** | **135** | **~4 hours** |

## Pass Criteria

- **Boot**: 10/10 must pass
- **Identity**: 10/10 must pass
- **Tool**: 14/15 can fail (at least 1 pass)
- **Delegation**: 12/15 minimum (core functionality)
- **Cluster**: 8/10 minimum
- **HiveMind**: 8/10 minimum
- **Parallel**: 8/10 minimum
- **Brain**: 8/10 minimum
- **Behavioral**: 12/15 minimum
- **Integration**: 15/20 minimum
- **Regression**: 10/10 must pass (no breakage)

**Overall**: 115/135 (85%) minimum for ship readiness