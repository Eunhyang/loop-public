# NAS Vault 설정 방식 비교

## 세 가지 옵션

### 옵션 A: Vault를 NAS로 완전 이동 ⭐ (가장 간단)

#### 구조
```
MacBook Obsidian ←─ SMB/NFS 마운트 ─→ NAS (/volume1/vault/LOOP)
                                           │
                                           ├─ Git repo
                                           └─ MkDocs 서버
```

#### 설정 방법

**1. NAS에서**:
```bash
# Vault 생성
cd /volume1/vault
git clone git@github.com:Eunhyang/loop_obsidian.git LOOP
cd LOOP

# Git 설정
git config --local user.name "Team"
git config --local user.email "team@example.com"

# MkDocs 설정
pip3 install mkdocs-material
mkdocs serve -a 0.0.0.0:8000
```

**2. MacBook에서**:
```bash
# NAS 폴더 마운트
# Finder → 이동 → 서버에 연결
# smb://nas-ip/vault

# Obsidian 설정
# 1. Obsidian 열기
# 2. "Open folder as vault"
# 3. /Volumes/vault/LOOP 선택

# Obsidian Git 플러그인 설정
# - Auto pull: 5분마다
# - Auto commit: 10분마다
# - Auto push: 15분마다
```

**3. 팀원도 동일하게**:
- NAS 마운트
- Obsidian에서 열기
- Git 플러그인 설정

#### 장점
- ✅ 가장 간단 (파일이 한 곳)
- ✅ 실시간 동기화
- ✅ NAS가 백업 역할
- ✅ 팀원 모두 같은 원본 접근

#### 단점
- ❌ 네트워크 필수
- ❌ NAS 다운 시 작업 불가
- ❌ Wi-Fi 느리면 Obsidian 느려짐
- ❌ 동시 수정 시 Git 충돌 (수동 해결 필요)

#### 언제 적합?
- 팀원이 항상 사무실/집 (네트워크 연결)
- NAS 성능 좋음 (SSD, 빠른 네트워크)
- 오프라인 작업 거의 없음

---

### 옵션 B: 로컬 Vault + NAS Clone

#### 구조
```
MacBook (/Users/.../LOOP)
   ↓ push
GitHub (git@github.com:Eunhyang/loop_obsidian.git)
   ↑ pull (15분마다)
NAS (/volume1/web/LOOP) → MkDocs
```

#### 설정 방법

**1. MacBook** (현재 상태 유지):
```bash
# 현재 vault 그대로
cd /Users/gim-eunhyang/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/LOOP

# Obsidian Git 플러그인으로 자동 push
```

**2. NAS**:
```bash
cd /volume1/web
git clone git@github.com:Eunhyang/loop_obsidian.git LOOP
cd LOOP

# 자동 pull 스크립트
cat > /volume1/scripts/sync-vault.sh << 'EOF'
#!/bin/bash
cd /volume1/web/LOOP
git pull
mkdocs build
EOF

chmod +x /volume1/scripts/sync-vault.sh

# Cron
crontab -e
*/15 * * * * /volume1/scripts/sync-vault.sh
```

**3. MkDocs**:
```bash
cd /volume1/web/LOOP
mkdocs serve -a 0.0.0.0:8000
```

#### 장점
- ✅ 오프라인 작업 가능
- ✅ 로컬 속도 (빠름)
- ✅ NAS 장애와 무관

#### 단점
- ❌ 파일이 3곳 (로컬, GitHub, NAS)
- ❌ 동기화 지연 (최대 15분)
- ❌ 설정 복잡

#### 언제 적합?
- 외부에서 자주 작업 (카페, 출장)
- NAS 네트워크 불안정
- 혼자 작업 (충돌 거의 없음)

---

### 옵션 C: 하이브리드 (로컬 + NAS Git Remote)

#### 구조
```
MacBook (/Users/.../LOOP)
   ↓ push
GitHub (origin)
   ↓ push
NAS Bare Repo (nas-remote)
   ↓ hook
Working Copy → MkDocs
```

#### 설정 방법

**1. NAS에 Bare Repo 생성**:
```bash
# Git bare repo
cd /volume1/git
git init --bare LOOP.git

# Working copy
cd /volume1/web
git clone /volume1/git/LOOP.git LOOP
cd LOOP
git remote add origin git@github.com:Eunhyang/loop_obsidian.git

# Post-receive hook (자동 deploy)
cat > /volume1/git/LOOP.git/hooks/post-receive << 'EOF'
#!/bin/bash
cd /volume1/web/LOOP
git pull /volume1/git/LOOP.git main
mkdocs build
EOF
chmod +x /volume1/git/LOOP.git/hooks/post-receive
```

