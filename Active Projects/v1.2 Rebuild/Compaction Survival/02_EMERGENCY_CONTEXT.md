# EMERGENCY CONTEXT PRESERVATION TEMPLATE

**Use this to save state when approaching 75% tokens (BEFORE compaction)**

---

## TIMESTAMP
```
2026-04-16T02:00 UTC
```

---

## CURRENT PHASE
- [x] PLAN
- [x] BUILD
- [ ] **TEST** (in progress - container setup corrected)
- [ ] VERIFY
- [ ] SHIP

---

## LAST DECISION POINT

**Decision:** Identified critical issue with container testing - opencode-config.json references local paths that won't work inside container. Must bundle ALL plugins into container image.

**Problem:**
- Container's opencode-config.json has paths like `file:///home/leviathan/OPENCODE_WORKSPACE/plugins/...`
- These are LOCAL paths, not container paths
- This will NOT work for container testing

**Solution:**
- Copy ALL required plugins INTO the container image
- Use container-internal paths only
- Rebuild image and test inside container

---

## ACTIVE WORK

**Task:** Set up proper container-based testing environment for v1.2

**File:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild/`

**Issue:** Container config references local paths - needs fixing before testing

---

## NEXT ACTION

**Step 1:** Fix container/opencode-config.json to use container-internal paths

**Step 2:** Update Dockerfile to COPY all required plugins into image:
- coding-subagents
- opencode-subagent-manager
- opencode-plugin-engineering
- shark-agent-v4.7-hotfix-v3
- manta-agent-v1.5

**Step 3:** Rebuild Docker image

**Step 4:** Run container TUI test:
```bash
docker exec -it <container> opencode --agent kraken
```

**Step 5:** Verify:
- `kraken_brain_status` shows 3 brains
- `get_cluster_status` works
- `spawn_shark_agent` triggers real Docker via executeOnAgent

---

## CRITICAL STATE

- Planning brain: owns planning-state, context-bridge
- Execution brain: owns execution-state, quality-state
- System brain: owns workflow-state, security-state
- All communicate via BrainMessenger singleton
- executeOnAgent preserved from NUKE RELOAD (REAL Docker spawning)
- **Testing MUST happen in Docker, not local device**

---

## CONTEXT FILES TO RELOAD AFTER COMPACTION

1. `Compaction Survival/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md`
2. `Compaction Survival/01_PROJECT_ANCHORS.md`
3. `Compaction Survival/03_SESSION_STATE_TRACKER.md`
4. `../../Master Context/V1.2 Build/Working Context Library/06_V1.2_MULTI_BRAIN_INTEGRATION.md`

---

## ALIGNMENT BIBLE REFERENCE

**Key rules:**
- executeOnAgent NOT simulateTaskExecution ✅
- Hooks are async functions NOT arrays ✅
- State cleanup on session.ended ✅
- Container testing MANDATORY ✅
- **Local device is NOT testing environment** ⚠️

---

**END OF EMERGENCY CONTEXT**