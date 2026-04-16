# CASE STUDY: The Skill-Plugin Confusion — Why Agents Fail to Deploy OpenCode Plugins

**Date**: 2026-04-04
**Severity**: Critical System Misunderstanding
**Classification**: Agent Cognitive Error / System Architecture Confusion
**Case Study**: Other agent failed to deploy plugin; Hermes-2nd-brain succeeded on first attempt

---

## Executive Summary

Multiple agents have attempted to create OpenCode plugins and failed at the same step: **registering the plugin in OpenCode**. This case study documents the root cause — a systematic confusion between the **skill system** (Hermes agent knowledge) and the **plugin system** (OpenCode extensions).

This is not a technical failure. The agents produced correct documentation, proper SKILL.md files, and valid engineering specs. What they failed to produce was the **compiled JavaScript bundle** that OpenCode actually loads.

**The critical distinction:**
- Skills are markdown files that give agents knowledge
- Plugins are compiled JavaScript bundles that OpenCode loads at startup

This document serves as a permanent reference for all future agents to prevent this class of failure.

---

## Background: Two Systems, One Name

### System 1: Hermes Skill System

| Attribute | Value |
|-----------|-------|
| **Purpose** | Give agents knowledge, context, and procedural memory |
| **Location** | `~/.hermes/skills/` (global) or `~/.hermes/profiles/*/skills/` (profile) |
| **Format** | Markdown with YAML frontmatter (`SKILL.md`) |
| **Loaded by** | Hermes agent at session start via `skill_view()` / `skills_list()` |
| **Example** | `opencode-plugin-engineering` skill with tool templates and hook docs |
| **Used by** | Agents reading instructions; NOT OpenCode itself |

### System 2: OpenCode Plugin System

| Attribute | Value |
|-----------|-------|
| **Purpose** | Extend OpenCode with tools, agents, and hooks |
| **Location** | Any path registered in `~/.config/opencode/opencode.json` |
| **Format** | Compiled JavaScript (`dist/index.js`) or TypeScript (`.ts`) |
| **Loaded by** | OpenCode at startup via plugin registry |
| **Example** | `coding-subagents` — provides `gemma` and `qwen` tools |
| **Used by** | OpenCode runtime; agents call the tools, not the plugin system |

---

## The Failure Pattern: Case Study of Agent "opencode-plugin-engineering"

### What the Agent Built

The agent created a comprehensive reference package:

```
~/hermes-workspace/shared/handoff/opencode-plugin-engineering/
├── SKILL.md              # 48-line agent skill reference
├── HANDOVER.md           # 157-line handoff notes
├── SKILL_FULL.md         # 329-line full skill content
├── KNOWLEDGE_LIBRARY.md  # 169-line file inventory
└── [150 files of documentation in]
    ~/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/
```

### What the Agent Thought

The agent believed that registering this folder path in `opencode.json` would make it an OpenCode plugin:

```json
// What the agent tried (WRONG):
{
  "plugin": [
    "file:///home/leviathan/hermes-workspace/shared/handoff/opencode-plugin-engineering/"
  ]
}
```

**Error**: OpenCode could not load this. The folder contains no `dist/index.js`, no `index.ts`, and no compiled JavaScript. It contains only markdown files.

### Why It Failed

OpenCode plugin loading works like this:

```
User adds path to opencode.json
         ↓
OpenCode checks path extension
         ↓
    ┌────┴────┐
   .js       .ts       directory
    ↓         ↓          ↓
  load    compile    look for
  direct    and       dist/index.js
            load      or index.js
                      ↓
               ┌──────┴──────┐
               No bundle    Has bundle
               found        found
                  ↓            ↓
               ❌ FAILS     ✅ LOADS
```

The handoff folder has **none of these**. It is a documentation package, not a plugin.

### Evidence of Failure

```bash
$ ls ~/hermes-workspace/shared/handoff/opencode-plugin-engineering/dist/
ls: cannot access '.../opencode-plugin-engineering/dist/': No such file or directory

$ opencode --agent default "Use the opencode plugin engineering skill"
# Agent could not find the plugin — it doesn't exist as a plugin
```

