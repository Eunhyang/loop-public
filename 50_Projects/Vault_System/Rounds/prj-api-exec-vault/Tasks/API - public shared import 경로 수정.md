---
entity_type: Task
entity_id: "tsk-018-05"
entity_name: "API - public shared import 경로 수정"
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-api-exec-vault"
project_id: "prj-api-exec-vault"
aliases: ["tsk-018-05"]

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
tags: ["api", "refactoring", "shared"]
priority_flag: high
---

# API - public shared import 경로 수정

> Task ID: `tsk-018-05` | Project: `prj-api-exec-vault` | Status: done

## 목표

**완료 조건**:
1. public/api가 shared/ 모듈을 import하도록 수정
2. 기존 코드 호환성 유지
3. 중복 코드 제거

---

## 상세 내용

### 배경

tsk-018-03에서 public/shared/ 모듈을 생성했으나,
public/api는 아직 기존 경로 (api/utils/, api/oauth/) 사용 중.

### 작업 내용

1. public/api/main.py에서 shared/ import
2. 기존 utils/vault_utils.py → shared/utils/vault_utils.py 참조
3. 기존 oauth/security.py 일부 → shared/auth/ 참조
4. 중복 코드 정리 (기존 파일은 shared로 redirect)

---

## 체크리스트

- [x] public/api/main.py import 경로 수정 - api/__init__.py에서 sys.path 설정
- [x] 기존 utils/ → shared/utils/ 마이그레이션 - get_vault_dir, get_exec_vault_dir re-export
- [ ] 기존 oauth/ 일부 → shared/auth/ 마이그레이션 - 보류 (AuthMiddleware 구조 차이)
- [x] 기존 코드 호환성 테스트 - 통과
- [x] 서버 시작 테스트 - import 테스트 통과

---

## Notes

### PRD (Product Requirements Document)

**목표**: public/api가 public/shared/ 모듈을 import하도록 마이그레이션

**범위**:
- shared/utils/vault_utils.py: 환경변수 우선순위 명확화, 경로 검증 개선
- api/__init__.py: sys.path 설정으로 shared 모듈 import 보장
- api/utils/vault_utils.py: shared.utils.vault_utils에서 re-export

### Tech Spec

**변경 파일**:
1. `shared/utils/vault_utils.py`
   - 환경변수 우선순위 문서화: VAULT_DIR -> LOOP_VAULT_PATH -> Docker -> NAS -> Mac -> Local -> Module-relative -> cwd
   - `.is_dir()` 체크로 파일과 디렉토리 구분
   - Module-relative fallback 추가: `Path(__file__).resolve().parents[2]`
   - 경로 미감지 시 warning 발생

2. `api/__init__.py`
   - sys.path에 public/ 추가 (shared 모듈 import 보장)
   - api.* 모듈 import 시 항상 실행됨

3. `api/utils/__init__.py`
   - 중복 sys.path 코드 제거 (api/__init__.py로 이동)

4. `api/utils/vault_utils.py`
   - `get_vault_dir`, `get_exec_vault_dir`를 shared.utils.vault_utils에서 re-export
   - api 전용 함수 유지: load_members, extract_frontmatter, get_next_task_id 등

### 작업 로그

#### 2026-01-06 15:30
**개요**: public/api가 public/shared/ 모듈을 import할 수 있도록 sys.path 설정을 추가하고, 기존 vault_utils 함수들을 shared 모듈에서 re-export하도록 수정했습니다. 환경변수 우선순위를 명확히 문서화하고 경로 검증을 개선했습니다.

**변경사항**:
- 개발: api/__init__.py에 sys.path 설정 추가
- 수정: shared/utils/vault_utils.py 환경변수 우선순위 명확화
- 수정: api/utils/vault_utils.py에서 shared 모듈 re-export

**파일 변경**:
- `public/shared/utils/vault_utils.py` - 환경변수 우선순위, .is_dir() 체크, Module-relative fallback
- `public/api/__init__.py` - sys.path 설정으로 shared 모듈 import 보장
- `public/api/utils/__init__.py` - 중복 sys.path 코드 제거
- `public/api/utils/vault_utils.py` - get_vault_dir, get_exec_vault_dir re-export

**결과**: ✅ Import 테스트 통과, 서버 시작 정상

**다음 단계**:
- 없음 (완료)

---

**2026-01-06 (상세)**: tsk-018-05 구현
- codex-claude-loop 스킬로 구현 및 코드 리뷰
- Codex 피드백 반영: Path.cwd() fallback 개선, sys.path 설정 위치 이동, .is_dir() 체크 추가
- 모든 import 테스트 통과


---

## 참고 문서

- [[prj-api-exec-vault]] - 소속 Project
- [[tsk-018-03]] - 선행 작업 (shared/ 모듈)

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
