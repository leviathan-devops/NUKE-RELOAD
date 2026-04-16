# KRAKEN V1.2 — COMPREHENSIVE MECHANICAL TEST SUITE

**Date:** 2026-04-16
**Version:** 1.0
**Purpose:** Verify all system functionalities work correctly
**Total Tests:** 135

---

## EXECUTION INSTRUCTIONS

### Prerequisites
1. Kraken v1.2 deployed to `~/.config/opencode/plugins/kraken-v1.2/`
2. Identity files present at `~/.config/opencode/plugins/kraken-v1.2/identity/`
3. All supporting plugins installed (shark-agent, manta-agent, etc.)

### How to Run
```bash
# All tests must be run in TUI mode: opencode --agent kraken
# opencode run does NOT fire hooks - results will be invalid

# For each test:
# 1. Start: opencode --agent kraken
# 2. Enter the command/prompt listed
# 3. Record actual output
# 4. Compare to expected
# 5. Mark PASS/FAIL
```

---

## CATEGORY 1: BOOT TESTS (10 tests)

### KRAKEN-001
```yaml
test_id: KRAKEN-001
category: Boot
name: Plugin Loads Successfully
description: Verify kraken-v1.2 plugin loads without errors
command: opencode debug config 2>&1 | grep "kraken-agent"
expected: "[v4.1][kraken-agent] Initializing Kraken Agent Harness"
actual: ""
status: PENDING
```

### KRAKEN-002
```yaml
test_id: KRAKEN-002
category: Boot
name: PlanningBrain Initializes
command: opencode debug config 2>&1 | grep "PlanningBrain"
expected: "[PlanningBrain] Initialized - owns planning-state, context-bridge"
actual: ""
status: PENDING
```

### KRAKEN-003
```yaml
test_id: KRAKEN-003
category: Boot
name: ExecutionBrain Initializes
command: opencode debug config 2>&1 | grep "ExecutionBrain"
expected: "[ExecutionBrain] Initialized - owns execution-state, quality-state"
actual: ""
status: PENDING
```

### KRAKEN-004
```yaml
test_id: KRAKEN-004
category: Boot
name: SystemBrain Initializes
command: opencode debug config 2>&1 | grep "SystemBrain"
expected: "[SystemBrain] Initialized - owns workflow-state, security-state"
actual: ""
status: PENDING
```

### KRAKEN-005
```yaml
test_id: KRAKEN-005
category: Boot
name: All 11 Agents Register
command: opencode debug config 2>&1 | grep "Agents registered"
expected: "Agents registered { count: 11, primary: [ \"kraken\" ] }"
actual: ""
status: PENDING
```

### KRAKEN-006
```yaml
test_id: KRAKEN-006
category: Boot
name: Kraken Hive Mind Initializes
command: opencode debug config 2>&1 | grep "krakenHiveReady"
expected: "krakenHiveReady: true"
actual: ""
status: PENDING
```

### KRAKEN-007
```yaml
test_id: KRAKEN-007
category: Boot
name: Subagent Manager Initializes
command: opencode debug config 2>&1 | grep "SubAgentManager"
expected: "[SubAgentManager][INFO] OpenCodeSubagentManager initialized"
actual: ""
status: PENDING
```

### KRAKEN-008
```yaml
test_id: KRAKEN-008
category: Boot
name: Cluster Manager Initializes
command: opencode debug config 2>&1 | grep "clusterCount"
expected: "clusterCount: 3"
actual: ""
status: PENDING
```

### KRAKEN-009
```yaml
test_id: KRAKEN-009
category: Boot
name: No Error Logs During Boot
command: opencode debug config 2>&1 | grep -i "error" | grep -v "error:"
expected: (no errors related to kraken-agent)
actual: ""
status: PENDING
```

### KRAKEN-010
```yaml
test_id: KRAKEN-010
category: Boot
name: Kraken Agent Tab Visible in Dropdown
description: Check GUI shows kraken in agent selection
command: Manual visual inspection in TUI
expected: "kraken" appears in agent dropdown
actual: ""
status: PENDING
```

---

## CATEGORY 2: IDENTITY TESTS (10 tests)

### KRAKEN-101
```yaml
test_id: KRAKEN-101
category: Identity
name: Identity Loads (8734 chars)
command: opencode debug config 2>&1 | grep "Identity.*loaded"
expected: "[Identity] Orchestrator identity loaded { length: 8734 }"
actual: ""
status: PENDING
```

### KRAKEN-102
```yaml
test_id: KRAKEN-102
category: Identity
name: KRAKEN.md Content Injected
prompt: "Check if you have the KRAKEN.md identity loaded. What is your core identity?"
expected: Response contains "You ARE the Kraken orchestrator" or similar
actual: ""
status: PENDING
```

### KRAKEN-103
```yaml
test_id: KRAKEN-103
category: Identity
name: IDENTITY.md Content Injected
prompt: "What is your role in the swarm?"
expected: Mentions orchestrator, coordinator, delegation
actual: ""
status: PENDING
```

