# LOOP Dashboard API

웹 UI에서 Task/Project를 생성/수정/삭제할 수 있도록 REST API를 제공하는 FastAPI 서버

## 🚀 Quick Start

### 1. 설치

```bash
cd /Volumes/LOOP_CORE/vault/LOOP

# API 서버 의존성 포함 설치
poetry install --extras api
```

### 2. 개발 모드 실행

```bash
cd /Volumes/LOOP_CORE/vault/LOOP

# Poetry 환경에서 실행
poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port 8081
```

### 3. 프로덕션 모드 실행

```bash
poetry run uvicorn api.main:app --host 0.0.0.0 --port 8081 --workers 2
```

### 4. 접속

- **API 문서 (Swagger)**: http://localhost:8081/docs
- **API 문서 (ReDoc)**: http://localhost:8081/redoc
- **Health Check**: http://localhost:8081/health

---

## 📡 API Endpoints

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Task 목록 조회 |
| GET | `/api/tasks?project_id=prj-001` | 특정 프로젝트의 Task 목록 |
| GET | `/api/tasks?status=doing` | 특정 상태의 Task 목록 |
| POST | `/api/tasks` | Task 생성 |
| PUT | `/api/tasks/{task_id}` | Task 수정 |
| DELETE | `/api/tasks/{task_id}` | Task 삭제 |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Project 목록 조회 |
| POST | `/api/projects` | Project 생성 |
| PUT | `/api/projects/{project_id}` | Project 수정 |
| DELETE | `/api/projects/{project_id}` | Project 삭제 |

### Tracks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracks` | Track 목록 조회 |
| GET | `/api/tracks/{track_id}` | 개별 Track 조회 |

### Programs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/programs` | Program 목록 조회 |
| GET | `/api/programs/{program_id}` | 개별 Program 조회 |

### Hypotheses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hypotheses` | Hypothesis 목록 조회 |
| GET | `/api/hypotheses?parent_id=trk-1` | 특정 Track의 Hypothesis 목록 |
| GET | `/api/hypotheses?evidence_status=planning` | 특정 상태의 Hypothesis 목록 |
| GET | `/api/hypotheses?horizon=2026` | 특정 연도의 Hypothesis 목록 |
| GET | `/api/hypotheses/{hypothesis_id}` | 개별 Hypothesis 조회 (body 포함) |
| POST | `/api/hypotheses` | Hypothesis 생성 |
| PUT | `/api/hypotheses/{hypothesis_id}` | Hypothesis 수정 |
| DELETE | `/api/hypotheses/{hypothesis_id}` | Hypothesis 삭제 |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/members` | 멤버 목록 조회 |

---

## 📝 사용 예시

### Task 생성

```bash
curl -X POST http://localhost:8081/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "API 서버 구축",
    "project_id": "prj-001",
    "assignee": "eunhyang",
    "priority": "high",
    "status": "doing",
    "due": "2025-12-25",
    "tags": ["api", "backend"]
  }'
```

**응답**:
```json
{
  "success": true,
  "task_id": "tsk-015-01",
  "file_path": "50_Projects/2025/P001_Ontology/Tasks/API_서버_구축.md",
  "message": "Task created successfully"
}
```

### Task 수정

```bash
curl -X PUT http://localhost:8081/api/tasks/tsk-015-01 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done"
  }'
```

### Task 삭제

```bash
curl -X DELETE http://localhost:8081/api/tasks/tsk-015-01
```

### Project 생성

```bash
curl -X POST http://localhost:8081/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "API 서버 개발",
    "owner": "eunhyang",
    "priority": "high"
  }'
```

### Project 수정

```bash
curl -X PUT http://localhost:8081/api/projects/prj-001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "priority_flag": "high"
  }'
```

### Project 삭제

```bash
# 하위 Task 없는 프로젝트 삭제
curl -X DELETE http://localhost:8081/api/projects/prj-015

# 하위 Task 포함 강제 삭제
curl -X DELETE "http://localhost:8081/api/projects/prj-015?force=true"
```

### Hypothesis 생성

```bash
curl -X POST http://localhost:8081/api/hypotheses \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "천천히 먹기 효과 검증",
    "parent_id": "trk-1",
    "hypothesis_question": "천천히 먹기가 실제 식사 행동을 바꾸는가?",
    "success_criteria": "2주 사용 코호트에서 식사시간 +20% 개선",
    "failure_criteria": "개선이 미미(<+5%)하거나 지속 사용이 안 됨",
    "measurement": "기능 사용 로그 + 식사 기록",
    "horizon": "2026",
    "evidence_status": "planning"
  }'
