# Dashboard API - TODO

**Project**: LOOP Dashboard API
**Last Updated**: 2025-12-19

---

## ✅ 완료된 작업

### Phase 1: 기본 구조 (2025-12-19)

- [x] **API 서버 구조 설계**
  - 수정 파일: `api/main.py`, `api/routers/`, `api/models/`, `api/utils/`
  - 작업 내용: FastAPI 기반 API 서버 구조 설계 및 생성
  - 변경 사항:
    - api/ 폴더 생성 (scripts/와 분리)
    - Router 패턴 적용 (tasks.py, projects.py)
    - Pydantic 모델 정의 (entities.py)
    - Vault 파일 처리 유틸리티 (vault_utils.py)

- [x] **Task CRUD 엔드포인트**
  - 수정 파일: `api/routers/tasks.py`, `api/models/entities.py`
  - 작업 내용: Task 생성/조회/수정/삭제 API 구현
  - 변경 사항:
    - POST /api/tasks - Task 생성
    - GET /api/tasks - Task 목록 조회 (project_id, status 필터링)
    - PUT /api/tasks/{task_id} - Task 수정
    - DELETE /api/tasks/{task_id} - Task 삭제
    - Task ID 자동 생성 로직 (tsk:NNN-NN)

- [x] **Project CRUD 엔드포인트**
  - 수정 파일: `api/routers/projects.py`, `api/models/entities.py`
  - 작업 내용: Project 생성/조회 API 구현
  - 변경 사항:
    - POST /api/projects - Project 생성
    - GET /api/projects - Project 목록 조회
    - Project ID 자동 생성 로직 (prj:NNN)
    - 디렉토리 구조 자동 생성 (Tasks/, Results/)

- [x] **Poetry 통합**
  - 수정 파일: `pyproject.toml`, `api/README.md`, `START_API_SERVER.md`
  - 작업 내용: requirements.txt → pyproject.toml 마이그레이션
  - 변경 사항:
    - api/requirements.txt 삭제
    - pyproject.toml에 optional-dependencies 추가
    - 모든 문서 Poetry 명령어로 업데이트

- [x] **Interactive Dashboard**
  - 수정 파일: `scripts/build_dashboard_interactive.py`
  - 작업 내용: Task/Project 생성 Modal UI 추가
  - 변경 사항:
    - Modal 폼 추가 (Task, Project)
    - JavaScript API 호출 로직
    - Toast 알림

---

## 🚧 진행 중

(현재 진행 중인 작업 없음)

---

## ✅ 완료된 작업 (계속)

### NAS 배포 (2025-12-19)

- [x] **NAS API 서버 배포**
  - 배포 일시: 2025-12-19 18:45 KST
  - 수정 파일:
    - `api/main.py` - 환경별 Vault 경로 자동 감지
    - `api/routers/tasks.py` - get_vault_dir() 사용
    - `api/routers/projects.py` - get_vault_dir() 사용
    - `api/utils/vault_utils.py` - get_vault_dir() 함수 추가
  - 작업 내용:
    - NAS에 Python 의존성 설치 (fastapi, uvicorn, pyyaml)
    - API 서버 시작 스크립트 작성 (`/volume1/LOOP_CORE/scripts/start-api-server.sh`)
    - DSM Task Scheduler로 자동 시작 설정
    - Reverse Proxy 설정 (192.168.219.100:8081 → kanban.sosilab.synology.me:443)
    - Vault 경로 자동 감지 로직 추가 (NAS/MacBook 환경 모두 지원)
  - 결과: **배포 성공**
    - API URL: `https://kanban.sosilab.synology.me`
    - Health: `vault_exists: true`, `projects_count: 14`

### Phase 2: 테스트 및 검증 (2025-12-19)

- [x] **API 서버 통합 테스트**
  - 테스트 일시: 2025-12-19 18:21 KST
  - 확인 사항:
    - [x] API 서버 시작: `poetry run uvicorn api.main:app --port 8081` ✅
    - [x] Health Check: `{"status":"healthy","vault_exists":true,"projects_count":14}` ✅
    - [x] Members 조회: 3명 (eunhyang, myunghak, dan) ✅
    - [x] Projects 조회: 14개 프로젝트 정상 조회 ✅
    - [x] Tasks 조회 (prj:001): Task 목록 정상 조회 ✅
    - [x] Task 생성 테스트: `tsk:014-02` 생성 → 파일 확인 → 삭제 ✅
    - [x] Project 생성 테스트: `prj:015` 생성 → 디렉토리 구조 확인 (Tasks/, Results/) → 삭제 ✅
  - 결과: **모든 테스트 통과**

