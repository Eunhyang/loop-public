---
description: 로컬 SSD에서 직접 커밋/푸시 후 NAS로 rsync 백업 - 두 Vault 동시 처리
---

# Safe Commit (로컬 SSD 운영 모드)

로컬 SSD에서 직접 git commit/push 후 NAS로 rsync 백업합니다.

**두 Vault 동시 커밋:**
- `~/dev/loop/public` (Shared Vault)
- `~/dev/loop/exec` (Exec Vault)

## 사용자 입력

$ARGUMENTS

(비어있으면 자동 커밋 메시지 생성)

## 실행 절차

### 1. 양쪽 Vault 변경사항 확인

```bash
# Shared Vault (LOOP)
cd ~/dev/loop/public && git status --short

# Exec Vault (loop_exec)
cd ~/dev/loop/exec && git status --short
```

### 2. 로컬에서 직접 커밋/푸시

#### Shared Vault (LOOP) 커밋
```bash
cd ~/dev/loop/public && git add -A && git commit -m "커밋메시지" && git push origin main
```

#### Exec Vault (loop_exec) 커밋
```bash
cd ~/dev/loop/exec && git add -A && git commit -m "커밋메시지" && git push origin main
```

### 3. NAS로 rsync 백업

```bash
~/bin/sync-to-nas.sh
```

### 4. 결과 확인
```bash
# Shared Vault
cd ~/dev/loop/public && git log -1 --oneline

# Exec Vault
cd ~/dev/loop/exec && git log -1 --oneline
```

## 커밋 메시지 규칙

- 커밋 메시지 끝에 다음 추가:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Vault 경로

| Vault | 로컬 경로 | NAS 백업 경로 |
|-------|---------|--------------|
| Shared (LOOP) | `~/dev/loop/public` | `/Volumes/LOOP_CORE/vault/LOOP` |
| Exec (loop_exec) | `~/dev/loop/exec` | `/Volumes/LOOP_CLevel/vault/loop_exec` |

## 통합 명령 템플릿

두 vault를 한 번에 처리:
```bash
# LOOP
cd ~/dev/loop/public
git add -A && git commit -m "커밋메시지" && git push origin main || echo "LOOP: no changes"

# loop_exec
cd ~/dev/loop/exec
git add -A && git commit -m "커밋메시지" && git push origin main || echo "loop_exec: no changes"

# NAS 백업
~/bin/sync-to-nas.sh
```

## 선택적 커밋

특정 vault만 커밋하려면:
- `--shared`: LOOP만 커밋
- `--exec`: loop_exec만 커밋
- (기본): 둘 다 커밋

## rsync 옵션

```bash
# LOOP만 동기화
~/bin/sync-to-nas.sh --loop

# loop_exec만 동기화
~/bin/sync-to-nas.sh --exec

# 둘 다 동기화 (기본)
~/bin/sync-to-nas.sh --all
```

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│  로컬 Mac (SSD) - 작업 + Git                                │
│  ~/dev/loop/public        ← Claude Code + Obsidian + Git    │
│  ~/dev/loop/exec          ← Claude Code + Git               │
│         │                                                   │
│         │ git push → GitHub                                 │
│         │                                                   │
│         │ rsync --delete → NAS (백업)                       │
│         ▼                                                   │
├─────────────────────────────────────────────────────────────┤
│  NAS (SMB Mount) - 백업/공유 전용                           │
│  /Volumes/LOOP_CORE/vault/LOOP      ← 읽기 전용 백업        │
│  /Volumes/LOOP_CLevel/vault/loop_exec  ← 읽기 전용 백업     │
└─────────────────────────────────────────────────────────────┘
```

> **Note**: NAS daemon은 더 이상 commit하지 않음 (2025-12-29 변경)
> NAS는 rsync 수신 전용으로 운영됨