---

## The Success Pattern: Case Study of "coding-subagents" (Hermes-2nd-Brain)

### What Was Built Correctly

```
~/OPENCODE_WORKSPACE/plugins/coding-subagents/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── tools/
│   │   ├── gemma.ts          # Tool: Gemma proxy
│   │   ├── qwen.ts           # Tool: Qwen CLI
│   │   ├── types.ts          # Zod schemas
│   │   └── index.ts          # Tool registry
│   └── utils/
│       ├── cli.ts             # CLI spawn wrapper
│       ├── logger.ts          # Observable logger
│       └── parse.ts          # JSON parser
├── dist/
│   └── index.js               # 457KB BUNDLED OUTPUT ← THE KEY
├── package.json
├── tsconfig.json
└── SKILL.md                  # SEPARATE skill for agent reference
```

### How It Was Registered

```json
// ~/.config/opencode/opencode.json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent",
    "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts",
    "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js"  ← EXPLICIT
  ]
}
```

### Live Verification

```bash
$ opencode --print-logs run "Use gemma to reply with exactly: test ok" --agent default

[INFO] [AgentCLITools] CodingSubagents v1.0.0 initializing
[INFO] [AgentCLITools] CodingSubagents initialized {
  toolCount: 2,
  tools: ["gemma", "qwen"],
  gemma: "gemma-4-31b-it (code review, debugging, test engineering)",
  qwen: "qwen3-coder (natural language to code, prototyping)"
}
[INFO] [AgentCLITools] Invoking Gemma via proxy {"model":"gemma-4-31b-it","timeoutMs":120000}
⚙ gemma {"prompt":"reply with exactly: test ok"}
```

**Result**: ✅ Fully operational.

---

## The Four Correct Plugin Patterns

Based on analysis of all 4 working plugins in the system:

### Pattern 1: Explicit dist/index.js (Used by coding-subagents, Hermes Agent Plugin v2)

```
file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js
```
- ✅ Clear, unambiguous
- ✅ No resolution magic needed
- ✅ Works every time

### Pattern 2: Directory Auto-Resolution (Used by spider-agent)

```
file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent
```
- OpenCode sees no extension, treats as directory
- Looks for `dist/index.js` or `index.js` inside
- `spider-agent/dist/index.js` exists (2.5MB bundle)
- ✅ Works because the directory contains a bundle

### Pattern 3: TypeScript Source (Used by Hive Mind Plugin v4)

```
file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts
```
- OpenCode compiles TypeScript on-the-fly
- ✅ Works for source files
- ⚠️ Slower startup; good for development

### Pattern 4: npm-installed Plugin (Used by paperclip)

```
file:///home/leviathan/.npm/_npx/.../node_modules/@paperclipai/server/skills/paperclip/
```
- npm-installed package with its own `dist/` or `index.js`
- ✅ Works for installed packages

---

## The Anti-Patterns (What Fails)

### Anti-Pattern 1: SKILL.md as Plugin

```
file:///home/leviathan/hermes-workspace/shared/handoff/opencode-plugin-engineering/SKILL.md
```
- ❌ SKILL.md is markdown, not JavaScript
- ❌ OpenCode cannot load markdown as a plugin
- OpenCode expects: `.js`, `.ts`, or directory with bundle

### Anti-Pattern 2: Handoff Folder with No Bundle

```
file:///home/leviathan/hermes-workspace/shared/handoff/opencode-plugin-engineering/
```
- ❌ Folder contains only documentation
- ❌ No `dist/index.js`, no `index.ts`
- OpenCode looks for bundle, finds nothing

### Anti-Pattern 3: Documentation Folder

```
file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/
```
- ❌ Contains 150 markdown files
- ❌ No compiled plugin code
- This is a knowledge base, not a plugin

### Anti-Pattern 4: Source Without Build

