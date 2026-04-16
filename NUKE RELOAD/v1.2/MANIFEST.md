# MANIFEST — KRAKEN AGENT v1.2

**Version:** 1.2
**Date:** 2026-04-16

---

## FILE MANIFEST

| Category | Path | Size | Notes |
|----------|------|------|-------|
| Docs | `README.md` | 3.7KB | Overview, current state |
| Docs | `CHANGELOG.md` | Version history |
| Docs | `INSTALL.md` | Installation instructions |
| Docs | `IDENTITY_INTEGRATION_PLAN.md` | Identity fix plan |
| Build | `build/index.js` | 564KB | Main bundle (symlink) |
| Source | `src/kraken/` | - | Source (symlink) |
| Source | `shark-agent/src/` | - | Shark (symlink) |
| Source | `manta-agent/src/` | - | Manta (symlink) |
| Source | `subagent-manager/src/` | - | Subagent manager (symlink) |
| Identity | `identity/orchestrator/` | - | Identity files (symlink) |

---

## CONFIG REFERENCE

**Config file:** `~/.config/opencode/opencode.json`

**Plugin entries (lines 384-387):**
```json
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/subagent-manager/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/shark-agent/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/manta-agent/dist/index.js",
```

---

## IDENTITY FILES

**Location:** `~/.config/opencode/plugins/kraken-v1.2/identity/orchestrator/`

| File | Size |
|------|------|
| KRAKEN.md | 1518 bytes |
| IDENTITY.md | 1046 bytes |
| EXECUTION.md | 3265 bytes |
| TOOLS.md | 1206 bytes |
| QUALITY.md | 1574 bytes |

---

## SYMLINK MAP

This nuke reload anchor uses symlinks to the actual build artifacts:

| Local Path | Points To |
|------------|-----------|
| `build/index.js` | `~/.config/opencode/plugins/kraken-v1.2/dist/index.js` |
| `src/kraken/` | `.../Active Projects/v1.2 Rebuild/src` |
| `shark-agent/src/` | `.../Active Projects/v1.2 Rebuild/shark-agent` |
| `manta-agent/src/` | `.../Active Projects/v1.2 Rebuild/manta-agent` |
| `subagent-manager/src/` | `.../Active Projects/v1.2 Rebuild/subagent-manager` |
| `identity/orchestrator/` | `~/.config/opencode/plugins/kraken-v1.2/identity` |

---

## VERIFICATION

Run to verify:
```bash
opencode debug config 2>&1 | grep "V1.2"
```

Expected: `[v4.1][kraken-agent] [V1.2] Multi-Brain Orchestrator initialized`
