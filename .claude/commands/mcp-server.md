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
| 컨테이너 이름 | `loop-api` |
| 포트 | 8082 (내부 8081) |
| Python | 3.11 (Docker) |

## 사용자 입력

$ARGUMENTS

(rebuild / restart / logs / status / stop)

## 실행 절차

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
코드 변경 후 Docker 이미지를 다시 빌드하고 배포합니다:
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-api:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop loop-api
/var/packages/ContainerManager/target/usr/bin/docker rm loop-api
/var/packages/ContainerManager/target/usr/bin/docker run -d --name loop-api --restart unless-stopped -p 8082:8081 -v /volume1/LOOP_CORE/vault/LOOP:/vault:rw -v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:ro -e VAULT_DIR=/vault -e EXEC_VAULT_DIR=/vault/exec -e OAUTH_DB_PATH=/vault/api/oauth/oauth.db -e TZ=Asia/Seoul loop-api:latest
" 2>&1'
```

> **볼륨 마운트 설명**:
> - `/volume1/LOOP_CORE/vault/LOOP:/vault:rw` - LOOP vault (읽기/쓰기)
> - `/volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:ro` - loop_exec vault (읽기 전용, RBAC 보호)

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
