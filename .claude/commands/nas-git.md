---
description: NAS Git sync management (sync, pull, push, reset) - handles public + exec simultaneously
model: haiku
---

# NAS Git Management

Manually execute Git sync between NAS and GitHub.
**Both vaults processed together**: public (LOOP) + exec (loop_exec)

## User Input

$ARGUMENTS

(sync | pull | push | reset | logs | status | local-sync | nas-to-local)

## Command Reference

| Command | Description |
|------|------|
| `local-sync` | **Local → GitHub → NAS full sync** (recommended) - both vaults |
| `nas-to-local` | **NAS → GitHub → Local sync** - both vaults |
| `sync` | NAS only sync (commit → pull → push) |
| `pull` | GitHub → NAS pull only |
| `push` | NAS → GitHub push only |
| `reset` | Reset to GitHub state on conflict |
| `logs` | View sync logs |
| `status` | Check NAS git status |

## Vault Paths

| Vault | Local | NAS |
|-------|------|-----|
| public (LOOP) | `~/dev/loop/public` | `/volume1/LOOP_CORE/vault/LOOP` |
| exec (loop_exec) | `~/dev/loop/exec` | `/volume1/LOOP_CLevel/vault/loop_exec` |

## Execution Steps

### local-sync - Local → GitHub → NAS Full Sync (Recommended)

> **CRITICAL: main 브랜치만 동기화. feature 브랜치는 건드리지 않음**
> 병렬 세션에서 작업 중인 브랜치와 충돌 방지

Safe sequence to sync **both vaults** local changes to NAS:
1. 현재 브랜치 저장 (main 아니면 경고)
2. main 브랜치로 checkout
3. NAS uncommitted changes commit + push first (both)
4. Local pull --rebase (both) - **autostash 사용 안 함**
5. Local push (both)
6. NAS pull (both)
7. 원래 브랜치로 복귀
8. API cache refresh (Dashboard update)

