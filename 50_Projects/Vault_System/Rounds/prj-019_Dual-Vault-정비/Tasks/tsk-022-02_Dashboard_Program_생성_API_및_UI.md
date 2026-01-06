---
entity_type: Task
entity_id: "tsk-022-02"
entity_name: "Dashboard - Program 생성 API 및 UI"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-022-02"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["dashboard", "api", "program", "crud", "ui"]
priority_flag: medium
---

# Dashboard - Program 생성 API 및 UI

> Task ID: `tsk-022-02` | Project: `prj-019` | Status: doing

## 목표

**완료 조건**:
1. `POST /api/programs` API 엔드포인트 구현 (SSOT 패턴 따르기)
2. Dashboard에 Program 생성 UI 추가 (모달/폼)
3. `api/constants.py`에서 `PROGRAM_TYPES` import하여 검증
4. 생성된 Program이 Dashboard Program-Round 뷰에서 조회 가능
5. 기존 SSOT 패턴 준수 확인

---

## 상세 내용

### 배경

현재 Dashboard에는 Program을 조회하는 기능(`tsk-017-12`에서 구현)만 있고, 새로운 Program을 생성하는 기능이 없습니다. `api/routers/programs.py`에는 GET 엔드포인트만 구현되어 있습니다.

Program 생성 기능이 필요한 이유:
- 새로운 Program(예: 채용, YouTube 주간 컨텐츠 등)을 CLI가 아닌 Dashboard UI에서 생성
- 일관된 스키마 검증을 통해 데이터 품질 보장
- Round(Project)들을 그룹화하는 Program 관리 효율화

### 작업 내용

**1. API 개발 (`api/routers/programs.py`)**
- `POST /api/programs` 엔드포인트 추가
- Request body: `entity_name`, `program_type`, `owner`, `status` 등
- `api/constants.py`의 `PROGRAM_TYPES` 사용하여 검증
- ID 자동 생성: `pgm-{normalized_name}` 패턴
- `_PROGRAM.md` 파일 생성 (템플릿 사용)

**2. Dashboard UI (`_dashboard/`)**
- Program 생성 버튼 추가 (Program-Round 뷰 헤더)
- 생성 모달/폼 구현:
  - entity_name (필수, ` - ` 형식 검증)
  - program_type (드롭다운, PROGRAM_TYPES에서 로드)
  - owner (현재 사용자 기본값)
  - description
- 폼 제출 → `POST /api/programs` 호출
- 성공 시 Program-Round 뷰 새로고침

**3. SSOT 패턴 확인**
- `00_Meta/schema_constants.yaml` → `PROGRAM_TYPES` 정의 확인
- `api/constants.py` → YAML 로드하여 Python 상수 노출 확인
- Program 스키마 필수 필드 검증

---

## 체크리스트

- [ ] `api/routers/programs.py`에 `POST /api/programs` 추가
- [ ] Request 모델 정의 (Pydantic)
- [ ] `PROGRAM_TYPES` 검증 로직 추가
- [ ] Program ID 자동 생성 로직 구현
- [ ] `_PROGRAM.md` 파일 생성 로직
- [ ] Dashboard Program 생성 버튼 추가
- [ ] Program 생성 모달 UI 구현
- [ ] 폼 검증 (entity_name 형식 등)
- [ ] API 호출 및 에러 처리
- [ ] 생성 후 목록 새로고침
- [ ] 빌드 및 테스트 확인

---

## Notes

### Context (from main session)

**요구사항**:
1. Program 생성 API 추가: `POST /api/programs` (기존 SSOT 패턴 따르기)
2. Dashboard UI: Program 생성 모달/폼 추가
3. 기존 패턴: `api/constants.py`에서 `PROGRAM_TYPES` import하여 검증

**기존 SSOT 패턴**:
- `00_Meta/schema_constants.yaml` → 유일한 스키마 정의
- `api/constants.py` → YAML 로드하여 Python 상수 노출 (PROGRAM_TYPES 이미 있음)
- 각 라우터에서 `from ..constants import PROGRAM_TYPES` 해서 검증
- `scripts/validate_schema.py`에 `validate_program()` 이미 있음