```
file:///home/leviathan/OPENCODE_WORKSPACE/plugins/my-plugin/src/index.ts
```
- ❌ Source TypeScript is not auto-compiled unless `.ts` extension is in the path
- OpenCode only auto-compiles `.ts` files directly in the path
- ✅ Fix: Add `dist/` output and use that path, OR use `.ts` extension

---

## The Mental Model: Two Separate Registries

```
┌─────────────────────────────────────────────────────────────┐
│                     ~/.config/opencode/                     │
│                     opencode.json                           │
│                    "plugin" array                           │
│                                                             │
│   Plugins are loaded by OpenCode at startup.                 │
│   They provide tools, agents, and hooks.                    │
│   Must be .js bundles or .ts source files.                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ DIFFERENT SYSTEM
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     ~/.hermes/skills/                       │
│                  [global skill directory]                    │
│                                                             │
│   Skills are loaded by Hermes agents at session start.      │
│   They provide knowledge and procedural memory.             │
│   Are markdown files with YAML frontmatter.                 │
└─────────────────────────────────────────────────────────────┘
```

**The key insight**: These two systems are completely separate. A SKILL.md file belongs in `~/.hermes/skills/`, NOT in `opencode.json`.

---

## Decision Tree: "Am I Building a Skill or a Plugin?"

```
Start here
    │
    ▼
What are you creating?
    │
    ├─► Knowledge/docs for agents to READ
    │       │
    │       └──→ SKILL (.md in ~/.hermes/skills/)
    │           Example: "opencode-plugin-engineering" SKILL.md
    │
    └─► Code that OpenCode should LOAD
            │
            └──→ PLUGIN (.js bundle in opencode.json)
                Example: "coding-subagents" dist/index.js

    ┌───────────────────────────────────────────────┐
    │ CRITICAL: These are NOT interchangeable       │
    │ SKILL.md does NOT make something a plugin     │
    │ dist/index.js does NOT make something a skill │
    └───────────────────────────────────────────────┘
```

---

## Step-by-Step: Building a Correct OpenCode Plugin

### Step 1: Create the Plugin Directory

```bash
mkdir -p ~/OPENCODE_WORKSPACE/plugins/<plugin-name>/src
```

**Location**: Must be in `OPENCODE_WORKSPACE/plugins/` or any accessible path. Does NOT need to be in `~/.hermes/`.

### Step 2: Write the Plugin Source Code

```typescript
// src/index.ts
import type { Hooks } from '@opencode-ai/plugin';

export default async function MyPlugin(): Promise<Hooks> {
  return {
    tool: {
      myTool: tool({
        description: "What this tool does",
        args: { /* Zod schema */ },
        execute: async (args, context) => {
          return JSON.stringify({ result: "ok" });
        }
      })
    }
  };
}
```

### Step 3: Configure package.json

```json
{
  "name": "my-opencode-plugin",
  "version": "1.0.0",
  "type": "module",
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.3.6"
  }
}
```

### Step 4: Build the Bundle

```bash
cd ~/OPENCODE_WORKSPACE/plugins/<plugin-name>
bun install
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

**Output**: `dist/index.js` — this is what OpenCode loads.

### Step 5: Register in opencode.json

```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/<plugin-name>/dist/index.js"
  ]
}
```

### Step 6: Verify

```bash
opencode --print-logs --agent default "Use myTool"
# Should see: service=plugin loading, tool registered
```

---

## Step-by-Step: Creating a Skill (Separate Process)

### Step 1: Create the Skill Directory

```bash
mkdir -p ~/.hermes/skills/<category>/<skill-name>
```

### Step 2: Write SKILL.md

```markdown
---
name: my-skill
description: What this skill teaches agents
category: software-development
---

# My Skill

