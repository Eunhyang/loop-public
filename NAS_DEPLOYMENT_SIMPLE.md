# Synology NAS 칸반 배포 (실시간 버전)

> **현재 상황**: Vault가 이미 NAS에 있고, MacBook에서 마운트하여 사용 중
>
> **목표**: MacBook에서 Dashboard 수정 → 5초 이내 웹 배포

---

## 📊 실제 구조

```
MacBook (Obsidian 작업)
    ↓ AFP 마운트 (/Volumes/LOOP_CORE)
NAS /volume1/LOOP_CORE/vault/LOOP (파일들이 실시간으로 업데이트됨)
    ↓
MacBook: python3 scripts/build_dashboard.py . 실행
    ↓ _dashboard/index.html 생성
NAS 파일 감시 스크립트 (5초마다 체크)
    ↓ Dashboard 발견 시 즉시 복사
/volume1/web/kanban/index.html (웹 배포)
    ↓ Web Station
팀원 브라우저 (http://kkanban.sosilab.synology.me)
```

**핵심**:
- SSH 불필요
- Git pull 불필요
- Dashboard 빌드 후 **5초 이내** 자동 배포

---

## 🚀 빠른 설정 (5분, SSH 불필요)

### 준비물
- ✅ NAS에 vault 마운트되어 있음 (`/volume1/LOOP_CORE`)
- ✅ 스크립트 이미 존재 (`scripts/watch-deploy-simple.sh`)
- ✅ DSM 웹 접근 가능

---

### 1단계: DSM Task Scheduler 설정 (3분)

**DSM 웹 인터페이스** 접속 → **제어판** → **작업 스케줄러**

#### 1-1. 새 작업 생성
1. **생성** 버튼 클릭
2. **트리거된 작업** → **사용자 정의 스크립트** 선택

#### 1-2. 일반 설정
- **작업 이름**: `Kanban File Watch`
- **사용자**: `root` (드롭다운에서 선택)
- **활성화됨**: ✅ 체크

#### 1-3. 스케줄 설정
- **부팅 시 실행** 선택 ✅

#### 1-4. 작업 설정
**사용자 정의 스크립트** 입력란에 다음 복사/붙여넣기:

```bash
nohup /volume1/LOOP_CORE/scripts/watch-deploy-simple.sh > /dev/null 2>&1 &
```

#### 1-5. 저장 및 실행
1. **확인** 클릭
2. 작업 목록에서 "Kanban File Watch" **선택**
3. 상단 **실행** 버튼 클릭
4. 확인 팝업 → **예** 클릭

✅ **완료!** 이제 5초마다 Dashboard를 웹으로 자동 복사합니다.

---

### 2단계: 작동 확인 (2분)

#### 2-1. 로그 확인
**DSM File Station**:
1. `/LOOP_CORE/logs/` 폴더로 이동
2. `kanban-watch-simple.log` 파일 열기
3. 다음 내용이 5초마다 추가되는지 확인:
   ```
   2025-12-19 XX:XX:XX - Dashboard synced to web
   ```

#### 2-2. 실시간 업데이트 테스트
**MacBook에서**:
```bash
cd /Volumes/LOOP_CORE/vault/LOOP
python3 scripts/build_dashboard.py .
```

**5초 대기** → 브라우저에서 대시보드 새로고침

✅ 변경사항이 반영되면 성공!

---

## 🔍 작동 원리

### 실시간 동기화 방식

```bash
# watch-deploy-simple.sh 핵심 로직
while true; do
    sleep 5  # 5초 대기

    # Dashboard 파일이 있으면 웹으로 복사
    if [ -f "$VAULT_DIR/_dashboard/index.html" ]; then
        cp -f "$VAULT_DIR/_dashboard/index.html" "$WEB_DIR/index.html"
    fi
done
```

**특징**:
- ✅ 5초마다 Dashboard 존재 여부 확인
- ✅ 있으면 즉시 웹 디렉토리로 복사
- ✅ Schema 검증 없음 (빠름)
- ✅ Python/YAML 모듈 불필요

---

## 📝 사용 시나리오

### 시나리오 1: Dashboard 업데이트

```
1. MacBook에서 Dashboard 재생성
   cd /Volumes/LOOP_CORE/vault/LOOP
   python3 scripts/build_dashboard.py .

2. 5초 이내 자동 배포
   - NAS 파일 감시 스크립트가 감지
   - 웹 디렉토리로 복사

3. 브라우저 새로고침
   ↓
4. 최신 Dashboard 표시됨 ✅
```

### 시나리오 2: Task 상태 변경

```
1. Obsidian에서 Task 상태 변경: pending → in_progress
   ↓
2. 자동 배포 (15분 이내)
   ↓
3. 칸반 보드에서 카드가 다른 컬럼으로 이동 ✅
```

### 시나리오 3: 급한 업데이트

```
1. MacBook에서 작업 완료
2. NAS SSH 접속:
   ssh admin@nas-ip
3. 수동 실행:
   sudo /volume1/scripts/deploy-kanban.sh
4. 즉시 배포 완료 ✅
```

---

## 🛠️ 관리 및 모니터링

### 로그 확인

