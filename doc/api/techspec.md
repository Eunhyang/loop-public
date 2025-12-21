# Dashboard API - Technical Specification

**Project**: LOOP Dashboard API
**Version**: 1.1.0
**Last Updated**: 2025-12-21
**Status**: Active

---

## 1. 개요

### 목적

LOOP Vault의 Task/Project를 웹 대시보드에서 조회/생성/수정/삭제할 수 있는 REST API 제공.

### 핵심 기능

- Task CRUD (Create, Read, Update, Delete)
- Project CRUD
- Track/Hypothesis/Condition 조회
- 마크다운 본문(body) 포함 응답
- Obsidian URI 연동

---

## 2. 아키텍처

### 기술 스택

- **Language**: Python 3.9+
- **Framework**: FastAPI
- **Data Storage**: Markdown files (Obsidian Vault)
- **Validation**: Pydantic

### 디렉토리 구조

```
scripts/
└── api_server.py      # 현재 단일 파일 (레거시)

api/                   # 리팩토링 대상
├── main.py            # FastAPI 앱
├── routers/
│   ├── tasks.py
│   └── projects.py
├── models/
│   └── entities.py
└── utils/
    └── vault_utils.py
```

### 데이터 흐름

```
Browser → FastAPI → Vault Files (*.md)
                         ↓
              Frontmatter (YAML) + Body (Markdown)
                         ↓
              JSON Response → Browser
```

---

## 3. API 엔드포인트

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Task 목록 (본문 포함) |
| POST | /api/tasks | Task 생성 |
| PUT | /api/tasks/{id} | Task 수정 |
| DELETE | /api/tasks/{id} | Task 삭제 |
| GET | /api/projects | Project 목록 |
| POST | /api/projects | Project 생성 |
| PUT | /api/projects/{id} | Project 수정 |
| DELETE | /api/projects/{id} | Project 삭제 |
| GET | /api/tracks | Track 목록 |
| GET | /api/hypotheses | Hypothesis 목록 |
| GET | /api/conditions | Condition 목록 |
| GET | /api/members | Member 목록 |
| GET | /api/constants | 상수값 (status, priority 등) |

---

## 4. 데이터 모델

### Task 응답

```python
class TaskResponse(BaseModel):
    entity_type: str = "Task"
    entity_id: str
    entity_name: str
    project_id: str
    assignee: str
    status: str
    priority: str
    due: Optional[str]
    notes: Optional[str]  # 마크다운 본문
    _path: str            # Vault 상대 경로
```

### Project 응답

```python
class ProjectResponse(BaseModel):
    entity_type: str = "Project"
    entity_id: str
    entity_name: str
    owner: str
    status: str
    priority_flag: str
    _path: str
```

---

## 5. 현재 작업 (API-001)

### 문제

`scripts/api_server.py`의 `extract_frontmatter()`가 YAML만 추출하고 본문(body)을 버림.

### 해결

```python
def extract_frontmatter_and_body(file_path: Path) -> Tuple[Optional[Dict], str]:
    """YAML frontmatter와 본문을 함께 추출"""
    content = file_path.read_text(encoding='utf-8')
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)', content, re.DOTALL)
    if match:
        frontmatter = yaml.safe_load(match.group(1))
        body = match.group(2).strip()
        return frontmatter, body
    return None, content
```

### Dashboard 연동

- `task.notes` = body 내용
- TaskPanel에서 마크다운 렌더링
- TaskCard에 Obsidian 링크 아이콘

---

## 6. Obsidian URI

### 형식

```
obsidian://open?vault=LOOP&file={encoded_path}
```

### 예시

```
obsidian://open?vault=LOOP&file=50_Projects%2F2025%2FP008_%ED%8C%8C%EC%9D%BC%EB%9F%BF%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%ED%9B%84%EB%B3%B4%2FTasks%2F%5B%EB%8B%A8%EB%8B%98%5D%20%ED%9B%84%EB%B3%B4%20%ED%83%9C%EC%8A%A4%ED%81%AC%201%20%E2%80%93%20%EA%BC%AD%EA%BC%AD%20%EC%95%B1%20Onboarding%20UIUX.md
```

---

## 7. 서버 실행

### 개발 환경

```bash
cd /Volumes/LOOP_CORE/vault/LOOP
poetry run uvicorn scripts.api_server:app --reload --host 0.0.0.0 --port 8081
```

### Swagger UI

```
http://localhost:8081/docs
```

---

## 8. 아키텍처 결정 기록 (ADR)

### ADR-001: 단일 파일 API 서버

- **날짜**: 2025-12-19
- **결정**: `scripts/api_server.py` 단일 파일로 시작
- **이유**: 빠른 프로토타이핑
- **영향**: 향후 `api/` 모듈로 리팩토링 필요

### ADR-002: 본문(body)을 notes 필드로 반환

- **날짜**: 2025-12-21
- **결정**: frontmatter + body를 함께 추출, body는 `notes` 필드로 반환
- **이유**: Task 상세 내용을 대시보드에서 볼 수 있어야 함
- **영향**: API 응답 크기 증가 (큰 본문 포함)

---

**Version**: 1.1.0
**Status**: Living Document
