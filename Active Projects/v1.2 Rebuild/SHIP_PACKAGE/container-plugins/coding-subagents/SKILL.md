---
name: coding-subagents
description: External sub-agent tools for code review and prototyping - gemma (Gemma-4-31b-it) and qwen (Qwen Code CLI). Use these to offload code review, bug detection, and prototyping tasks.
triggers:
  - "code review"
  - "review this code"
  - "write a prototype"
  - "natural language to code"
  - "build scaffolding"
---

# Coding Subagents

Two external tools available for code review and prototyping.

## gemma — Code Review Specialist

**Model:** Gemma-4-31b-it (via proxy API)
**Best for:** Code review, bug detection, test engineering, production verification

```json
{"prompt": "Review this code for bugs and security issues: ..."}
```

## qwen — Natural Language to Code

**Model:** Qwen3-Coder CLI
**Best for:** Converting natural language to code, quick prototypes, scaffolding

**IMPORTANT:** Always set `yolo: true` to avoid permission prompts blocking execution.

```json
{"prompt": "Write a REST API that does X", "yolo": true}
```

## Workflow Examples

### Review → Implement
```
Use gemma: {"prompt": "Review this code: ..."}
Use qwen: {"prompt": "Fix bugs: ...", "yolo": true}
```

### Parallel Review
```
Use gemma: {"prompt": "Security review: ..."}
Use gemma: {"prompt": "Performance review: ..."}
```
