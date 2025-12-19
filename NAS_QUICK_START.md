# Synology NAS 배포 Quick Start

> 5분 안에 칸반 대시보드 배포하기

---

## 🚀 초고속 설정 (복붙용)

### 1단계: SSH 접속

```bash
ssh admin@YOUR_NAS_IP
```

### 2단계: 한방 설치 스크립트 실행

```bash
# 전체 설정 자동화 스크립트
curl -s https://raw.githubusercontent.com/YOUR_ORG/loop_obsidian/main/scripts/nas_install.sh | bash

# 또는 수동 설치 (아래 내용 복사)
```

### 3단계: 수동 설치 (curl 안 되면)

```bash
# 1. 디렉토리 생성
sudo mkdir -p /volume1/vault /volume1/web/kanban /volume1/scripts /volume1/logs
sudo chown $(whoami):users /volume1/vault /volume1/scripts

# 2. Vault clone
cd /volume1/vault
git clone https://github.com/YOUR_ORG/loop_obsidian.git LOOP
cd LOOP

# 3. PyYAML 설치
/volume1/@appstore/py3k/usr/local/bin/python3 -m pip install --user pyyaml

# 4. 배포 스크립트 복사
sudo cp scripts/deploy_to_nas.sh /volume1/scripts/deploy-kanban.sh
sudo chmod +x /volume1/scripts/deploy-kanban.sh

# 5. 첫 배포 실행
sudo /volume1/scripts/deploy-kanban.sh
```

### 4단계: Web Station 설정

**DSM 웹 인터페이스에서**:

1. **패키지 센터** → "Web Station" 설치
2. **Web Station** 열기
3. **웹 서비스 포털** → **가상 호스트 생성**
4. 설정:
   - 포트: `8080`
   - 문서 루트: `/volume1/web/kanban`
   - 클릭: **만들기**

### 5단계: 자동화 설정

**DSM** → **제어판** → **작업 스케줄러**:

1. **생성** → **예약된 작업** → **사용자 정의 스크립트**
2. 일반:
   - 작업 이름: `Kanban Auto Deploy`
   - 사용자: `root`
3. 스케줄:
   - 반복: 15분마다
4. 작업 설정:
   ```bash
   /volume1/scripts/deploy-kanban.sh
   ```
5. **확인** 클릭

---

## ✅ 확인

브라우저에서:
```
http://YOUR_NAS_IP:8080
```

칸반 대시보드가 보이면 성공! 🎉

---

## 🔧 문제 해결

### Dashboard가 안 보여요
```bash
# 로그 확인
tail -50 /volume1/logs/kanban-deploy.log

# 수동 배포
sudo /volume1/scripts/deploy-kanban.sh
```

### 권한 오류
```bash
# 웹 디렉토리 권한 수정
sudo chown -R http:http /volume1/web/kanban
sudo chmod 755 /volume1/web/kanban
sudo chmod 644 /volume1/web/kanban/index.html
```

### Git pull 실패
```bash
cd /volume1/vault/LOOP
git status
git pull origin main

# SSH 키 설정 (Private repo인 경우)
ssh-keygen -t ed25519 -C "nas@loop"
cat ~/.ssh/id_ed25519.pub
# → GitHub에 등록
```

---

## 📚 자세한 가이드

- **전체 매뉴얼**: `NAS_DEPLOYMENT_GUIDE.md`
- **Claude 가이드**: `CLAUDE.md`
- **팀원 가이드**: `SETUP.md`

---

**설정 시간**: 5-10분
**자동화 완료 후**: 관리 불필요
**Last updated**: 2025-12-19