```bash
echo "╔════════════════════════════════════════════╗"
echo "║  Local Sync: public + exec (main only)    ║"
echo "╚════════════════════════════════════════════╝"

# ============================================
# 현재 브랜치 저장 + main checkout
# ============================================
ORIG_BRANCH_PUBLIC=$(cd ~/dev/loop/public && git branch --show-current)
ORIG_BRANCH_EXEC=$(cd ~/dev/loop/exec && git branch --show-current)

echo ""
echo "현재 브랜치:"
echo "  - public: $ORIG_BRANCH_PUBLIC"
echo "  - exec: $ORIG_BRANCH_EXEC"

if [ "$ORIG_BRANCH_PUBLIC" != "main" ]; then
    echo ""
    echo "⚠️  public vault: '$ORIG_BRANCH_PUBLIC' 브랜치에서 작업 중"
    echo "    main 브랜치만 동기화하고 원래 브랜치로 복귀합니다"
fi

if [ "$ORIG_BRANCH_EXEC" != "main" ]; then
    echo ""
    echo "⚠️  exec vault: '$ORIG_BRANCH_EXEC' 브랜치에서 작업 중"
    echo "    main 브랜치만 동기화하고 원래 브랜치로 복귀합니다"
fi

# ============================================
# PUBLIC (LOOP) VAULT
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PUBLIC VAULT (LOOP)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 0: main 브랜치로 checkout (uncommitted 변경 있으면 실패)
echo ""
echo "=== [PUBLIC] Step 0: main checkout ==="
cd ~/dev/loop/public
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  uncommitted 변경사항 있음. 현재 브랜치에 커밋하거나 stash하세요."
    echo "    또는 /done-dev-task로 작업을 완료하세요."
    exit 1
fi
git checkout main

# Step 1: NAS public changes first
echo ""
echo "=== [PUBLIC] Step 1: NAS commit + push ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null
git add -A
if [ -n \"\$(git status --porcelain)\" ]; then
  git commit --no-verify -m 'nas-auto: \$(date +%Y-%m-%d\ %H:%M)'
fi
git push origin main 2>&1 || true
"

# Step 2: Local public pull --rebase (autostash 없이 - main은 clean 상태)
echo ""
echo "=== [PUBLIC] Step 2: 로컬 pull --rebase ==="
git pull --rebase origin main

# Step 3: Local public push
echo ""
echo "=== [PUBLIC] Step 3: 로컬 push ==="
git push origin main

# Step 4: NAS public pull
echo ""
echo "=== [PUBLIC] Step 4: NAS pull ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null
git pull --rebase origin main 2>&1
"

# Step 5: 원래 브랜치로 복귀
echo ""
echo "=== [PUBLIC] Step 5: 원래 브랜치 복귀 ==="
git checkout "$ORIG_BRANCH_PUBLIC"
echo "    현재 브랜치: $(git branch --show-current)"

# ============================================
# EXEC (loop_exec) VAULT
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EXEC VAULT (loop_exec)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 0: main 브랜치로 checkout
echo ""
echo "=== [EXEC] Step 0: main checkout ==="
cd ~/dev/loop/exec
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  uncommitted 변경사항 있음. 현재 브랜치에 커밋하거나 stash하세요."
    # public은 이미 복귀했으므로 exec만 경고 후 계속
fi
git checkout main

# Step 1: NAS exec changes first
echo ""
echo "=== [EXEC] Step 1: NAS commit + push ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CLevel/vault/loop_exec
git config --global --add safe.directory /volume1/LOOP_CLevel/vault/loop_exec 2>/dev/null
git add -A
if [ -n \"\$(git status --porcelain)\" ]; then
  git commit --no-verify -m 'nas-auto: \$(date +%Y-%m-%d\ %H:%M)'
fi
git push origin main 2>&1 || true
"

# Step 2: Local exec pull --rebase
echo ""
echo "=== [EXEC] Step 2: 로컬 pull --rebase ==="
git pull --rebase origin main

# Step 3: Local exec push
echo ""
echo "=== [EXEC] Step 3: 로컬 push ==="
git push origin main

# Step 4: NAS exec pull
echo ""
echo "=== [EXEC] Step 4: NAS pull ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CLevel/vault/loop_exec
git config --global --add safe.directory /volume1/LOOP_CLevel/vault/loop_exec 2>/dev/null
git pull --rebase origin main 2>&1
"

# Step 5: 원래 브랜치로 복귀
echo ""
echo "=== [EXEC] Step 5: 원래 브랜치 복귀 ==="
git checkout "$ORIG_BRANCH_EXEC"
echo "    현재 브랜치: $(git branch --show-current)"

# ============================================
# API CACHE REFRESH
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  API CACHE REFRESH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "=== API Cache Reload ==="
curl -s -X POST "${LOOP_API_URL:-https://mcp.sosilab.synology.me}/api/cache/reload" \
  -H "Content-Type: application/json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Tasks: {d.get(\"tasks\",0)}, Projects: {d.get(\"projects\",0)}, Hypotheses: {d.get(\"hypotheses\",0)}')" 2>/dev/null \
  || echo "API 서버 연결 실패 (무시)"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  동기화 완료: public + exec (main only)   ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "브랜치 상태:"
echo "  - public: $(cd ~/dev/loop/public && git branch --show-current)"
echo "  - exec: $(cd ~/dev/loop/exec && git branch --show-current)"
```

### nas-to-local - NAS → GitHub → Local Sync

Pull **both vaults** NAS changes to local:
1. NAS uncommitted changes commit + push (both)
2. Local pull (both)
3. API cache refresh (Dashboard update)