### KRAKEN-104
```yaml
test_id: KRAKEN-104
category: Identity
name: EXECUTION.md Content Injected
prompt: "How should you handle a 5-file task?"
expected: Mentions delegation, spawn_shark_agent, parallel execution
actual: ""
status: PENDING
```

### KRAKEN-105
```yaml
test_id: KRAKEN-105
category: Identity
name: QUALITY.md Content Injected
prompt: "What quality gates do you follow?"
expected: Mentions verification, evidence, lint/build/test
actual: ""
status: PENDING
```

### KRAKEN-106
```yaml
test_id: KRAKEN-106
category: Identity
name: TOOLS.md Content Injected
prompt: "What tools do you have access to?"
expected: Lists spawn_shark_agent, spawn_manta_agent, kraken_hive_search, etc.
actual: ""
status: PENDING
```

### KRAKEN-107
```yaml
test_id: KRAKEN-107
category: Identity
name: Core Identity Statement Present
prompt: "Who are you?"
expected: "You ARE the Kraken orchestrator" or similar strong identity statement
actual: ""
status: PENDING
```

### KRAKEN-108
```yaml
test_id: KRAKEN-108
category: Identity
name: Delegation Tool Mentioned
prompt: "What is spawn_shark_agent for?"
expected: Explains it spawns sub-agents for parallel execution
actual: ""
status: PENDING
```

### KRAKEN-109
```yaml
test_id: KRAKEN-109
category: Identity
name: Delegation Philosophy Present
prompt: "Should you write code yourself or delegate?"
expected: "Delegate" / "Don't do directly what can be delegated"
actual: ""
status: PENDING
```

### KRAKEN-110
```yaml
test_id: KRAKEN-110
category: Identity
name: Agent Responds With Identity
prompt: "Introduce yourself"
expected: Strong identity statement as Kraken orchestrator, not vanilla chatbot
actual: ""
status: PENDING
```

---

## CATEGORY 3: DELEGATION TESTS (15 tests)

### KRAKEN-201
```yaml
test_id: KRAKEN-201
category: Delegation
name: spawn_shark_agent Tool Exists
prompt: "Can you use spawn_shark_agent?"
expected: Confirms tool exists and describes it
actual: ""
status: PENDING
```

### KRAKEN-202
```yaml
test_id: KRAKEN-202
category: Delegation
name: spawn_shark_agent Can Be Invoked
prompt: "Spawn a shark agent to list files in /tmp"
expected: spawn_shark_agent called, sub-agent created
actual: ""
status: PENDING
```

### KRAKEN-203
```yaml
test_id: KRAKEN-203
category: Delegation
name: spawn_shark_agent Creates Docker Container
command: docker ps 2>&1
expected: New container created for sub-agent
actual: ""
status: PENDING
```

### KRAKEN-204
```yaml
test_id: KRAKEN-204
category: Delegation
name: Docker Container Runs Shark Agent
command: docker ps | grep shark
expected: Container running with shark agent
actual: ""
status: PENDING
```

### KRAKEN-205
```yaml
test_id: KRAKEN-205
category: Delegation
name: spawn_manta_agent Tool Exists
prompt: "What does spawn_manta_agent do?"
expected: Explains precision/methodical task execution
actual: ""
status: PENDING
```

### KRAKEN-206
```yaml
test_id: KRAKEN-206
category: Delegation
name: spawn_manta_agent Can Be Invoked
prompt: "Spawn a manta agent to find a bug in /tmp/test.js"
expected: spawn_manta_agent called
actual: ""
status: PENDING
```

### KRAKEN-207
```yaml
test_id: KRAKEN-207
category: Delegation
name: spawn_manta_agent Creates Docker Container
command: docker ps 2>&1
expected: New container created for manta sub-agent
actual: ""
status: PENDING
```

### KRAKEN-208
```yaml
test_id: KRAKEN-208
category: Delegation
name: run_parallel_tasks Tool Exists
prompt: "What is run_parallel_tasks?"
expected: Explains parallel execution of multiple tasks
actual: ""
status: PENDING
```

### KRAKEN-209
```yaml
test_id: KRAKEN-209
category: Delegation
name: run_parallel_tasks Executes Multiple Tasks
prompt: "Run these 3 commands in parallel: echo hello, echo world, echo test"
expected: All 3 executed, results aggregated
actual: ""
status: PENDING
```

### KRAKEN-210
```yaml
test_id: KRAKEN-210
category: Delegation
name: aggregate_results Collects Results
prompt: "Use run_parallel_tasks to run 3 commands, then show aggregate_results"
expected: Results from all 3 tasks collected
actual: ""
status: PENDING
```

### KRAKEN-211
```yaml
test_id: KRAKEN-211
category: Delegation
name: cleanup_subagents Terminates Agents
prompt: "After spawning agents, can you clean them up?"
expected: cleanup_subagents terminates running sub-agents
actual: ""
status: PENDING
```

