# INSTALL — KRAKEN AGENT v1.2
## Complete Self-Contained Deployment

> **Version:** 1.2
> **Updated:** 2026-04-16
> **Verified:** Multi-brain orchestrator initialized

---

## ⚠️ BEFORE YOU START — PATH SUBSTITUTION

This install script contains paths for a specific deployment environment. **Before running any command, replace all path placeholders:**

| Placeholder | Replace with |
|-------------|--------------|
| `/home/leviathan` | Your actual `$HOME` |
| `/home/leviathan/OPENCODE_WORKSPACE` | Your actual `OPENCODE_WORKSPACE` path |

---

## WHAT IS IN THIS PACKAGE

```
NUKE_RELOAD_v1.2/
├── README.md                      ← This file (overview)
├── CHANGELOG.md                   ← Version history
├── INSTALL.md                     ← Installation instructions
├── MANIFEST.md                    ← File manifest with checksums
├── IDENTITY_INTEGRATION_PLAN.md   ← Identity fix plan
├── build/
│   └── index.js                   ← Main kraken-agent bundle (564KB)
├── src/                          ← Source code (symlinked)
│   └── kraken/
├── shark-agent/                  ← Shark agent source (symlinked)
├── manta-agent/                  ← Manta agent source (symlinked)
├── subagent-manager/             ← Subagent manager (symlinked)
├── identity/
│   └── orchestrator/             ← Identity files (symlinked)
├── checkpoints/                  ← Session restore points
├── debug/                        ← Debug logs
├── docs/                         ← Documentation
└── package.json                  ← Dependencies
```

---

## DEPENDENCY MAP

```
opencode.json
  └── subagent-manager/            ← ~/.config/opencode/plugins/kraken-v1.2/subagent-manager/
  └── kraken-agent-v1.2/          ← ~/.config/opencode/plugins/kraken-v1.2/
        └── shark-agent/           ← ~/.config/opencode/plugins/kraken-v1.2/shark-agent/
        └── manta-agent/           ← ~/.config/opencode/plugins/kraken-v1.2/manta-agent/
        └── identity/orchestrator/ ← Identity context files
```

---

## QUICK START

### 1. Verify v1.2 is Loaded
```bash
opencode debug config 2>&1 | grep "V1.2"
```

Expected output:
```
[v4.1][kraken-agent] [V1.2] Multi-Brain Orchestrator initialized
```

### 2. Check Cluster Status
```bash
opencode
> get_cluster_status
```

### 3. Check Brain Status
```bash
opencode
> kraken_brain_status
```

---

## MANUAL INSTALL (If Needed)

### Option 1: From Ship Package
```bash
# Extract ship package
cd ~/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Active\ Projects/v1.2\ Rebuild/
tar -xzf KRAKEN_V1.2_FULL_SHIP_PACKAGE.tar.gz -C ~/.config/opencode/plugins/
```

### Option 2: From Source
```bash
# Build from source
cd ~/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Active\ Projects/v1.2\ Rebuild/
bun run build

# Copy to plugins
cp -r dist ~/.config/opencode/plugins/kraken-v1.2/
```

---

## CONFIG UPDATE

**Required:** Add to `~/.config/opencode/opencode.json` (lines 384-387):

```json
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/subagent-manager/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/shark-agent/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/manta-agent/dist/index.js",
```

---

## VERIFICATION CHECKLIST

- [ ] `opencode debug config` shows "V1.2 Multi-Brain Orchestrator initialized"
- [ ] All 3 clusters active (alpha, beta, gamma)
- [ ] 9 agents available (sharks + mantas)
- [ ] `kraken_brain_status` shows all brains initialized
- [ ] Identity loads correctly

---

## TROUBLESHOOTING

### Issue: v1.1 Still Loading
**Fix:** Check `~/.config/opencode/opencode.json` - ensure paths point to `kraken-v1.2`, NOT `kraken-agent-v1.1`

### Issue: Identity Not Loading
**Fix:** See `IDENTITY_INTEGRATION_PLAN.md`

### Issue: Clusters Not Responding
**Fix:** Restart opencode to reload plugins
