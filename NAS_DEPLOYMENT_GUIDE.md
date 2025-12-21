# Synology NAS 칸반 대시보드 배포 가이드

> 완전 자동화 배포 시스템 (사내 전용)

**목표**: Git push → 자동 pull → Dashboard 재생성 → 웹 서빙

---

## 📋 시스템 구조

```
MacBook (Obsidian + Git)
    ↓ git push
GitHub Repository
    ↓ git pull (15분마다)
Synology NAS (/volume1/vault/LOOP)
    ↓ build_dashboard.py
Dashboard HTML (/volume1/web/kanban/)
    ↓ Web Station
http://nas-ip/kanban/ (팀 접근)
```

---

## 🚀 Phase 1: 초기 설정 (1회만)

### 1.1 Synology 패키지 설치

**DSM 관리 페이지 접속** → 패키지 센터

필수 패키지:
- ✅ **Web Station** - 웹 서버
- ✅ **Git Server** (선택) - Git 저장소 호스팅
- ✅ **Python 3.9** - 스크립트 실행
- ✅ **Text Editor** - 스크립트 편집

설치 방법:
1. 패키지 센터 열기
2. 검색: "Web Station"
3. 설치 클릭
4. Python 3.9도 동일하게 설치

### 1.2 SSH 접속 활성화

**제어판** → **터미널 및 SNMP** → **터미널 탭**
- ✅ SSH 서비스 활성화
- 포트: 22 (기본값)

### 1.3 Python 환경 설정

SSH로 NAS 접속:
```bash
ssh admin@nas-ip
# 또는 your-username@nas-ip
```

PyYAML 설치:
```bash
# Python 3.9 경로 확인
which python3
# /volume1/@appstore/py3k/usr/local/bin/python3

# PyYAML 설치
sudo /volume1/@appstore/py3k/usr/local/bin/python3 -m pip install pyyaml

# 또는
python3 -m pip install --user pyyaml
```

---

## 🔧 Phase 2: Vault 설정

### 2.1 Vault Clone

```bash
# 작업 디렉토리 생성
sudo mkdir -p /volume1/vault
sudo chown $(whoami):users /volume1/vault
cd /volume1/vault

# Git Clone
git clone git@github.com:Eunhyang/loop_obsidian.git LOOP
# 또는 HTTPS
git clone https-//github.com/Eunhyang/loop_obsidian.git LOOP

cd LOOP
```

### 2.2 Git 자격 증명 설정

```bash
cd /volume1/vault/LOOP

# Git 사용자 설정
git config --local user.name "LOOP Team"
git config --local user.email "team@example.com"

# SSH 키 설정 (Private Repo인 경우)
# 1. SSH 키 생성
ssh-keygen -t ed25519 -C "nas@loop-team"
# 저장 위치: /root/.ssh/id_ed25519

# 2. Public key를 GitHub에 등록
cat /root/.ssh/id_ed25519.pub
# GitHub → Settings → SSH keys → New SSH key

# 3. SSH 연결 테스트
ssh -T git@github.com
```

### 2.3 첫 빌드 테스트

```bash
cd /volume1/vault/LOOP

# Schema 검증
python3 scripts/validate_schema.py .

# Dashboard 생성
python3 scripts/build_dashboard.py .

# 생성 확인
ls -lh _dashboard/index.html
# -rw-r--r-- 1 root root 38K Dec 19 13:24 _dashboard/index.html
```

---

## 🌐 Phase 3: Web Station 설정

### 3.1 웹 루트 폴더 생성

```bash
# 웹 서비스 폴더 생성
sudo mkdir -p /volume1/web/kanban
sudo chown http:http /volume1/web/kanban
```

### 3.2 Web Station 가상 호스트 설정

**DSM** → **Web Station** → **웹 서비스 포털**

1. **가상 호스트 생성** 클릭
2. 설정:
   - **호스트 이름**: `kanban.local` (또는 비워두기)
   - **포트**: `8080` (HTTP)
   - **문서 루트**: `/volume1/web/kanban`
   - **백엔드 서버**: PHP 없음 (정적 HTML)
   - **HTTP 백엔드 서버**: 없음

3. **만들기** 클릭

### 3.3 접근 테스트

브라우저에서:
```
http://nas-ip:8080
```

빈 페이지가 뜨면 성공 (아직 파일이 없음)

---

## ⚙️ Phase 4: 자동 배포 스크립트

### 4.1 배포 스크립트 생성

```bash
# 스크립트 디렉토리 생성
sudo mkdir -p /volume1/scripts
cd /volume1/scripts

# 배포 스크립트 작성
sudo nano deploy-kanban.sh
```

