---
description: Direct commit/push from local SSD, then rsync backup to NAS - handles both vaults
---

# Safe Commit (Local SSD Mode)

Direct git commit/push from local SSD, then rsync backup to NAS.

**Both vaults processed together:**
- `~/dev/loop/public` (Shared Vault)
- `~/dev/loop/exec` (Exec Vault)

## User Input

$ARGUMENTS

(Empty = auto-generate commit message)

## Execution Steps

### 1. Check changes in both vaults

```bash
# Shared Vault (LOOP)
cd ~/dev/loop/public && git status --short

# Exec Vault (loop_exec)
cd ~/dev/loop/exec && git status --short
```

### 2. Direct commit/push from local

#### Shared Vault (LOOP) commit
```bash
cd ~/dev/loop/public && git add -A && git commit -m "커밋메시지" && git push origin main
```

#### Exec Vault (loop_exec) commit
```bash
cd ~/dev/loop/exec && git add -A && git commit -m "커밋메시지" && git push origin main
```

### 3. rsync backup to NAS

```bash
~/bin/sync-to-nas.sh
```

### 4. Verify results
```bash
# Shared Vault
cd ~/dev/loop/public && git log -1 --oneline

# Exec Vault
cd ~/dev/loop/exec && git log -1 --oneline
```

## Commit Message Rules

- Append to end of commit message:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Vault Paths

| Vault | Local Path | NAS Backup Path |
|-------|---------|--------------|
| Shared (LOOP) | `~/dev/loop/public` | `/Volumes/LOOP_CORE/vault/LOOP` |
| Exec (loop_exec) | `~/dev/loop/exec` | `/Volumes/LOOP_CLevel/vault/loop_exec` |

## Combined Command Template

Process both vaults at once:
```bash
# LOOP
cd ~/dev/loop/public
git add -A && git commit -m "커밋메시지" && git push origin main || echo "LOOP: no changes"

# loop_exec
cd ~/dev/loop/exec
git add -A && git commit -m "커밋메시지" && git push origin main || echo "loop_exec: no changes"

# NAS backup
~/bin/sync-to-nas.sh
```

## Selective Commit

To commit specific vault only:
- `--shared`: LOOP only
- `--exec`: loop_exec only
- (default): both

## rsync Options

```bash
# LOOP only
~/bin/sync-to-nas.sh --loop

# loop_exec only
~/bin/sync-to-nas.sh --exec

# Both (default)
~/bin/sync-to-nas.sh --all
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Local Mac (SSD) - Work + Git                               │
│  ~/dev/loop/public        ← Claude Code + Obsidian + Git    │
│  ~/dev/loop/exec          ← Claude Code + Git               │
│         │                                                   │
│         │ git push → GitHub                                 │
│         │                                                   │
│         │ rsync --delete → NAS (backup)                     │
│         ▼                                                   │
├─────────────────────────────────────────────────────────────┤
│  NAS (SMB Mount) - Backup/Share only                        │
│  /Volumes/LOOP_CORE/vault/LOOP      ← Read-only backup      │
│  /Volumes/LOOP_CLevel/vault/loop_exec  ← Read-only backup   │
└─────────────────────────────────────────────────────────────┘
```

> **Note**: NAS daemon no longer commits (changed 2025-12-29)
> NAS operates as rsync receiver only
