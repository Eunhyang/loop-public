# Dashboard API - Technical Specification

**Project**: LOOP Dashboard API
**Version**: 1.0.0
**Last Updated**: 2025-12-19
**Status**: In Development

---

## 1. 개요

### 목적
Obsidian Vault의 Task/Project 엔티티를 웹 UI에서 생성/수정/삭제할 수 있도록 REST API 제공

### 핵심 기능
- Task CRUD (Create, Read, Update, Delete)
- Project CRUD
- Member 목록 조회
- Vault 파일 시스템과 실시간 동기화

---

## 2. 아키텍처

### 기술 스택
- **Framework**: FastAPI 0.104.0+
- **Server**: Uvicorn (ASGI)
- **Validation**: Pydantic 2.0+
- **Dependency Management**: Poetry
- **File Format**: Markdown with YAML frontmatter

### 디렉토리 구조
```
api/
├── main.py              # FastAPI 앱 엔트리포인트
├── routers/             # API 라우터
│   ├── tasks.py         # Task CRUD
│   └── projects.py      # Project CRUD
├── models/              # Pydantic 모델
│   └── entities.py      # Task/Project 스키마
├── utils/               # 유틸리티
│   └── vault_utils.py   # Vault 파일 처리
└── docs/                # 프로젝트 문서
    └── dashboard-api/
        ├── techspec.md  # 이 파일
        └── todo.md      # 작업 목록
```

### 데이터 흐름
```
Web UI (Dashboard)
    ↓ HTTP Request
FastAPI Router (tasks.py / projects.py)
    ↓ Pydantic Validation
Vault Utils (vault_utils.py)
    ↓ File I/O
Vault Markdown Files (50_Projects/*/Tasks/*.md)
    ↓ Real-time sync (AFP/NFS mount)
Obsidian (Team members)
```

---

## 3. API 엔드포인트

### Base URL
- **Development**: `http://localhost:8081`
- **Production (NAS)**: `http://kkanban.sosilab.synology.me:8081`

### Tasks

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/tasks` | Task 목록 조회 | - | `List[TaskResponse]` |
| GET | `/api/tasks?project_id=prj:001` | 프로젝트별 Task 조회 | - | `List[TaskResponse]` |
| GET | `/api/tasks?status=doing` | 상태별 Task 조회 | - | `List[TaskResponse]` |
| POST | `/api/tasks` | Task 생성 | `TaskCreate` | `TaskResponse` |
| PUT | `/api/tasks/{task_id}` | Task 수정 | `TaskUpdate` | `TaskResponse` |
| DELETE | `/api/tasks/{task_id}` | Task 삭제 | - | `DeleteResponse` |

### Projects

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/projects` | Project 목록 조회 | - | `List[ProjectResponse]` |
| POST | `/api/projects` | Project 생성 | `ProjectCreate` | `ProjectResponse` |

### Members

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/members` | 멤버 목록 조회 | - | `List[Member]` |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | 서버 상태 확인 |

---

## 4. 데이터 모델

### TaskCreate (Request)
```python
class TaskCreate(BaseModel):
    entity_name: str          # Task 이름 (필수)
    project_id: str           # 프로젝트 ID (필수, 예: "prj:001")
    assignee: str             # 담당자 (필수, 예: "eunhyang")
    priority: str = "medium"  # 우선순위 (low/medium/high)
    status: str = "todo"      # 상태 (todo/doing/done/blocked)
    due: Optional[str] = None # 마감일 (YYYY-MM-DD)
    tags: List[str] = []      # 태그 목록
```

### TaskResponse (Response)
```python
class TaskResponse(BaseModel):
    success: bool
    task_id: str              # 생성된 Task ID (예: "tsk:015-01")
    file_path: str            # 파일 경로
    message: str
```

### ProjectCreate (Request)
```python
class ProjectCreate(BaseModel):
    entity_name: str          # Project 이름 (필수)
    owner: str                # Owner (필수, 예: "eunhyang")
    priority: str = "medium"  # 우선순위
```

### ProjectResponse (Response)
```python
class ProjectResponse(BaseModel):
    success: bool
    project_id: str           # 생성된 Project ID (예: "prj:015")
    directory_path: str       # 디렉토리 경로
    message: str
```

---

## 5. ID 생성 규칙

### Task ID
- **형식**: `tsk:NNN-NN`
- **예시**: `tsk:015-01`, `tsk:015-02`
- **생성 로직**:
  1. 해당 프로젝트의 모든 Task ID 스캔
  2. 최대 번호 찾기 (예: `tsk:015-03`)
  3. +1 증가 (예: `tsk:015-04`)

### Project ID
- **형식**: `prj:NNN`
- **예시**: `prj:015`, `prj:016`
- **생성 로직**:
  1. 모든 프로젝트 스캔
  2. 최대 번호 찾기
  3. +1 증가

---

## 6. 파일 생성 규칙

### Task 파일
- **위치**: `50_Projects/2025/P{N}_{ProjectName}/Tasks/{TaskName}.md`
- **형식**:
```markdown
---
entity_type: Task
entity_id: "tsk:015-01"
entity_name: API 서버 구축
created: 2025-12-19
updated: 2025-12-19
status: doing
parent_id: "prj:001"
assignee: eunhyang
priority: high
due: "2025-12-25"
tags: [api, backend]
---

