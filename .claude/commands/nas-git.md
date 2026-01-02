---
description: NAS Git 동기화 관리 (sync, pull, push, reset) - public + exec 동시 처리
---

# NAS Git 관리

NAS와 GitHub 간 Git 동기화를 수동으로 실행합니다.
**두 Vault 동시 처리**: public (LOOP) + exec (loop_exec)

## 사용자 입력

$ARGUMENTS

(sync | pull | push | reset | logs | status | local-sync | nas-to-local)

## 명령어 설명

| 명령 | 설명 |
|------|------|
| `local-sync` | **로컬 → GitHub → NAS 전체 동기화** (권장) - 양쪽 vault |
| `nas-to-local` | **NAS → GitHub → 로컬 동기화** - 양쪽 vault |
| `sync` | NAS만 동기화 (commit → pull → push) |
| `pull` | GitHub → NAS pull만 |
| `push` | NAS → GitHub push만 |
| `reset` | 충돌 시 GitHub 기준으로 리셋 |
| `logs` | 동기화 로그 확인 |
| `status` | NAS git status 확인 |

## Vault 경로

| Vault | 로컬 | NAS |
|-------|------|-----|
| public (LOOP) | `~/dev/loop/public` | `/volume1/LOOP_CORE/vault/LOOP` |
| exec (loop_exec) | `~/dev/loop/exec` | `/volume1/LOOP_CLevel/vault/loop_exec` |

## 실행 절차

### local-sync - 로컬 → GitHub → NAS 전체 동기화 (권장)

안전한 순서로 **양쪽 vault** 로컬 변경사항을 NAS까지 동기화합니다:
1. NAS uncommitted 변경 먼저 commit + push (양쪽)
2. 로컬 commit (양쪽)
3. 로컬 pull --rebase (양쪽)
4. 로컬 push (양쪽)
5. NAS pull (양쪽)

```bash
echo "╔════════════════════════════════════════════╗"
echo "║  Local Sync: public + exec                ║"
echo "╚════════════════════════════════════════════╝"

# ============================================
# PUBLIC (LOOP) VAULT
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PUBLIC VAULT (LOOP)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: NAS public 변경사항 먼저 올림
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

# Step 2: 로컬 public commit
echo ""
echo "=== [PUBLIC] Step 2: 로컬 commit ==="
cd ~/dev/loop/public
git add -A
if [ -n "$(git status --porcelain)" ]; then
  git commit --no-verify -m "local-sync: $(date '+%Y-%m-%d %H:%M')"
fi

# Step 3: 로컬 public pull --rebase
echo ""
echo "=== [PUBLIC] Step 3: 로컬 pull --rebase ==="
git pull --rebase origin main

# Step 4: 로컬 public push
echo ""
echo "=== [PUBLIC] Step 4: 로컬 push ==="
git push origin main

# Step 5: NAS public pull
echo ""
echo "=== [PUBLIC] Step 5: NAS pull ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null
git pull --rebase origin main 2>&1
"

# ============================================
# EXEC (loop_exec) VAULT
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EXEC VAULT (loop_exec)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: NAS exec 변경사항 먼저 올림
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

# Step 2: 로컬 exec commit
echo ""
echo "=== [EXEC] Step 2: 로컬 commit ==="
cd ~/dev/loop/exec
git add -A
if [ -n "$(git status --porcelain)" ]; then
  git commit --no-verify -m "local-sync: $(date '+%Y-%m-%d %H:%M')"
fi

# Step 3: 로컬 exec pull --rebase
echo ""
echo "=== [EXEC] Step 3: 로컬 pull --rebase ==="
git pull --rebase origin main

# Step 4: 로컬 exec push
echo ""
echo "=== [EXEC] Step 4: 로컬 push ==="
git push origin main

# Step 5: NAS exec pull
echo ""
echo "=== [EXEC] Step 5: NAS pull ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CLevel/vault/loop_exec
git config --global --add safe.directory /volume1/LOOP_CLevel/vault/loop_exec 2>/dev/null
git pull --rebase origin main 2>&1
"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  동기화 완료: public + exec               ║"
echo "╚════════════════════════════════════════════╝"
```

### nas-to-local - NAS → GitHub → 로컬 동기화

**양쪽 vault** NAS 변경사항을 로컬로 가져옵니다:
1. NAS uncommitted 변경 commit + push (양쪽)
2. 로컬 pull (양쪽)

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

# Step 2: 로컬 public pull
echo ""
echo "=== [PUBLIC] Step 2: 로컬 pull ==="
cd ~/dev/loop/public
git pull --rebase origin main

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

# Step 2: 로컬 exec pull
echo ""
echo "=== [EXEC] Step 2: 로컬 pull ==="
cd ~/dev/loop/exec
git pull --rebase origin main

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  동기화 완료: public + exec               ║"
echo "╚════════════════════════════════════════════╝"
```

### logs - 동기화 로그 확인
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
echo "=== 최근 동기화 로그 ==="
tail -30 /volume1/LOOP_CORE/vault/LOOP/_build/git-sync.log 2>/dev/null || echo "로그 파일 없음"
'
```

### status - Git 상태 확인
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

### sync - 즉시 전체 동기화
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

### reset - GitHub 기준으로 리셋 (충돌 해결)
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

## 주의사항

- **`local-sync` 권장**: 로컬 작업 후 NAS까지 안전하게 동기화
- `reset`은 NAS의 커밋되지 않은 변경사항을 모두 삭제합니다
- 충돌 발생 시 `local-sync`의 Step 3에서 로컬에서 해결 (NAS보다 편함)
- 일반적인 동기화는 15분마다 자동 실행됩니다 (cron)

## 플로우 다이어그램

### local-sync (로컬 → NAS)
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  로컬    │     │  GitHub  │     │   NAS    │
│  (SSD)   │     │  (hub)   │     │ (팀원용) │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │                │  Step 1: push ◄┤
     │  Step 2: commit│                │
     │  Step 3: pull ◄┤                │
     │ ├► Step 4: push│                │
     │                │  Step 5: pull ►┤
     │                │                │
```

### nas-to-local (NAS → 로컬)
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  로컬    │     │  GitHub  │     │   NAS    │
│  (SSD)   │     │  (hub)   │     │ (팀원용) │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │                │  Step 1: push ◄┤
     │  Step 2: pull ◄┤                │
     │                │                │
```