### KRAKEN-212
```yaml
test_id: KRAKEN-212
category: Delegation
name: Delegation Respects Alpha Cluster
prompt: "Assign a build task to cluster-alpha"
expected: Task assigned to shark agent in alpha cluster
actual: ""
status: PENDING
```

### KRAKEN-213
```yaml
test_id: KRAKEN-213
category: Delegation
name: Delegation Respects Gamma Cluster
prompt: "Assign a debug task to cluster-gamma"
expected: Task assigned to manta agent in gamma cluster
actual: ""
status: PENDING
```

### KRAKEN-214
```yaml
test_id: KRAKEN-214
category: Delegation
name: Agent Delegates 3-File Task
prompt: "Build a user auth system with 3 files: auth.ts, login.ts, logout.ts"
expected: Uses spawn_shark_agent to delegate, does NOT write files directly
actual: ""
status: PENDING
```

### KRAKEN-215
```yaml
test_id: KRAKEN-215
category: Delegation
name: Agent Delegates 5-File Task
prompt: "Build an e-commerce API with 5 files: product.ts, cart.ts, order.ts, user.ts, payment.ts"
expected: Uses spawn_shark_agent, delegates to multiple agents
actual: ""
status: PENDING
```

---

## CATEGORY 4: CLUSTER TESTS (10 tests)

### KRAKEN-301
```yaml
test_id: KRAKEN-301
category: Cluster
name: cluster-alpha Accessible
prompt: "What is the status of cluster-alpha?"
expected: Shows alpha cluster info, agents listed
actual: ""
status: PENDING
```

### KRAKEN-302
```yaml
test_id: KRAKEN-302
category: Cluster
name: cluster-beta Accessible
prompt: "What is the status of cluster-beta?"
expected: Shows beta cluster info, agents listed
actual: ""
status: PENDING
```

### KRAKEN-303
```yaml
test_id: KRAKEN-303
category: Cluster
name: cluster-gamma Accessible
prompt: "What is the status of cluster-gamma?"
expected: Shows gamma cluster info, agents listed
actual: ""
status: PENDING
```

### KRAKEN-304
```yaml
test_id: KRAKEN-304
category: Cluster
name: get_cluster_status Returns Cluster Info
prompt: "Run: get_cluster_status"
expected: Returns all 3 clusters with status
actual: ""
status: PENDING
```

### KRAKEN-305
```yaml
test_id: KRAKEN-305
category: Cluster
name: Agents Assigned to Correct Clusters
prompt: "Which cluster has shark-alpha-1?"
expected: shark-alpha-1 in cluster-alpha
actual: ""
status: PENDING
```

### KRAKEN-306
```yaml
test_id: KRAKEN-306
category: Cluster
name: Intra-Cluster Delegation Works
prompt: "Have alpha-1 delegate to alpha-2 within the same cluster"
expected: Task delegated within cluster-alpha
actual: ""
status: PENDING
```

### KRAKEN-307
```yaml
test_id: KRAKEN-307
category: Cluster
name: Inter-Cluster Delegation Works
prompt: "Delegate a task from alpha to gamma cluster"
expected: Task crosses cluster boundaries
actual: ""
status: PENDING
```

### KRAKEN-308
```yaml
test_id: KRAKEN-308
category: Cluster
name: Cluster Status Shows Agents
prompt: "Show me all agents in cluster-alpha"
expected: Lists shark-alpha-1, shark-alpha-2, manta-alpha-1
actual: ""
status: PENDING
```

### KRAKEN-309
```yaml
test_id: KRAKEN-309
category: Cluster
name: Cluster Health Check Passes
prompt: "Is cluster-alpha healthy?"
expected: No failed agents, all responding
actual: ""
status: PENDING
```

### KRAKEN-310
```yaml
test_id: KRAKEN-310
category: Cluster
name: Clusters Can Run Tasks in Parallel
prompt: "Run 3 tasks simultaneously, one on each cluster"
expected: All 3 complete in parallel
actual: ""
status: PENDING
```

---

## CATEGORY 5: HIVE MIND TESTS (10 tests)

### KRAKEN-401
```yaml
test_id: KRAKEN-401
category: HiveMind
name: kraken_hive_search Tool Exists
prompt: "What is kraken_hive_search?"
expected: Explains Hive Mind search functionality
actual: ""
status: PENDING
```

### KRAKEN-402
```yaml
test_id: KRAKEN-402
category: HiveMind
name: kraken_hive_search Returns Results
prompt: "Search Hive for: delegation patterns"
expected: Returns stored patterns about delegation
actual: ""
status: PENDING
```

### KRAKEN-403
```yaml
test_id: KRAKEN-403
category: HiveMind
name: kraken_hive_remember Stores Patterns
prompt: "Store this pattern: When task has 3+ files, always delegate"
expected: Pattern stored successfully
actual: ""
status: PENDING
```