**스크립트 내용**:
```bash
#!/bin/bash
# LOOP Kanban Auto Deploy Script
# Synology NAS Optimized

set -e  # 오류 시 중단

# 설정
VAULT_DIR="/volume1/vault/LOOP"
WEB_DIR="/volume1/web/kanban"
LOG_FILE="/volume1/logs/kanban-deploy.log"
PYTHON="/volume1/@appstore/py3k/usr/local/bin/python3"

# 로그 디렉토리 생성
mkdir -p /volume1/logs

# 로그 시작
echo "========================================" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Deploy started" >> "$LOG_FILE"

# 1. Git Pull
cd "$VAULT_DIR"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Pulling from GitHub..." >> "$LOG_FILE"
git fetch origin main >> "$LOG_FILE" 2>&1

# 변경사항 확인
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - No changes detected. Skipping." >> "$LOG_FILE"
    exit 0
fi

# Pull
git pull origin main >> "$LOG_FILE" 2>&1
echo "$(date '+%Y-%m-%d %H:%M:%S') - Pull completed" >> "$LOG_FILE"

# 2. Schema 검증
echo "$(date '+%Y-%m-%d %H:%M:%S') - Validating schema..." >> "$LOG_FILE"
$PYTHON scripts/validate_schema.py . >> "$LOG_FILE" 2>&1

# 3. Dashboard 재생성
echo "$(date '+%Y-%m-%d %H:%M:%S') - Building dashboard..." >> "$LOG_FILE"
$PYTHON scripts/build_dashboard.py . >> "$LOG_FILE" 2>&1

# 4. 웹 디렉토리로 복사
echo "$(date '+%Y-%m-%d %H:%M:%S') - Deploying to web..." >> "$LOG_FILE"
cp -f _dashboard/index.html "$WEB_DIR/index.html"
chmod 644 "$WEB_DIR/index.html"
chown http:http "$WEB_DIR/index.html"

# 5. 완료
echo "$(date '+%Y-%m-%d %H:%M:%S') - Deploy completed successfully!" >> "$LOG_FILE"
echo "Dashboard URL: http://$(hostname):8080" >> "$LOG_FILE"
```

**실행 권한 부여**:
```bash
sudo chmod +x /volume1/scripts/deploy-kanban.sh

# 테스트 실행
sudo /volume1/scripts/deploy-kanban.sh

# 로그 확인
tail -f /volume1/logs/kanban-deploy.log
```

---

## 🕐 Phase 5: 자동화 스케줄링

### 5.1 작업 스케줄러 설정

**DSM** → **제어판** → **작업 스케줄러**

1. **생성** → **예약된 작업** → **사용자 정의 스크립트**

2. 일반 설정:
   - **작업 이름**: `LOOP Kanban Auto Deploy`
   - **사용자**: `root`
   - **활성화**: ✅

3. 스케줄 설정:
   - **날짜 실행**: 매일
   - **시간**: 반복
   - **빈도**: 15분마다
   - **첫 실행 시간**: 00:00
   - **마지막 실행 시간**: 23:45

4. 작업 설정:
   - **사용자 정의 스크립트**:
   ```bash
   /volume1/scripts/deploy-kanban.sh
   ```

5. **확인** 클릭

### 5.2 즉시 실행 테스트

작업 스케줄러에서:
1. 방금 만든 작업 선택
2. **실행** 버튼 클릭
3. 로그 확인:
   ```bash
   tail -20 /volume1/logs/kanban-deploy.log
   ```

---

## 🎯 Phase 6: 접근 및 사용

### 6.1 팀원 접근 방법

**브라우저 북마크 추가**:
```
http://nas-ip:8080
또는
http://nas-hostname.local:8080
```

### 6.2 업데이트 흐름

```
1. MacBook에서 작업 (Obsidian)
   ↓
2. Git commit & push
   ↓
3. 15분 이내 자동 배포 (NAS)
   ↓
4. 브라우저 새로고침 (F5)
   ↓
5. 최신 칸반 보드 확인 ✅
```

### 6.3 수동 업데이트 (급할 때)

SSH로 NAS 접속:
```bash
ssh admin@nas-ip
sudo /volume1/scripts/deploy-kanban.sh
```

---

## 🔍 모니터링 및 유지보수

### 로그 확인

```bash
# 최근 배포 로그
tail -50 /volume1/logs/kanban-deploy.log

# 실시간 모니터링
tail -f /volume1/logs/kanban-deploy.log

# 오늘 배포 내역
grep "$(date '+%Y-%m-%d')" /volume1/logs/kanban-deploy.log

# 오류만 필터링
grep "error\|Error\|ERROR\|failed" /volume1/logs/kanban-deploy.log
```

### 로그 로테이션 (선택)

로그 파일이 너무 커지는 것 방지:
```bash
# /volume1/scripts/rotate-logs.sh
#!/bin/bash
LOG_FILE="/volume1/logs/kanban-deploy.log"
MAX_SIZE=10485760  # 10MB

if [ -f "$LOG_FILE" ]; then
    SIZE=$(stat -f%z "$LOG_FILE")
    if [ $SIZE -gt $MAX_SIZE ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
        touch "$LOG_FILE"
        echo "$(date) - Log rotated" >> "$LOG_FILE"
    fi
fi
```

