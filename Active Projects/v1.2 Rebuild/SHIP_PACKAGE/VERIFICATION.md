# KRAKEN V1.2 — VERIFICATION CHECKLIST

**For:** Vanilla build agent with no prior context
**Version:** 1.2.0
**Classification:** Verification Documentation

---

## PRE-INSTALLATION VERIFICATION

### Bundle Integrity

- [ ] Bundle file exists: `dist/index.js`
- [ ] Bundle size: 555,061 bytes
- [ ] No simulateTaskExecution references: `grep -c "simulateTaskExecution" dist/index.js` returns `0`
- [ ] executeOnAgent present: `grep -c "executeOnAgent" dist/index.js` returns `2`
- [ ] Brain infrastructure present:
  - [ ] PlanningBrain: `grep -c "PlanningBrain" dist/index.js` > 0
  - [ ] ExecutionBrain: `grep -c "ExecutionBrain" dist/index.js` > 0
  - [ ] SystemBrain: `grep -c "SystemBrain" dist/index.js` > 0
  - [ ] BrainMessenger: `grep -c "BrainMessenger" dist/index.js` > 0

### Container Image

- [ ] Image builds successfully: `docker build -t kraken-v1.2-test:latest -f Dockerfile .`
- [ ] Image exists: `docker images kraken-v1.2-test:latest`
- [ ] Image size reasonable: < 5GB

---

## CONTAINER TESTING VERIFICATION

### Phase 1: Container Load Test

```bash
docker run --rm kraken-v1.2-test:latest opencode run "hello" 2>&1 | head -30
```

**Expected:**
```
[INFO] CodingSubagents initialized
[INFO] OpenCodeSubagentManager initialized
[INFO] OpenCodePluginEngineering initialized
[v4.1][kraken-agent] Initializing Kraken Agent Harness {
  clusters: 3,
  agents: 11,
}
[PlanningBrain] Initializing...
[PlanningBrain] Initialized - owns planning-state, context-bridge
[ExecutionBrain] Initializing...
[ExecutionBrain] Initialized - owns execution-state, quality-state
[SystemBrain] Initializing...
[SystemBrain] Initialized - owns workflow-state, security-state
[v4.1][kraken-agent] [V1.2] Multi-Brain Orchestrator initialized {
  planning: true,
  execution: true,
  system: true,
}
```

**Checkmarks:**
- [ ] CodingSubagents initialized
- [ ] OpenCodeSubagentManager initialized
- [ ] OpenCodePluginEngineering initialized
- [ ] Kraken Agent Harness initialized (clusters: 3, agents: 11)
- [ ] PlanningBrain Initialized
- [ ] ExecutionBrain Initialized
- [ ] SystemBrain Initialized
- [ ] Multi-Brain Orchestrator initialized (all 3 brains: true)

### Phase 2: Interactive TUI Test

```bash
docker run -it kraken-v1.2-test:latest
```

**In TUI, run these commands:**

#### Command 1: kraken_brain_status

```
kraken_brain_status
```

**Expected output:**
```
Planning Brain:
  initialized: true
  owns: planning-state, context-bridge

Execution Brain:
  initialized: true
  owns: execution-state, quality-state

System Brain:
  initialized: true
  owns: workflow-state, security-state
```

**Checkmarks:**
- [ ] Command recognized
- [ ] Planning Brain: initialized: true
- [ ] Execution Brain: initialized: true
- [ ] System Brain: initialized: true

#### Command 2: hive_status

```
hive_status
```

**Expected:** Shows hive context connection

**Checkmarks:**
- [ ] Command recognized
- [ ] Returns status (not error)

#### Command 3: get_cluster_status

```
get_cluster_status
```

**Expected:**
```
Alpha cluster: available
Beta cluster: available
Gamma cluster: available
```

**Checkmarks:**
- [ ] Alpha cluster: available
- [ ] Beta cluster: available
- [ ] Gamma cluster: available

#### Command 4: kraken_message_status

```
kraken_message_status
```

**Expected:** Shows message queue (may be empty initially)

