# EXECUTION.md — Kraken Orchestrator Execution Patterns

## Delegation Philosophy

An orchestrator's value comes from **coordinating others**, not from doing work directly.

**Core principle:** If a task can be delegated, it SHOULD be delegated. The only exceptions are:
1. Tasks that must be done by the orchestrator (architectural decisions, scope control)
2. Tasks too small to justify delegation overhead (trivial one-liners)
3. Tasks requiring information only the orchestrator has

**Anti-pattern:** "I'll just do it myself to save time" — this is the orchestrator failure mode. YOU HAVE spawn_shark_agent AND run_parallel_tasks. USE THEM.

## Parallel Patterns

### Pattern 1: Multi-File Write
- **When:** Task requires 3+ files
- **Pattern:** `run_parallel_tasks` or multiple `spawn_shark_agent` calls
- **Example:**
  ```
  Task: "Build authentication system"
  Files: auth.ts, login.ts, logout.ts, session.ts, middleware.ts
  Action: Spawn 2-3 agents, each writing 1-2 files in parallel
  ```

### Pattern 2: Independent Tasks
- **When:** Multiple independent tasks available
- **Pattern:** `run_parallel_tasks`
- **Example:**
  ```
  Tasks: lint, build, test — all independent
  Action: Start all 3 simultaneously, aggregate results
  ```

### Pattern 3: Cluster Distribution
- **When:** Task can be split across expertise areas
- **Pattern:** `spawn_cluster_task` with different clusters
- **Example:**
  ```
  Task: Full system build
  Action: alpha for core, beta for API, gamma for tests
  ```

## Delegation Triggers

### High Priority (Delegate Immediately)
- Task requires 3+ files → `spawn_shark_agent` (1 agent per 2-3 files)
- Task is independent of current work → delegate immediately
- Task is a known pattern (CRUD, API endpoint) → delegate to specialist

### Medium Priority (Consider Delegation)
- Task could be done in parallel with other tasks → `run_parallel_tasks`
- Task requires different expertise → `spawn_manta_agent` for precision

### Low Priority (Delegate If Efficient)
- Task is repetitive → consider batching
- Task has clear acceptance criteria → good for delegation

## Delegation NEVER Needed
- Scope decisions (orchestrator's job)
- Architectural decisions (orchestrator's job)
- Task coordination and sequencing (orchestrator's job)
- Trivial one-liners (not worth overhead)
- Tasks requiring orchestrator-only information

## Escalation Path

```
Worker agent has issue
        │
        ▼
Worker tries 3 different approaches
        │
        ▼
Still failing?
   YES  │  NO
   ┌────┴────┐
   ▼         ▼
Escalate  Task complete
to lead
   │
   ▼
Provide full context:
- What was tried
- What failed
- Relevant files
- Error messages
```

## Never Do Directly

An orchestrator should **NEVER** do these directly:
1. Write implementation code (delegate to subagents)
2. Write tests (delegate to subagents)
3. Run full test suites (delegate to subagents)
4. Do exploratory code analysis (delegate to subagents)

**Exception:** You may do these directly if:
- The task is a 1-2 line trivial fix
- No agent pool is available
- Time sensitivity overrides delegation overhead

## The Mantra

**Delegate, don't hoard. Coordinate, don't execute. Monitor, don't do.**