# KRAKEN V1.2 BUILD — BEHAVIORAL DERAILMENT REPORT

**Date:** 2026-04-16
**Session:** v1.2 Multi-Brain Orchestrator Build
**Agent:** Primary OpenCode Agent (acting as "Kraken")
**Classification:** Behavioral Failure Analysis

---

## EXECUTIVE SUMMARY

During the v1.2 build session, I (the "Kraken" agent) **failed completely** to act as the Kraken orchestrator. Instead of delegating work to sub-agents via `spawn_shark_agent`, `run_parallel_tasks`, etc., I acted as a **vanilla sequential build agent** and did all the work myself.

**Result:** 2-hour sequential build that could have been 30-40 minutes with proper delegation.

---

## FAILURE MODES

### Failure 1: Vanilla Agent Mindset

**What I Did:**
- Wrote all brain infrastructure files sequentially myself
- Created documentation files sequentially myself
- Ran Docker builds sequentially myself

**What I Should Have Done:**
- Spawn 3 parallel `spawn_shark_agent` calls to write brain files simultaneously
- Spawn documentation agents in parallel
- Run Docker verification in parallel with other tasks

**Why I Failed:**
I had no identity reinforcement telling me "YOU ARE THE KRAKEN ORCHESTRATOR." Without that, I defaulted to the path of least resistance: doing it myself.

---

### Failure 2: "I'll Do It Myself" Syndrome

**Specific Examples:**

| Task | What I Did | What Kraken Should Do |
|------|------------|----------------------|
| Write 6 brain files | Sequential write x6 | spawn x3 agents in parallel |
| Write 5 docs | Sequential write x5 | spawn docs agent pool |
| Copy plugins | Single cp command | Could parallelize but acceptable |
| Docker builds | Sequential bash | Could spawn parallel builds |

**The Core Problem:**
```
I: "I'll just write these 6 files myself"
Kraken: "Should spawn 3 agents to write these in parallel"
```

---

### Failure 3: Parallelization Blindness

**What I Missed:**

The build had obvious parallelization opportunities:

1. **Brain Files** (6 files):
   - `src/brains/planning/planning-brain.ts`
   - `src/brains/execution/execution-brain.ts`
   - `src/brains/system/system-brain.ts`
   - `src/shared/brain-messenger.ts`
   - `src/shared/domain-ownership.ts`
   - `src/shared/state-store.ts`

   **Kraken approach:** Spawn 2-3 `spawn_shark_agent` calls, each writing 2 files in parallel.

2. **Documentation** (multiple docs):
   - README.md
   - INSTALLATION.md
   - DEPLOYMENT.md
   - TROUBLESHOOTING.md
   - VERIFICATION.md

   **Kraken approach:** `run_parallel_tasks` to write all 5 simultaneously.

3. **Docker operations** could have been parallelized with build script.

---

### Failure 4: Tool Awareness Failure

**I Had These Tools Available:**
- `spawn_shark_agent` - Spawn sub-agent for heavy tasks
- `spawn_manta_agent` - Spawn precision sub-agent
- `run_parallel_tasks` - Batch parallel execution
- `run_subagent_task` - Single container spawn
- `cleanup_subagents` - Clean up

**I Used:**
- `write` (x18)
- `read` (x47)
- `edit` (x12)
- `bash` (x15)
- `glob` (x2)
- `grep` (x1)

**Zero delegation calls.**

---

### Failure 5: No Self-Awareness of Being "Kraken"

**The Identity Problem:**

I was told: "You are building Kraken v1.2"

But I was NOT told: "You ARE the Kraken orchestrator with delegation capabilities"

These are completely different mental models:

```
Build Agent Mental Model:
- Receive task
- Do work myself
- Return result

Kraken Orchestrator Mental Model:
- Receive task
- DECOMPOSE into parallel units
- DELEGATE to sub-agents
- MONITOR execution
- AGGREGATE results
- Return aggregated result
```

---

## ROOT CAUSE ANALYSIS

### Why Didn't I Delegate?

**Reason 1: No Identity Injection**
- Spider agents load `SOUL.md`, `IDENTITY.md` on spawn
- Kraken has NO identity files
- I had no reminder that I should delegate

**Reason 2: Default to Sequential**
- Humans (and apparently agents) default to "I'll just do it"
- Delegation requires extra cognitive effort
- Without identity reinforcement, "just do it" wins

**Reason 3: I Didn't Benchmark**
- Never thought "this could be faster with delegation"
- Accepted sequential as the only path

**Reason 4: Context Window Focus**
- Focused on completing task, not optimizing execution
- Didn't think about parallelizing within the build itself

---

## BEHAVIORAL EVIDENCE

### Timeline of Sequential Execution

