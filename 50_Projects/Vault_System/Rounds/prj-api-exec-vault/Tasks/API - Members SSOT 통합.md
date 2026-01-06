---
entity_type: Task
entity_id: "tsk-018-06"
entity_name: "API - Members SSOT 통합"
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-api-exec-vault"
project_id: "prj-api-exec-vault"
aliases: ["tsk-018-06"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["api", "members", "ssot", "refactoring"]
priority_flag: high
---

# API - Members SSOT 통합

> Task ID: `tsk-018-06` | Project: `prj-api-exec-vault` | Status: done

## 목표

**완료 조건**:
1. VaultCache에서 exec vault 멤버 파일 파싱 (기존 마크다운 파일 활용)
2. Members API가 scope에 따라 적절한 데이터 반환 (mcp:read → 기본, mcp:exec → 민감 포함)
3. 기존 members.yaml 외 레거시 파일 정리/삭제

---

## 상세 내용

### 배경

현재 멤버 API 구조:
- `public/00_Meta/members.yaml` - 기본 멤버 정보 (id, name, role, aliases)
- `exec/40_People/Team_Roster.md` - 테이블 형식 (급여 등 민감 정보)
- `exec/40_People/Core/*.md` - 개인 프로파일 (frontmatter 없음)

문제점:
- exec vault 멤버 정보가 API에서 접근 불가
- SSOT 원칙에 맞게 기존 파일을 파싱해야 함 (새 YAML 파일 생성 불필요)

### 작업 내용

1. **VaultCache 멤버 로딩 추가**
   - `_load_members()` 메서드 추가
   - public/00_Meta/members.yaml 파싱 (기존)
   - exec/40_People/Team_Roster.md 테이블 파싱 (민감 정보)

2. **Members API 엔드포인트 개선**
   - scope 기반 응답 분기
   - `mcp:read` → 기본 멤버 정보
   - `mcp:exec` → 기본 + 민감 정보 (급여, 계약)

3. **레거시 정리**
   - 중복/미사용 멤버 관련 코드 제거
   - 불필요한 파일 삭제

---

## 체크리스트

- [x] VaultCache._load_members() 구현
- [x] exec/40_People/members.yaml SSOT 생성
- [x] /api/members scope 기반 응답 분기
- [x] 레거시 코드 정리 (public/00_Meta/members.yaml 삭제)
- [x] 테스트 완료

---

## Notes

### Todo
- [ ] exec/40_People/Core/*.md에 frontmatter 추가 검토 (필요시)
- [ ] 캐시 갱신 로직 (mtime 기반)

### 작업 로그

**2026-01-06** - tsk-018-06 완료

**변경 사항:**

1. **SSOT 단일화**: `exec/40_People/members.yaml` 생성
   - 기존 2개 소스 (public members.yaml + exec Team_Roster.md) → 1개로 통합
   - 7명 멤버 정보 (Core Team 2, Former 1, Advisors 2, Placeholders 2)
   - 기본 정보 + 민감 정보 (salary, contract_type, start_date, note) 통합 관리

2. **VaultCache 수정** (`api/cache/vault_cache.py`)
   - `_load_members()`: exec vault에서만 로드
   - `get_all_members(include_sensitive)`: scope 기반 필터링
   - `get_member()`: aliases 지원 추가

3. **API 수정** (`api/main.py`)
   - `/api/members`: `include_sensitive` 파라미터로 변경
   - mcp:read → 기본 정보 (6개 필드)
   - mcp:exec → 전체 정보 (10개 필드)

4. **validate_schema.py 수정**
   - `_load_valid_assignees()`: exec vault 경로로 변경
   - 13개 유효 assignee (7 id + 6 aliases)

5. **레거시 삭제**
   - `public/00_Meta/members.yaml` 삭제

**테스트 결과:**
- 7명 멤버 로드 확인
- scope 기반 민감 필드 필터링 정상
- validate_schema.py assignee 검증 정상

---

## 참고 문서

- [[prj-api-exec-vault]] - 소속 Project
- `public/api/cache/vault_cache.py` - VaultCache 구현
- `public/api/utils/vault_utils.py` - load_members 함수

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