**현재 상태**:
- `api/routers/programs.py`: GET만 있음 (POST/PUT/DELETE 없음)
- `_dashboard/`: Program 생성 UI 없음
- Program 스키마 필수 필드: `entity_type`, `entity_id`, `entity_name`, `program_type`, `owner`, `status`

**관련 파일들**:
- `/Users/gim-eunhyang/dev/loop/public/api/routers/programs.py` - API 라우터
- `/Users/gim-eunhyang/dev/loop/public/api/constants.py` - PROGRAM_TYPES 상수
- `/Users/gim-eunhyang/dev/loop/public/api/models/entities.py` - Pydantic 모델
- `/Users/gim-eunhyang/dev/loop/public/_dashboard/index.html` - 대시보드 HTML
- `/Users/gim-eunhyang/dev/loop/public/_dashboard/js/components/program-rounds-view.js` - Program 뷰
- `/Users/gim-eunhyang/dev/loop/public/50_Projects/Hiring/_PROGRAM.md` - Program 파일 예시

### PRD (Product Requirements Document)

**Goal**: Dashboard에서 Program을 생성할 수 있는 API 및 UI 구현

**User Story**: 사용자가 Dashboard에서 새 Program(채용, 런칭 등)을 생성하고 Round(Project)를 관리할 수 있어야 함

**Success Criteria**:
1. `POST /api/programs` API 엔드포인트 동작
2. Dashboard Program-Round 뷰에서 "New Program" 버튼으로 생성 가능
3. SSOT 패턴 준수 (schema_constants.yaml -> constants.py -> API 검증)
4. 생성된 Program이 목록에 즉시 반영

### Tech Spec

**API Layer** (`api/routers/programs.py`):
- `POST /api/programs` - Program 생성
- Request Body (ProgramCreate Pydantic model):
  - `entity_name`: str (필수, "주제 - 내용" 형식)
  - `program_type`: str (필수, PROGRAM_TYPES에서 선택)
  - `owner`: str (필수)
  - `description`: str (선택)
- Response (ProgramResponse):
  - `success`: bool
  - `program_id`: str (자동 생성: `pgm-{normalized_name}`)
  - `file_path`: str
  - `message`: str

**Pydantic Models** (`api/models/entities.py`):
- `ProgramCreate`: Request 모델
- `ProgramResponse`: Response 모델

**File Generation**:
- 경로: `50_Projects/{ProgramName}/_PROGRAM.md`
- 템플릿: 기존 `pgm-hiring` 참조
- ID 패턴: `pgm-{kebab-case-name}` (예: `pgm-youtube-weekly`)

**Dashboard UI** (`_dashboard/`):
- Program 생성 버튼: `program-rounds-view.js` 헤더에 추가
- 생성 모달: `js/components/program-modal.js` 신규 생성
- API 호출: `api.js`에 `createProgram()` 추가
- 상태 갱신: `state.js`에서 `reloadPrograms()` 호출

**SSOT 패턴 확인**:
- `00_Meta/schema_constants.yaml`: PROGRAM_TYPES 정의
- `api/constants.py`: YAML에서 PROGRAM_TYPES 로드
- API: `from ..constants import PROGRAM_TYPES`로 검증

### Todo
- [x] API: ProgramCreate, ProgramResponse Pydantic 모델 생성
- [x] API: POST /api/programs 엔드포인트 구현
- [x] API: _PROGRAM.md 파일 생성 로직
- [x] Dashboard: api.js에 createProgram() 추가
- [x] Dashboard: program-modal.js 생성 (모달 컴포넌트)
- [x] Dashboard: program-rounds-view.js에 생성 버튼 추가
- [x] Dashboard: index.html에 모달 HTML 추가
- [x] Dashboard: css/program-rounds.css 스타일 추가
- [ ] 빌드 및 테스트 확인

### 작업 로그
<!-- workthrough 스킬이 자동 생성 -->


---

## 참고 문서

- [[prj-019]] - 소속 Project (Dual-Vault - 정비)
- [[tsk-017-12]] - 선행 Task (Program-Round 대시보드 통합)

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