**Checkmarks:**
- [ ] Command recognized
- [ ] Returns queue status

### Phase 3: Real Execution Test

```bash
# In TUI:
spawn_shark_agent { task: "echo test" }
```

**From host terminal:**
```bash
docker ps
```

**Expected:**
- [ ] New container created
- [ ] Container running (status: Up)
- [ ] Container created by executeOnAgent (not simulateTaskExecution)

**Checkmarks:**
- [ ] Container created
- [ ] Container shows in `docker ps`
- [ ] Container has kraken-related name

### Phase 4: Cleanup Verification

```bash
# In TUI, exit
exit

# Check container stopped
docker ps
```

**Expected:**
- [ ] Container exited gracefully
- [ ] No zombie processes

---

## LOCAL DEPLOYMENT VERIFICATION

### Prerequisites

- [ ] All container tests passed
- [ ] Container exported: `docker run --rm kraken-v1.2-test:latest tar ... > /tmp/kraken.tar`
- [ ] Archive extracted to: `~/.config/opencode/plugins/kraken-agent-v1.2/`

### Installation Verification

```bash
ls -la ~/.config/opencode/plugins/kraken-agent-v1.2/
```

**Checkmarks:**
- [ ] Directory exists
- [ ] Contains `dist/` directory
- [ ] Contains `dist/index.js`
- [ ] Size: 555,061 bytes

### Config Verification

```bash
cat ~/.config/opencode/opencode.json
```

**Checkmarks:**
- [ ] Valid JSON
- [ ] Contains `plugin` array
- [ ] Contains path to kraken-agent-v1.2

### Local Load Test

```bash
opencode run "hello" 2>&1 | head -30
```

**Expected:** Same output as container load test

**Checkmarks:**
- [ ] Plugin loads
- [ ] All 3 brains initialize
- [ ] No errors

### Local Interactive Test

```bash
opencode --agent kraken
```

**In TUI:**
- [ ] kraken_brain_status works
- [ ] get_cluster_status works
- [ ] hive_status works

### Local Execution Test

```bash
# In TUI:
spawn_shark_agent { task: "echo local" }

# From terminal:
docker ps
```

**Checkmarks:**
- [ ] Container created on local (not container)
- [ ] executeOnAgent working (not simulateTaskExecution)

---

## FINAL VERIFICATION CHECKLIST

### All Tests Pass

- [ ] Bundle integrity verified
- [ ] Container builds successfully
- [ ] Container load test passes
- [ ] TUI loads without errors
- [ ] kraken_brain_status shows 3 brains
- [ ] get_cluster_status shows 3 clusters
- [ ] hive_status works
- [ ] kraken_message_status works
- [ ] spawn_shark_agent creates real containers
- [ ] Local deployment successful
- [ ] Local execution works

### Alignment Bible Compliance

- [ ] executeOnAgent used (NOT simulateTaskExecution)
- [ ] Hooks are async functions (NOT arrays)
- [ ] State cleanup on session.ended
- [ ] Container testing completed

---

## VERIFICATION COMMANDS REFERENCE

```bash
# Bundle checks
wc -c dist/index.js                    # Should be 555061
grep -c "simulateTaskExecution" dist/index.js  # Should be 0
grep -c "executeOnAgent" dist/index.js         # Should be 2

# Container checks
docker images kraken-v1.2-test:latest
docker run --rm kraken-v1.2-test:latest opencode run "hello" 2>&1 | grep -i brain

# Local checks
ls -la ~/.config/opencode/plugins/kraken-agent-v1.2/dist/
cat ~/.config/opencode/opencode.json

# Runtime checks
opencode --agent kraken
# In TUI: kraken_brain_status, get_cluster_status, hive_status
```

---

## SUCCESS CRITERIA

**Deployment is successful when:**

1. All bundle checks pass
2. All container tests pass
3. All local tests pass
4. All 3 brains initialize
5. executeOnAgent creates real containers
6. No errors in logs

**If ANY criterion fails, do NOT proceed to production use.**

---

**END VERIFICATION CHECKLIST**