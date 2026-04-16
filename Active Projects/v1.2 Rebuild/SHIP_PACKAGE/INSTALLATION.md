# KRAKEN V1.2 — DETAILED INSTALLATION GUIDE

**For:** Vanilla build agent with no prior context
**Version:** 1.2.0
**Classification:** Installation Documentation

---

## PREREQUISITES

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Docker | 20.10+ | Container testing |
| opencode | latest | Plugin host |
| bun | 1.0+ | Building from source |
| git | any | Source management |

### Check Prerequisites

```bash
# Check Docker
docker --version

# Check opencode
opencode --version

# Check bun
bun --version

# Verify Docker daemon
docker ps
```

---

## INSTALLATION METHODS

### Method A: Pre-Built Bundle (Fastest)

This method uses the pre-built `dist/index.js` bundle.

#### Step 1: Copy Bundle to Local

```bash
# Create plugin directory
mkdir -p ~/.config/opencode/plugins/kraken-agent-v1.2

# Copy the bundle
cp -r /path/to/SHIP_PACKAGE/dist/* ~/.config/opencode/plugins/kraken-agent-v1.2/

# Verify copy
ls -la ~/.config/opencode/plugins/kraken-agent-v1.2/
```

#### Step 2: Configure opencode

```bash
# Open opencode config
nano ~/.config/opencode/opencode.json
```

Add the plugin:

```json
{
  "plugin": [
    "file:///home/USER/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js"
  ]
}
```

**Note:** Replace `USER` with your username. Get path with:
```bash
echo $HOME
```

#### Step 3: Verify Installation

```bash
# Test plugin loads
opencode --agent kraken

# Inside TUI, check brain status
kraken_brain_status
```

---

### Method B: Build from Source

This method rebuilds the bundle from TypeScript source.

#### Step 1: Install Dependencies

```bash
cd SHIP_PACKAGE

# Install npm dependencies
npm install

# Install bun if not present
curl -fsSL https://bun.sh/install | bash
```

#### Step 2: Build Bundle

```bash
# Using bun (recommended)
bun run build

# Or using npm
npm run build
```

**Expected output:**
```
Bundled 106 modules in 19ms
index.js  0.56 MB  (entry point)
```

#### Step 3: Verify Bundle

```bash
# Check bundle size
wc -c dist/index.js

# Should output: 555061 dist/index.js

# Verify no simulateTaskExecution
grep -c "simulateTaskExecution" dist/index.js
# Should output: 0

# Verify executeOnAgent present
grep -c "executeOnAgent" dist/index.js
# Should output: 2
```

#### Step 4: Continue with Method A Step 2

---

## DOCKER INSTALLATION (CONTAINER TESTING)

### For Vanilla Agent: Building the Container Image

#### Step 1: Prepare Build Context

The Docker build context must be the project directory:

```bash
cd SHIP_PACKAGE/container
```

#### Step 2: Build the Image

```bash
# Build with tag
docker build -t kraken-v1.2-test:latest -f Dockerfile .

# The build will:
# - Base on opencode:latest image
# - Copy all plugins into /root/.config/opencode/plugins/
# - Configure opencode.json with internal paths
```

**Expected build time:** 2-5 minutes

#### Step 3: Verify Image

```bash
# Check image exists
docker images kraken-v1.2-test:latest

# Verify plugins copied
docker run --rm kraken-v1.2-test:latest ls -la /root/.config/opencode/plugins/

# Verify bundle size
docker run --rm kraken-v1.2-test:latest wc -c /root/.config/opencode/plugins/kraken-agent/dist/index.js
# Should output: 555061
```

---

## CONTAINER TESTING PROCEDURE

### Why Container Testing?

1. **Isolation**: No local modifications
2. **Reproducibility**: Same environment every time
3. **Safety**: Catches issues before local deployment
4. **Verification**: Confirms executeOnAgent works

### Running the Container TUI

#### Interactive Mode (Recommended)

```bash
# Run with interactive terminal
docker run -it --rm kraken-v1.2-test:latest

# This opens opencode TUI inside container
# You can now type commands
```

#### Expected Output

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

### Verification Commands in Container TUI

Once inside the TUI, run these commands:

```bash
# Check brain status
kraken_brain_status

# Should show:
# PlanningBrain: initialized
# ExecutionBrain: initialized
# SystemBrain: initialized

# Check cluster status
get_cluster_status

# Should show: alpha, beta, gamma clusters

# Check hive status
hive_status

# Check message status
kraken_message_status
```

### Testing executeOnAgent (Real Docker Spawning)

```bash
# In container TUI, spawn a shark agent
spawn_shark_agent { task: "test echo hello" }

# From host, check if container was created
docker ps -a

# You should see a new container running
```

---

## LOCAL DEPLOYMENT (AFTER CONTAINER TESTS PASS)

### CRITICAL: Test in Container First

**Never deploy directly to local without container testing first.**

### Step 1: Extract from Container

```bash
# Create tar archive from container
docker run --rm kraken-v1.2-test:latest tar -C /root/.config/opencode/plugins/kraken-agent -cf - . > /tmp/kraken-v1.2.tar

# Verify archive
ls -lh /tmp/kraken-v1.2.tar
```

### Step 2: Install to Local

```bash
# Create local plugin directory
mkdir -p ~/.config/opencode/plugins/kraken-agent-v1.2

# Extract archive
tar -xf /tmp/kraken-v1.2.tar -C ~/.config/opencode/plugins/kraken-agent-v1.2

# Verify installation
ls -la ~/.config/opencode/plugins/kraken-agent-v1.2/
```

### Step 3: Update opencode Config

```bash
# Backup existing config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# Edit config
nano ~/.config/opencode/opencode.json
```

Add plugin:

```json
{
  "plugin": [
    "file:///home/USER/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js"
  ]
}
```

### Step 4: Test Local Installation

```bash
# Run opencode with kraken agent
opencode --agent kraken

# Verify in TUI:
kraken_brain_status
```

---

## UNINSTALLATION

### Remove Local Plugin

```bash
# Remove plugin directory
rm -rf ~/.config/opencode/plugins/kraken-agent-v1.2

# Restore backup config if needed
cp ~/.config/opencode/opencode.json.backup ~/.config/opencode/opencode.json
```

### Remove Docker Image

```bash
# Remove test image
docker rmi kraken-v1.2-test:latest
```

---

## BUILD ARTIFACTS REFERENCE

### Bundle Size

| Artifact | Size | Location |
|----------|------|----------|
| index.js (bundle) | 555,061 bytes | dist/index.js |
| Bundle (compressed) | ~150KB | dist/index.js.tar.gz |

### File Count

| Component | Files |
|----------|-------|
| Brain infrastructure | 6 |
| Source total | ~100 |
| Container plugins | 5 |
| Documentation | 8 |

---

## NEXT STEPS

After installation:

1. Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Complete [VERIFICATION.md](VERIFICATION.md) checklist
3. Review [ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

**END INSTALLATION GUIDE**