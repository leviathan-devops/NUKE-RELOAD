---
name: opencode-plugin-engineering
description: Build production-grade OpenCode plugins using Spider Agent patterns
category: software-development
tags: [opencode, plugin, spider-agent, hooks, tools]
layer: master
version: 2.0
---

# OpenCode Plugin Engineering — Master Skill

**Type**: Neural Pathway — T2 Consolidated
**Location**: `OPENCODE_WORKSPACE/Shared Workspace Context/Plugin Engineering/`
**Audience**: Plugin engineers building OpenCode plugins
**Prerequisite**: Understand OpenCode basics

---

## CRITICAL: Skill ≠ Plugin — Read First

> **SKILL.md does NOT make a plugin.**
> - **Skill** = `.md` file in `~/.hermes/skills/` → Hermes agent knowledge/context
> - **Plugin** = compiled `.js` bundle registered in `opencode.json` → OpenCode extensions
>
> You MUST build to `dist/index.js`. See `cases/SKILL_VS_PLUGIN_CASE_STUDY.md` for full analysis.

---

## Layered Architecture

```
Plugin Engineering/
├── SKILL.md                    ← YOU ARE HERE (entry point, ~300 lines)
├── layers/
│   ├── layer-1-CORE.md          ← Full T1 neural pathway (~1770 lines)
├── references/
│   ├── HOOK_MAP.md             ← All hook types with signatures
│   ├── HOOK_ARCHITECTURE.md    ← Hook execution order, session state
│   ├── tool-template.md        ← Tool implementation template
│   └── hook-template.md        ← Hook implementation template
├── cases/
│   ├── SKILL_VS_PLUGIN_CASE_STUDY.md  ← The failure/success analysis
│   └── SPIDER_AGENT_FORENSIC_REPORT.md ← Spider Agent internals
└── QUICKSTART.md               ← Optional: 1-page quickstart
```

**Layer loading strategy:**
1. Start at `SKILL.md` (this file)
2. For deep dives, load `layers/layer-1-CORE.md`
3. For hook details, load `references/HOOK_MAP.md`
4. For debugging, load `references/HOOK_ARCHITECTURE.md`
5. For failure analysis, load `cases/SKILL_VS_PLUGIN_CASE_STUDY.md`

---

## Quick Access

### "What does a plugin look like?"
```
layers/layer-1-CORE.md → Sections 1-2
```

### "What hooks are available?"
```
references/HOOK_MAP.md
```

### "How do I build one?"
```
layers/layer-1-CORE.md → Section 6 (Tool Development)
references/tool-template.md
```

### "Why did my plugin fail?"
```
cases/SKILL_VS_PLUGIN_CASE_STUDY.md
```

### "How does Spider Agent work?"
```
cases/SPIDER_AGENT_FORENSIC_REPORT.md
```

---

## Minimal Plugin Shell

```typescript
import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin';
import { z } from 'zod';

export const MyPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  const state = await initializeState(input.directory);
  
  return {
    name: "my-plugin",
    tool: createTools(state),
    ...createHooks(state)
  };
};
```

---

## Tool Definition

```typescript
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';

const myTool = tool({
  description: "What this tool does",
  args: {
    requiredArg: z.string().describe("Description"),
    optionalArg: z.string().optional().describe("Optional"),
    enumArg: z.enum(["a", "b"]).describe("Enum")
  },
  execute: async (args, context) => {
    // context: sessionID, messageID, agent, directory, worktree, abort, metadata, ask
    return JSON.stringify({ result: "ok" });
  }
});
```

---

## Hook Quick Reference

| Hook | When | Blocking? | Use Case |
|------|------|-----------|----------|
| `tool.execute.before` | Pre-tool | Can block | Safety, validation |
| `tool.execute.after` | Post-tool | No | Evidence, tracking |
| `command.execute.before` | Pre-command | Can block | Command interception |
| `chat.message` | On message | Can block | Delegation, routing |
| `chat.params` | Pre-LLM | No | Parameter tuning |
| `experimental.session.compacting` | Pre-compact | No | Context injection |