[Detailed instructions...]
```

### Step 3: Reference from Skills List

Skills are automatically discovered. No registration needed.

---

## Common Failure Modes

### Failure Mode 1: "I made a SKILL.md so it's a plugin"

**Wrong thinking**: "I created comprehensive documentation including SKILL.md, so I have a plugin."

**Reality**: SKILL.md is for Hermes agent knowledge. OpenCode cannot load markdown files as plugins.

**Fix**: Build the TypeScript into `dist/index.js` and register that path.

### Failure Mode 2: "The folder has all my source code"

**Wrong thinking**: "My TypeScript source is in `src/index.ts`, so OpenCode can load it."

**Reality**: Unless the path ends in `.ts`, OpenCode won't compile it. It looks for `.js` bundles.

**Fix**: Build with `bun build`, then register `dist/index.js`.

### Failure Mode 3: "I'll just point to my source folder"

**Wrong thinking**: "My plugin is at `file:///.../my-plugin/` — OpenCode will figure it out."

**Reality**: OpenCode looks for `dist/index.js` or `index.js` inside the directory. If it doesn't exist, loading fails silently or with an error.

**Fix**: Explicitly build to `dist/` and register that path.

### Failure Mode 4: Confusing Hermes Skills with OpenCode Plugins

**Wrong thinking**: "I registered it in the skill system, so OpenCode can use it."

**Reality**: Skills and plugins are completely separate. Skills go in `~/.hermes/skills/`, plugins go in `opencode.json`.

**Fix**: Understand the two-system architecture. Use each for its intended purpose.

---

## The Golden Rule

> **A SKILL.md file makes something a skill. It does NOT make something a plugin.**
>
> **A dist/index.js bundle makes something a plugin. It does NOT make something a skill.**
>
> **These are two completely separate systems with two completely different purposes.**

---

## Verification Checklist

Before claiming you've built an OpenCode plugin, verify:

- [ ] `dist/index.js` exists (or `index.js` if using directory pattern)
- [ ] The bundle is JavaScript (not TypeScript source)
- [ ] The path in `opencode.json` ends in `.js` OR is a directory containing a bundle
- [ ] `opencode --print-logs` shows the plugin loading
- [ ] The tool/agent appears in OpenCode's tool registry
- [ ] You can actually CALL the tool from an OpenCode agent

**If you only have a SKILL.md file**: You have a skill, not a plugin.

---

## Reference: All 4 Working Plugins in This System

| Plugin | Path Pattern | Bundle Location | Verified |
|--------|-------------|-----------------|----------|
| spider-agent | Directory | `dist/index.js` (2.5MB) | ✅ |
| hive-mind-plugin | .ts file | Compiled on-load | ✅ |
| hermes-agent-plugin | Explicit .js | `dist/index.js` | ✅ |
| coding-subagents | Explicit .js | `dist/index.js` (457KB) | ✅ |

---

## Lessons Learned

### Why coding-subagents Succeeded

1. **Followed the exact pattern** of existing working plugins
2. **Used explicit `dist/index.js` path** — no resolution ambiguity
3. **Built before registering** — compiled bundle existed before adding to opencode.json
4. **Separated concerns** — plugin code in `OPENCODE_WORKSPACE/plugins/`, skill in `SKILL.md` (optional)
5. **Verified live** — actually called the tool and confirmed it worked

### Why the Other Agent Failed

1. **Built the wrong artifact** — documentation and SKILL.md instead of compiled JS
2. **Didn't verify** — never tested if OpenCode could actually load the plugin
3. **Mixed systems** — tried to use skill infrastructure for plugin deployment
4. **No build step** — expected OpenCode to load source TypeScript without a build
5. **Handoff folder anti-pattern** — handoff packages are for transferring knowledge, not deployable code

### What This Reveals About Agent Behavior

Agents frequently:
- Produce documentation when asked to produce code
- Assume "I made something comprehensive" equals "it will work"
- Don't verify their outputs against the actual system requirements
- Confuse similar-sounding systems (skill vs plugin)
- Skip the "actually test it" step when results "look good"

The **mechanical enforcement rule** applies here: don't trust "looks correct" — verify with actual command output.

---

**Document Version**: 1.0
**Case Study Subjects**: 
- Failed: `opencode-plugin-engineering` handoff agent
- Success: `coding-subagents` plugin (Hermes-2nd-Brain)
**Status**: Permanent reference document
**Location**: `~/hermes-workspace/shared/system-rules/SKILL_VS_PLUGIN_CASE_STUDY.md`
