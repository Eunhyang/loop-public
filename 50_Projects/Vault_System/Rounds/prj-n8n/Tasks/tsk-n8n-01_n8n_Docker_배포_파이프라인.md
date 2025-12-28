---
entity_type: Task
entity_id: tsk-n8n-01
entity_name: n8n Docker 배포 및 파이프라인 구축
created: 2025-12-27
updated: '2025-12-27'
status: done
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-01
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: '2025-12-27'
priority: high
estimated_hours: 4
actual_hours: null
type: dev
target_project: loop
conditions_3y:
- cond-e
tags:
- n8n
- docker
- automation
- mcp
- llm
priority_flag: high
start_date: '2025-12-27'
notes: "# n8n Docker 배포 및 파이프라인 구축\n\n> Task ID: `tsk-n8n-01` | Project: `prj-n8n`\
  \ | Status: doing\n\n## 목표\n\n**완료 조건**:\n1. NAS에 n8n Docker 컨테이너 배포 완료\n2. 웹 UI\
  \ (port 5678) 접근 가능\n3. LOOP MCP API 연동 워크플로우 생성\n4. 빠진 필드 자동 추론 파이프라인 동작\n\n---\n\
  \n## 상세 내용\n\n### 배경\n\nTask/Project 엔티티에 빠진 필드를 수동으로 채우는 것은 비효율적.\nn8n + LLM으로\
  \ 자동화하여 vault 데이터 품질 향상.\n\n### 작업 내용\n\n1. **n8n Docker 설정**\n   - docker-compose.yml\
  \ 작성\n   - 영구 저장 볼륨 설정\n   - 환경변수 설정 (timezone 등)\n\n2. **NAS 배포**\n   - Container\
  \ Manager에서 배포\n   - 포트 매핑 (5678)\n   - 웹 UI 접근 확인\n\n3. **LOOP API 연동**\n   - HTTP\
  \ Request 노드 설정\n   - OAuth Bearer 토큰 설정\n   - GET /api/tasks 테스트\n\n4. **Auto-fill\
  \ 파이프라인**\n   - Cron 트리거 또는 Manual 트리거\n   - 빠진 필드 필터 (conditions_3y, due, priority)\n\
  \   - OpenAI 노드로 LLM 추론\n   - PUT /api/tasks/{id}로 업데이트\n\n---\n\n## 체크리스트\n\n-\
  \ [x] docker-compose.yml 작성\n- [x] NAS Container Manager 배포\n- [x] 웹 UI 접근 확인 (port\
  \ 5678)\n- [ ] LOOP API 인증 설정\n- [ ] GET /api/tasks 노드 생성\n- [ ] 빠진 필드 필터 로직\n-\
  \ [ ] OpenAI 추론 노드\n- [ ] PUT /api/tasks 노드\n- [ ] 전체 워크플로우 테스트\n\n---\n\n## Notes\n\
  \n### Tech Spec\n\n**인프라**:\n- Target: NAS (Synology) Docker 환경\n- Container: n8nio/n8n\
  \ (latest)\n- Port: 5678\n- Volume: /volume1/docker/n8n/data:/home/node/.n8n\n\n\
  **연동**:\n- LOOP MCP API: https://mcp.sosilab.synology.me\n- Authentication: OAuth\
  \ Bearer Token\n- AI Provider: OpenAI API (GPT-4)\n\n**docker-compose.yml**:\n```yaml\n\
  version: '3.8'\nservices:\n  n8n:\n    image: n8nio/n8n\n    container_name: n8n\n\
  \    restart: unless-stopped\n    ports:\n      - \"5678:5678\"\n    environment:\n\
  \      - TZ=Asia/Seoul\n      - GENERIC_TIMEZONE=Asia/Seoul\n      - N8N_SECURE_COOKIE=false\n\
  \    volumes:\n      - ./data:/home/node/.n8n\n```\n\n**워크플로우 구조**:\n```\nTrigger\
  \ → GET /api/tasks → Filter Missing → Loop → OpenAI Infer → PUT /api/tasks\n```\n\
  \n**빠진 필드 감지 로직** (Code 노드):\n```javascript\nconst tasks = $input.all();\nreturn\
  \ tasks.filter(item => {\n  const t = item.json;\n  return !t.conditions_3y?.length\
  \ || !t.due || !t.priority;\n});\n```\n\n### Todo\n- [x] docker-compose.yml 작성\n\
  - [x] NAS에 디렉토리 생성 (/volume1/docker/n8n)\n- [x] Docker Compose 배포 (Container Manager\
  \ 또는 SSH)\n- [x] 웹 UI 접근 확인 (https://n8n.sosilab.synology.me)\n- [ ] LOOP API Credentials\
  \ 설정 (Bearer Token)\n- [ ] GET /api/tasks HTTP Request 노드 생성\n- [ ] 빠진 필드 필터 Code\
  \ 노드 생성\n- [ ] OpenAI 노드 설정 (API Key + Prompt)\n- [ ] PUT /api/tasks/{id} HTTP Request\
  \ 노드 생성\n- [ ] 전체 워크플로우 End-to-End 테스트\n- [ ] (Optional) Slack 알림 노드 추가\n\n### 작업\
  \ 로그\n\n#### 2025-12-27 05:15 (NAS 배포 완료)\n**개요**: n8n Docker 컨테이너 NAS 배포 완료. https://n8n.sosilab.synology.me\
  \ 로 접속 가능.\n\n**변경사항**:\n- 추가: `.env` 파일 생성 (N8N_USER, N8N_PASSWORD, N8N_ENCRYPTION_KEY)\n\
  - 배포: NAS에 `/volume1/docker/n8n` 디렉토리 생성 및 권한 설정\n- 배포: `docker-compose up -d n8n`\
  \ 실행\n- 설정: Synology Reverse Proxy에 n8n 서브도메인 추가\n\n**파일 변경**:\n- `docker-compose.yml`\
  \ - n8n 서비스 추가 (codex-claude-loop에서 완료)\n- `.env` - 환경변수 설정 (Basic Auth, Encryption\
  \ Key)\n- `.env.example` - 템플릿 파일\n- `.gitignore` - `.env` 추가 (보안)\n\n**결과**: ✅\
  \ 배포 성공\n- Health Check: `{\"status\":\"ok\"}`\n- URL: https://n8n.sosilab.synology.me\n\
  - Basic Auth: admin / W7SrDxKe7YcXejDX\n\n**다음 단계**:\n1. n8n 초기 계정 설정 완료\n2. LOOP\
  \ API Credentials 설정\n3. Entity Auto-filler 워크플로우 구성\n\n---\n\n#### 2025-12-27 05:00\
  \ (codex-claude-loop)\n**개요**: docker-compose.yml에 n8n 서비스 추가 완료\n\n**변경사항**:\n\
  - 수정: `docker-compose.yml` - n8n 서비스 추가\n- 추가: `.env.example` - n8n 환경변수 템플릿\n\n\
  **Codex 리뷰 반영**:\n- Basic auth 기본값 제거 → `.env` 필수\n- `N8N_ENCRYPTION_KEY` 추가 (credential\
  \ 암호화)\n- `user: \"1000:1000\"` 추가 (비루트 실행)\n- `N8N_SECURE_COOKIE` 제거 (HTTPS 환경에서\
  \ 자동 처리)\n\n**결과**: ✅ docker-compose.yml 준비 완료\n\n**다음 단계**:\n1. NAS에서 `/volume1/docker/n8n`\
  \ 디렉토리 생성\n2. `.env` 파일 생성 (실제 비밀번호 설정)\n3. `docker-compose up -d n8n` 실행\n4. n8n\
  \ GUI에서 워크플로우 구성\n\n---\n\n## 참고 문서\n\n- [[prj-n8n]] - 소속 Project\n\
  - https://docs.n8n.io/ - n8n 공식 문서\n- `api/routers/tasks.py` - LOOP Task API\n\n\
  ---\n\n**Created**: 2025-12-27\n**Assignee**: 김은향\n**Due**: 2025-12-27"