### 칸반 보드 UI 서빙 (2025-12-19)

- [x] **FastAPI에서 칸반 보드 HTML 직접 서빙**
  - 완료 일시: 2025-12-19 19:00 KST
  - 수정 파일: `api/main.py`
  - 작업 내용: 루트 경로(/)에서 칸반 보드 HTML 반환하도록 수정
  - 변경 사항:
    - `from fastapi.responses import FileResponse` 추가
    - `@app.get("/")` → `_dashboard/index.html` 파일 반환
    - 기존 API 정보는 `/api/info`로 이동
  - 결과: **배포 성공**
    - `https://kanban.sosilab.synology.me/` → 칸반 보드 UI 표시
    - `https://kanban.sosilab.synology.me/docs` → Swagger UI
    - `https://kanban.sosilab.synology.me/api/*` → API 엔드포인트

---

## 📋 예정된 작업

### Phase 3: 기능 개선

- [ ] **Hypothesis CRUD 엔드포인트 추가**
  - 작업 내용: Hypothesis 생성/조회/수정/삭제 API
  - 예상 파일:
    - `api/routers/hypotheses.py`
    - `api/models/entities.py` (HypothesisCreate, HypothesisResponse 추가)
  - 우선순위: Medium

- [ ] **Experiment CRUD 엔드포인트 추가**
  - 작업 내용: Experiment 생성/조회/수정/삭제 API
  - 우선순위: Medium

- [ ] **Task 수정 UI**
  - 작업 내용: Dashboard에서 Task 상태/담당자 변경
  - 관련 파일: `scripts/build_dashboard_interactive.py`
  - 우선순위: High

- [ ] **Project 수정/삭제 UI**
  - 작업 내용: Dashboard에서 Project 정보 수정/삭제
  - 우선순위: Medium

### Phase 4: 성능 최적화

- [ ] **Vault 스캔 결과 캐싱**
  - 작업 내용: 파일 스캔 결과를 메모리에 캐싱 (TTL: 5초)
  - 예상 파일: `api/utils/cache.py`
  - 이유: 매 요청마다 파일 시스템 스캔 비효율적
  - 우선순위: Medium

- [ ] **파일 변경 감지 (inotify)**
  - 작업 내용: 파일 변경 시 캐시 무효화
  - 우선순위: Low

- [ ] **Uvicorn 워커 증가**
  - 작업 내용: `--workers 2` 설정 (NAS 배포 시)
  - 우선순위: Low

### Phase 5: 보안 강화

- [ ] **API Key 인증**
  - 작업 내용: 간단한 API Key 기반 인증
  - 예상 파일: `api/middleware/auth.py`
  - 우선순위: Medium

- [ ] **CORS Origin 제한**
  - 작업 내용: 프로덕션 환경에서 특정 origin만 허용
  - 수정 파일: `api/main.py`
  - 우선순위: Medium

- [ ] **Input Validation 강화**
  - 작업 내용: Pydantic 모델에 더 엄격한 validation 추가
  - 우선순위: Low

### Phase 6: 테스트 자동화

- [ ] **pytest 설정**
  - 작업 내용: pytest 설정 및 기본 테스트 작성
  - 예상 파일:
    - `tests/test_tasks.py`
    - `tests/test_projects.py`
    - `tests/conftest.py`
  - 우선순위: High

- [ ] **통합 테스트**
  - 작업 내용: 실제 Vault 파일 생성/삭제 테스트
  - 우선순위: Medium

- [ ] **CI/CD 파이프라인**
  - 작업 내용: GitHub Actions 설정
  - 우선순위: Low

---

## 🐛 알려진 이슈

### 현재 없음

---

## 💡 아이디어 / 향후 검토

- [ ] **WebSocket 지원**: 실시간 Task 상태 업데이트
- [ ] **Bulk Operations**: 여러 Task를 한 번에 생성/수정
- [ ] **Task Template**: 자주 사용하는 Task 패턴을 템플릿으로 저장
- [ ] **GraphQL API**: REST 대신 GraphQL 제공
- [ ] **Slack 알림**: Task 생성/완료 시 Slack 알림

---

## 📝 작업 기록 가이드

**작업 시작 시**:
```markdown
- [ ] **TASK-XXX** 태스크 제목
  - 예상 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 무엇을 할 것인지
  - 우선순위: High/Medium/Low
```

**작업 완료 시**:
```markdown
- [x] **TASK-XXX** 태스크 제목
  - 수정 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 실제 수행한 작업 설명
  - 변경 사항: 구체적인 변경 내용
  - 완료일: 2025-12-19
```

---

**Last Updated**: 2025-12-19
