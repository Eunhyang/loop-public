---
description: Docker 기반 MCP 서버 관리 (빌드, 재시작, 로그 확인)
---

# MCP Server 관리 (Docker)

MCP(Model Context Protocol) 서버는 Docker 컨테이너로 NAS에서 실행됩니다.
ChatGPT Developer Mode에서 LOOP Vault 데이터에 접근할 수 있게 해줍니다.

## 서버 정보

| 항목 | 값 |
|-----|-----|
| URL | `https://mcp.sosilab.synology.me` |
| MCP 엔드포인트 | `https://mcp.sosilab.synology.me/mcp` |
| 컨테이너 | `loop-api` (API+MCP), `loop-auth` (OAuth) |
| 포트 | loop-api: 8082→8081, loop-auth: 8084→8083 |
| Python | 3.11 (Docker) |

### 아키텍처
```
loop-auth (8084) ─── OAuth 인증 (독립 컨테이너)
      │                - /authorize, /token, /register
      │                - SQLite DB, RSA keys
      ↓
loop-api (8082) ─── API + MCP (JWT 검증만)
                     - Vault 접근
                     - JWKS_URL로 loop-auth에서 공개키 fetch
```

**장점**: loop-api rebuild 시에도 인증 세션 유지 (재로그인 불필요)

## 사용자 입력

$ARGUMENTS

(rebuild / restart / logs / status / stop)

## 실행 절차

### [rebuild 전] 로컬 변경사항 확인 (rebuild 명령 시에만)

rebuild 실행 전에 로컬에 커밋되지 않은 변경사항이 있는지 확인합니다.
변경사항이 있으면 NAS에 반영되지 않은 상태이므로 sync 먼저 실행할지 물어봅니다.

```bash
cd ~/dev/loop/public && git status --short
```

변경사항이 있으면 사용자에게 질문:
> "로컬에 변경사항이 있습니다. NAS에 먼저 동기화할까요? (git push → NAS sync)"

**Yes인 경우:**
1. 로컬에서 커밋 & push:
```bash
cd ~/dev/loop/public && git add -A && git commit -m "chore: sync before rebuild" && git push origin main
```

2. NAS에서 pull:
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
echo "Dkssud272902*" | sudo -S /volume1/LOOP_CORE/vault/LOOP/scripts/nas-git-sync.sh 2>&1
'
```

3. 그 다음 rebuild 진행

---

### 상태 확인 (status)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker ps | grep -E "loop-api|loop-auth"'
```

### 로그 확인 (logs)
```bash
# loop-api 로그
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 loop-api 2>&1'

# loop-auth 로그
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 loop-auth 2>&1'
```

### 재시작 (restart)
```bash
# loop-api만 재시작 (인증 세션 유지)
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker restart loop-api 2>&1'
```

### 재빌드 (rebuild)
loop-api만 재빌드합니다 (loop-auth는 유지되어 인증 세션 보존):
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
# .env 파일에서 API 키 로드
source /volume1/LOOP_CORE/vault/LOOP/.env 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-api:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop loop-api
/var/packages/ContainerManager/target/usr/bin/docker rm loop-api
/var/packages/ContainerManager/target/usr/bin/docker run -d --name loop-api --restart unless-stopped -p 8082:8081 -v /volume1/LOOP_CORE/vault/LOOP:/vault:rw -v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:ro -v /volume1/LOOP_CORE/vault/LOOP/api/oauth/keys:/app/api/oauth/keys:ro -e VAULT_DIR=/vault -e EXEC_VAULT_DIR=/vault/exec -e JWKS_URL=http://loop-auth:8083/.well-known/jwks.json -e OAUTH_ISSUER=https://mcp.sosilab.synology.me -e TZ=Asia/Seoul -e OPENAI_API_KEY=\$OPENAI_API_KEY -e ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY --link loop-auth:loop-auth loop-api:latest
" 2>&1'
```

### 전체 재빌드 (rebuild-all)
loop-auth와 loop-api 모두 재빌드합니다 (인증 세션 초기화됨):
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
source /volume1/LOOP_CORE/vault/LOOP/.env 2>/dev/null || true

# loop-auth 빌드 및 실행
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-auth:latest -f Dockerfile.auth .
/var/packages/ContainerManager/target/usr/bin/docker stop loop-auth 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker rm loop-auth 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker run -d --name loop-auth --restart unless-stopped -p 8084:8083 -v /volume1/LOOP_CORE/vault/LOOP/api/oauth:/app/api/oauth:rw -e OAUTH_DB_PATH=/app/api/oauth/oauth.db -e OAUTH_KEYS_DIR=/app/api/oauth/keys -e OAUTH_ISSUER=https://mcp.sosilab.synology.me -e TOKEN_EXPIRE_HOURS=720 -e TZ=Asia/Seoul loop-auth:latest

# loop-auth 시작 대기
sleep 5

# loop-api 빌드 및 실행
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-api:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop loop-api 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker rm loop-api 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker run -d --name loop-api --restart unless-stopped -p 8082:8081 -v /volume1/LOOP_CORE/vault/LOOP:/vault:rw -v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:ro -v /volume1/LOOP_CORE/vault/LOOP/api/oauth/keys:/app/api/oauth/keys:ro -e VAULT_DIR=/vault -e EXEC_VAULT_DIR=/vault/exec -e JWKS_URL=http://loop-auth:8083/.well-known/jwks.json -e OAUTH_ISSUER=https://mcp.sosilab.synology.me -e TZ=Asia/Seoul -e OPENAI_API_KEY=\$OPENAI_API_KEY -e ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY --link loop-auth:loop-auth loop-api:latest
" 2>&1'
```

> **볼륨 마운트 설명**:
> - `/volume1/LOOP_CORE/vault/LOOP:/vault:rw` - LOOP vault (읽기/쓰기)
> - `/volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:ro` - loop_exec vault (읽기 전용, RBAC 보호)
> - `/volume1/LOOP_CORE/vault/LOOP/api/oauth/keys:/app/api/oauth/keys:ro` - RSA keys (JWT 검증용)

### 중지 (stop)
```bash
# loop-api만 중지
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker stop loop-api 2>&1'

# 전체 중지
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "/var/packages/ContainerManager/target/usr/bin/docker stop loop-api loop-auth" 2>&1'
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