```bash
echo "╔════════════════════════════════════════════╗"
echo "║  NAS to Local: public + exec              ║"
echo "╚════════════════════════════════════════════╝"

# ============================================
# PUBLIC (LOOP) VAULT
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PUBLIC VAULT (LOOP)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: NAS public commit + push
echo ""
echo "=== [PUBLIC] Step 1: NAS commit + push ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null
git add -A
if [ -n \"\$(git status --porcelain)\" ]; then
  git commit --no-verify -m 'nas-auto: \$(date +%Y-%m-%d\ %H:%M)'
fi
git push origin main 2>&1 || true
"

# Step 2: Local public pull (autostash로 uncommitted 변경 보호)
echo ""
echo "=== [PUBLIC] Step 2: 로컬 pull ==="
cd ~/dev/loop/public
git pull --rebase --autostash origin main

# ============================================
# EXEC (loop_exec) VAULT
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EXEC VAULT (loop_exec)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: NAS exec commit + push
echo ""
echo "=== [EXEC] Step 1: NAS commit + push ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CLevel/vault/loop_exec
git config --global --add safe.directory /volume1/LOOP_CLevel/vault/loop_exec 2>/dev/null
git add -A
if [ -n \"\$(git status --porcelain)\" ]; then
  git commit --no-verify -m 'nas-auto: \$(date +%Y-%m-%d\ %H:%M)'
fi
git push origin main 2>&1 || true
"

# Step 2: Local exec pull (autostash로 uncommitted 변경 보호)
echo ""
echo "=== [EXEC] Step 2: 로컬 pull ==="
cd ~/dev/loop/exec
git pull --rebase --autostash origin main

# ============================================
# API CACHE REFRESH
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  API CACHE REFRESH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "=== API Cache Reload ==="
curl -s -X POST "${LOOP_API_URL:-https://mcp.sosilab.synology.me}/api/cache/reload" \
  -H "Content-Type: application/json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Tasks: {d.get(\"tasks\",0)}, Projects: {d.get(\"projects\",0)}, Hypotheses: {d.get(\"hypotheses\",0)}')" 2>/dev/null \
  || echo "API 서버 연결 실패 (무시)"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  동기화 완료: public + exec               ║"
echo "╚════════════════════════════════════════════╝"
```

### logs - View sync logs
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
echo "=== 최근 동기화 로그 ==="
tail -30 /volume1/LOOP_CORE/vault/LOOP/_build/git-sync.log 2>/dev/null || echo "로그 파일 없음"
'
```

### status - Check Git status
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null

echo '=== NAS Git Status ==='
git status --short

echo ''
echo '=== 최근 커밋 (5개) ==='
git log --oneline -5
"
```

### sync - Immediate full sync
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
echo "Dkssud272902*" | sudo -S /volume1/LOOP_CORE/vault/LOOP/scripts/nas-git-sync.sh 2>&1
'
```

### pull - GitHub → NAS
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null

echo '=== GitHub → NAS Pull ==='
git pull --rebase origin main 2>&1
"
```

### push - NAS → GitHub
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null

echo '=== 변경사항 커밋 ==='
git add -A
if [ -n \"\$(git status --porcelain)\" ]; then
  git commit --no-verify -m 'manual: \$(date +%Y-%m-%d\ %H:%M)'
fi

echo ''
echo '=== NAS → GitHub Push ==='
git push origin main 2>&1
"
```

### reset - Reset to GitHub state (conflict resolution)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null

echo '⚠️  WARNING: NAS 로컬 변경사항이 모두 삭제됩니다!'
echo ''
echo '=== Rebase 중단 (있으면) ==='
git rebase --abort 2>/dev/null || true

echo ''
echo '=== GitHub 기준으로 리셋 ==='
git fetch origin main
git reset --hard origin/main

echo ''
echo '=== 완료 ==='
git log --oneline -3
"
```

## Important Notes

- **`local-sync` recommended**: Safe sync from local work to NAS
- `reset` deletes all uncommitted NAS changes
- On conflict, resolve locally in Step 3 of `local-sync` (easier than NAS)
- Normal sync runs automatically every 15 minutes (cron)

## Flow Diagrams

### local-sync (Local → NAS)
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Local   │     │  GitHub  │     │   NAS    │     │   API    │
│  (SSD)   │     │  (hub)   │     │ (team)   │     │ (cache)  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │                │  Step 1: push ◄┤                │
     │  Step 2: commit│                │                │
     │  Step 3: pull ◄┤                │                │
     │ ├► Step 4: push│                │                │
     │                │  Step 5: pull ►┤                │
     │                │                │  Step 6: reload►
     │                │                │                │
```

### nas-to-local (NAS → Local)
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Local   │     │  GitHub  │     │   NAS    │     │   API    │
│  (SSD)   │     │  (hub)   │     │ (team)   │     │ (cache)  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │                │  Step 1: push ◄┤                │
     │  Step 2: pull ◄┤                │                │
     │                │                │  Step 3: reload►
     │                │                │                │
```
