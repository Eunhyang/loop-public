# NAS 배포 (SSH 없이 GUI만으로)

> Finder + DSM 웹 인터페이스로 완전 설정

---

## ✅ 현재 상황

- Vault가 이미 NAS에 마운트됨: `/Volumes/LOOP_CORE/vault/LOOP`
- NAS 실제 경로: `/volume1/vault/LOOP`
- MacBook에서 Obsidian으로 작업 중

**목표**: SSH 한 번도 안 쓰고 칸반 배포하기!

---

## 🖥️ 전체 과정 (GUI만 사용)

### Step 1: 폴더 생성 (DSM File Station)

1. 브라우저에서 DSM 접속: `http://YOUR_NAS_IP:5000`
2. 로그인
3. **File Station** 앱 열기
4. 왼쪽에서 `volume1` 선택
5. 다음 폴더들 생성 (없으면):
   - `scripts`
   - `logs`
   - `web` → 하위에 `kanban` 폴더

결과:
```
volume1/
├─ vault/
│  └─ LOOP/  (이미 있음)
├─ scripts/  (새로 만듦)
├─ logs/     (새로 만듦)
└─ web/
   └─ kanban/  (새로 만듦)
```

### Step 2: 배포 스크립트 복사 (Finder)

1. **Finder** 열기
2. 사이드바에서 `LOOP_CORE` 선택 (이미 마운트되어 있음)
3. `vault/LOOP/scripts/deploy_to_nas.sh` 찾기
4. 파일 복사 (⌘C)
5. 사이드바에서 `LOOP_CORE` → `scripts/` 폴더로 이동
6. 붙여넣기 (⌘V)
7. 파일명 변경: `deploy_to_nas.sh` → `deploy-kanban.sh`

**또는 드래그 앤 드롭**:
- `vault/LOOP/scripts/deploy_to_nas.sh`를
- `scripts/` 폴더로 드래그
- Option 키 누르고 드래그하면 복사됨

### Step 3: Web Station 설치 및 설정

**패키지 설치**:
1. DSM → **패키지 센터**
2. 검색: "Web Station"
3. **설치** 클릭
4. 검색: "Python 3.9" (또는 3.11)
5. **설치** 클릭

**가상 호스트 설정**:
1. DSM → **Web Station** 열기
2. **웹 서비스 포털** 탭
3. **가상 호스트 생성** 클릭
4. 설정:
   ```
   이름: Kanban
   포트: 8080 (HTTP)
   문서 루트: /web/kanban
   PHP: 없음
   ```
5. **만들기**

### Step 4: Python 환경 설정 (Terminal 앱 사용)

**DSM Terminal 앱으로** (SSH 대신):

1. DSM → **패키지 센터**
2. 검색: "Terminal"
3. 설치 (Synology 공식)
4. **Terminal** 앱 열기
5. 명령 실행:
   ```bash
   sudo python3 -m pip install pyyaml
   ```

**또는 PyYAML이 이미 설치되어 있을 수도** (Python 3.9+ 버전 확인)

### Step 5: 작업 스케줄러 설정

1. DSM → **제어판** → **작업 스케줄러**
2. **생성** 클릭
3. **예약된 작업** → **사용자 정의 스크립트**

**일반 설정**:
- 작업 이름: `Kanban Auto Deploy`
- 사용자: `root` (중요!)
- 활성화: ✅

**스케줄 설정**:
- 날짜 실행: 매일
- 빈도: 반복
- 시간 설정:
  - 첫 실행: `00:00`
  - 마지막 실행: `23:45`
  - 반복 주기: `15분마다`

**작업 설정**:
- 사용자 정의 스크립트:
  ```bash
  /volume1/scripts/deploy-kanban.sh
  ```

4. **확인** 클릭

### Step 6: 첫 실행 테스트

1. 방금 만든 작업 선택
2. **실행** 버튼 클릭 (상단 도구 모음)
3. 잠시 대기 (30초~1분)
4. **File Station**에서 `/volume1/logs/kanban-deploy.log` 확인

**로그 파일에 다음이 있으면 성공**:
```
Deploy completed successfully!
Dashboard URL: http://...
```

### Step 7: 웹 접근 확인

브라우저에서:
```
http://YOUR_NAS_IP:8080
```

칸반 대시보드 보이면 완료! 🎉

---

## 🔧 문제 해결 (GUI로)

### 문제 1: 스크립트 실행 오류

**로그 확인**:
1. DSM File Station
2. `/volume1/logs/kanban-deploy.log` 열기
3. 오류 메시지 확인

**일반적인 오류**:

**"Permission denied"**:
- 작업 스케줄러에서 사용자가 `root`인지 확인

**"python3: command not found"**:
- 패키지 센터에서 Python 3.9 설치 확인
- 스크립트 상단 PYTHON 경로 수정:
  ```bash
  PYTHON="/usr/bin/python3"  # 또는
  PYTHON="/usr/local/bin/python3"
  ```

**"No module named yaml"**:
- Terminal 앱에서 PyYAML 설치:
  ```bash
  sudo python3 -m pip install pyyaml
  ```

### 문제 2: 웹 페이지 안 보임

**확인 사항**:

1. **파일 존재 확인**:
   - File Station → `/volume1/web/kanban/`
   - `index.html` 파일 있는지 확인

2. **Web Station 확인**:
   - DSM → Web Station
   - 가상 호스트 상태 "실행 중" 확인

3. **방화벽 확인**:
   - 제어판 → 보안 → 방화벽
   - 포트 8080 허용되어 있는지

4. **수동 배포**:
   - 작업 스케줄러에서 작업 선택
   - **실행** 버튼 클릭

### 문제 3: Dashboard 업데이트 안 됨

**변경 감지 리셋**:

1. File Station → `/volume1/logs/`
2. `.last_kanban_build` 파일 삭제
3. 작업 스케줄러에서 수동 실행

**또는 강제 빌드**:

작업 스케줄러 스크립트를 임시로 수정:
```bash
rm -f /volume1/logs/.last_kanban_build
/volume1/scripts/deploy-kanban.sh
```

---

## 📱 모바일에서도 가능

Synology DS file 앱:
1. App Store/Play Store에서 "DS file" 설치
2. NAS 연결
3. 파일 복사, 로그 확인 가능

---

## ⚡ 더 쉬운 방법: 즐겨찾기 설정

### DSM 바탕화면 바로가기

1. **File Station**: `/volume1/logs/kanban-deploy.log` 우클릭 → "즐겨찾기 추가"
2. **작업 스케줄러**: 자주 쓰는 작업 별표 표시

### 브라우저 북마크

```
http://YOUR_NAS_IP:8080  (칸반 보드)
http://YOUR_NAS_IP:5000  (DSM 관리)
```

---

## ✅ 최종 체크리스트 (SSH 불필요)

- [ ] DSM File Station에서 폴더 생성 (`scripts`, `logs`, `web/kanban`)
- [ ] Finder로 스크립트 복사 (`deploy-kanban.sh`)
- [ ] Web Station 설치 및 가상 호스트 설정
- [ ] Python 3.9 설치 (패키지 센터)
- [ ] PyYAML 설치 (Terminal 앱 또는 이미 설치됨)
- [ ] 작업 스케줄러 등록 (root, 15분마다)
- [ ] 수동 실행 테스트
- [ ] 로그 확인 (File Station)
- [ ] 웹 접근 확인 (http://nas-ip:8080)

모두 GUI로 완료 가능! 🎉

---

**설정 시간**: 15분
**SSH 사용**: 0회
**Last updated**: 2025-12-19
