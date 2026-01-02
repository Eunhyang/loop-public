---
description: Docker 기반 Content OS 서버 관리 (빌드, 재시작, 로그 확인)
---

# Content OS Server 관리 (Docker)

Content OS는 Docker 컨테이너로 NAS에서 실행됩니다.
콘텐츠 파이프라인 및 자동화 서비스를 제공합니다.

## 서버 정보

| 항목 | 값 |
|-----|-----|
| URL | `https://contentos.sosilab.synology.me` |
| 컨테이너 이름 | `content-os` |
| 이미지 이름 | `loop-content-os` |
| 포트 | 8083 (내부 8081) |
| 소스 경로 | `/volume1/LOOP_CORE/vault/LOOP/50_Projects/Content_OS` |

## 사용자 입력

$ARGUMENTS

(status / logs / restart / rebuild / stop)

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
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker ps | grep content-os'
```

### 로그 확인 (logs)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 content-os 2>&1'
```

### 재시작 (restart)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker restart content-os 2>&1'
```

### 재빌드 (rebuild)
코드 변경 후 Docker 이미지를 다시 빌드하고 배포합니다:
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP/50_Projects/Content_OS
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-content-os:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop content-os
/var/packages/ContainerManager/target/usr/bin/docker rm content-os
/var/packages/ContainerManager/target/usr/bin/docker run -d \
  --name content-os \
  --restart unless-stopped \
  -p 8083:8081 \
  -v /volume1/LOOP_CORE/vault/LOOP:/vault:ro \
  -e VAULT_DIR=/vault \
  -e TZ=Asia/Seoul \
  loop-content-os:latest
" 2>&1'
```

### 중지 (stop)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker stop content-os 2>&1'
```

## Health Check
```bash
curl -s -o /dev/null -w "%{http_code}" https://contentos.sosilab.synology.me/health
```

## 관련 파일

| 파일 | 설명 |
|-----|------|
| `50_Projects/Content_OS/Dockerfile` | Docker 이미지 정의 |
| `50_Projects/Content_OS/app/` | FastAPI 앱 소스 |

## 트러블슈팅

### 컨테이너 시작 실패
```bash
# 상세 로그 확인
/content-os-server logs
```

### 접속 오류
1. `/content-os-server status`로 컨테이너 상태 확인
2. 컨테이너가 없으면 `/content-os-server rebuild` 실행
3. Synology Reverse Proxy 설정 확인 (contentos.sosilab.synology.me:443 → localhost:8083)
