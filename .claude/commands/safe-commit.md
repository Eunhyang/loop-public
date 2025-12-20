---
description: NAS git sync daemon과 충돌하지 않는 안전한 커밋/푸시 (SSH 사용)
---

# Safe Commit (NAS Sync 충돌 방지)

SMB 마운트에서는 git index 쓰기 문제가 발생할 수 있어서, NAS에 SSH로 직접 접속해서 커밋합니다.

## 사용자 입력

$ARGUMENTS

(비어있으면 자동 커밋 메시지 생성)

## 실행 절차

### 1. 변경사항 확인
```bash
git status --short
```

### 2. SSH로 NAS에서 직접 커밋/푸시 실행

사용자가 커밋 메시지를 제공한 경우:
```bash
ssh -p 22 Sosilab@100.93.242.60 "cd /volume1/LOOP_CORE/vault/LOOP && git add -A && git commit -m '사용자_메시지' && git push origin main"
```

메시지가 없으면 변경된 파일을 분석해서 적절한 커밋 메시지 생성 후:
```bash
ssh -p 22 Sosilab@100.93.242.60 "cd /volume1/LOOP_CORE/vault/LOOP && git add -A && git commit -m '자동생성_메시지' && git push origin main"
```

### 3. 결과 확인
```bash
git log -1 --oneline
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
- Vault 경로: `/volume1/LOOP_CORE/vault/LOOP`
- Sync 스크립트: `/volume1/LOOP_CORE/scripts/loop-git-sync.sh`

## 대안: NAS Daemon 사용

급하지 않으면 lock 파일 없이 두면 NAS daemon이 15분마다 자동 커밋:
```bash
# daemon이 처리하도록 대기
ssh -p 22 Sosilab@100.93.242.60 "/volume1/LOOP_CORE/scripts/loop-git-sync.sh"
```