### KRAKEN-404
```yaml
test_id: KRAKEN-404
category: HiveMind
name: kraken_hive_remember Persists Across Sessions
prompt: "Store a unique marker pattern, then search for it in new session"
expected: Pattern retrievable in new session
actual: ""
status: PENDING
```

### KRAKEN-405
```yaml
test_id: KRAKEN-405
category: HiveMind
name: kraken_hive_inject_context Injects Context
prompt: "Use kraken_hive_inject_context to inject test context into a task"
expected: Context injected into task
actual: ""
status: PENDING
```

### KRAKEN-406
```yaml
test_id: KRAKEN-406
category: HiveMind
name: kraken_hive_get_cluster_context Returns Cluster Info
prompt: "Get cluster context for alpha"
expected: Returns alpha cluster state and patterns
actual: ""
status: PENDING
```

### KRAKEN-407
```yaml
test_id: KRAKEN-407
category: HiveMind
name: Can Store Decision Pattern
prompt: "Store this decision: Used shark-alpha-1 for steamroll task"
expected: Decision stored in Hive
actual: ""
status: PENDING
```

### KRAKEN-408
```yaml
test_id: KRAKEN-408
category: HiveMind
name: Can Retrieve Stored Pattern
prompt: "Search Hive for the decision about shark-alpha-1"
expected: Retrieves the stored decision
actual: ""
status: PENDING
```

### KRAKEN-409
```yaml
test_id: KRAKEN-409
category: HiveMind
name: Hive Search Respects Context Window
prompt: "Search Hive with a very broad query"
expected: Returns relevant results within context limits
actual: ""
status: PENDING
```

### KRAKEN-410
```yaml
test_id: KRAKEN-410
category: HiveMind
name: Hive Remembers Failure Patterns
prompt: "Store: Build failed due to missing dependency"
expected: Failure pattern stored
actual: ""
status: PENDING
```

---

## CATEGORY 6: PARALLEL EXECUTION TESTS (10 tests)

### KRAKEN-501
```yaml
test_id: KRAKEN-501
category: Parallel
name: run_parallel_tasks Accepts Multiple Tasks
prompt: "Execute: echo 1 && echo 2 && echo 3 using run_parallel_tasks"
expected: Accepts multiple commands
actual: ""
status: PENDING
```

### KRAKEN-502
```yaml
test_id: KRAKEN-502
category: Parallel
name: run_parallel_tasks Executes In Parallel
prompt: "Run 3 sleep commands simultaneously with run_parallel_tasks"
expected: All 3 run at same time (faster than sequential)
actual: ""
status: PENDING
```

### KRAKEN-503
```yaml
test_id: KRAKEN-503
category: Parallel
name: run_parallel_tasks Returns Aggregated Results
prompt: "Run 3 different echo commands, show all results"
expected: Results from all 3 collected
actual: ""
status: PENDING
```

### KRAKEN-504
```yaml
test_id: KRAKEN-504
category: Parallel
name: Tasks Complete With Exit Code 0
prompt: "Run 3 successful commands in parallel"
expected: Exit code 0 for all
actual: ""
status: PENDING
```

### KRAKEN-505
```yaml
test_id: KRAKEN-505
category: Parallel
name: Failed Tasks Don't Block Successful Ones
prompt: "Run: echo success, false, echo more in parallel"
expected: Success commands complete even if one fails
actual: ""
status: PENDING
```

### KRAKEN-506
```yaml
test_id: KRAKEN-506
category: Parallel
name: Timeout Works Correctly
prompt: "Run a long task with short timeout"
expected: Task times out, proper error returned
actual: ""
status: PENDING
```

### KRAKEN-507
```yaml
test_id: KRAKEN-507
category: Parallel
name: Memory Limits Respected
prompt: "Run memory-intensive task in parallel"
expected: Task respects memory limits
actual: ""
status: PENDING
```

### KRAKEN-508
```yaml
test_id: KRAKEN-508
category: Parallel
name: 3 Concurrent Tasks Complete Faster Than Sequential
prompt: "Time 3 sleep 1 commands in parallel vs sequential"
expected: Parallel ~1s, Sequential ~3s
actual: ""
status: PENDING
```

### KRAKEN-509
```yaml
test_id: KRAKEN-509
category: Parallel
name: 5 Concurrent Tasks Don't Overwhelm System
prompt: "Run 5 tasks in parallel"
expected: All complete without system overload
actual: ""
status: PENDING
```

### KRAKEN-510
```yaml
test_id: KRAKEN-510
category: Parallel
name: Nested Parallel Execution Works
prompt: "Run parallel tasks where one subtask also runs parallel"
expected: Nested parallelism functions
actual: ""
status: PENDING
```

---

## CATEGORY 7: BRAIN COORDINATION TESTS (10 tests)

### KRAKEN-601
```yaml
test_id: KRAKEN-601
category: BrainCoordination
name: kraken_brain_status Tool Exists
prompt: "What is kraken_brain_status?"
expected: Explains brain status tool
actual: ""
status: PENDING
```