```bash
# 최근 배포 내역
tail -50 /volume1/logs/kanban-deploy.log

# 실시간 모니터링
tail -f /volume1/logs/kanban-deploy.log

# 오늘 배포 내역
grep "$(date '+%Y-%m-%d')" /volume1/logs/kanban-deploy.log

# 변경 감지 내역
grep "Detected.*changed" /volume1/logs/kanban-deploy.log
```

### 수동 배포

```bash
# 즉시 배포 (급할 때)
ssh admin@nas-ip
sudo /volume1/scripts/deploy-kanban.sh
```

### 스케줄 확인

**DSM** → **제어판** → **작업 스케줄러**
- "Kanban Auto Deploy" 상태 확인
- 마지막 실행 시간 확인

---

## ❓ 문제 해결

### Dashboard가 업데이트 안 돼요

```bash
# 1. 로그 확인
tail -30 /volume1/logs/kanban-deploy.log

# 2. 마지막 빌드 시간 확인
ls -lh /volume1/logs/.last_kanban_build

# 3. 수동 실행
sudo /volume1/scripts/deploy-kanban.sh

# 4. 변경 감지 강제 리셋
sudo rm /volume1/logs/.last_kanban_build
sudo /volume1/scripts/deploy-kanban.sh
```

### 변경했는데 감지 안 돼요

```bash
# 파일 수정 시간 확인
ls -lt /volume1/vault/LOOP/50_Projects/P*/Tasks/*.md | head -10

# 스크립트 직접 실행하여 디버깅
cd /volume1/vault/LOOP
find 50_Projects -name "*.md" -newer /volume1/logs/.last_kanban_build

# 강제 빌드
sudo rm /volume1/logs/.last_kanban_build
sudo /volume1/scripts/deploy-kanban.sh
```

### 웹 접근이 안 돼요

```bash
# 1. Web Station 상태 확인
# DSM → Web Station → 실행 중?

# 2. 파일 확인
ls -lh /volume1/web/kanban/index.html

# 3. 권한 확인
chmod 644 /volume1/web/kanban/index.html
chown http:http /volume1/web/kanban/index.html

# 4. 포트 확인
netstat -an | grep 8080
```

---

## 🎯 최적화 팁

### 배포 주기 조정

**빠른 업데이트 원하면** (5분마다):
```bash
# 작업 스케줄러에서 주기 변경
*/5 * * * * /volume1/scripts/deploy-kanban.sh
```

**리소스 절약하려면** (30분마다):
```bash
*/30 * * * * /volume1/scripts/deploy-kanban.sh
```

### 특정 폴더만 감지

스크립트 수정 (라인 42):
```bash
# 전체 프로젝트 대신 특정 프로젝트만
CHANGED=$(find "$VAULT_DIR/50_Projects/P001_Ontology" -name "*.md" -newer "$LAST_BUILD_FILE" 2>/dev/null | wc -l)
```

### 알림 추가

스크립트 마지막에 추가:
```bash
# Slack 알림
curl -X POST "https://hooks.slack.com/YOUR_WEBHOOK" \
  -d '{"text":"📊 Dashboard updated!"}'
```

---

## ✅ 완료 체크리스트

### 필수 항목
- [x] NAS에 vault 마운트됨 (`/volume1/LOOP_CORE`)
- [x] MacBook 마운트 확인 (`/Volumes/LOOP_CORE`)
- [x] 파일 감시 스크립트 존재 (`scripts/watch-deploy-simple.sh`)
- [x] DSM Task Scheduler 작업 생성
- [x] 작업 실행 및 로그 확인
- [ ] 웹 접근 확인 (`http://kkanban.sosilab.synology.me`)

### 선택 항목
- [ ] Web Station 가상 호스트 설정
- [ ] 도메인 연결 (QuickConnect 또는 DDNS)
- [ ] HTTPS 인증서 설정

---

## 🎯 최종 요약

### 완료된 작업
1. ✅ **파일 감시 스크립트** 작성 및 배포
2. ✅ **DSM Task Scheduler** 설정 (부팅 시 자동 실행)
3. ✅ **실시간 동기화** 작동 확인 (5초 주기)

### 작동 방식
```
MacBook: Dashboard 빌드
  ↓ (5초 이내)
NAS: 파일 감시 스크립트
  ↓
웹: /volume1/web/kanban/index.html
```

### 사용법
```bash
# MacBook에서 Dashboard 업데이트
cd /Volumes/LOOP_CORE/vault/LOOP
python3 scripts/build_dashboard.py .

# 5초 대기 → 자동 배포 완료
```

---

## 📚 관련 문서

- `CLAUDE.md` - Claude Code 가이드 (NAS 배포 섹션 포함)
- `README.md` - 칸반 대시보드 사용법
- `scripts/build_dashboard.py` - Dashboard 생성 스크립트
- `scripts/watch-deploy-simple.sh` - 파일 감시 스크립트

---

**설정 시간**: 5분 (SSH 불필요)
**업데이트 주기**: 5초 (실시간)
**유지보수**: 없음 (완전 자동화)
**Last updated**: 2025-12-19
**Version**: 3.0 (Real-time)
