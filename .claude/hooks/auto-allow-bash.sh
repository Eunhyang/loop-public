#!/bin/bash

# PermissionRequest Hook - 특정 패턴의 Bash 명령어 자동 승인
# stdin으로 JSON input 받음

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# 디버그 로그
echo "[DEBUG] COMMAND first line: $(echo "$COMMAND" | head -n1)" >> /tmp/hook-debug.log

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
  "^grep "                 # grep 명령어
  "^poetry "               # poetry 명령어
  "^source "               # source 명령어
  "^for "                  # for 루프
  "^which "                # which 명령어
)

# 첫 줄만 추출 (멀티라인 명령어 대응)
FIRST_LINE=$(echo "$COMMAND" | head -n1)

# 패턴 매칭 체크
for pattern in "${ALLOW_PATTERNS[@]}"; do
  if echo "$FIRST_LINE" | grep -qE "$pattern"; then
    # 자동 승인 - 올바른 형식
    echo "[DEBUG] MATCHED pattern: $pattern" >> /tmp/hook-debug.log
    echo '{"hookSpecificOutput": {"hookEventName": "PermissionRequest", "decision": {"behavior": "allow"}}}'
    exit 0
  fi
done

# 매칭 안 되면 기본 동작 (사용자에게 묻기)
echo "[DEBUG] NO MATCH for: $FIRST_LINE" >> /tmp/hook-debug.log
exit 0
