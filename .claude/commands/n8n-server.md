---
description: Docker 기반 n8n 서버 관리 (재시작, 로그 확인, 환경변수 설정)
---

# n8n Server 관리 (Docker)

n8n 워크플로우 자동화 서버는 Docker 컨테이너로 NAS에서 실행됩니다.

## 서버 정보

| 항목 | 값 |
|-----|-----|
| URL | `https://n8n.sosilab.synology.me` |
| 컨테이너 이름 | `n8n` |
| 포트 | 5678 |
| 데이터 경로 | `/volume1/docker/n8n` |

## 사용자 입력

$ARGUMENTS

(status / logs / restart / rebuild / stop / env)

## 실행 절차

### 상태 확인 (status)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker ps | grep n8n'
```

### 로그 확인 (logs)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 n8n 2>&1'
```

### 재시작 (restart)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker restart n8n 2>&1'
```

### 환경변수 확인 (env)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker inspect n8n --format="{{range .Config.Env}}{{println .}}{{end}}" 2>&1'
```

### 재빌드 (rebuild) - WebSocket 문제 해결용 환경변수 포함
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
/var/packages/ContainerManager/target/usr/bin/docker stop n8n
/var/packages/ContainerManager/target/usr/bin/docker rm n8n
/var/packages/ContainerManager/target/usr/bin/docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -v /volume1/docker/n8n:/home/node/.n8n \
  -e N8N_PUSH_BACKEND=sse \
  -e N8N_EDITOR_BASE_URL=https://n8n.sosilab.synology.me \
  -e WEBHOOK_URL=https://n8n.sosilab.synology.me \
  -e N8N_PROTOCOL=https \
  -e N8N_PROXY_HOPS=1 \
  -e GENERIC_TIMEZONE=Asia/Seoul \
  -e TZ=Asia/Seoul \
  n8nio/n8n:latest
" 2>&1'
```

### 중지 (stop)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker stop n8n 2>&1'
```

## Health Check
```bash
curl -s -o /dev/null -w "%{http_code}" https://n8n.sosilab.synology.me/healthz
```

## 환경변수 설명

| 변수 | 값 | 설명 |
|-----|-----|------|
| `N8N_PUSH_BACKEND` | `sse` | WebSocket 대신 SSE 사용 (프록시 호환) |
| `N8N_EDITOR_BASE_URL` | `https://n8n.sosilab.synology.me` | 에디터 기본 URL |
| `WEBHOOK_URL` | `https://n8n.sosilab.synology.me` | 웹훅 기본 URL |
| `N8N_PROTOCOL` | `https` | HTTPS 프로토콜 사용 |
| `N8N_PROXY_HOPS` | `1` | 리버스 프록시 홉 수 |
| `LOOP_API_TOKEN` | `loop_2024_kanban_secret` | LOOP API 인증 (Docker 환경변수) |

## LOOP API Credential 설정 (CRITICAL)

> **워크플로우에서 LOOP API 호출 시 반드시 Credential 연결 필요**

| Credential 이름 | 타입 | 헤더 | 값 |
|----------------|------|------|-----|
| `LOOP API Token` | Header Auth | `x-api-token` | `loop_2024_kanban_secret` |

### 워크플로우 설정 방법

1. **HTTP Request 노드** 열기
2. **Authentication**: `Predefined Credential Type` 선택
3. **Credential Type**: `Header Auth`
4. **Header Auth**: `LOOP API Token` 선택

### 주의사항

- 워크플로우 JSON import 시 Credential 자동 연결 안 됨
- 반드시 import 후 수동으로 Credential 연결 필요
- Docker 환경변수 `LOOP_API_TOKEN`과 n8n Credential은 별개

## 트러블슈팅

### "Connection issue or server is down" 오류
1. `/n8n-server env`로 환경변수 확인
2. `N8N_PUSH_BACKEND=sse` 없으면 `/n8n-server rebuild` 실행
3. 브라우저 하드 리프레시 (Cmd+Shift+R)

### 컨테이너 시작 실패
```bash
# 상세 로그 확인
/n8n-server logs
```

## 관련 파일

| 파일 | 설명 |
|-----|------|
| `_build/n8n_workflows/` | 워크플로우 JSON 파일들 |
| `api/routers/pending.py` | Pending Review API (n8n 연동) |