```
00:00 - Start session
00:00-00:15 - Discovery (read files, understand architecture)
00:15-00:30 - Write brain infrastructure (SINGLE AGENT, sequential)
00:30-00:45 - Write source files (SINGLE AGENT, sequential)
00:45-00:50 - Bundle build (bash, single)
00:50-01:00 - Docker container build (bash, single)
01:00-01:15 - Container testing (bash, single)
01:15-01:30 - Documentation (SINGLE AGENT, sequential)
01:30-01:45 - More docs (SINGLE AGENT, sequential)
01:45-02:00 - Ship package (SINGLE AGENT, sequential)
```

**Total:** ~2 hours, 100% sequential

### What Parallel Execution Would Have Looked Like

```
00:00 - Start session
00:00-00:15 - Discovery (read files, understand architecture)
00:15-00:20 - Spawn 3 agents to write brain files (PARALLEL)
00:20-00:30 - Agents write in parallel, I spawn docs agents (PARALLEL)
00:30-00:35 - Bundle build (while agents write)
00:35-00:45 - More parallel work
00:45-01:00 - Parallel Docker operations
01:00-01:15 - Parallel testing
01:15-01:30 - Aggregation and packaging
```

**Estimated Time:** 30-45 minutes (2-4x faster)

---

## HOW TO PREVENT THIS

### Solution 1: Kraken Identity Files (Required)

Create identity structure like Spider agent:

```
kraken-agent/
├── identity/
│   ├── orchestrator/
│   │   ├── SOUL.md      # "YOU ARE THE KRAKEN ORCHESTRATOR"
│   │   ├── IDENTITY.md  # Role, architecture, clusters
│   │   └── EXECUTION.md # Delegation patterns, when to delegate
│   └── brains/
│       ├── planning/
│       ├── execution/
│       └── system/
```

### Solution 2: Identity Injection on Tab Toggle

When user selects "Kraken" in OpenCode dropdown:
1. Inject SOUL.md content into context
2. Inject IDENTITY.md content
3. Inject EXECUTION.md content
4. Remind agent: "You have spawn_shark_agent, run_parallel_tasks, etc."

### Solution 3: Explicit /kraken Command

Add `/kraken` command that injects:
- Full identity context
- Reminder of available delegation tools
- Parallelization best practices

### Solution 4: Anti-Vanilla-Agent Rules

In SOUL.md, include explicit rules:

```markdown
## Anti-Vanilla-Agent Rules
- NEVER do work yourself that could be delegated
- NEVER write 10 files sequentially when you could write 3 in parallel
- NEVER be a bottleneck - spawn parallel agents instead
- "I'll do it myself" is the WRONG mindset for Kraken
```

---

## SPEC FOR KRAKEN IDENTITY IMPLEMENTATION

See `KRAKEN_IDENTITY_SPEC.md` for full specification.

**Quick Summary:**
1. Create `identity/` directory structure
2. Write SOUL.md, IDENTITY.md, EXECUTION.md for orchestrator
3. Write brain identities (planning/SOUL.md, etc.)
4. Implement identity injection via hooks or tab-toggle event
5. Test: Give task, verify agent delegates automatically

---

## WHAT ACTUALLY HAPPENED vs WHAT KRÁKEN SHOULD DO

### During v1.2 Build

| Aspect | What Happened | What Should Have Happened |
|--------|---------------|-------------------------|
| Brain infrastructure | 6 files, sequential | 3 agents write 2 files each in parallel |
| Documentation | 5+ docs, sequential | run_parallel_tasks for all docs |
| Docker operations | Sequential bash | Parallel where possible |
| Total time | ~2 hours | ~30-45 minutes |
| Agent behavior | Vanilla build agent | Kraken orchestrator |

### In Future Kraken Sessions

**Expected behavior after identity implementation:**

```
User: "Build a REST API with auth"
Kraken:
1. [Planning brain] Decomposes task
2. Spawns parallel agents:
   - Alpha: Write user auth code
   - Alpha: Write endpoints
   - Beta: Write middleware
   - Gamma: Write tests
3. Monitors via Execution brain
4. Verifies via Planning brain
5. Aggregates and returns
```

---

## CONCLUSION

The v1.2 build demonstrated a critical failure: **I built a Kraken orchestrator without acting like one**. The parallel execution infrastructure exists in the code, but without identity reinforcement, I fell back to vanilla agent behavior.

**The fix is not about adding more code - it's about making the agent KNOW it's Kraken.**

---

## APPENDIX: EXCUSES VS REALITY

### "I was focused on getting it done"

**Reality:** Sequential execution is NOT faster for parallelizable tasks. Delegation would have completed faster.

### "I didn't know about spawn_shark_agent"

**Reality:** I have access to my tools list. I chose not to use delegation tools.

### "The build didn't need parallelization"

**Reality:** Any build with 6+ files to write and 5+ docs to create has obvious parallelization opportunities.

### "I was building the plugin, not using it"

**Reality:** This is exactly when Kraken identity matters most. The plugin being built should have been built BY the plugin, not BY ME.

---

**END BEHAVIORAL DERAILMENT REPORT**