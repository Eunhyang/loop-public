---
entity_type: Task
entity_id: "tsk-017-15"
entity_name: "Dual-Vault - exec ID 마이그레이션"
created: 2026-01-03
updated: 2026-01-03
status: done
closed: 2026-01-03

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-017-15"]

# === 관계 ===
outgoing_relations:
  - type: follows
    target_id: "tsk-017-14"
    description: "exec ID 체계 정비 후 마이그레이션"
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-03
due: 2026-01-03
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["dual-vault", "exec", "migration", "id-system"]
priority_flag: high
---

# Dual-Vault - exec ID 마이그레이션

> Task ID: `tsk-017-15` | Project: `prj-019` | Status: doing

## 목표

**완료 조건**:
1. 기존 exec 파일들의 충돌 ID를 새 체계로 마이그레이션
2. 모든 파일 내부 참조(project_id, entity_id, aliases) 업데이트
3. 파일명 변경 (필요시)

---

## 마이그레이션 대상

### Projects

| 현재 ID | 새 ID | 파일 |
|---------|-------|------|
| prj-017 | prj-tips-idp | 아이디어파트너스 |
| prj-018 | ✅ 유지 (폴더명만) | 프라이머 (이미 tsk-primer-* 사용중) |

### Tasks - 아이디어파트너스

| 현재 ID | 새 ID |
|---------|-------|
| tsk-017-01 | tsk-tips-idp-01 |
| tsk-017-02 | tsk-tips-idp-02 |
| tsk-017-03 | tsk-tips-idp-03 |
| tsk-017-04 | tsk-tips-idp-04 |

### Tasks - JEMI/청년창업

| 현재 ID | 새 ID |
|---------|-------|
| tsk-019-09 | tsk-grants-jemi-09 |
| tsk-019-10 | tsk-grants-jemi-10 |
| tsk-019-11 | tsk-grants-jemi-11 |
| tsk-019-15 | tsk-grants-youth-15 |
| tsk-019-16 | tsk-grants-youth-16 |
| tsk-019-17 | tsk-grants-youth-17 |

---

## 체크리스트

- [x] prj-017 → prj-tips-idp 마이그레이션
- [x] tsk-017-01~04 → tsk-tips-idp-01~04 마이그레이션
- [x] tsk-019-09~11 → tsk-grants-jemi-09~11 마이그레이션
- [x] tsk-019-15~17 → tsk-grants-youth-15~17 마이그레이션
- [x] 내부 참조 일관성 확인 (aliases에 legacy ID 유지)

---

## Notes

### 작업 로그

#### 2026-01-03 20:50
**개요**: exec vault 기존 파일들의 충돌 ID를 새 체계로 마이그레이션 완료

**변경사항**:
1. **prj-017 → prj-tips-idp**
   - Project_정의.md: entity_id, aliases 변경
   - 본문 ID 참조 업데이트

2. **tsk-017-01~04 → tsk-tips-idp-01~04**
   - 4개 Task 파일 ID 변경
   - parent_id, project_id → prj-tips-idp
   - aliases에 legacy ID 유지

3. **tsk-019-09~11 → tsk-grants-jemi-09~11**
   - 3개 Task 파일 ID 변경

4. **tsk-019-15~17 → tsk-grants-youth-15~17**
   - 3개 Task 파일 ID 변경

**마이그레이션 결과**:
| 기존 | 신규 |
|------|------|
| prj-017 | prj-tips-idp |
| tsk-017-01~04 | tsk-tips-idp-01~04 |
| tsk-019-09~11 | tsk-grants-jemi-09~11 |
| tsk-019-15~17 | tsk-grants-youth-15~17 |

**결과**: ✅ 마이그레이션 완료 (11개 파일)

#### 추가 마이그레이션 (prj-018)
- prj-018 → prj-tips-primer
- 7개 Task 파일 project_id 업데이트

**최종 결과**: ✅ 총 19개 파일 마이그레이션 완료

---

## 참고 문서

- [[tsk-017-14]] - 선행 Task (exec ID 체계 정비)
- `00_Meta/schema_constants.yaml` - exec_id_patterns SSOT

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
