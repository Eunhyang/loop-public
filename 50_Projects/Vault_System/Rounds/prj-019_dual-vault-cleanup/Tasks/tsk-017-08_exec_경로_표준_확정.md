---
entity_type: Task
entity_id: "tsk-017-08"
entity_name: "Dual-Vault - exec 경로 표준 확정"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-017-08", "exec 경로 표준화"]

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

# === Task 유형 ===
type: dev
target_project: loop

# === 3Y 전략 연결 ===
# === 분류 ===
tags: ["vault", "dual-vault", "migration", "cleanup"]
priority_flag: high
---

# Dual-Vault - exec 경로 표준 확정

> Task ID: `tsk-017-08` | Project: `prj-019` | Status: doing

## 목표

**완료 조건** (모두 완료):
1. [x] exec vault의 `50_Projects_Exec/` → `50_Projects/` 마이그레이션 완료
2. [x] exec CLAUDE.md 문서 업데이트
3. [x] `40_People/Hiring_Rounds/` 예시를 `50_Projects/Hiring_Rounds/`로 변경
4. [x] public과 동일한 API 경로 패턴 사용 가능

---

## 상세 내용

### 배경

~~이전 exec vault 구조~~ (마이그레이션 완료):
```
loop_exec/
├── 50_Projects_Exec/     # ← 이전 경로 (삭제됨)
│   └── P015/
```

**현재 exec vault 구조** (A안 적용 완료):
```
loop_exec/
├── 50_Projects/          # ← public과 동일한 구조
│   └── P015/
│       ├── _INDEX.md
│       ├── Tasks/
│       └── Retrospectives/
└── 40_People/
    └── Candidates/       # 채용 후보자 정보
```

### 작업 내용

1. **디렉토리 마이그레이션**
   - `50_Projects_Exec/` → `50_Projects/` 이름 변경
   - Git 이력 보존 (`git mv` 사용)

2. **내부 파일 링크 업데이트**
   - `_INDEX.md` 등 내부 링크 경로 수정

3. **exec CLAUDE.md 업데이트**
   - `50_Projects_Exec/` 참조 → `50_Projects/`로 변경
   - `40_People/Hiring_Rounds/` 예시 정리

4. **검증**
   - 마이그레이션 후 Obsidian에서 링크 정상 작동 확인

---

## 체크리스트

- [x] `50_Projects_Exec/` → `50_Projects/` 디렉토리 이름 변경 (git mv)
- [x] 내부 파일 링크 업데이트 (R001_단님_파일럿_회고.md)
- [x] exec CLAUDE.md 문서 업데이트
- [x] `40_People/Hiring_Rounds/` 예시를 `50_Projects/Hiring_Rounds/`로 변경
- [x] API mcp_composite.py 예시 경로 수정
- [ ] Obsidian 링크 정상 동작 확인 (수동 검증 필요)

---

## Notes

### Tech Spec

- **도구**: `git mv` (이력 보존)
- **대상 파일**:
  - `/Users/gim-eunhyang/dev/loop/exec/50_Projects_Exec/` → `/Users/gim-eunhyang/dev/loop/exec/50_Projects/`
  - `/Users/gim-eunhyang/dev/loop/exec/CLAUDE.md` 업데이트
- **영향 범위**: exec vault 내부만 (public vault는 변경 없음)

### Todo
- [x] git mv로 디렉토리 이름 변경
- [x] R001_단님_파일럿_회고.md 내부 링크 수정
- [x] CLAUDE.md 경로 참조 업데이트
- [x] 40_People/Hiring_Rounds/ → 50_Projects/Hiring_Rounds/ 변경
- [x] mcp_composite.py 예시 경로 수정
- [x] Validation 수행 (240 entities indexed)

### 작업 로그

#### 2026-01-02 17:58
**개요**: exec vault의 `50_Projects_Exec/` 디렉토리를 `50_Projects/`로 마이그레이션하여 public vault와 동일한 경로 구조를 적용. 관련 문서 및 API 참조 경로를 모두 업데이트 완료.

**변경사항**:
- 개발: `50_Projects/` 디렉토리 구조로 마이그레이션 (exec vault)
- 수정: exec CLAUDE.md - 경로 참조를 `50_Projects_Exec/` → `50_Projects/`로 변경
- 수정: exec CLAUDE.md - `40_People/Hiring_Rounds/` → `50_Projects/Hiring_Rounds/` 예시 변경
- 수정: API `mcp_composite.py` - exec vault 경로 예시를 `50_Projects/` 기준으로 수정
- 삭제: 기존 `50_Projects_Exec/` 디렉토리 (git mv로 이력 보존)

**파일 변경**:
- `/Users/gim-eunhyang/dev/loop/exec/50_Projects/` - 신규 경로 (P015 프로젝트 포함)
- `/Users/gim-eunhyang/dev/loop/exec/CLAUDE.md` - 경로 참조 및 예시 업데이트
- `/Users/gim-eunhyang/dev/loop/public/api/routers/mcp_composite.py` - exec vault 엔드포인트 경로 예시 수정

**결과**: 빌드 성공, Validation 통과 (240 entities indexed)

**다음 단계**:
- [ ] Obsidian에서 링크 정상 동작 수동 확인

---

## 참고 문서

- [[prj-019]] - 소속 Project
- [[loop_exec/CLAUDE.md]] - exec vault 문서
- [[prj-mcp-dual-vault-rbac]] - 관련 RBAC 프로젝트

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