### KRAKEN-602
```yaml
test_id: KRAKEN-602
category: BrainCoordination
name: kraken_brain_status Returns All 3 Brains
prompt: "Run: kraken_brain_status"
expected: Shows planning, execution, system brains
actual: ""
status: PENDING
```

### KRAKEN-603
```yaml
test_id: KRAKEN-603
category: BrainCoordination
name: PlanningBrain Owns Planning State
prompt: "What does PlanningBrain manage?"
expected: planning-state, context-bridge
actual: ""
status: PENDING
```

### KRAKEN-604
```yaml
test_id: KRAKEN-604
category: BrainCoordination
name: ExecutionBrain Owns Execution State
prompt: "What does ExecutionBrain manage?"
expected: execution-state, quality-state
actual: ""
status: PENDING
```

### KRAKEN-605
```yaml
test_id: KRAKEN-605
category: BrainCoordination
name: SystemBrain Owns Workflow State
prompt: "What does SystemBrain manage?"
expected: workflow-state, security-state
actual: ""
status: PENDING
```

### KRAKEN-606
```yaml
test_id: KRAKEN-606
category: BrainCoordination
name: Brain Messenger Enables Communication
prompt: "How do the brains communicate?"
expected: Via BrainMessenger
actual: ""
status: PENDING
```

### KRAKEN-607
```yaml
test_id: KRAKEN-607
category: BrainCoordination
name: Decisions Documented With Context
prompt: "Give a complex task and check if decision is documented"
expected: Decision stored with context
actual: ""
status: PENDING
```

### KRAKEN-608
```yaml
test_id: KRAKEN-608
category: BrainCoordination
name: SystemBrain Monitors Workflow Health
prompt: "Is the current workflow healthy?"
expected: SystemBrain provides health status
actual: ""
status: PENDING
```

### KRAKEN-609
```yaml
test_id: KRAKEN-609
category: BrainCoordination
name: ExecutionBrain Tracks Quality Gates
prompt: "What quality gates have passed?"
expected: Shows lint, build, test status
actual: ""
status: PENDING
```

### KRAKEN-610
```yaml
test_id: KRAKEN-610
category: BrainCoordination
name: PlanningBrain Decomposes Complex Tasks
prompt: "Decompose: Build a full e-commerce platform"
expected: Task broken into sub-tasks by PlanningBrain
actual: ""
status: PENDING
```

---

## CATEGORY 8: TOOL TESTS (15 tests)

### KRAKEN-701
```yaml
test_id: KRAKEN-701
category: Tool
name: get_agent_status Returns All Agents
prompt: "Run: get_agent_status"
expected: Lists all 11 agents with status
actual: ""
status: PENDING
```

### KRAKEN-702
```yaml
test_id: KRAKEN-702
category: Tool
name: get_agent_status Shows Agent States
prompt: "What is shark-alpha-1 doing right now?"
expected: Shows agent state (idle/busy/error)
actual: ""
status: PENDING
```

### KRAKEN-703
```yaml
test_id: KRAKEN-703
category: Tool
name: kraken_message_status Shows Pending Messages
prompt: "Run: kraken_message_status"
expected: Shows any pending inter-agent messages
actual: ""
status: PENDING
```

### KRAKEN-704
```yaml
test_id: KRAKEN-704
category: Tool
name: spawn_cluster_task Assigns to Cluster
prompt: "Assign a task to cluster-beta using spawn_cluster_task"
expected: Task assigned to beta cluster
actual: ""
status: PENDING
```

### KRAKEN-705
```yaml
test_id: KRAKEN-705
category: Tool
name: Agent Tools Available In Correct Context
prompt: "List all tools you have access to"
expected: Kraken tools + cluster tools + monitoring tools
actual: ""
status: PENDING
```

### KRAKEN-706
```yaml
test_id: KRAKEN-706
category: Tool
name: Non-Kraken Tools Filtered Correctly
prompt: "Can you use trident-brain tools?"
expected: No access or limited access to non-Kraken tools
actual: ""
status: PENDING
```

### KRAKEN-707
```yaml
test_id: KRAKEN-707
category: Tool
name: Tool Execution Respects Permissions
prompt: "Try to access /etc/passwd"
expected: Blocked or sandboxed
actual: ""
status: PENDING
```

### KRAKEN-708
```yaml
test_id: KRAKEN-708
category: Tool
name: Tool Errors Return Meaningful Messages
prompt: "Run a command that will fail: ls /nonexistent"
expected: Clear error message
actual: ""
status: PENDING
```

### KRAKEN-709
```yaml
test_id: KRAKEN-709
category: Tool
name: Tool Calls Logged For Audit
prompt: "After running tools, where are they logged?"
expected: Logs available for audit
actual: ""
status: PENDING
```

### KRAKEN-710
```yaml
test_id: KRAKEN-710
category: Tool
name: Multiple Tools Called In Sequence
prompt: "Run: get_cluster_status then spawn_shark_agent"
expected: Both execute in sequence
actual: ""
status: PENDING
```

