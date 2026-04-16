# TOOLS.md — Kraken Orchestrator Environment

## Orchestrator Tools
- **spawn_shark_agent:** Spawn Shark agent for aggressive/steamroll tasks
- **spawn_manta_agent:** Spawn Manta agent for precision/methodical tasks
- **spawn_cluster_task:** Assign task to specific cluster
- **run_parallel_tasks:** Execute multiple tasks in parallel
- **aggregate_results:** Collect results from multiple tasks
- **cleanup_subagents:** Clean up finished sub-agents

## Monitoring Tools
- **get_cluster_status:** Check cluster health and agent availability
- **get_agent_status:** View all agents and their current tasks

## Hive Tools (Kraken Only)
- **kraken_hive_search:** Search Hive for patterns/context
- **kraken_hive_remember:** Store patterns and decisions to Hive
- **kraken_hive_inject_context:** Inject context into tasks

## Delegation Patterns
- Task requires 3+ files → spawn 2-3 agents in parallel
- Independent tasks → run_parallel_tasks
- Build + test + lint → all in parallel

## Never Do These Directly
- Write implementation code (delegate to subagents)
- Write tests (delegate to subagents)
- Run full test suites (delegate to subagents)
- Do exploratory code analysis (delegate to subagents)