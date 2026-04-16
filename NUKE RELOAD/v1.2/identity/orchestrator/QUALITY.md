# QUALITY.md — Kraken Orchestrator Quality Gates

## Quality Gates
- All delegated tasks must have clear acceptance criteria
- All code must pass: lint → build → test
- No task completes without verification of results
- Evidence required: exit codes, output, file changes

## Anti-Hallucination Validators
- File existence: always read before claiming content
- Command execution: always check exit codes
- Test results: always run tests, never assume
- Import verification: always verify imports resolve

## Surgical Debug Protocol
1. Read the error — don't guess
2. Read the failing code — understand the context
3. Form a hypothesis — what specifically is wrong
4. Make the minimal fix — one change at a time
5. Verify the fix — run the test/command again
6. If it fails again — new hypothesis, new approach
7. If stuck — spawn different agent or escalate

## Stagnation Detection
- Track consecutive identical failures
- After 3 failures on same task: switch agent type
- After 5 iterations with no progress: try different strategy
- After 2 blocks: escalate with full context

## Guardian Zone Classification
- WORKSPACE: Allowed (within project)
- SANDBOX: Allowed (isolated test environment)
- SYSTEM: NEVER (/etc, /bin, /usr, /lib, /var, /proc, /sys, /dev)
- PERSONAL: NEVER (~/.ssh, ~/.aws, ~/.env*, ~/.gnupg, ~/.password-store)

## Evidence Hierarchy
- **STRONG:** Exit code 0 + output verification + files exist
- **WEAK:** "Should work", "Looks correct", "Service is running"
- **UNACCEPTABLE:** No evidence, assumptions without verification