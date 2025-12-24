---
description: NAS git sync daemon과 충돌하지 않는 안전한 커밋/푸시 (SSH→NAS, HTTPS→GitHub) - 두 Vault 동시 커밋
---

# Safe Commit (NAS Sync 충돌 방지)

SMB 마운트에서는 git index 쓰기 문제가 발생할 수 있어서, NAS에 SSH로 직접 접속해서 커밋합니다.

**두 Vault 동시 커밋:**
- `LOOP` (Shared Vault) - 코어 멤버 접근
- `loop_exec` (Exec Vault) - C-Level 전용

**GitHub 인증**: 양쪽 모두 HTTPS + PAT (Personal Access Token) 방식 사용

## 사용자 입력

$ARGUMENTS

(비어있으면 자동 커밋 메시지 생성)

## 실행 절차

### 1. 양쪽 Vault 변경사항 확인

```bash
# Shared Vault (LOOP)
cd /Volumes/LOOP_CORE/vault/LOOP && git status --short

# Exec Vault (loop_exec)
cd /Volumes/LOOP_CLevel/vault/loop_exec && git status --short
```

### 2. SSH로 NAS에서 직접 커밋/푸시 실행

#### Shared Vault (LOOP_CORE) 커밋
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'export HOME=/tmp && git config --global --add safe.directory "*" && git config --global user.email "eunhyang90218@gmail.com" && git config --global user.name "Claude Code" && cd /volume1/LOOP_CORE/vault/LOOP && git add -A && git commit --no-verify -m "커밋메시지" && git push origin main'
```

#### Exec Vault (LOOP_CLevel) 커밋
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'export HOME=/tmp && git config --global --add safe.directory "*" && git config --global user.email "eunhyang90218@gmail.com" && git config --global user.name "Claude Code" && cd /volume1/LOOP_CLevel/vault/loop_exec && git add -A && git commit --no-verify -m "커밋메시지" && git push origin main'
```

### 3. 결과 확인
```bash
# Shared Vault
cd /Volumes/LOOP_CORE/vault/LOOP && git log -1 --oneline

# Exec Vault
cd /Volumes/LOOP_CLevel/vault/loop_exec && git log -1 --oneline
```

## 커밋 메시지 규칙

- 커밋 메시지 끝에 다음 추가:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## NAS 연결 정보

- Host: `100.93.242.60` (Tailscale IP)
- Port: `22`
- User: `Sosilab`
- Password: `Dkssud272902*`

### Vault 경로

| Vault | NAS 경로 | 로컬 마운트 |
|-------|---------|------------|
| Shared (LOOP) | `/volume1/LOOP_CORE/vault/LOOP` | `/Volumes/LOOP_CORE/vault/LOOP` |
| Exec (loop_exec) | `/volume1/LOOP_CLevel/vault/loop_exec` | `/Volumes/LOOP_CLevel/vault/loop_exec` |

## SSH 명령 템플릿 (통합)

두 vault를 한 번에 커밋하는 스크립트:
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
export HOME=/tmp
git config --global --add safe.directory "*"
git config --global user.email "eunhyang90218@gmail.com"
git config --global user.name "Claude Code"

# Shared Vault
cd /volume1/LOOP_CORE/vault/LOOP
git add -A && git commit --no-verify -m "커밋메시지" && git push origin main || echo "LOOP: no changes"

# Exec Vault
cd /volume1/LOOP_CLevel/vault/loop_exec
git add -A && git commit --no-verify -m "커밋메시지" && git push origin main || echo "loop_exec: no changes"
'
```

## 선택적 커밋

특정 vault만 커밋하려면:
- `--shared`: LOOP만 커밋
- `--exec`: loop_exec만 커밋
- (기본): 둘 다 커밋

## GitHub Remote 설정

양쪽 Vault 모두 HTTPS + PAT 방식 사용 (SSH 키 불필요):

```bash
# LOOP (Shared Vault)
git remote set-url origin https://Eunhyang:ghp_TOKEN@github.com/Eunhyang/loop_obsidian.git

# loop_exec (Exec Vault)
git remote set-url origin https://Eunhyang:ghp_TOKEN@github.com/Eunhyang/loop_exec.git
```

> PAT은 GitHub Settings > Developer settings > Personal access tokens에서 발급

## 대안: NAS Daemon 사용

급하지 않으면 lock 파일 없이 두면 NAS daemon이 15분마다 자동 커밋:
```bash
# Shared Vault daemon
ssh -p 22 Sosilab@100.93.242.60 "/volume1/LOOP_CORE/scripts/loop-git-sync.sh"
```