```

**응답**:
```json
{
  "success": true,
  "hypothesis_id": "hyp-1-12",
  "file_path": "60_Hypotheses/2026/hyp-1-12_천천히_먹기_효과_검증.md",
  "message": "Hypothesis created successfully"
}
```

### Hypothesis 수정

```bash
curl -X PUT http://localhost:8081/api/hypotheses/hyp-1-12 \
  -H "Content-Type: application/json" \
  -d '{
    "evidence_status": "validating",
    "confidence": 0.3
  }'
```

### Hypothesis 삭제

```bash
curl -X DELETE http://localhost:8081/api/hypotheses/hyp-1-12
```

---

## 🏗️ 구조

```
api/
├── main.py              # FastAPI 앱 (엔트리포인트)
├── routers/             # API 라우터
│   ├── tasks.py         # Task CRUD
│   └── projects.py      # Project CRUD
├── models/              # Pydantic 모델
│   └── entities.py      # Task/Project 스키마
├── utils/               # 유틸리티
│   └── vault_utils.py   # Vault 파일 처리
└── README.md            # 이 파일
```

---

## 🔧 NAS에서 실행 (프로덕션)

### 1. 의존성 설치

```bash
ssh admin@nas-ip
cd /volume1/LOOP_CORE/vault/LOOP

# Poetry 설치 (최초 1회)
curl -sSL https-//install.python-poetry.org | python3 -

# 의존성 설치
poetry install --extras api
```

### 2. 백그라운드 실행

```bash
cd /volume1/LOOP_CORE/vault/LOOP

# nohup으로 백그라운드 실행
nohup poetry run uvicorn api.main:app \
  --host 0.0.0.0 \
  --port 8081 \
  > /volume1/LOOP_CORE/logs/api-server.log 2>&1 &

# PID 확인
echo $! > /volume1/LOOP_CORE/logs/api-server.pid
```

### 3. 서비스 확인

```bash
# 프로세스 확인
ps aux | grep uvicorn

# 로그 확인
tail -f /volume1/LOOP_CORE/logs/api-server.log

# Health check
curl http://localhost:8081/health
```

### 4. 서비스 종료

```bash
# PID로 종료
kill $(cat /volume1/LOOP_CORE/logs/api-server.pid)

# 또는 직접 종료
pkill -f "uvicorn api.main"
```

---

## 🎯 DSM Task Scheduler 설정 (자동 시작)

### 1. 시작 스크립트 생성

```bash
# /volume1/LOOP_CORE/scripts/start-api-server.sh
#!/bin/bash

VAULT_DIR="/volume1/LOOP_CORE/vault/LOOP"
LOG_FILE="/volume1/LOOP_CORE/logs/api-server.log"
PID_FILE="/volume1/LOOP_CORE/logs/api-server.pid"

cd "$VAULT_DIR"

nohup poetry run uvicorn api.main:app \
  --host 0.0.0.0 \
  --port 8081 \
  > "$LOG_FILE" 2>&1 &

echo $! > "$PID_FILE"
echo "API Server started (PID: $!)"
```

### 2. DSM Task Scheduler

**작업 이름**: API Server Auto Start
**사용자**: root
**트리거**: 부팅 시 실행
**스크립트**:
```bash
bash /volume1/LOOP_CORE/scripts/start-api-server.sh
```

---

## 🐛 트러블슈팅

### 문제 1: Port 8081 already in use

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :8081

# 강제 종료
kill -9 <PID>
```

### 문제 2: Module not found

```bash
# 의존성 재설치
cd /Volumes/LOOP_CORE/vault/LOOP
poetry install --extras api
```

### 문제 3: Permission denied

```bash
# NAS에서 실행 권한 부여
chmod +x /volume1/LOOP_CORE/scripts/start-api-server.sh
```

---

## 📚 참고 문서

- **FastAPI 공식 문서**: https-//fastapi.tiangolo.com/
- **Uvicorn 문서**: https-//www.uvicorn.org/
- **Dashboard 아키텍처**: `../NAS_DASHBOARD_ARCHITECTURE.md`

---

**Version**: 1.0.0
**Last Updated**: 2025-12-19
**Author**: LOOP Team