---
# n8n Docker 배포 및 파이프라인 구축

> Task ID: `tsk-n8n-01` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. NAS에 n8n Docker 컨테이너 배포 완료
2. 웹 UI (port 5678) 접근 가능
3. LOOP MCP API 연동 워크플로우 생성
4. 빠진 필드 자동 추론 파이프라인 동작

---

## 상세 내용

### 배경

Task/Project 엔티티에 빠진 필드를 수동으로 채우는 것은 비효율적.
n8n + LLM으로 자동화하여 vault 데이터 품질 향상.

### 작업 내용

1. **n8n Docker 설정**
   - docker-compose.yml 작성
   - 영구 저장 볼륨 설정
   - 환경변수 설정 (timezone 등)

2. **NAS 배포**
   - Container Manager에서 배포
   - 포트 매핑 (5678)
   - 웹 UI 접근 확인

3. **LOOP API 연동**
   - HTTP Request 노드 설정
   - OAuth Bearer 토큰 설정
   - GET /api/tasks 테스트

4. **Auto-fill 파이프라인**
   - Cron 트리거 또는 Manual 트리거
   - 빠진 필드 필터 (conditions_3y, due, priority)
   - OpenAI 노드로 LLM 추론
   - PUT /api/tasks/{id}로 업데이트

