# KRAKEN V1.2 — TROUBLESHOOTING GUIDE

**For:** Vanilla build agent with no prior context
**Version:** 1.2.0
**Classification:** Troubleshooting Documentation

---

## QUICK DIAGNOSTICS

Run these commands to quickly identify issues:

```bash
# 1. Check if plugin loads
opencode run "hello" 2>&1 | grep -i kraken

# 2. Check Docker
docker ps

# 3. Check bundle exists
ls -la ~/.config/opencode/plugins/kraken-agent-v1.2/dist/

# 4. Check config
cat ~/.config/opencode/opencode.json
```

---

## ISSUE CATEGORIES

1. [Plugin Loading Issues](#category-1-plugin-loading-issues)
2. [Brain Initialization Issues](#category-2-brain-initialization-issues)
3. [Docker/Container Issues](#category-3-dockercontainer-issues)
4. [Execution Issues](#category-4-execution-issues)
5. [TUI/Hang Issues](#category-5-tuihang-issues)

---

## CATEGORY 1: PLUGIN LOADING ISSUES

### Issue 1.1: Plugin Not Found

**Symptom:**
```
Error: Plugin not found at file:///path/to/plugin
```

**Diagnosis:**
```bash
# Check if file exists
ls -la ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js

# Check opencode.json path
cat ~/.config/opencode/opencode.json
```

**Solutions:**

1. **Verify path is correct** - The path must exactly match:
   ```json
   "file:///home/USERNAME/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js"
   ```

2. **Fix path:**
   ```bash
   # Get your home path
   echo $HOME

   # Edit config
   nano ~/.config/opencode/opencode.json
   ```

3. **Use correct path format:**
   - Windows: `file:///C:/Users/USERNAME/.config/opencode/plugins/...`
   - Linux/Mac: `file:///home/USERNAME/.config/opencode/plugins/...`

---

### Issue 1.2: Bundle Corrupted

**Symptom:**
```
Error: Cannot find module
Error: Invalid bundle
```

**Diagnosis:**
```bash
# Check bundle size
wc -c ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js
# Should be: 555061

# Verify bundle integrity
grep -c "executeOnAgent" ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js
# Should be: 2

grep -c "simulateTaskExecution" ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js
# Should be: 0
```

**Solution:**
```bash
# Re-extract from container
docker run --rm kraken-v1.2-test:latest tar -C /root/.config/opencode/plugins/kraken-agent -cf - . > /tmp/kraken.tar
rm -rf ~/.config/opencode/plugins/kraken-agent-v1.2
mkdir -p ~/.config/opencode/plugins/kraken-agent-v1.2
tar -xf /tmp/kraken.tar -C ~/.config/opencode/plugins/kraken-agent-v1.2
```

---

### Issue 1.3: Multiple Plugin Conflicts

**Symptom:**
```
Error: Plugin already loaded
Warning: Duplicate plugin name
```

**Diagnosis:**
```bash
# Check for duplicate entries
grep -c "kraken" ~/.config/opencode/opencode.json
```

**Solution:**
```bash
# Backup and recreate clean config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# Create clean config with ONLY kraken
echo '{"plugin":["file:///home/USERNAME/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js"]}' > ~/.config/opencode/opencode.json
```

---

## CATEGORY 2: BRAIN INITIALIZATION ISSUES

### Issue 2.1: Brains Not Initializing

**Symptom:**
```
[PlanningBrain] Initializing...
(v nothing else)
```

**Diagnosis:**
Check container logs:
```bash
docker logs <container> 2>&1 | grep -i brain
```

**Expected output:**
```
[PlanningBrain] Initializing...
[PlanningBrain] Initialized - owns planning-state, context-bridge
[ExecutionBrain] Initializing...
[ExecutionBrain] Initialized - owns execution-state, quality-state
[SystemBrain] Initializing...
[SystemBrain] Initialized - owns workflow-state, security-state
```

**Solutions:**

1. **Increase timeout** - Brains may need more time:
   ```bash
   # Wait longer before checking logs
   sleep 10
   docker logs <container>
   ```

2. **Check memory** - Not enough memory:
   ```bash
   docker stats
   ```

3. **Rebuild container** - Corruption:
   ```bash
   docker rmi kraken-v1.2-test:latest
   cd SHIP_PACKAGE/container
   docker build -t kraken-v1.2-test:latest -f Dockerfile .
   ```

---

### Issue 2.2: Partial Brain Initialization

**Symptom:**
```
[PlanningBrain] Initialized
[ExecutionBrain] Initializing...
(Error occurred)
```

**Diagnosis:**
```bash
docker logs <container> 2>&1 | tail -50
```

**Likely Cause:** Dependency issue or circular import

**Solution:**
```bash
# Rebuild from source
cd SHIP_PACKAGE
bun run build

# Verify bundle
grep -c "createPlanningBrain\|createExecutionBrain\|createSystemBrain" dist/index.js
```

---

### Issue 2.3: Brain Status Tool Not Working

**Symptom:**
```
kraken_brain_status: command not found
```

**Diagnosis:**
```bash
# Check if tool exists in bundle
grep -c "kraken_brain_status" ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js
# Should be: 1
```

**Solution:** Bundle may not include monitoring tools. Verify source:
```bash
grep "kraken_brain_status" SHIP_PACKAGE/src/tools/monitoring-tools.ts
```

---

## CATEGORY 3: DOCKER/CONTAINER ISSUES

### Issue 3.1: Docker Build Fails

**Symptom:**
```
ERROR: failed to solve: failed to compute cache key
```

**Diagnosis:**
```bash
# Check if context is correct
ls -la SHIP_PACKAGE/
```

**Solutions:**

1. **Build from correct directory:**
   ```bash
   cd SHIP_PACKAGE/container
   docker build -t kraken-v1.2-test:latest -f Dockerfile .
   ```

2. **Check for spaces in paths:**
   ```bash
   # Spaces can cause issues
   ls -la SHIP_PACKAGE/container/
   ```

3. **Clear Docker cache:**
   ```bash
   docker builder prune
   docker build --no-cache -t kraken-v1.2-test:latest -f Dockerfile .
   ```

---

### Issue 3.2: Docker Run Hangs

**Symptom:**
```
docker run -it kraken-v1.2-test:latest
(times out)
```

**Diagnosis:**
```bash
# Run with timeout
timeout 30 docker run -it --rm kraken-v1.2-test:latest echo "test"
```

**Solutions:**

1. **Use run instead of exec:**
   ```bash
   # Correct
   docker run -it kraken-v1.2-test:latest

   # Not
   docker exec -it kraken-v1.2-test:latest opencode
   ```

2. **Use opencode serve instead of TUI:**
   ```bash
   docker run -d kraken-v1.2-test:latest opencode serve
   docker exec -it kraken-v1.2-test:latest opencode attach
   ```

3. **Detach after startup:**
   ```bash
   docker run -d --name kraken kraken-v1.2-test:latest
   docker exec -it kraken opencode
   ```

---

### Issue 3.3: executeOnAgent Not Working (Docker in Docker)

**Symptom:**
```
Error: Cannot connect to Docker daemon
spawn_shark_agent fails immediately
```

**Diagnosis:**
```bash
# Check if Docker socket exists in container
docker run --rm kraken-v1.2-test:latest ls -la /var/run/docker.sock

# Check if docker command works inside container
docker run --rm kraken-v1.2-test:latest docker ps
```

**Solutions:**

1. **Mount Docker socket when running container:**
   ```bash
   docker run -it --rm \
     -v /var/run/docker.sock:/var/run/docker.sock \
     kraken-v1.2-test:latest
   ```

2. **Verify Docker access from host:**
   ```bash
   docker ps
   ```

---

### Issue 3.4: Container Image Too Large

**Symptom:**
```
Image size: 3GB+
WARNING: Image size exceeds recommended 2GB
```

**Diagnosis:**
```bash
docker images kraken-v1.2-test:latest
```

**Solutions:**

1. **Prune builder cache:**
   ```bash
   docker builder prune
   ```

2. **Multi-stage build** (not implemented in current Dockerfile)

3. **Verify bundle size:**
   ```bash
   docker run --rm kraken-v1.2-test:latest du -sh /root/.config/opencode/plugins/
   ```

---

## CATEGORY 4: EXECUTION ISSUES

### Issue 4.1: spawn_shark_agent Command Not Found

**Symptom:**
```
spawn_shark_agent: command not found
```

**Diagnosis:**
```bash
# Check if tool exists
grep -c "spawn_shark_agent" ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js
```

**Solution:** The tool name may be different. Check available tools:
```bash
# In TUI, type:
help

# Or check source:
grep "spawn_shark_agent" SHIP_PACKAGE/src/index.ts
```

---

### Issue 4.2: Agent Spawns But Doesn't Execute

**Symptom:**
```
spawn_shark_agent returns success
Container created but no output
```

**Diagnosis:**
```bash
# Check container status
docker ps -a | grep shark

# Check container logs
docker logs <container_id>

# Check if container is running
docker inspect <container_id> --format='{{.State.Status}}'
```

**Solutions:**

1. **Check container exit code:**
   ```bash
   docker inspect <container_id> --format='{{.State.ExitCode}}'
   ```

2. **Verify entry point:**
   ```bash
   docker inspect <container_id> --format='{{.Config.Entrypoint}}'
   ```

3. **Check network access:**
   ```bash
   docker exec <container_id> ping -c 1 8.8.8.8
   ```

---

### Issue 4.3: executeOnAgent Uses Wrong Command

**Symptom:**
```
Plugin uses simulateTaskExecution instead of executeOnAgent
WARNING: Simulated execution detected
```

**Diagnosis:**
```bash
# Verify correct function in bundle
grep -c "simulateTaskExecution" ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js
# Should be: 0

grep -c "executeOnAgent" ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js
# Should be: 2
```

**Solution:** Re-extract from verified container:
```bash
docker run --rm kraken-v1.2-test:latest tar -C /root/.config/opencode/plugins/kraken-agent -cf - . > /tmp/kraken.tar
rm -rf ~/.config/opencode/plugins/kraken-agent-v1.2
mkdir -p ~/.config/opencode/plugins/kraken-agent-v1.2
tar -xf /tmp/kraken.tar -C ~/.config/opencode/plugins/kraken-agent-v1.2
```

---

## CATEGORY 5: TUI/HANG ISSUES

### Issue 5.1: TUI Freezes on Start

**Symptom:**
```
opencode --agent kraken
(black screen, no response)
```

**Diagnosis:**
```bash
# Check if process is running
ps aux | grep opencode

# Check Docker container
docker ps
```

**Solutions:**

1. **Kill and restart:**
   ```bash
   pkill -f opencode
   docker kill $(docker ps -q --filter name=kraken) 2>/dev/null
   opencode --agent kraken
   ```

2. **Use serve mode instead:**
   ```bash
   opencode serve &
   sleep 5
   opencode attach
   ```

3. **Increase timeout:**
   ```bash
   timeout 60 opencode --agent kraken
   ```

---

### Issue 5.2: TUI Shows No Text

**Symptom:**
```
(white screen, no text, responsive)
```

**Diagnosis:** Terminal encoding issue

**Solutions:**

1. **Set UTF-8:**
   ```bash
   export LANG=en_US.UTF-8
   export LC_ALL=en_US.UTF-8
   opencode --agent kraken
   ```

2. **Use different terminal:**
   ```bash
   # Try without agent first
   opencode

   # Then with agent
   opencode --agent kraken
   ```

---

### Issue 5.3: Commands Execute But No Output

**Symptom:**
```
> kraken_brain_status
(executes, no output)
```

**Diagnosis:**
```bash
# Check if tool is registered
grep "kraken_brain_status" SHIP_PACKAGE/src/tools/monitoring-tools.ts
```

**Solution:** Verify monitoring tools are included:
```bash
grep -c "kraken_brain_status\|kraken_message_status" ~/.config/opencode/plugins/kraken-agent-v1.2/dist/index.js
# Should be: 2 (one for each tool)
```

---

## ERROR MESSAGES REFERENCE

| Error | Cause | Solution |
|-------|-------|----------|
| `Plugin not found` | Wrong path | Fix path in opencode.json |
| `Cannot find module` | Corrupted bundle | Re-extract from container |
| `Duplicate plugin` | Multiple entries | Clean opencode.json |
| `Docker daemon not running` | Docker issue | Restart Docker |
| `Connection refused` | Network issue | Check Docker socket |
| `Permission denied` | File permissions | chmod 755 files |
| `Out of memory` | Resource issue | Increase Docker memory |

---

## ESCALATION

If issue persists after trying all solutions:

1. **Collect diagnostics:**
   ```bash
   # Save all relevant info
   docker logs <container> > container_logs.txt
   cat ~/.config/opencode/opencode.json > config.txt
   docker images > images.txt
   docker ps -a > containers.txt
   ```

2. **Document:**
   - What you tried
   - What happened
   - Expected vs actual

3. **Report to:** Issue tracker with logs attached

---

## COMMON FIXES SUMMARY

| Issue | Quick Fix |
|-------|-----------|
| Plugin won't load | Verify path, re-extract from container |
| Brains not initializing | Rebuild container, increase timeout |
| Docker fails | Clear cache, rebuild, check path |
| TUI freezes | Use serve mode, kill and restart |
| executeOnAgent fails | Verify Docker socket mounted |
| No output | Check encoding, verify tool exists |

---

**END TROUBLESHOOTING GUIDE**