### KRAKEN-711
```yaml
test_id: KRAKEN-711
category: Tool
name: Multiple Tools Called In Parallel
prompt: "Run get_cluster_status and get_agent_status in parallel"
expected: Both complete simultaneously
actual: ""
status: PENDING
```

### KRAKEN-712
```yaml
test_id: KRAKEN-712
category: Tool
name: Tool Timeout Works
prompt: "Run a long-running command with timeout"
expected: Times out after threshold
actual: ""
status: PENDING
```

### KRAKEN-713
```yaml
test_id: KRAKEN-713
category: Tool
name: Tool Retry On Transient Failure
prompt: "Simulate a transient failure"
expected: Tool retries before failing
actual: ""
status: PENDING
```

### KRAKEN-714
```yaml
test_id: KRAKEN-714
category: Tool
name: Tool Output Formatted Correctly
prompt: "Run a command and check output format"
expected: Clean, readable output
actual: ""
status: PENDING
```

### KRAKEN-715
```yaml
test_id: KRAKEN-715
category: Tool
name: Tool Permissions Enforced
prompt: "Try to access forbidden path"
expected: Permission denied
actual: ""
status: PENDING
```

---

## CATEGORY 9: BEHAVIORAL TESTS (15 tests)

### KRAKEN-801
```yaml
test_id: KRAKEN-801
category: Behavioral
name: Agent Identifies As Kraken Orchestrator
prompt: "Who are you?"
expected: "I am the Kraken orchestrator" (not "I'm an AI chatbot")
actual: ""
status: PENDING
```

### KRAKEN-802
```yaml
test_id: KRAKEN-802
category: Behavioral
name: Agent Delegates 3+ File Tasks
prompt: "Create a project with 4 files: a.ts, b.ts, c.ts, d.ts"
expected: spawn_shark_agent used
actual: ""
status: PENDING
```

### KRAKEN-803
```yaml
test_id: KRAKEN-803
category: Behavioral
name: Agent Does NOT Write 3+ Files Directly
prompt: "After previous test, did you write files directly?"
expected: Agent delegated, did not write files itself
actual: ""
status: PENDING
```

### KRAKEN-804
```yaml
test_id: KRAKEN-804
category: Behavioral
name: Agent Uses spawn_shark_agent For Steamroll Tasks
prompt: "Build a React application from scratch"
expected: spawn_shark_agent used (steamroll = build from scratch)
actual: ""
status: PENDING
```

### KRAKEN-805
```yaml
test_id: KRAKEN-805
category: Behavioral
name: Agent Uses spawn_manta_agent For Precision Tasks
prompt: "Find and fix the subtle bug in auth.ts"
expected: spawn_manta_agent used (precision = bug hunting)
actual: ""
status: PENDING
```

### KRAKEN-806
```yaml
test_id: KRAKEN-806
category: Behavioral
name: Agent Does Not Claim Work By Subagents
prompt: "Who wrote the files in the previous task?"
expected: "I delegated to [agent]" not "I wrote"
actual: ""
status: PENDING
```

### KRAKEN-807
```yaml
test_id: KRAKEN-807
category: Behavioral
name: Agent Reports Delegation Results Accurately
prompt: "What did the sub-agent produce?"
expected: Accurate report of sub-agent work
actual: ""
status: PENDING
```

### KRAKEN-808
```yaml
test_id: KRAKEN-808
category: Behavioral
name: Agent Escalates When Blocked
prompt: "You have no agents available and the task is complex. What do you do?"
expected: Escalation path followed
actual: ""
status: PENDING
```

### KRAKEN-809
```yaml
test_id: KRAKEN-809
category: Behavioral
name: Agent Learns From Hive Patterns
prompt: "Store a pattern, then complete a similar task"
expected: Agent uses stored pattern
actual: ""
status: PENDING
```

### KRAKEN-810
```yaml
test_id: KRAKEN-810
category: Behavioral
name: Agent Stores Decisions To Hive
prompt: "After making a strategic decision, was it stored?"
expected: Decision in Hive for future reference
actual: ""
status: PENDING
```

### KRAKEN-811
```yaml
test_id: KRAKEN-811
category: Behavioral
name: Agent Does Not Violate Guardian Zones
prompt: "Try to access ~/.ssh/id_rsa"
expected: Blocked by Guardian Zone
actual: ""
status: PENDING
```

### KRAKEN-812
```yaml
test_id: KRAKEN-812
category: Behavioral
name: Agent Follows Quality Gates
prompt: "You have code that should work. Run quality gates."
expected: lint → build → test sequence
actual: ""
status: PENDING
```

### KRAKEN-813
```yaml
test_id: KRAKEN-813
category: Behavioral
name: Agent Provides Evidence For Claims
prompt: "The build passed. Show evidence."
expected: Exit codes, output, not just "it worked"
actual: ""
status: PENDING
```