**Experimental hooks:**

| Hook | Purpose |
|------|---------|
| `experimental.chat.messages.transform` | Transform message history |
| `experimental.chat.system.transform` | Enhance system prompt |
| `experimental.session.compacting` | Inject context before compaction |

---

## State Directory Structure

```
.{plugin-name}/
├── state.json              # Current state snapshot
├── plan.md                 # Execution plan
├── evidence/               # QA evidence
├── knowledge/              # Learned patterns
├── checkpoints/            # Git-based snapshots
└── delegation-ledger.json  # Delegation history
```

---

## Hook Chain Composition

```typescript
"tool.execute.before": [
  sessionStateHook,      // 1. Ensure session state exists
  safetyCheckHook,       // 2. Safety validation
  scopeGuardHook,         // 3. Scope enforcement
  repetitionCheckHook,    // 4. Repetition detection
  activityTrackHook       // 5. Activity logging
]
```

---

## Hub-and-Spoke Orchestration

```
                    ┌─────────────────┐
                    │   architect     │ ◄── mode: "primary"
                    │  (orchestrator) │
                    └────────┬────────┘
                             │ delegates
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    coder      │    │   reviewer    │    │test_engineer │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## Build & Register

```bash
# Build
cd ~/OPENCODE_WORKSPACE/plugins/<plugin-name>
bun install
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Result: dist/index.js
```

**Registration in opencode.json:**
```json
{
  "plugin": [
    "file:///path/to/plugins/my-plugin/dist/index.js"
  ]
}
```

---

## Common Pitfalls

1. **SKILL.md ≠ Plugin** — Build to `dist/index.js`
2. **Hook key typos** — Use exact: `tool.execute.before`, not `toolBefore`
3. **Blocking in after hooks** — Use before hooks to block
4. **Missing state init** — Initialize in plugin function, not hooks
5. **No bundle** — OpenCode needs `dist/index.js`, not TypeScript source

---

## Debugging Checklist

### Hook Not Firing?
1. Check execution order
2. Check hook key exact match
3. Verify plugin in `opencode.json`
4. Check `Promise<void>` return

### Agent Blocked?
1. Run `spiderState.activeAgent.get(sessionId)`
2. Check `AGENT_AUTHORITY_RULES`
3. Verify vanilla agents have full access

### Model Fallback Issues?
1. Check `lastModelResponseTime` updating
2. Verify timeout threshold (default 3 min)
3. Check `fallback_models` array

---

## Verification

```bash
# Check plugin loads
opencode --print-logs --agent default "test"

# Should see:
# service=plugin path=.../dist/index.js loading plugin
# service=tool.registry status=started
```

---

## Working Plugin Examples

| Plugin | Path | Notes |
|--------|------|-------|
| spider-agent | `OPENCODE_WORKSPACE/plugins/spider-agent` | Directory auto-resolve |
| coding-subagents | `OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js` | Explicit .js |
| hive-mind-plugin | `Hive Mind Plugin/v4/hive-mind-plugin.ts` | TypeScript |
| hermes-agent-plugin | `Hermes Agent Plugin/v2-build/dist/index.js` | Explicit .js |

---

## Deep Dive Paths

### Path 1: Full Engineering (Start Here → Layer 1)
```
SKILL.md → layers/layer-1-CORE.md → references/HOOK_MAP.md
```

### Path 2: Hook Mastery
```
SKILL.md → references/HOOK_MAP.md → references/HOOK_ARCHITECTURE.md
```

### Path 3: Troubleshooting
```
SKILL.md → cases/SKILL_VS_PLUGIN_CASE_STUDY.md → cases/SPIDER_AGENT_FORENSIC_REPORT.md
```

### Path 4: Tool Implementation
```
SKILL.md → references/tool-template.md → cases/SPIDER_AGENT_FORENSIC_REPORT.md
```

---

## Related Skills

- `subagent-driven-development` — Multi-agent orchestration
- `systematic-debugging` — Debug plugin issues
- `claude-code` — Delegate to Claude Code during build
