# API 서버 빠른 시작 가이드

## 🚀 MacBook에서 실행 (개발)

### 1단계: 의존성 설치 (최초 1회)

```bash
cd /Volumes/LOOP_CORE/vault/LOOP

# API 서버 의존성 포함 설치
poetry install --extras api
```

### 2단계: 서버 실행

```bash
cd /Volumes/LOOP_CORE/vault/LOOP
poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port 8081
```

**출력**:
```
INFO:     Uvicorn running on http://0.0.0.0:8081 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 3단계: Dashboard 빌드

**새 터미널**:
```bash
cd /Volumes/LOOP_CORE/vault/LOOP
python3 scripts/build_dashboard_interactive.py .
```

### 4단계: Dashboard 열기

브라우저에서:
```
file:///Volumes/LOOP_CORE/vault/LOOP/_dashboard/index.html
```

또는:
```
http://kkanban.sosilab.synology.me
```

---

## 🎯 기능 테스트

### Task 생성 테스트

1. Dashboard에서 **[➕ New Task]** 클릭
2. 정보 입력:
   - Task Name: `테스트 Task`
   - Project: `prj-001` 선택
   - Assignee: `eunhyang` 선택
   - Priority: `Medium`
3. **[Create Task]** 클릭
4. 성공 메시지 확인: `Task created: tsk-XXX-XX`
5. 페이지 새로고침 → 새 Task 카드 확인

### Project 생성 테스트

1. **[📁 New Project]** 클릭
2. 정보 입력:
   - Project Name: `테스트 프로젝트`
   - Owner: `eunhyang`
3. **[Create Project]** 클릭
4. Obsidian에서 확인: `50_Projects/2025/P0XX_테스트_프로젝트/`

---

## 🛠️ NAS에서 실행 (프로덕션)

### 1단계: SSH 접속

```bash
ssh admin@kkanban.sosilab.synology.me
```

### 2단계: 의존성 설치 (최초 1회)

```bash
cd /volume1/LOOP_CORE/vault/LOOP

# Poetry 설치 (최초 1회)
curl -sSL https-//install.python-poetry.org | python3 -

# 의존성 설치
poetry install --extras api
```

### 3단계: 서버 실행

```bash
cd /volume1/LOOP_CORE/vault/LOOP

# 백그라운드 실행
nohup poetry run uvicorn api.main:app \
  --host 0.0.0.0 \
  --port 8081 \
  > /volume1/LOOP_CORE/logs/api-server.log 2>&1 &

# PID 저장
echo $! > /volume1/LOOP_CORE/logs/api-server.pid
```

### 4단계: 확인

```bash
# 프로세스 확인
ps aux | grep uvicorn

# 로그 확인
tail -f /volume1/LOOP_CORE/logs/api-server.log

# Health check
curl http://localhost:8081/health
```

### 5단계: 종료 (필요시)

```bash
kill $(cat /volume1/LOOP_CORE/logs/api-server.pid)
```

---

## 📡 API 테스트 (curl)

### Health Check

```bash
curl http://localhost:8081/health
```

**응답**:
```json
{
  "status": "healthy",
  "vault_exists": true,
  "projects_count": 14,
  "timestamp": "2025-12-19T16:30:00"
}
```

### Task 생성

```bash
curl -X POST http://localhost:8081/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "curl 테스트 Task",
    "project_id": "prj-001",
    "assignee": "eunhyang",
    "priority": "high",
    "status": "todo"
  }'
```

**응답**:
```json
{
  "success": true,
  "task_id": "tsk-049-01",
  "file_path": "50_Projects/2025/P001_Ontology/Tasks/curl_테스트_Task.md",
  "message": "Task created successfully"
}
```

### Task 목록 조회

```bash
curl http://localhost:8081/api/tasks
```

### Project 목록 조회

```bash
curl http://localhost:8081/api/projects
```

---

## 🐛 문제 해결

### 문제 1: `uvicorn: command not found`

```bash
cd /Volumes/LOOP_CORE/vault/LOOP
poetry install --extras api
```

### 문제 2: `ModuleNotFoundError: No module named 'fastapi'`

```bash
cd /Volumes/LOOP_CORE/vault/LOOP
poetry install --extras api
```

### 문제 3: `Port 8081 already in use`

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :8081

# 종료
kill -9 <PID>
```

### 문제 4: API 서버 연결 실패 (Dashboard)

**원인**: API 서버가 실행되지 않음

**해결**:
```bash
# 터미널에서 API 서버 실행 확인
curl http://localhost:8081/health

# 안 되면 서버 시작
cd /Volumes/LOOP_CORE/vault/LOOP
poetry run uvicorn api.main:app --host 0.0.0.0 --port 8081
```

---

## 🔄 전체 워크플로우

```
1. API 서버 시작 (백그라운드)
   poetry run uvicorn api.main:app --host 0.0.0.0 --port 8081 &

2. Dashboard 빌드
   python3 scripts/build_dashboard_interactive.py .

3. Dashboard 접속
   open _dashboard/index.html

4. Task 생성 (웹 UI)
   [New Task] → 정보 입력 → [Create Task]

5. Obsidian에서 확인
   50_Projects/*/Tasks/ 에 새 .md 파일 생성됨

6. Dashboard 자동 재빌드 (NAS File Watcher)
   파일 변경 감지 → 2초 후 자동 빌드 → 웹 배포
```

---

## 📚 관련 문서

- **API 문서**: `/api/README.md`
- **API Swagger**: http://localhost:8081/docs
- **Dashboard 아키텍처**: `/NAS_DASHBOARD_ARCHITECTURE.md`

---

**Last Updated**: 2025-12-19