# API 서버 구축

Task 내용...
```

### Project 파일
- **위치**: `50_Projects/2025/P{N}_{ProjectName}/Project_정의.md`
- **하위 폴더**:
  - `Tasks/` - Task 파일들
  - `Results/` - 결과물

---

## 7. CORS 설정

**현재 설정**: 모든 origin 허용 (개발용)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**프로덕션**: 특정 origin만 허용
```python
allow_origins=[
    "http://kkanban.sosilab.synology.me",
    "http://localhost:8080"
]
```

---

## 8. 에러 처리

### 표준 에러 응답
```python
raise HTTPException(
    status_code=400,
    detail="Project not found: prj:999"
)
```

### 주요 에러 케이스
| Status Code | 설명 | 예시 |
|-------------|------|------|
| 400 | Bad Request | Invalid project_id format |
| 404 | Not Found | Project not found |
| 500 | Internal Server Error | File I/O error |

---

## 9. 보안 고려사항

### 현재 상태
- ❌ 인증 없음 (로컬 네트워크 내부 사용 가정)
- ❌ 권한 관리 없음

### 향후 개선 (TODO)
- [ ] API Key 인증
- [ ] 멤버별 권한 관리
- [ ] Rate Limiting
- [ ] Input Validation 강화

---

## 10. 배포

### 개발 환경 (MacBook)
```bash
cd /Volumes/LOOP_CORE/vault/LOOP
poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port 8081
```

### 프로덕션 환경 (NAS)
```bash
cd /volume1/LOOP_CORE/vault/LOOP
nohup poetry run uvicorn api.main:app \
  --host 0.0.0.0 --port 8081 \
  > /volume1/LOOP_CORE/logs/api-server.log 2>&1 &
```

### 자동 시작 (DSM Task Scheduler)
- **트리거**: 부팅 시 실행
- **스크립트**: `/volume1/LOOP_CORE/scripts/start-api-server.sh`

---

## 11. 성능 고려사항

### 현재 성능
- **Vault 스캔**: 매 요청마다 파일 시스템 스캔
- **동시성**: Uvicorn 단일 워커
- **캐싱**: 없음

### 향후 최적화 (TODO)
- [ ] Vault 스캔 결과 캐싱 (TTL: 5초)
- [ ] Uvicorn 워커 증가 (--workers 2)
- [ ] 파일 변경 감지 (inotify) → 캐시 무효화

---

## 12. 테스트 전략

### 현재
- ✅ Swagger UI 수동 테스트 (`/docs`)
- ✅ curl 수동 테스트

### 향후 (TODO)
- [ ] pytest로 unit test 작성
- [ ] 통합 테스트 (실제 Vault 파일 생성/삭제)
- [ ] CI/CD 파이프라인

---

## 13. 문서

- **Quick Start**: `START_API_SERVER.md`
- **API 문서**: `api/README.md`
- **Swagger UI**: `http://localhost:8081/docs`
- **ReDoc**: `http://localhost:8081/redoc`

---

## 14. 의존성

**pyproject.toml**:
```toml
[project.optional-dependencies]
api = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "python-multipart>=0.0.6"
]
```

**설치**:
```bash
poetry install --extras api
```

---

## 15. 아키텍처 결정 기록 (ADR)

### ADR-001: Poetry 의존성 관리
- **날짜**: 2025-12-19
- **결정**: `api/requirements.txt` 삭제, `pyproject.toml`에 통합
- **이유**: 프로젝트 전체가 Poetry 사용, 일관성 유지
- **영향**: 모든 설치 명령어 변경 (`pip install` → `poetry install --extras api`)

### ADR-002: API 서버를 scripts/ 외부에 배치
- **날짜**: 2025-12-19
- **결정**: `api/` 폴더 분리 생성
- **이유**: scripts/는 일회성 유틸리티, API 서버는 persistent application
- **영향**: 디렉토리 구조 변경, Obsidian은 `.py` 파일 무시

### ADR-003: Vault 파일 직접 조작
- **날짜**: 2025-12-19
- **결정**: 별도 DB 없이 Vault 마크다운 파일 직접 생성/수정
- **이유**: Obsidian과의 실시간 동기화, 단순성
- **트레이드오프**: 성능보다 단순성 우선, 캐싱은 향후 추가

---

**Version**: 1.0.0
**Status**: Living Document (업데이트 계속됨)
