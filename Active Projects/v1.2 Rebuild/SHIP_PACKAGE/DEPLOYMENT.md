# KRAKEN V1.2 — DEPLOYMENT GUIDE

**For:** Vanilla build agent with no prior context
**Version:** 1.2.0
**Classification:** Deployment Documentation

---

## DEPLOYMENT PHILOSOPHY

**Container First, Local Second**

```
Container Testing → Local Deployment
     ✅ PASS              ❌ NEVER
```

**Rule:** NOTHING on local device until ALL container tests pass.

---

## PHASE 1: CONTAINER TESTING (REQUIRED)

### Why Container Testing is Mandatory

1. **No local modifications** during testing
2. **Identical environment** every time
3. **Catches issues** before local deployment
4. **Verified execution** of executeOnAgent

### Step 1.1: Build Container Image

```bash
cd SHIP_PACKAGE/container

# Build the image
docker build -t kraken-v1.2-test:latest -f Dockerfile .
```

**Expected output:**
```
[1/15] FROM ghcr.io/anomalyco/opencode:latest
...
[15/15] RUN mkdir -p /root/.shark/evidence
 => naming to docker.io/library/kraken-v1.2-test:latest done
```

### Step 1.2: Run Container Verification

```bash
# Quick load test
docker run --rm kraken-v1.2-test:latest opencode run "hello" 2>&1 | head -30

# Should see:
# [PlanningBrain] Initializing...
# [PlanningBrain] Initialized
# [ExecutionBrain] Initialized
# [SystemBrain] Initialized
```

### Step 1.3: Interactive TUI Test

```bash
# Start interactive TUI
docker run -it kraken-v1.2-test:latest

# Inside TUI, run verification commands:
```

#### TUI Verification Commands

```bash
# 1. Check brain status
kraken_brain_status

# Expected output:
# Planning Brain: initialized ✅
# Execution Brain: initialized ✅
# System Brain: initialized ✅

# 2. Check cluster status
get_cluster_status

# Expected output:
# Alpha cluster: available
# Beta cluster: available
# Gamma cluster: available

# 3. Check hive status
hive_status

# 4. Check message status
kraken_message_status
```

### Step 1.4: Test Real Execution (executeOnAgent)

```bash
# In TUI, spawn a test agent
spawn_shark_agent { task: "echo test" }

# From host terminal, check for running containers
docker ps

# You should see a new container created by executeOnAgent
```

### Container Test Results

**If ALL checks pass:**
- [ ] Brain initialization messages appear
- [ ] kraken_brain_status shows 3 brains
- [ ] get_cluster_status shows clusters
- [ ] spawn_shark_agent creates Docker containers
- [ ] docker ps shows running containers

**If ANY check fails:**
- Do NOT proceed to local deployment
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Report issue before continuing

---

## PHASE 2: LOCAL DEPLOYMENT (AFTER CONTAINER PASSES)

### CRITICAL PRECONDITIONS

- [ ] All container tests passed
- [ ] No errors in container logs
- [ ] executeOnAgent verified working
- [ ] 3 brains all initializing

### Step 2.1: Export from Container

```bash
# Create archive from container's plugin directory
docker run --rm kraken-v1.2-test:latest tar -C /root/.config/opencode/plugins/kraken-agent -cf - . > /tmp/kraken-v1.2-export.tar

# Verify archive
ls -lh /tmp/kraken-v1.2-export.tar
```

### Step 2.2: Backup Local Config

```bash
# Backup current opencode config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup-$(date +%Y%m%d)

# Backup existing kraken plugin if present
if [ -d ~/.config/opencode/plugins/kraken-agent ]; then
    cp -r ~/.config/opencode/plugins/kraken-agent ~/.config/opencode/plugins/kraken-agent.backup
fi
```

### Step 2.3: Install to Local

```bash
# Create plugin directory
mkdir -p ~/.config/opencode/plugins/kraken-agent-v1.2

# Extract archive
tar -xf /tmp/kraken-v1.2-export.tar -C ~/.config/opencode/plugins/kraken-agent-v1.2

# Verify extraction
ls -la ~/.config/opencode/plugins/kraken-agent-v1.2/
```

### Step 2.4: Configure opencode.json

```bash
# Get home path
HOME_PATH=$(echo $HOME)

# Create new config with full paths
cat > ~/.config/opencode/opencode.json << EOF
{
  "plugin": [
    "file://${HOME_PATH}/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js"
  ]
}
EOF

# Verify config
cat ~/.config/opencode/opencode.json
```

### Step 2.5: Local Verification

```bash
# Run opencode
opencode --agent kraken

# In TUI, verify:
kraken_brain_status

# Should show same 3 brains as container
```

### Step 2.6: Functional Test

```bash
# In TUI:
hive_status
get_cluster_status
spawn_shark_agent { task: "echo local test" }

# On host:
docker ps

# Should show container from local execution
```

---

## PHASE 3: ROLLBACK

### If Local Deployment Fails

```bash
# Remove failed installation
rm -rf ~/.config/opencode/plugins/kraken-agent-v1.2

# Restore backup
if [ -d ~/.config/opencode/plugins/kraken-agent.backup ]; then
    mv ~/.config/opencode/plugins/kraken-agent.backup ~/.config/opencode/plugins/kraken-agent
fi

# Restore config
cp ~/.config/opencode/opencode.json.backup-$(date +%Y%m%d) ~/.config/opencode/opencode.json

# Verify rollback
opencode --agent kraken
```

---

## DEPLOYMENT OPTIONS

### Option 1: Development Deployment

For development with live reloading:

```bash
# Use symlink to source
ln -sf /path/to/SHIP_PACKAGE/dist/index.js ~/.config/opencode/plugins/kraken-agent/dist/index.js
```

### Option 2: Production Deployment

For production with fixed version:

```bash
# Use archive export method (Phase 2)
```

### Option 3: Docker-Only Deployment

Never install locally, always run in container:

```bash
# Create alias
alias kraken='docker run -it kraken-v1.2-test:latest'

# Use
kraken
```

---

## POST-DEPLOYMENT

### Verify Installation

See [VERIFICATION.md](VERIFICATION.md) for complete checklist.

### Common First Commands

```bash
# Check brain status
kraken_brain_status

# View agent status
kraken_status

# Check clusters
get_cluster_status

# View hive context
hive_context { query: "recent tasks" }

# Spawn test agent
spawn_shark_agent { task: "test echo hello" }
```

---

## ENVIRONMENT VARIABLES

### Kraken-Specific

| Variable | Default | Purpose |
|----------|---------|---------|
| KRAKEN_CONTAINER | false | Running in container |
| KRAKEN_PLUGIN_DIR | ~/.config/opencode/plugins/kraken-agent | Plugin directory |
| KRAKEN_ALLOWED_PATHS | /workspace,/tmp | Allowed file paths |
| OPENCODE_WORKSPACE | ~/opencode-workspace | Working directory |

### Docker Runtime

| Variable | Purpose |
|----------|---------|
| DOCKER_HOST | Docker daemon socket |
| DOCKER_BUILDKIT | Enable buildkit |

---

## NEXT STEPS

1. Complete [VERIFICATION.md](VERIFICATION.md) checklist
2. Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Read [ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

**END DEPLOYMENT GUIDE**