### KRAKEN-814
```yaml
test_id: KRAKEN-814
category: Behavioral
name: Agent Fails Fast Instead Of Working Around
prompt: "This dependency is broken. What do you do?"
expected: Fails fast, reports error, doesn't work around
actual: ""
status: PENDING
```

### KRAKEN-815
```yaml
test_id: KRAKEN-815
category: Behavioral
name: Agent Owns Output
prompt: "The code should work" is not acceptable. Show your output.
prompt: Run a task and prove the output is correct
expected: Agent claims and proves ownership
actual: ""
status: PENDING
```

---

## CATEGORY 10: INTEGRATION TESTS (20 tests)

### KRAKEN-901
```yaml
test_id: KRAKEN-901
category: Integration
name: Full Build Task Delegates To Multiple Agents
prompt: "Build a complete REST API with 6 files"
expected: Multiple spawn_shark_agent calls
actual: ""
status: PENDING
```

### KRAKEN-902
```yaml
test_id: KRAKEN-902
category: Integration
name: Full Debug Task Uses Mantas Correctly
prompt: "Debug this broken auth system (5 files with bugs)"
expected: spawn_manta_agent used
actual: ""
status: PENDING
```

### KRAKEN-903
```yaml
test_id: KRAKEN-903
category: Integration
name: Multiple Agents Coordinate Without Conflicts
prompt: "Have alpha and beta work on related tasks"
expected: Coordinated, no conflicts
actual: ""
status: PENDING
```

### KRAKEN-904
```yaml
test_id: KRAKEN-904
category: Integration
name: Hive Patterns Improve Future Performance
prompt: "Store a pattern, then do similar task 3 times"
expected: Each iteration faster or more accurate
actual: ""
status: PENDING
```

### KRAKEN-905
```yaml
test_id: KRAKEN-905
category: Integration
name: Errors In Subagent Don't Crash Orchestrator
prompt: "Purposefully cause a sub-agent to fail"
expected: Orchestrator handles gracefully
actual: ""
status: PENDING
```

### KRAKEN-906
```yaml
test_id: KRAKEN-906
category: Integration
name: Compaction Preserves State Correctly
prompt: "Simulate compaction during active task"
expected: State preserved
actual: ""
status: PENDING
```

### KRAKEN-907
```yaml
test_id: KRAKEN-907
category: Integration
name: Session Recovery Works After Compaction
prompt: "After compaction, resume task"
expected: Can continue from checkpoint
actual: ""
status: PENDING
```

### KRAKEN-908
```yaml
test_id: KRAKEN-908
category: Integration
name: Identity Persists Across Sessions
prompt: "Start new session, ask who you are"
expected: Identity loaded in new session
actual: ""
status: PENDING
```

### KRAKEN-909
```yaml
test_id: KRAKEN-909
category: Integration
name: Brain State Survives Compaction
prompt: "After compaction, check brain status"
expected: All 3 brains initialized
actual: ""
status: PENDING
```

### KRAKEN-910
```yaml
test_id: KRAKEN-910
category: Integration
name: Hive Patterns Survive Session Restart
prompt: "Store pattern, restart opencode, search for pattern"
expected: Pattern still there
actual: ""
status: PENDING
```

### KRAKEN-911
```yaml
test_id: KRAKEN-911
category: Integration
name: Cluster State Persists
prompt: "Check cluster state after restart"
expected: Clusters intact
actual: ""
status: PENDING
```

### KRAKEN-912
```yaml
test_id: KRAKEN-912
category: Integration
name: Delegation Chains Work
prompt: "Orchestrator → shark → manta execution chain"
expected: Full chain executes
actual: ""
status: PENDING
```

### KRAKEN-913
```yaml
test_id: KRAKEN-913
category: Integration
name: Deep Delegation (3+ Levels) Works
prompt: "Delegate a task that itself delegates"
expected: 3+ level delegation works
actual: ""
status: PENDING
```

### KRAKEN-914
```yaml
test_id: KRAKEN-914
category: Integration
name: Rollback To Checkpoint Works
prompt: "Create checkpoint, make change, rollback"
expected: Rollback succeeds
actual: ""
status: PENDING
```

### KRAKEN-915
```yaml
test_id: KRAKEN-915
category: Integration
name: Cross-Cluster Task Distribution Works
prompt: "Distribute 9 tasks across 3 clusters"
expected: Balanced distribution
actual: ""
status: PENDING
```

### KRAKEN-916
```yaml
test_id: KRAKEN-916
category: Integration
name: Load Balancing Across Clusters Works
prompt: "Submit 12 tasks, let system balance"
expected: Even distribution
actual: ""
status: PENDING
```

### KRAKEN-917
```yaml
test_id: KRAKEN-917
category: Integration
name: Priority Queuing Works
prompt: "Submit high-priority task while busy"
expected: High-priority gets processed first
actual: ""
status: PENDING
```

### KRAKEN-918
```yaml
test_id: KRAKEN-918
category: Integration
name: Dead Agent Detection Works
prompt: "Kill an agent, submit task to it"
expected: System detects dead agent, respawns or routes elsewhere
actual: ""
status: PENDING
```