---

## 체크리스트

- [x] docker-compose.yml 작성
- [x] NAS Container Manager 배포
- [x] 웹 UI 접근 확인 (port 5678)
- [ ] LOOP API 인증 설정
- [ ] GET /api/tasks 노드 생성
- [ ] 빠진 필드 필터 로직
- [ ] OpenAI 추론 노드
- [ ] PUT /api/tasks 노드
- [ ] 전체 워크플로우 테스트

---

## Notes

### Tech Spec

**인프라**:
- Target: NAS (Synology) Docker 환경
- Container: n8nio/n8n (latest)
- Port: 5678
- Volume: /volume1/docker/n8n/data:/home/node/.n8n

**연동**:
- LOOP MCP API: https://mcp.sosilab.synology.me
- Authentication: OAuth Bearer Token
- AI Provider: OpenAI API (GPT-4)

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - TZ=Asia/Seoul
      - GENERIC_TIMEZONE=Asia/Seoul
      - N8N_SECURE_COOKIE=false
    volumes:
      - ./data:/home/node/.n8n
```

**워크플로우 구조**:
```
Trigger → GET /api/tasks → Filter Missing → Loop → OpenAI Infer → PUT /api/tasks
```

**빠진 필드 감지 로직** (Code 노드):
```javascript
const tasks = $input.all();
return tasks.filter(item => {
  const t = item.json;
  return !t.conditions_3y?.length || !t.due || !t.priority;
});
```

### Todo
- [x] docker-compose.yml 작성
- [x] NAS에 디렉토리 생성 (/volume1/docker/n8n)
- [x] Docker Compose 배포 (Container Manager 또는 SSH)
- [x] 웹 UI 접근 확인 (https://n8n.sosilab.synology.me)
- [ ] LOOP API Credentials 설정 (Bearer Token)
- [ ] GET /api/tasks HTTP Request 노드 생성
- [ ] 빠진 필드 필터 Code 노드 생성
- [ ] OpenAI 노드 설정 (API Key + Prompt)
- [ ] PUT /api/tasks/{id} HTTP Request 노드 생성
- [ ] 전체 워크플로우 End-to-End 테스트
- [ ] (Optional) Slack 알림 노드 추가

### 작업 로그

#### 2025-12-27 05:15 (NAS 배포 완료)
**개요**: n8n Docker 컨테이너 NAS 배포 완료. https://n8n.sosilab.synology.me 로 접속 가능.

**변경사항**:
- 추가: `.env` 파일 생성 (N8N_USER, N8N_PASSWORD, N8N_ENCRYPTION_KEY)
- 배포: NAS에 `/volume1/docker/n8n` 디렉토리 생성 및 권한 설정
- 배포: `docker-compose up -d n8n` 실행
- 설정: Synology Reverse Proxy에 n8n 서브도메인 추가

**파일 변경**:
- `docker-compose.yml` - n8n 서비스 추가 (codex-claude-loop에서 완료)
- `.env` - 환경변수 설정 (Basic Auth, Encryption Key)
- `.env.example` - 템플릿 파일
- `.gitignore` - `.env` 추가 (보안)

**결과**: ✅ 배포 성공
- Health Check: `{"status":"ok"}`
- URL: https://n8n.sosilab.synology.me
- Basic Auth: admin / W7SrDxKe7YcXejDX

**다음 단계**:
1. n8n 초기 계정 설정 완료
2. LOOP API Credentials 설정
3. Entity Auto-filler 워크플로우 구성

---

#### 2025-12-27 05:00 (codex-claude-loop)
**개요**: docker-compose.yml에 n8n 서비스 추가 완료

**변경사항**:
- 수정: `docker-compose.yml` - n8n 서비스 추가
- 추가: `.env.example` - n8n 환경변수 템플릿

**Codex 리뷰 반영**:
- Basic auth 기본값 제거 → `.env` 필수
- `N8N_ENCRYPTION_KEY` 추가 (credential 암호화)
- `user: "1000:1000"` 추가 (비루트 실행)
- `N8N_SECURE_COOKIE` 제거 (HTTPS 환경에서 자동 처리)

**결과**: ✅ docker-compose.yml 준비 완료

**다음 단계**:
1. NAS에서 `/volume1/docker/n8n` 디렉토리 생성
2. `.env` 파일 생성 (실제 비밀번호 설정)
3. `docker-compose up -d n8n` 실행
4. n8n GUI에서 워크플로우 구성

---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- https://docs.n8n.io/ - n8n 공식 문서
- `api/routers/tasks.py` - LOOP Task API

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27