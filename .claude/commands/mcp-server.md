---
description: Docker 기반 MCP 서버 관리 (빌드, 재시작, 로그 확인)
model: haiku
---

# MCP Server 관리 (Docker)

MCP(Model Context Protocol) 서버는 Docker 컨테이너로 NAS에서 실행됩니다.
ChatGPT Developer Mode에서 LOOP Vault 데이터에 접근할 수 있게 해줍니다.

## 서버 정보

| 항목 | 값 |
|-----|-----|
| URL | `https://mcp.sosilab.synology.me` |
| MCP 엔드포인트 | `https://mcp.sosilab.synology.me/mcp` |
| 컨테이너 | `loop-api` (API + MCP + OAuth) |
| 포트 | 8082 → 8081 |
| Python | 3.11 (Docker) |

### 아키텍처
```
loop-api (8082) ─── API + MCP + OAuth
                     - Vault 접근
                     - OAuth (/authorize, /token, /register)
                     - 키/DB는 볼륨에 영구 저장
```

**세션 유지**: OAuth 키/DB가 `/api/oauth/` 볼륨에 저장 → rebuild해도 인증 세션 유지

## 사용자 입력

$ARGUMENTS

(rebuild / restart / logs / status / stop)

## 실행 절차

### [rebuild 전] 자동 동기화 (rebuild 명령 시 필수)

rebuild 실행 전에 **`/nas-git local-sync`를 자동으로 먼저 실행**합니다.
이렇게 하면 로컬 변경사항이 NAS에 반영된 후 rebuild가 진행됩니다.

**실행 순서:**
1. `/nas-git local-sync` 실행 (로컬 → GitHub → NAS 동기화)
2. 동기화 완료 후 rebuild 진행

> **주의**: rebuild 명령어 입력 시 Claude가 자동으로 `/nas-git local-sync`를 먼저 실행합니다.
> 별도로 sync를 실행할 필요가 없습니다.

---

### 상태 확인 (status)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker ps | grep loop-api'
```

### 로그 확인 (logs)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 loop-api 2>&1'
```

### 재시작 (restart)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker restart loop-api 2>&1'
```

### 재빌드 (rebuild)
loop-api를 재빌드합니다 (OAuth 키/DB는 볼륨에 보존되어 인증 세션 유지):
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
# .env 파일에서 API 키 로드
source /volume1/LOOP_CORE/vault/LOOP/.env 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-api:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop loop-api
/var/packages/ContainerManager/target/usr/bin/docker rm loop-api
/var/packages/ContainerManager/target/usr/bin/docker run -d --name loop-api --restart unless-stopped -p 8082:8081 -v /volume1/LOOP_CORE/vault/LOOP:/vault:rw -v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:rw -v /volume1/LOOP_CORE/vault/LOOP/api/oauth:/app/api/oauth:rw -e VAULT_DIR=/vault -e EXEC_VAULT_DIR=/vault/exec -e OAUTH_ISSUER=https://mcp.sosilab.synology.me -e TZ=Asia/Seoul -e OPENAI_API_KEY=\$OPENAI_API_KEY -e ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY loop-api:latest
" 2>&1'
```

### 전체 재빌드 (rebuild-all)
OAuth 키/DB를 포함하여 완전히 새로 시작합니다 (인증 세션 초기화됨):
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
source /volume1/LOOP_CORE/vault/LOOP/.env 2>/dev/null || true

# OAuth 키/DB 초기화 (새 키 생성됨 - 기존 토큰 무효화)
rm -rf /volume1/LOOP_CORE/vault/LOOP/api/oauth/keys
rm -f /volume1/LOOP_CORE/vault/LOOP/api/oauth/oauth.db

# loop-api 빌드 및 실행
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-api:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop loop-api 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker rm loop-api 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker run -d --name loop-api --restart unless-stopped -p 8082:8081 -v /volume1/LOOP_CORE/vault/LOOP:/vault:rw -v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:rw -v /volume1/LOOP_CORE/vault/LOOP/api/oauth:/app/api/oauth:rw -e VAULT_DIR=/vault -e EXEC_VAULT_DIR=/vault/exec -e OAUTH_ISSUER=https://mcp.sosilab.synology.me -e TZ=Asia/Seoul -e OPENAI_API_KEY=\$OPENAI_API_KEY -e ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY loop-api:latest
" 2>&1'
```

> **볼륨 마운트 설명**:
> - `/volume1/LOOP_CORE/vault/LOOP:/vault:rw` - LOOP vault (읽기/쓰기)
> - `/volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:rw` - loop_exec vault (읽기/쓰기, Dashboard 수정 허용)
> - `/volume1/LOOP_CORE/vault/LOOP/api/oauth:/app/api/oauth:rw` - OAuth 키/DB (영구 저장)

### 중지 (stop)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker stop loop-api 2>&1'
```

## Health Check
```bash
curl -s https://mcp.sosilab.synology.me/health | python3 -m json.tool
```

## MCP 엔드포인트 테스트
```bash
curl -s -m 3 https://mcp.sosilab.synology.me/mcp
# 정상 응답: event: endpoint, data: /mcp/messages/?session_id=...
```

## 관련 파일

| 파일 | 설명 |
|-----|------|
| `Dockerfile` | Docker 이미지 정의 (Python 3.11 + FastAPI + MCP) |
| `docker-compose.yml` | 컨테이너 구성 (참고용) |
| `api/main.py` | FastAPI 앱 + MCP 마운트 |
| `api/models/entities.py` | Pydantic 모델 (OpenAPI 스키마) |

## 트러블슈팅

### ChatGPT 연결 오류
1. `curl https://mcp.sosilab.synology.me/mcp` 로 SSE 응답 확인
2. OpenAPI 스키마 오류 시 `api/models/entities.py` 확인
3. 재빌드 후 다시 시도

### 컨테이너 시작 실패
```bash
# 상세 로그 확인
docker logs loop-api 2>&1 | tail -50
```
