#!/bin/bash

# PermissionRequest Hook - 특정 패턴의 Bash 명령어 자동 승인
# stdin으로 JSON input 받음

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# 자동 승인할 패턴들
ALLOW_PATTERNS=(
  "^# "                    # 주석으로 시작하는 스크립트
  "^echo "                 # echo 명령어
  "^git "                  # git 명령어
  "^sshpass "              # sshpass (NAS 접속)
  "^ssh "                  # ssh 명령어
  "^curl "                 # curl 명령어
  "^ls "                   # ls 명령어
  "^cat "                  # cat 명령어
  "^cd "                   # cd 명령어
  "^mkdir "                # mkdir 명령어
  "^pnpm "                 # pnpm 명령어
  "^npm "                  # npm 명령어
  "^python"                # python/python3
  "^sleep "                # sleep 명령어
  "^head "                 # head 명령어
  "^tail "                 # tail 명령어
  "^codex "                # codex 명령어
  "^find "                 # find 명령어
  "^chmod "                # chmod 명령어
  "^node "                 # node 명령어
)

# 패턴 매칭 체크
for pattern in "${ALLOW_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    # 자동 승인 - 올바른 형식
    echo '{"hookSpecificOutput": {"hookEventName": "PermissionRequest", "decision": {"behavior": "allow"}}}'
    exit 0
  fi
done

# 매칭 안 되면 기본 동작 (사용자에게 묻기)
exit 0
