#!/bin/bash
# validate-agent-output.sh
# Task tool (agent) 출력에서 필수 워크플로우 완료 여부 검증

# stdin으로 hook context (JSON) 받음
INPUT=$(cat)

# tool_name 확인
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Task tool이 아니면 통과
if [[ "$TOOL_NAME" != "Task" ]]; then
    exit 0
fi

# agent 출력 추출
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty')

# 필수 키워드 목록 (loop-dev-task 워크플로우 완료 시 있어야 하는 것들)
REQUIRED_PATTERNS=(
    "codex-claude-loop"
    "Step 6"
)

# 선택적 검증: loop-dev-task 관련 agent인지 확인
if echo "$TOOL_OUTPUT" | grep -qi "loop-dev-task\|start-dev-task\|tsk-"; then

    # 필수 패턴 검증
    MISSING=""
    for pattern in "${REQUIRED_PATTERNS[@]}"; do
        if ! echo "$TOOL_OUTPUT" | grep -qi "$pattern"; then
            MISSING="$MISSING $pattern"
        fi
    done

    if [[ -n "$MISSING" ]]; then
        # 경고 메시지 (stderr로 출력하면 사용자에게 표시됨)
        echo "⚠️ Agent 출력 검증 경고:" >&2
        echo "   필수 워크플로우 키워드 누락:$MISSING" >&2
        echo "   loop-dev-task 스킬의 Step 6 (codex-claude-loop)이 실행되지 않았을 수 있습니다." >&2

        # exit 1 하면 차단, exit 0 하면 경고만
        # 현재는 경고만 (차단하려면 exit 1로 변경)
        exit 0
    fi
fi

exit 0