**2. MacBook Git Remote 추가**:
```bash
cd /Users/gim-eunhyang/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/LOOP

# NAS를 추가 remote로
git remote add nas ssh://user@nas-ip/volume1/git/LOOP.git

# Push to both
git push origin main
git push nas main

# 또는 자동화
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
git push origin main
git push nas main
EOF
chmod +x .git/hooks/post-commit
```

#### 장점
- ✅ 로컬 작업 (빠름)
- ✅ NAS 즉시 업데이트 (post-receive hook)
- ✅ GitHub 백업 유지
- ✅ 오프라인 가능

#### 단점
- ❌ Git 설정 복잡
- ❌ SSH 키 설정 필요

---

## 추천

### 상황별 추천

| 상황 | 추천 옵션 |
|------|-----------|
| 팀원 2-3명, 사무실 작업 | **옵션 A** (NAS로 이동) |
| 혼자 작업, 외부에서 자주 | **옵션 B** (로컬 + clone) |
| 팀 작업 + 외부 작업 혼합 | **옵션 C** (하이브리드) |

### 현재 상황 (팀원들과 공유)

**추천: 옵션 A (NAS로 완전 이동)**

이유:
1. ✅ 팀원들이 같은 파일 접근
2. ✅ 설정 가장 간단
3. ✅ 실시간 동기화
4. ✅ NAS 칸반 서버와 같은 위치

단, 조건:
- NAS 성능 좋아야 함 (SSD)
- 네트워크 안정적
- 팀원들 주로 사무실/집 작업

---

## 실제 설정 (옵션 A 기준)

### 1. 현재 로컬 vault를 NAS로 이동

```bash
# 1. 현재 vault 백업
cd /Users/gim-eunhyang/Library/Mobile\ Documents/iCloud~md~obsidian/Documents
tar -czf LOOP-backup-$(date +%Y%m%d).tar.gz LOOP

# 2. NAS에 복사 (rsync 추천)
rsync -avz --progress LOOP/ user@nas-ip:/volume1/vault/LOOP/

# 3. NAS에서 Git 확인
ssh user@nas-ip
cd /volume1/vault/LOOP
git status  # 정상이면 OK

# 4. Git remote 확인
git remote -v
# origin  git@github.com:Eunhyang/loop_obsidian.git (fetch)
# origin  git@github.com:Eunhyang/loop_obsidian.git (push)
```

### 2. MacBook Obsidian 설정

```bash
# 1. 기존 로컬 vault 이름 변경 (백업)
cd /Users/gim-eunhyang/Library/Mobile\ Documents/iCloud~md~obsidian/Documents
mv LOOP LOOP-old

# 2. NAS 마운트
# Finder → Cmd+K → smb://nas-ip/vault

# 3. Obsidian 재설정
# - Settings → Vault → Remove "LOOP"
# - Open folder as vault → /Volumes/vault/LOOP
```

### 3. Obsidian Git 플러그인 설정

```
Settings → Obsidian Git:
- Auto pull: 5분
- Auto commit: 10분
- Auto push: 15분
- Pull before push: ✅
```

### 4. NAS MkDocs 서버

```bash
ssh user@nas-ip

# 1. MkDocs 설정
cd /volume1/vault/LOOP
pip3 install mkdocs-material

# 2. mkdocs.yml 생성 (이미 있음)

# 3. 서버 실행 (systemd 또는 docker)
mkdocs serve -a 0.0.0.0:8000

# 또는 Docker
docker run -d \
  -v /volume1/vault/LOOP:/docs \
  -p 8000:8000 \
  --name mkdocs \
  squidfunk/mkdocs-material
```

### 5. 팀원 설정

**각 팀원 MacBook에서**:
```bash
# 1. NAS 마운트
# Finder → Cmd+K → smb://nas-ip/vault

# 2. Obsidian vault 추가
# Open folder as vault → /Volumes/vault/LOOP

# 3. Git 플러그인 설정
# (같은 설정)
```

---

## Git 충돌 방지 규칙 (옵션 A 사용 시 중요!)

| 규칙 | 설명 |
|------|------|
| ✅ 수정 전 Pull | 항상 최신 상태에서 시작 |
| ✅ 자기 파일만 수정 | Task assignee 확인 |
| ✅ 작은 단위 Commit | 자주 commit & push |
| ✅ 충돌 시 즉시 해결 | 방치하지 말 것 |
| ⚠️ 같은 파일 동시 수정 주의 | Slack 등으로 소통 |

---

**Last updated**: 2025-12-19
