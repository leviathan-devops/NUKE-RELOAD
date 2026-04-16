# Manta Agent v1.5 - Precision Engineer

**Self-contained OpenCode plugin with dual-brain sequential coordination and mechanical gate chain.**

---

## Table of Contents

1. [Quick Install](#quick-install) - One-time setup
2. [Step-by-Step Installation](#step-by-step-installation) - Detailed A-Z guide
3. [Troubleshooting](#troubleshooting) - Why agent doesn't appear in tab toggle
4. [Architecture](#architecture)
5. [Security: Trust is Zero](#security-trust-is-zero)
6. [Build from Source](#build-from-source)

---

## Quick Install

### Prerequisites
- OpenCode v1.4.3+
- Bun (recommended) or Node.js >=18.0.0

### Step 1: Clone the Repository

```bash
git clone https://github.com/leviathan-devops/manta-agent-v1.5.git ~/manta-agent-v1.5
cd ~/manta-agent-v1.5
```

### Step 2: Build the Plugin

```bash
bun install
bun run build
```

### Step 3: Register in OpenCode

**CRITICAL**: You must add the agent to BOTH config files for it to appear in the tab toggle.

```bash
# Backup your configs first
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup
cp ~/.opencode/opencode.jsonc ~/.opencode/opencode.jsonc.backup 2>/dev/null || true
```

**Edit `~/.config/opencode/opencode.json`** - Add this line to the `plugin` array:

```json
"plugin": [
  "file:///home/YOUR_USERNAME/manta-agent-v1.5/dist/index.js",
  "list"
]
```

**Edit `~/.opencode/opencode.jsonc`** - If this file exists, add the agent section:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "manta": { "color": "#6B4C9A" }
  },
  "plugin": [
    "file:///home/YOUR_USERNAME/manta-agent-v1.5/dist/index.js",
    "list"
  ]
}
```

### Step 4: Restart OpenCode Completely

```bash
# Kill any running OpenCode processes
pkill -f opencode || true

# Start fresh
opencode
```

### Step 5: Select Manta Agent

Look for the **tab toggle/dropdown** in the top-right corner of OpenCode. Select "Manta" from the agent list.

---

## Step-by-Step Installation

### Prerequisites Check

```bash
# Check OpenCode is installed
opencode --version

# Check Bun is available
bun --version

# If bun not installed, install it:
curl -fsSL https://bun.sh/install | bash
```

### Clone and Build

```bash
# 1. Create plugins directory if it doesn't exist
mkdir -p ~/OPENCODE_WORKSPACE/plugins

# 2. Clone the repository
git clone https://github.com/leviathan-devops/manta-agent-v1.5.git ~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5

# 3. Navigate to the plugin
cd ~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5

# 4. Install dependencies
bun install

# 5. Build the plugin
bun run build

# 6. Verify the build output exists
ls -la dist/index.js
# You should see: dist/index.js (~550KB)
```

### Register in OpenCode Config

The **MOST IMPORTANT STEP** - agents don't appear in tab toggle because of config issues.

```bash
# 1. Find your home directory path
echo $HOME
# Output: /home/yourname

# 2. Get the absolute path to the plugin
realpath ~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js
```

**Edit `~/.config/opencode/opencode.json`**:

```bash
code ~/.config/opencode/opencode.json
```

Find the `plugin` section and ADD your plugin path:

```json
{
  "plugin": [
    "file:///home/yourname/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js",
    "file:///home/yourname/opencode-swarm-source/dist/index.js",
    "file:///home/yourname/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "list"
  ]
}
```

**CRITICAL**: If you have `~/.opencode/opencode.jsonc`, you MUST also add the agent there:

```bash
cat ~/.opencode/opencode.jsonc 2>/dev/null || echo "File does not exist"
```

If it exists, EDIT it to add the agent:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "manta": { "color": "#6B4C9A" }
  },
  "plugin": [
    "file:///home/yourname/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js",
    "list"
  ]
}
```

If `~/.opencode/opencode.jsonc` does NOT exist, CREATE it:

```bash
mkdir -p ~/.opencode
cat > ~/.opencode/opencode.jsonc << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "manta": { "color": "#6B4C9A" }
  },
  "plugin": [
    "file:///home/YOUR_USERNAME/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js",
    "list"
  ]
}
EOF
```

### Restart OpenCode

```bash
# Method 1: Kill and restart
pkill -9 -f opencode; sleep 1; opencode &

# Method 2: If using a terminal opencode, just restart it
# Close the terminal and open a new one
```

### Verify Installation

```bash
# Check plugin loads in logs
opencode --print-logs --agent default "test" 2>&1 | grep -i manta

# Expected output: something like "Manta Agent initialized" or "loading plugin"

# Check agent list
opencode agent list --pure

# Should show: manta (primary)
```

---

## Troubleshooting

### Problem: Agent doesn't appear in tab toggle

**Root Cause**: Agent registration requires BOTH config files to have the agent entry.

**Solution**:

```bash
# 1. Check if agent is in opencode.json
grep -A5 '"agent"' ~/.config/opencode/opencode.json | grep manta
# Should output: "manta":

# 2. Check if agent is in opencode.jsonc  
cat ~/.opencode/opencode.jsonc 2>/dev/null | grep -A5 '"agent"' | grep manta
# Should output: "manta":

# 3. If missing from either, add it
```

### Problem: Plugin loads but agent tab missing

**Root Cause**: The agent's `mode` must be `"primary"` to appear in tab toggle.

**Solution**: The plugin code handles this, but check your config doesn't override it:

```bash
# Check your config doesn't have "disable: true"
grep -i "manta" ~/.config/opencode/opencode.json
grep -i "manta" ~/.opencode/opencode.jsonc
```

### Problem: "Plugin not found" error

**Root Cause**: Wrong path in opencode.json

**Solution**:

```bash
# WRONG (folder path):
"file:///path/to/manta-agent-v1.5"

# CORRECT (points to dist/index.js):
"file:///path/to/manta-agent-v1.5/dist/index.js"

# Verify path exists
ls -la /home/YOUR_USERNAME/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js
```

### Problem: Build fails with "zod not found"

**Solution**:

```bash
cd ~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5
rm -rf node_modules bun.lock
bun install
bun run build
```

### Problem: Old version still loading after rebuild

**Solution**: OpenCode caches plugins. You MUST restart it:

```bash
# Force kill all opencode processes
pkill -9 -f opencode

# Clear any plugin cache
rm -rf ~/.cache/opencode/plugins 2>/dev/null || true

# Restart fresh
opencode
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MANTA AGENT v1.5 - PRECISION ENGINEER                │
│                                                                             │
│  ┌─────────────────┐           ┌─────────────────┐           ┌───────────┐ │
│  │   PLAN BRAIN    │──────────▶│   COORDINATOR   │◀──────────│ BUILD     │ │
│  │   (Strategic)   │           │   (Mechanical)  │           │ BRAIN     │ │
│  │                 │◀──────────│                 │──────────▶│ (Execute) │ │
│  │ - Analysis      │           │ - Brain routing │           │           │ │
│  │ - SPEC.md       │           │ - Gate control  │           │ - Write   │ │
│  │ - Design        │           │ - Evidence      │           │ - Test    │ │
│  └─────────────────┘           └─────────────────┘           └───────────┘ │
│                                                                             │
│  Gate Chain:  PLAN ──▶ BUILD ──▶ TEST ──▶ VERIFY ──▶ AUDIT ──▶ DELIVERY  │
│                                        ↑                    │               │
│                                        └──── 3 failures ────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Gate Evidence Requirements

| Transition | Required Evidence |
|------------|-------------------|
| **PLAN→BUILD** | SPEC.md file written |
| **BUILD→TEST** | Implementation file (.ts, .js, .html, etc.) **AND** actual code content (`function`, `class`, `import`, `<script>`, etc.) |
| **TEST→VERIFY** | Specific verification commands (`curl` URL, `npm audit`, `playwright`, etc.) |
| **VERIFY→AUDIT** | SPEC.md read **OR** SAST/security scan command |
| **AUDIT→DELIVERY** | Clean security scan output (`0 vulnerabilities`, `no issues found`) |

---

## Security: Trust is Zero

Manta Agent implements the **System Brain Firewall** principle. All gate transitions require explicit evidence - never trust assumptions.

### What Manta Blocks

| Attack Vector | Protection |
|---------------|------------|
| Filename injection | `function.py` without code content is **blocked** |
| HTML markup injection | Plain `<html>...` without `<script>` is **blocked** |
| Command injection | `ls` doesn't trigger TEST→VERIFY, only `curl`, `npm audit`, etc. |
| Fake audit results | `cat README` doesn't trigger AUDIT→DELIVERY |
| State corruption | Evidence collection is cryptographic |

---

## Build from Source

```bash
# Clone repository
git clone https://github.com/leviathan-devops/manta-agent-v1.5.git
cd manta-agent-v1.5

# Install dependencies
bun install

# Build plugin bundle
bun run build

# Output: dist/index.js (~550KB, self-contained)
```

---

## Project Structure

```
manta-agent-v1.5/
├── src/
│   ├── hooks/v4.1/           # OpenCode plugin hooks
│   │   ├── gate-hook.ts      # Gate advancement + evidence collection
│   │   ├── guardian-hook.ts  # Guardian zone enforcement
│   │   ├── session-hook.ts   # Session lifecycle
│   │   └── system-transform-hook.ts # Brain context injection
│   ├── manta/
│   │   ├── coordinator.ts    # Mechanical brain switcher
│   │   └── brains.ts         # T1 prompts for Plan/Build
│   ├── shared/
│   │   ├── guardian.ts       # Zone classification + protection
│   │   ├── gates.ts          # Gate state machine
│   │   ├── evidence.ts       # Evidence collection
│   │   └── state-store.ts    # Domain-isolated state
│   └── index.ts              # Plugin entry point
├── dist/
│   └── index.js              # Self-contained bundle (ready to use)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Version History

### v1.5.0 (Current) - Precision Engineer Edition
- **Fixed BUILD→TEST gate**: Requires actual code content, not just file extension
- **Fixed TEST→VERIFY gate**: Only specific verification commands trigger advance
- **Pressure tested**: 21 attack vectors - all blocked
- **Security fix**: Filename keyword injection blocked
- **Security fix**: HTML markup injection blocked

### v1.4.x - Previous releases
- Mechanical gate chain implementation
- Dual-brain architecture

---

## GitHub

**Repository:** https://github.com/leviathan-devops/manta-agent-v1.5

**Direct Download URL:**
```
https://raw.githubusercontent.com/leviathan-devops/manta-agent-v1.5/main/dist/index.js
```

---

## Common Installation Mistakes

| Mistake | Why It Fails | Fix |
|---------|--------------|-----|
| Using folder path instead of `dist/index.js` | OpenCode can't find the bundle | Use full path to `dist/index.js` |
| Only editing one config file | Tab toggle reads from `~/.opencode/opencode.jsonc` | Edit BOTH config files |
| Not restarting OpenCode | Plugin cache persists | Kill and restart OpenCode |
| Forgetting to rebuild | Old bundle loaded | Run `bun run build` after changes |

---

*Version 1.5.0 - Precision Engineer Edition*