작업 스케줄러에 주간 실행 추가

---

## 🛠️ 문제 해결

### 문제 1: Dashboard가 업데이트 안 됨

**확인 사항**:
```bash
# 1. 작업 스케줄러 실행 여부
# DSM → 작업 스케줄러 → 상태 확인

# 2. Git pull 상태
cd /volume1/vault/LOOP
git status
git log -1

# 3. 로그 확인
tail -30 /volume1/logs/kanban-deploy.log

# 4. 수동 실행
sudo /volume1/scripts/deploy-kanban.sh
```

### 문제 2: Python 스크립트 오류

```bash
# PyYAML 설치 확인
python3 -c "import yaml; print(yaml.__version__)"

# 재설치
python3 -m pip install --upgrade pyyaml

# 스크립트 직접 실행
cd /volume1/vault/LOOP
python3 scripts/build_dashboard.py .
```

### 문제 3: 웹 접근 안 됨

```bash
# 1. Web Station 상태 확인
# DSM → Web Station → 실행 중 확인

# 2. 파일 권한 확인
ls -la /volume1/web/kanban/
# -rw-r--r-- 1 http http ... index.html

# 3. 방화벽 확인
# DSM → 제어판 → 보안 → 방화벽
# 포트 8080 허용 확인
```

### 문제 4: Git 인증 실패

```bash
# SSH 키 재설정
ssh-keygen -t ed25519 -C "nas@loop-team"
cat ~/.ssh/id_ed25519.pub
# GitHub에 등록

# HTTPS 사용 시 credential helper
git config --global credential.helper store
git pull  # 한 번 인증하면 저장됨
```

---

## 📊 고급 기능 (선택)

### 옵션 1: 실시간 알림 (Slack/Email)

배포 스크립트에 추가:
```bash
# Slack 알림
SLACK_WEBHOOK="https-//hooks.slack.com/services/YOUR/WEBHOOK/URL"

curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"📊 Kanban dashboard updated at $(date)\"}"
```

### 옵션 2: 여러 대시보드 서빙

```bash
# 프로젝트별 대시보드
/volume1/web/kanban/index.html       # 전체
/volume1/web/kanban/ontology.html    # Ontology 프로젝트만
/volume1/web/kanban/strategy.html    # 전략만

# build_dashboard.py 수정하여 여러 HTML 생성
```

### 옵션 3: HTTPS 설정

**DSM** → **제어판** → **보안** → **인증서**
1. Let's Encrypt 인증서 생성
2. Web Station에 적용
3. `http://` → `https-//` 접근

---

## ✅ 체크리스트

### 초기 설정
- [ ] Synology 패키지 설치 (Web Station, Python 3.9)
- [ ] SSH 활성화
- [ ] PyYAML 설치
- [ ] Vault clone (/volume1/vault/LOOP)
- [ ] Git 자격 증명 설정
- [ ] 첫 빌드 테스트

### 웹 서버 설정
- [ ] 웹 디렉토리 생성 (/volume1/web/kanban)
- [ ] Web Station 가상 호스트 설정
- [ ] 포트 8080 접근 테스트

### 자동화 설정
- [ ] 배포 스크립트 작성 (/volume1/scripts/deploy-kanban.sh)
- [ ] 실행 권한 부여
- [ ] 작업 스케줄러 등록 (15분마다)
- [ ] 즉시 실행 테스트
- [ ] 로그 확인

### 팀 온보딩
- [ ] 팀원들에게 URL 공유
- [ ] 북마크 등록 안내
- [ ] 업데이트 주기 안내 (15분)

---

## 📝 유지보수 일정

| 주기 | 작업 | 담당자 |
|------|------|--------|
| 매일 | 자동 배포 모니터링 (로그 확인) | 자동 |
| 주간 | 로그 파일 확인 | 운영자 |
| 월간 | PyYAML 업데이트 확인 | 운영자 |
| 분기 | Git 저장소 정리 | 운영자 |

---

## 🎓 참고 자료

**Synology 공식 문서**:
- [Web Station 사용 설명서](https-//kb.synology.com/DSM/help/WebStation)
- [Python Package 설치](https-//kb.synology.com/DSM/tutorial/How_to_install_Python_and_run_Python_scripts)
- [작업 스케줄러](https-//kb.synology.com/DSM/help/DSM/AdminCenter/system_taskscheduler)

**내부 문서**:
- `CLAUDE.md` - Claude Code 가이드
- `SETUP.md` - 팀원 온보딩 가이드
- `nas-kanban-setup.md` - 배포 옵션 비교
- `scripts/build_dashboard.py` - Dashboard 생성 스크립트

---

**Last updated**: 2025-12-19
**Version**: 1.0
**Author**: LOOP Team
**Status**: Production Ready ✅
