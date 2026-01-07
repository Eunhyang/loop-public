#!/bin/bash

# PermissionRequest Hook - 특정 패턴의 Bash 명령어 자동 승인
# stdin으로 JSON input 받음

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# 디버그 로그
echo "[DEBUG] COMMAND first line: $(echo "$COMMAND" | head -n1)" >> /tmp/hook-debug.log

# 자동 승인할 패턴들 (단순 prefix)
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
  "^docker "               # docker 명령어
  "^sudo "                 # sudo 명령어
  "^time "                 # time 명령어
  "^bash "                 # bash 명령어
  "^touch "                # touch 명령어
  "^rm "                   # rm 명령어
  "^cp "                   # cp 명령어
  "^mv "                   # mv 명령어
)

# Shell 연산자 포함 안전 패턴 (Agent 내부 동작 등)
SAFE_COMPLEX_PATTERNS=(
  "^cat .* 2>/dev/null"                    # cat with stderr redirect
  "^cat /tmp/claude/"                      # Agent task output 확인
  ".*/tasks/.*\.output"                    # Task output 파일 읽기
  "2>/dev/null \|\| echo"                  # 안전한 fallback 패턴
  "^test -[fedrwx]"                        # test 명령어
  "^\[ -[fedrwx]"                          # [ ] 조건문
  '^[A-Z_]+=.*curl'                        # 환경변수 + curl (API 호출)
  '^API_URL='                              # API_URL 환경변수
  '^LOOP_API'                              # LOOP_API 관련
  '^[A-Z_]+="[^"]*".*&&'                   # 환경변수 설정 + chaining
  '^[A-Z_]+=[^ ]*.*curl'                   # ENV=value curl 패턴
)

# 첫 줄만 추출 (멀티라인 명령어 대응)
FIRST_LINE=$(echo "$COMMAND" | head -n1)

# 자동 승인 함수
allow_and_exit() {
  local matched_pattern="$1"
  echo "[DEBUG] MATCHED pattern: $matched_pattern" >> /tmp/hook-debug.log
  echo '{"hookSpecificOutput": {"hookEventName": "PermissionRequest", "decision": {"behavior": "allow"}}}'
  exit 0
}

# 1. 단순 prefix 패턴 매칭 체크
for pattern in "${ALLOW_PATTERNS[@]}"; do
  if echo "$FIRST_LINE" | grep -qE "$pattern"; then
    allow_and_exit "$pattern"
  fi
done

# 2. Shell 연산자 포함 복잡한 패턴 체크 (전체 명령어 대상)
for pattern in "${SAFE_COMPLEX_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    allow_and_exit "$pattern (complex)"
  fi
done

# 매칭 안 되면 기본 동작 (사용자에게 묻기)
echo "[DEBUG] NO MATCH for: $FIRST_LINE" >> /tmp/hook-debug.log
exit 0
