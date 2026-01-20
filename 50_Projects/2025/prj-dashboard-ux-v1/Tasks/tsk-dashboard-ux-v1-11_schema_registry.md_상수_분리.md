---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-11"
entity_name: "schema_registry.md 상수 분리"
created: 2025-12-27
updated: 2025-12-27
status: done

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-11"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
due: null
priority: low
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
# === 분류 ===
tags: ["schema", "documentation"]
priority_flag: low
start_date: '2025-12-27'
---

# schema_registry.md 상수 분리

> Task ID: `tsk-dashboard-ux-v1-11` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

**완료 조건**:
1. schema_registry.md에서 하드코딩된 상수값이 있는지 확인
2. 있다면 YAML 참조로 변경
3. 문서 일관성 유지

---

## 상세 내용

### 배경

v4.0에서 이미 YAML 참조 안내가 추가되었으나, 문서 내 일부 섹션에 구체적 값이 남아있을 수 있음.

### 작업 내용

**변경 대상:**
- `00_Meta/schema_registry.md`

**확인 항목:**
- ID 패턴 테이블에 구체적 범위가 남아있는지
- 검증 규칙 섹션에 하드코딩된 값이 있는지
- 필요시 YAML 참조 링크로 교체

---

## 체크리스트

- [x] 현재 문서 상태 확인
- [x] 하드코딩된 값 검색
- [x] 필요시 YAML 참조로 변경
- [x] 버전 업데이트 (필요시)

---

## Notes

### Tech Spec
- **파일**: `00_Meta/schema_registry.md`
- **현재 버전**: v3.3 (frontmatter) / v4.0 (본문)
- **참조**: `00_Meta/schema_constants.yaml`

### Todo
- [x] 문서 읽기
- [x] 하드코딩 검색 (status, priority 등)
- [x] 변경 필요 부분 수정
- [x] 버전 정리

### 작업 로그

**2025-12-27 작업 완료**

1. **분석 결과**: `schema_registry.md` 검증 규칙 섹션(Section 4)의 모든 ID 패턴이 이미 YAML 참조 형식(`→ schema_constants.yaml id_patterns.xxx`)으로 변경되어 있음 확인
2. **발견된 문제**: 버전 불일치 (frontmatter v4.1 vs footer v4.0)
3. **수정 내용**:
   - footer 버전을 v4.1로 업데이트
   - v4.1 변경사항 문서화 추가
4. **검증**: 모든 하드코딩된 상수값이 YAML 참조로 대체됨 확인


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-05]] - 선행 Task (YAML 확장)
- [[00_Meta/schema_constants.yaml]] - Single Source of Truth

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**:
