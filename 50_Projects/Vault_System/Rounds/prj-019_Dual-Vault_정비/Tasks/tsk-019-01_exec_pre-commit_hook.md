---
entity_type: Task
entity_id: "tsk-019-01"
entity_name: "Dual-Vault - exec pre-commit hook"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-019-01"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: 2
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["pre-commit", "validation", "exec-vault", "automation"]
priority_flag: high
---

# Dual-Vault - exec pre-commit hook

> Task ID: `tsk-019-01` | Project: `prj-019` | Status: doing

## 목표

**완료 조건**:
1. exec vault의 .git/hooks/pre-commit 파일 생성
2. validate_schema.py 실행 - 에러 시 커밋 차단
3. check_orphans.py 실행 - 경고 출력만
4. build_graph_index.py 실행 - 자동 스테이징
5. public vault scripts 재사용 (복사 금지)

---

## 상세 내용

### 배경

public vault에는 이미 pre-commit hook이 있어 커밋 전 자동 검증이 수행됨.
exec vault에는 이 자동화가 없어 스키마 불일치가 발생할 수 있음.
exec vault에도 동일한 품질 관리 체계 적용 필요.

### 작업 내용

1. **pre-commit hook 생성**
   - 위치: `/Users/gim-eunhyang/dev/loop/exec/.git/hooks/pre-commit`
   - 실행 권한 부여: `chmod +x`

2. **validate_schema.py 실행**
   - public vault의 스크립트 직접 호출
   - 경로: `$LOOP_VAULT_PATH/scripts/validate_schema.py`
   - 에러 시 exit 1 (커밋 차단)

3. **check_orphans.py 실행**
   - public vault의 스크립트 직접 호출
   - 경고만 출력, 차단 없음

4. **build_graph_index.py 실행**
   - public vault의 스크립트 직접 호출
   - 생성된 `_Graph_Index.md` 자동 스테이징

5. **스크립트 재사용 원칙**
   - scripts 파일 복사 금지
   - 환경변수 `$LOOP_VAULT_PATH` 또는 상대 경로로 참조

---

## 체크리스트

- [ ] exec vault .git/hooks 디렉토리 확인
- [ ] pre-commit hook 파일 생성
- [ ] validate_schema.py 호출 로직 추가
- [ ] check_orphans.py 호출 로직 추가
- [ ] build_graph_index.py 호출 로직 추가
- [ ] 자동 스테이징 로직 추가
- [ ] 실행 권한 부여
- [ ] 테스트 커밋으로 동작 확인

---

## Notes

### Tech Spec

- **스크립트 언어**: Bash shell script
- **경로 참조 방식**:
  - 환경변수: `$LOOP_VAULT_PATH` (public vault 경로)
  - 또는 상대 경로: `../public/scripts/`
- **exec vault 경로**: `/Users/gim-eunhyang/dev/loop/exec`
- **public vault 경로**: `/Users/gim-eunhyang/dev/loop/public`
- **스크립트 실행 순서**:
  1. validate_schema.py (blocking)
  2. check_orphans.py (warning only)
  3. build_graph_index.py (auto-stage)

**예상 hook 구조**:
```bash
#!/bin/bash
set -e

# 환경변수 확인
LOOP_VAULT_PATH="${LOOP_VAULT_PATH:-$HOME/dev/loop/public}"
EXEC_VAULT_PATH="$(git rev-parse --show-toplevel)"

echo "=== LOOP exec vault pre-commit hook ==="

# 1. validate_schema.py (blocking)
echo "[1/3] Running validate_schema.py..."
python3 "$LOOP_VAULT_PATH/scripts/validate_schema.py" "$EXEC_VAULT_PATH"
if [ $? -ne 0 ]; then
    echo "ERROR: Schema validation failed. Commit blocked."
    exit 1
fi

# 2. check_orphans.py (warning only)
echo "[2/3] Running check_orphans.py..."
python3 "$LOOP_VAULT_PATH/scripts/check_orphans.py" "$EXEC_VAULT_PATH" || true

# 3. build_graph_index.py (auto-stage)
echo "[3/3] Running build_graph_index.py..."
python3 "$LOOP_VAULT_PATH/scripts/build_graph_index.py" "$EXEC_VAULT_PATH"

# Auto-stage _Graph_Index.md if modified
if [ -f "$EXEC_VAULT_PATH/_Graph_Index.md" ]; then
    git add "$EXEC_VAULT_PATH/_Graph_Index.md"
    echo "Auto-staged: _Graph_Index.md"
fi

echo "=== Pre-commit checks passed ==="
```

### Todo
- [ ] exec vault .git/hooks 디렉토리 존재 확인
- [ ] pre-commit hook 파일 작성
- [ ] public scripts가 exec vault 경로를 처리할 수 있는지 확인
- [ ] 스크립트 경로 참조 방식 결정 (환경변수 vs 상대경로)
- [ ] 테스트 커밋 수행
- [ ] 에러 케이스 테스트 (스키마 오류 있는 파일)

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-019]] - 소속 Project
- [[public/.git/hooks/pre-commit]] - public vault의 pre-commit hook (참고용)
- [[public/scripts/validate_schema.py]] - 스키마 검증 스크립트
- [[public/scripts/check_orphans.py]] - 고아 엔티티 검사 스크립트
- [[public/scripts/build_graph_index.py]] - 그래프 인덱스 빌드 스크립트

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
