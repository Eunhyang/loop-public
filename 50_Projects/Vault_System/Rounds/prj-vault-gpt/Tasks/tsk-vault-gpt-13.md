---
entity_type: Task
entity_id: "tsk-vault-gpt-13"
entity_name: "MCP Write API - ChatGPT에서 Project/Task 생성/수정"
created: 2026-01-09
updated: 2026-01-09
status: doing

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-13"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-09
due: 2026-01-09
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: []
priority_flag: high
---

# MCP Write API - ChatGPT에서 Project/Task 생성/수정

> Task ID: `tsk-vault-gpt-13` | Project: `prj-vault-gpt` | Status: doing

## 목표

ChatGPT MCP에서 Project/Task 생성/수정 기능 추가 (Read-only → CRUD)

**완료 조건**:
1. POST /api/mcp/project, PUT /api/mcp/project/{id} 구현
2. POST /api/mcp/task, PUT /api/mcp/task/{id} 구현
3. main.py MCP_ALLOWED_OPERATIONS에 4개 operation ID 추가
4. 로컬 테스트 성공
5. Docker 배포 및 ChatGPT 연동 테스트

---

## 상세 내용

### 배경

현재 ChatGPT MCP는 LOOP Vault를 읽기만 가능. 사용자가 ChatGPT에서 직접 프로젝트/태스크를 생성/수정할 수 있도록 Write API 추가 필요.

### 작업 내용

#### 1. entities.py - MCP 모델 5개 추가
- MCPProjectCreate
- MCPProjectUpdate
- MCPTaskCreate
- MCPTaskUpdate
- MCPWriteResponse

#### 2. mcp_composite.py - Write 엔드포인트 4개 추가
- POST /api/mcp/project
- PUT /api/mcp/project/{project_id}
- POST /api/mcp/task
- PUT /api/mcp/task/{task_id}

모든 엔드포인트는:
- `require_write_access()` - mcp:write scope 검증
- 기존 projects.py/tasks.py 로직 재사용
- auto_validate 기본값 true
- 감사 로그 자동 기록

#### 3. main.py - MCP_ALLOWED_OPERATIONS 업데이트
```python
"mcp_create_project_api_mcp_project_post",
"mcp_update_project_api_mcp_project__project_id__put",
"mcp_create_task_api_mcp_task_post",
"mcp_update_task_api_mcp_task__task_id__put",
```

---

## 체크리스트

### 구현
- [ ] entities.py - MCP 모델 5개 추가
- [ ] mcp_composite.py - require_write_access() 함수 구현
- [ ] mcp_composite.py - Project 엔드포인트 2개 (POST, PUT)
- [ ] mcp_composite.py - Task 엔드포인트 2개 (POST, PUT)
- [ ] main.py - MCP_ALLOWED_OPERATIONS에 4개 추가

### 테스트
- [ ] 로컬 API 서버 구동 (poetry run uvicorn api.main:app --reload --port 8081)
- [ ] curl로 Project 생성 테스트
- [ ] curl로 Task 생성 테스트
- [ ] OpenAPI 스펙 확인 (operation ID 노출 검증)

### 배포
- [ ] /mcp-server rebuild
- [ ] Production 테스트 (https://mcp.sosilab.synology.me)
- [ ] ChatGPT OAuth scope에 mcp:write 추가
- [ ] ChatGPT에서 E2E 테스트

---

## Notes

### 참조 계획서
- 파일: `/Users/gim-eunhyang/.claude/plans/cheeky-discovering-starfish.md`
- 승인일: 2026-01-09

### Tech Spec

**수정할 파일 (3개)**:
1. `/Users/gim-eunhyang/dev/loop/public/api/models/entities.py`
   - Line ~200 이후에 MCP 모델 5개 추가

2. `/Users/gim-eunhyang/dev/loop/public/api/routers/mcp_composite.py`
   - Line 1941 이후에 write 엔드포인트 4개 + require_write_access() 추가

3. `/Users/gim-eunhyang/dev/loop/public/api/main.py`
   - Line 332 MCP_ALLOWED_OPERATIONS 배열에 4개 operation ID 추가

**보안**:
- Scope 검증: `mcp:write` 필수
- DELETE 금지: 엔드포인트 자체 생성하지 않음
- 감사 로그: 기존 `log_entity_action()` 자동 호출
- 입력 검증: entity_name 형식, assignee 유효성 체크

**ChatGPT 연동**:
- OAuth scope: `mcp:read mcp:write`
- 권한 팝업: 4개 operation 각각 "Allow" 필요
- URL: `https://mcp.sosilab.synology.me/api/mcp/project`

### Todo

**Step 1: 코드 구현**
- [ ] entities.py 모델 추가
- [ ] mcp_composite.py 엔드포인트 구현
- [ ] main.py MCP_ALLOWED_OPERATIONS 업데이트

**Step 2: 로컬 테스트**
- [ ] API 서버 실행
- [ ] curl 테스트 (Project 생성)
- [ ] curl 테스트 (Task 생성)
- [ ] OpenAPI 스펙 검증

**Step 3: 배포 및 E2E 테스트**
- [ ] Docker rebuild
- [ ] Production API 테스트
- [ ] ChatGPT OAuth scope 업데이트
- [ ] ChatGPT에서 실제 생성 테스트

### 작업 로그

#### 2026-01-09 Implementation Complete

**개요**: MCP Write API 4개 엔드포인트 구현 완료. ChatGPT에서 Project/Task 생성/수정 가능하도록 변경.

**변경사항**:
- 개발:
  - `api/models/entities.py`: MCP 모델 5개 추가 (MCPProjectCreate, MCPProjectUpdate, MCPTaskCreate, MCPTaskUpdate, MCPWriteResponse)
  - `api/routers/mcp_composite.py`: Write 엔드포인트 4개 + require_write_access() 함수 추가
  - `api/main.py`: MCP_ALLOWED_OPERATIONS에 4개 operation ID 추가

**핵심 코드**:
```python
# mcp_composite.py
def require_write_access(request: Request) -> None:
    """mcp:write scope 확인"""
    role, scope = get_role_and_scope(request)
    if "mcp:write" not in scope and "mcp:admin" not in scope:
        raise HTTPException(status_code=403, detail="mcp:write scope required")

@router.post("/project", response_model=MCPWriteResponse, tags=["mcp-write"])
async def mcp_create_project(request: Request, project: MCPProjectCreate):
    require_write_access(request)
    # ... 기존 projects.create_project() 재사용
```

**결과**: ✅ 코드 구현 완료

**다음 단계**:
- [ ] 로컬 API 서버 테스트 (poetry run uvicorn api.main:app --reload --port 8081)
- [ ] curl로 Project/Task 생성 테스트
- [ ] Docker rebuild: /mcp-server rebuild
- [ ] ChatGPT OAuth scope에 mcp:write 추가
- [ ] E2E 테스트 (ChatGPT에서 실제 생성)

---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- `/Users/gim-eunhyang/.claude/plans/cheeky-discovering-starfish.md` - 구현 계획서
- `public/api/routers/projects.py` - 기존 Project CRUD 로직
- `public/api/routers/tasks.py` - 기존 Task CRUD 로직

---

**Created**: 2026-01-09
**Assignee**: 김은향
**Due**: 2026-01-09
