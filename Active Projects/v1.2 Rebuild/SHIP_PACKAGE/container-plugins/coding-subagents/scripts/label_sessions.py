#!/usr/bin/env python3
"""
Label Hermes session JSON files with semantic keyword titles.
Scans user messages and tool calls to generate a short topic token.
"""

import json
import os
import re
from pathlib import Path
from collections import Counter

HERMES_PROFILES = Path.home() / ".hermes/profiles"
KEYWORD_PATTERNS = [
    # Telegram
    (r"telegram|bridge|dm|shahraja", "telegram-bridge"),
    # Memory / context
    (r"memory|hermes.*audit|sessions?.*scan|session.*label", "hermes-memory-audit"),
    (r"memory.*overhaul|memory.*synth", "memory-synthesis"),
    # V4 / architecture
    (r"v4\.?\d?|spider|shark|trio|brain.*arch|orchestr", "v4-architecture"),
    (r"boilerplate|agent.?plugin|plugin.*build|build.*plan", "v4-boilerplate-wizard"),
    (r"wizard|elicitat|q&a|question.*bank", "v4-wizard-elicitation"),
    (r"factory|createV4|ArchitectureInstance", "v4-factory"),
    # Coding subagents / opencode
    (r"coding.?subagent|qwen|gemma|opencode.*plugin|subagent.*deploy", "coding-subagent-plugin"),
    (r"opencode|open.?code", "opencode-workflow"),
    # Profiles / profiles
    (r"profile|2nd.?brain|delegat|orchestr", "hermes-profile-config"),
    # Skills / knowledge
    (r"skill|skill.?manage|skill.?view", "skill-management"),
    # Spider agent
    (r"spider.?agent|spider.?plugin", "spider-agent"),
    # Hooks / tools
    (r"hook|tool.?template|plugin.?engin", "plugin-engineering"),
    # Testing
    (r"test|e2e|bun.*test|test.*fail", "testing"),
    # Debugging
    (r"debug|error|fix.*bug|crash", "debugging"),
    # Research / researcher
    (r"research|arxiv|ml|paper", "research"),
    # Devops / deployment
    (r"deploy|kubernetes|k8s|docker|container", "devops-deploy"),
    # Cron / scheduling
    (r"cron|schedul|periodic|recurring", "cron-automation"),
    # Webhook
    (r"webhook|event.?driven|subscribe", "webhook"),
    # MCP
    (r"mcp|model.?context.?protocol|server", "mcp"),
    # Browser / web
    (r"browser|navigate|click|scrape", "browser-automation"),
    # Code review
    (r"code.?review|pr|pull.?request", "code-review"),
    # Fine-tuning / ML
    (r"fine.?tun|lora|grpo|rlhf|peft", "ml-finetuning"),
    # Voice / audio
    (r"voice|tts|text.?to.?speech|audio", "voice-audio"),
    # Git
    (r"git|commit|push|branch|repo", "git-workflow"),
    # Session management
    (r"session.*list|session.*search|session.*find", "session-management"),
]

def extract_topic_keywords(session_path: str) -> str:
    """Read a session JSON and return the best semantic title."""
    try:
        with open(session_path) as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return "unknown"

    # Focus on user messages and assistant content; skip system tool listings
    text = []
    messages = data.get("messages", [])
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if isinstance(content, str):
            # Weight user messages higher
            if role == "user":
                text.append(content)
                text.append(content)  # double weight
            elif role == "assistant":
                text.append(content)

    combined = " ".join(text).lower()

    # Score each keyword pattern
    scores = Counter()
    for pattern, label in KEYWORD_PATTERNS:
        count = len(re.findall(pattern, combined))
        if count > 0:
            scores[label] = count

    if not scores:
        return "general"

    # Return top-scoring label(s) — prefer most specific
    top = scores.most_common(3)
    if len(top) == 1:
        return top[0][0]
    # If multiple, prefer the most specific (longest label first)
    top.sort(key=lambda x: (-x[1], -len(x[0])))
    return top[0][0]

def label_session(session_path: str, dry_run: bool = False) -> str:
    """Add title to a session JSON file."""
    try:
        with open(session_path) as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        return f"ERROR: {e}"

    title = extract_topic_keywords(session_path)

    if dry_run:
        session_id = data.get("session_id", Path(session_path).stem)
        return f"{session_id}: {title}"

    if "title" in data:
        old = data["title"]
        if old != title:
            data["title"] = title
            with open(session_path, "w") as f:
                json.dump(data, f, indent=2)
            return f"UPDATED {old!r} -> {title!r}"
        return f"UNCHANGED {title!r}"
    else:
        data["title"] = title
        with open(session_path, "w") as f:
            json.dump(data, f, indent=2)
        return f"ADDED {title!r}"

def update_sessions_index(profile_dir: Path):
    """Update the sessions.json index for a profile with titles."""
    index_path = profile_dir / "sessions.json"
    if not index_path.exists():
        return

    with open(index_path) as f:
        data = json.load(f)

    sessions_dir = profile_dir / "sessions"
    changed = 0
    for key, val in data.items():
        session_id = val.get("session_id", "")
        session_file = sessions_dir / f"session_{session_id}.json"
        if session_file.exists():
            try:
                with open(session_file) as f:
                    sess = json.load(f)
                if "title" in sess and val.get("title") != sess["title"]:
                    val["title"] = sess["title"]
                    changed += 1
            except:
                pass

    if changed:
        with open(index_path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  Updated {changed} entries in sessions.json")

def main():
    import sys
    dry_run = "--dry-run" in sys.argv

    profiles = sorted([d for d in HERMES_PROFILES.iterdir() if d.is_dir()])
    total = 0
    updated = 0

    for profile in profiles:
        sessions_dir = profile / "sessions"
        if not sessions_dir.exists():
            continue

        session_files = sorted(sessions_dir.glob("session_*.json"))
        # Skip request_dump files
        session_files = [f for f in session_files if "request_dump" not in f.name]

        if not session_files:
            continue

        print(f"\n{profile.name}: {len(session_files)} sessions")
        for sf in session_files:
            result = label_session(str(sf), dry_run=dry_run)
            if not dry_run and "ADDED" in result:
                print(f"  {sf.name}: {result}")
                updated += 1
            elif dry_run:
                print(f"  {result}")
            total += 1

        # Update index
        if not dry_run:
            update_sessions_index(profile)

    print(f"\n{'Would update' if dry_run else 'Updated'} {updated}/{total} sessions")

if __name__ == "__main__":
    main()