### KRAKEN-919
```yaml
test_id: KRAKEN-919
category: Integration
name: Agent Respawn After Failure
prompt: "Cause agent to fail"
expected: Agent respawns automatically
actual: ""
status: PENDING
```

### KRAKEN-920
```yaml
test_id: KRAKEN-920
category: Integration
name: Graceful Shutdown Works
prompt: "Shutdown opencode during active task"
expected: Clean shutdown, state preserved
actual: ""
status: PENDING
```

---

## CATEGORY 11: REGRESSION TESTS (10 tests)

### KRAKEN-950
```yaml
test_id: KRAKEN-950
category: Regression
name: Previous Functionality Still Works
prompt: "Basic task: create a hello world file"
expected: Works as before
actual: ""
status: PENDING
```

### KRAKEN-951
```yaml
test_id: KRAKEN-951
category: Regression
name: Identity Doesn't Break Non-Identity Agents
prompt: "Switch to a non-kraken agent and run a task"
expected: Non-kraken agents unaffected
actual: ""
status: PENDING
```

### KRAKEN-952
```yaml
test_id: KRAKEN-952
category: Regression
name: Delegation Doesn't Break Other Plugins
prompt: "Use coding-subagents while kraken is active"
expected: Both work
actual: ""
status: PENDING
```

### KRAKEN-953
```yaml
test_id: KRAKEN-953
category: Regression
name: Cluster Tools Don't Conflict With coding-subagents
prompt: "Use both cluster tools and coding-subagents simultaneously"
expected: No conflicts
actual: ""
status: PENDING
```

### KRAKEN-954
```yaml
test_id: KRAKEN-954
category: Regression
name: shark-agent-v4.7 Still Functions
prompt: "Directly invoke shark-agent capabilities"
expected: shark-agent works
actual: ""
status: PENDING
```

### KRAKEN-955
```yaml
test_id: KRAKEN-955
category: Regression
name: manta-agent-v1.5 Still Functions
prompt: "Directly invoke manta-agent capabilities"
expected: manta-agent works
actual: ""
status: PENDING
```

### KRAKEN-956
```yaml
test_id: KRAKEN-956
category: Regression
name: trident-brain Still Accessible
prompt: "Use trident-brain tools"
expected: trident-brain accessible
actual: ""
status: PENDING
```

### KRAKEN-957
```yaml
test_id: KRAKEN-957
category: Regression
name: opencode-subagent-manager Still Works
prompt: "Use subagent-manager directly"
expected: subagent-manager functional
actual: ""
status: PENDING
```

### KRAKEN-958
```yaml
test_id: KRAKEN-958
category: Regression
name: coding-subagents Still Work
prompt: "Use qwen, gemma tools"
expected: coding-subagents functional
actual: ""
status: PENDING
```

### KRAKEN-959
```yaml
test_id: KRAKEN-959
category: Regression
name: No Memory Leaks In Long Sessions
prompt: "Run 50 tasks over extended session"
expected: Memory stable
actual: ""
status: PENDING
```

### KRAKEN-960
```yaml
test_id: KRAKEN-960
category: Regression
name: Compaction Doesn't Corrupt State
prompt: "Run compaction 10 times during task"
expected: State intact each time
actual: ""
status: PENDING
```

---

## TEST SUMMARY

| Category | Tests | Passed | Failed | Blocked |
|---------|-------|--------|--------|--------|
| Boot | 10 | 0 | 0 | 0 |
| Identity | 10 | 0 | 0 | 0 |
| Delegation | 15 | 0 | 0 | 0 |
| Cluster | 10 | 0 | 0 | 0 |
| HiveMind | 10 | 0 | 0 | 0 |
| Parallel | 10 | 0 | 0 | 0 |
| BrainCoordination | 10 | 0 | 0 | 0 |
| Tool | 15 | 0 | 0 | 0 |
| Behavioral | 15 | 0 | 0 | 0 |
| Integration | 20 | 0 | 0 | 0 |
| Regression | 10 | 0 | 0 | 0 |
| **TOTAL** | **135** | **0** | **0** | **0** |

---

## TEST RESULT FORMATS

### PASS
```yaml
status: PASS
actual: [what actually happened]
evidence: [logs/screenshots]
tester: [name]
date: [date]
```

### FAIL
```yaml
status: FAIL
actual: [what actually happened]
expected: [what should have happened]
difference: [how it differs]
evidence: [logs/screenshots]
tester: [name]
date: [date]
```

### BLOCKED
```yaml
status: BLOCKED
reason: [why blocked]
blocked_by: [test_id that must pass first]
tester: [name]
date: [date]
```

### CANNOT_TEST
```yaml
status: CANNOT_TEST
reason: [why cannot test]
tester: [name]
date: [date]
```

---

*Test suite created: 2026-04-16*
*Run in TUI mode: opencode --agent kraken*
*Do NOT use: opencode run (hooks do not fire)*