# NAS 칸반 대시보드 아키텍처

> LOOP Vault의 Task/Project 데이터를 실시간 웹 칸반 보드로 배포하는 시스템 전체 구조

**Last Updated**: 2025-12-19
**Version**: 1.0

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [핵심 컴포넌트](#핵심-컴포넌트)
3. [배포 아키텍처](#배포-아키텍처)
4. [사용 시나리오](#사용-시나리오)
5. [파일 구조](#파일-구조)
6. [트러블슈팅](#트러블슈팅)

---

## 시스템 개요

### 목적
Obsidian Vault의 YAML frontmatter 기반 Task/Project 엔티티를 웹 칸반 보드로 자동 배포하여 팀원들이 브라우저에서 실시간으로 프로젝트 진행 상황을 확인할 수 있도록 함.

### 핵심 기능
- ✅ **실시간 동기화**: MacBook ↔ NAS AFP 마운트로 파일 즉시 반영
- ✅ **칸반 뷰**: TODO → DOING → DONE → BLOCKED 4컬럼
- ✅ **Obsidian 연동**: 클릭 시 Obsidian에서 파일 열기 (obsidian:// URI)
- ✅ **멤버 아이콘**: 담당자별 아이콘 및 이름 표시
- ✅ **프로젝트 진행률**: 완료/전체 Task 비율 시각화
- ✅ **validates 관계**: Task가 검증하는 Hypothesis 링크 표시

### 기술 스택
- **Frontend**: Vanilla HTML/CSS/JavaScript (standalone)
- **Backend**: Python 3.9+ (YAML 파싱, HTML 생성)
- **Deploy**: Bash shell scripts (NAS cron + file watch)
- **Web Server**: Synology Web Station (HTTP 8080)
- **Sync**: AFP network mount (실시간)

---

## 핵심 컴포넌트

### 1. Dashboard 생성기

**파일**: `scripts/build_dashboard.py` (878줄)

**기능**:
```python
# 1. Vault 스캔
entities = scan_vault(vault_path)
# → 01_North_Star/, 20_Strategy/, 50_Projects/, 60_Hypotheses/ 스캔
# → frontmatter YAML 파싱

# 2. 멤버 정보 로드
members = load_members('00_Meta/members.yaml')
# → id, name, icon, role 매핑

# 3. HTML 생성
html = generate_html(entities, 'LOOP', members)
# → 칸반 보드 (3탭: Kanban, Strategy, Projects)
# → CSS 인라인 포함 (외부 의존성 없음)

# 4. 파일 저장
output: _dashboard/index.html
```

**주요 로직**:

#### Task 카드 렌더링
```python
def render_task_card(task: Dict) -> str:
    # Task 정보 추출
    name = task.get('entity_name')
    entity_id = task.get('entity_id')
    assignee = get_member_display(task.get('assignee'), members)
    priority = task.get('priority', 'medium')
    due = task.get('due', '')

    # validates 관계 추출
    validates = get_validates_info(task)

    # Project 정보
    project_id = task.get('project_id')
    project_name = all_entities[project_id]['entity_name']

    # Obsidian URI 생성
    uri = f"obsidian://open?vault=LOOP&file={file_path}"

    # HTML 카드 생성 (클릭 가능, 색상 코드, 링크)
    return f'''<div class="task-card {priority_class}"
                    onclick="window.location.href='{uri}'">...</div>'''
```

#### 칸반 컬럼 구성
```python
tasks_by_status = {
    'todo': [],      # 📋 TODO (오렌지)
    'doing': [],     # ⚡ DOING (파랑)
    'done': [],      # ✅ DONE (초록)
    'blocked': [],   # 🚫 BLOCKED (빨강)
}
```

**출력 예시**:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <style>
        /* 690줄의 CSS - 칸반 스타일, 카드 디자인 */
    </style>
</head>
<body>
    <div class="header">LOOP Strategy Dashboard</div>
    <div class="tabs">...</div>
    <div class="kanban-board">
        <div class="kanban-column">
            <div class="task-card priority-high" onclick="...">
                <span class="task-name">Event 엔티티 검증</span>
                <span class="assignee">👩‍💻 은향</span>
                <div class="validates">validates: MH3_데이터_모델링_가능</div>
            </div>
        </div>
    </div>
</body>
</html>
```

---

### 2. NAS 배포 스크립트 (2가지 방식)

#### A. 프로덕션 배포 (검증 + 빌드)

**파일**: `/volume1/scripts/deploy-kanban.sh` (106줄)

**실행 방식**: Synology Task Scheduler (Cron, 15분마다)

**플로우**:
```bash
#!/bin/bash
# 1. 변경 감지
if ! check_changes; then
    exit 0  # 변경 없으면 종료
fi

# 2. Schema 검증
python3 scripts/validate_schema.py . || exit 1

# 3. Dashboard 빌드
python3 scripts/build_dashboard.py . || exit 1

# 4. Web 배포
cp _dashboard/index.html /volume1/web/kanban/index.html
chmod 644 /volume1/web/kanban/index.html
chown http:http /volume1/web/kanban/index.html

# 5. 타임스탬프 갱신
touch /volume1/logs/.last_kanban_build
```

**변경 감지 로직**:
```bash
check_changes() {
    # .last_kanban_build 이후 수정된 .md 파일 찾기
    CHANGED=$(find "$VAULT_DIR/50_Projects" \
                   -name "*.md" \
                   -newer "$LAST_BUILD_FILE" \
                   2>/dev/null | wc -l)

    if [ $CHANGED -gt 0 ]; then
        return 0  # 변경 있음
    else
        return 1  # 변경 없음
    fi
}
```

**특징**:
- ✅ 변경 없으면 스킵 (효율적)
- ✅ Schema 검증 포함 (안정성)
- ✅ 완전한 빌드 (Python 실행)
- ⏱️ 느림 (약 30초 소요)
- 📊 로그 기록 (`/volume1/logs/kanban-deploy.log`)

---

#### B. 개발용 배포 (실시간 복사)

**파일**: `/volume1/LOOP_CORE/scripts/watch-deploy-simple.sh` (26줄)

**실행 방식**: 부팅 시 백그라운드 (`nohup`)

**플로우**:
```bash
#!/bin/bash
while true; do
    sleep 5  # 5초 대기

    # Dashboard 파일 존재 확인
    if [ -f "$VAULT_DIR/_dashboard/index.html" ]; then
        # 즉시 Web 디렉토리로 복사
        cp -f "$VAULT_DIR/_dashboard/index.html" \
              "$WEB_DIR/index.html"
        chmod 644 "$WEB_DIR/index.html"
        log "Dashboard synced to web"
    fi
done
```

**특징**:
- ⚡ 빠름 (5초 이내 배포)
- ✅ 검증 없음 (MacBook에서 이미 빌드됨)
- ✅ 리소스 절약 (Python 미실행)
- ✅ 실시간 동기화
- 📝 간단한 로그 (`/volume1/LOOP_CORE/logs/kanban-watch-simple.log`)

**DSM Task Scheduler 설정**:
```bash
# 작업 이름: Kanban File Watch
# 트리거: 부팅 시 실행
# 사용자: root
# 스크립트:
nohup /volume1/LOOP_CORE/scripts/watch-deploy-simple.sh > /dev/null 2>&1 &
```

---

### 3. 멤버 설정 파일

**파일**: `00_Meta/members.yaml`

```yaml
members:
  - id: "eunhyang"
    name: "은향"
    icon: "👩‍💻"
    role: "Founder"

  - id: "myunghak"
    name: "명학"
    icon: "👨‍🔬"
    role: "Member"

  - id: "dan"
    name: "단"
    icon: "🧑‍🎨"
    role: "Member"
```

**사용처**:
- Task frontmatter: `assignee: "eunhyang"`
- Dashboard 표시: `👩‍💻 은향`

**코드 참조**:
```python
def get_member_display(assignee: str, members: Dict) -> str:
    if assignee in members:
        member = members[assignee]
        icon = member.get('icon', '👤')
        name = member.get('name', assignee)
        return f"{icon} {name}"
    return f"👤 {assignee}"
```

---

### 4. Dashboard UI 구조

#### 탭 구성
```
┌─────────────────────────────────────────────┐
│ 📋 Kanban Board | 🎯 Strategy | 📁 Projects │
└─────────────────────────────────────────────┘
```

**Kanban Board 탭**:
```
┌─────────┬─────────┬─────────┬──────────┐
│ 📋 TODO │ ⚡ DOING│ ✅ DONE │ 🚫 BLOCKED│
│ (오렌지)│ (파랑)  │ (초록)  │  (빨강)   │
├─────────┼─────────┼─────────┼──────────┤
│ Task 1  │ Task 3  │ Task 5  │ Task 7   │
│ Task 2  │ Task 4  │ Task 6  │          │
└─────────┴─────────┴─────────┴──────────┘
```

**Strategy 탭**:
```
┌──────────────────┬──────────────────┐
│ 🎯 North Star    │ 🔬 Meta Hypotheses│
│ - ns:001         │ - mh:1           │
│                  │ - mh:2           │
├──────────────────┼──────────────────┤
│ 📋 Conditions    │ 🛤️ Tracks         │
│ - cond:a         │ - trk:1          │
│ - cond:b         │ - trk:2          │
└──────────────────┴──────────────────┘
```

**Projects 탭**:
```
┌────────────────────────────────────────────┐
│ P001: Ontology v0.1                        │
│ Track: Track 2 (Data)                      │
│ Tasks: 2/3  [████████░░] 67%               │
│   - tsk:001-01: Event 엔티티 검증 (doing)  │
│   - tsk:001-02: Episode 정의 (done)        │
│   - tsk:001-03: 스키마 문서화 (todo)       │
└────────────────────────────────────────────┘
```

#### Task 카드 상세

```
┌────────────────────────────────────────┐
│ Event 엔티티 검증              tsk:001-01│ ← 제목 + ID
│                                        │
│ 👩‍💻 은향          📅 2025-12-25         │ ← 담당자 + 마감일
│                                        │
│ 📁 Ontology v0.1                        │ ← 프로젝트 링크
│                                        │
│ validates: MH3_데이터_모델링_가능        │ ← 검증 관계
│                                        │
│ [ontology] [validation]                │ ← 태그
└────────────────────────────────────────┘
   ↑ priority-high (빨강 테두리)
```

---

## 배포 아키텍처

### 전체 플로우

```
┌─────────────────────────────────────────────────────────┐
│ MacBook (개발 환경)                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Obsidian Vault                                      │ │
│ │ - Task/Project 파일 편집                            │ │
│ │ - YAML frontmatter 수정                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                      ↓ AFP Mount                        │
│              /Volumes/LOOP_CORE                         │
└─────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Synology NAS (프로덕션 환경)                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Vault Storage: /volume1/LOOP_CORE/vault/LOOP        │ │
│ │ - 실시간 파일 동기화 (네트워크 마운트)                 │ │
│ │ - 50_Projects/*.md (Task 파일)                      │ │
│ │ - _dashboard/index.html (빌드 결과)                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                      ↓                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 배포 레이어 (2가지 방식)                             │ │
│ │                                                     │ │
│ │ [방식 1] Cron (15분마다)                            │ │
│ │   /volume1/scripts/deploy-kanban.sh                │ │
│ │   → 변경 감지 → 검증 → 빌드 → 배포                 │ │
│ │   → Python 3.9 실행 (PyYAML)                       │ │
│ │                                                     │ │
│ │ [방식 2] 실시간 감시 (5초마다)                      │ │
│ │   /volume1/LOOP_CORE/scripts/watch-deploy-simple.sh│ │
│ │   → 파일 존재 확인 → 즉시 복사                     │ │
│ │   → 검증 없음 (빠른 배포)                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                      ↓                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Web Storage: /volume1/web/kanban/index.html         │ │
│ │ - 권한: 644 (http:http)                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                      ↓                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Web Station (HTTP Server)                           │ │
│ │ - 포트: 8080                                         │ │
│ │ - Virtual Host: kkanban.sosilab.synology.me         │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                       ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│ 팀원 브라우저                                            │
│ http://kkanban.sosilab.synology.me                      │
│ - 칸반 보드 뷰                                           │
│ - Obsidian URI 클릭 → 로컬 Obsidian 앱 실행             │
└─────────────────────────────────────────────────────────┘
```

### 데이터 플로우

```
1. Task 생성/수정 (Obsidian)
   ↓
2. 파일 저장 (자동)
   ↓
3. AFP 동기화 (즉시, 네트워크 마운트)
   ↓
4-A. [자동 배포 - Cron]
   → 15분 이내 변경 감지
   → Schema 검증
   → Dashboard 빌드 (Python)
   → Web 배포

4-B. [수동 배포 - MacBook]
   → python3 scripts/build_dashboard.py .
   → _dashboard/index.html 생성
   → 5초 이내 NAS가 자동 복사
   ↓
5. 브라우저 새로고침
   ↓
6. 최신 칸반 보드 확인 ✅
```

---

## 사용 시나리오

### 시나리오 1: Task 상태 변경 (자동 배포)

```yaml
# 1. Obsidian에서 Task frontmatter 수정
---
entity_type: Task
entity_id: tsk:001-01
status: todo → doing  # 변경
---
```

```
2. 파일 저장
   ↓ (자동 동기화)
3. NAS에 파일 반영 (즉시)
   ↓ (15분 이내)
4. Cron이 변경 감지
   ↓
5. Dashboard 재빌드
   ↓
6. Web 배포
   ↓
7. 브라우저 새로고침
   ↓
8. Task 카드가 TODO → DOING 컬럼으로 이동 ✅
```

---

### 시나리오 2: 새 Task 생성 (수동 빌드)

```bash
# 1. MacBook에서 Task 생성
# loop-entity-creator skill 사용 또는 수동 생성

# 2. Dashboard 즉시 재생성
cd /Volumes/LOOP_CORE/vault/LOOP
python3 scripts/build_dashboard.py .

# 출력:
# Scanning vault: /Volumes/LOOP_CORE/vault/LOOP
# Members loaded: 3
#   👩‍💻 은향 (eunhyang)
#   👨‍🔬 명학 (myunghak)
#   🧑‍🎨 단 (dan)
# Entities found:
#   Task: 25
#   Project: 14
# Dashboard generated: _dashboard/index.html

# 3. NAS가 5초 이내 자동 복사 (watch-deploy-simple.sh)

# 4. 브라우저 새로고침
# → 새 Task 카드 즉시 확인 ✅
```

---

### 시나리오 3: 긴급 배포 (NAS SSH)

```bash
# 1. NAS SSH 접속
ssh admin@kkanban.sosilab.synology.me

# 2. 수동 배포 실행
sudo /volume1/scripts/deploy-kanban.sh

# 출력:
# 2025-12-19 14:30:00 - Deploy check started
# 2025-12-19 14:30:01 - Step 1/4: Checking for file changes...
# 2025-12-19 14:30:02 - Detected 3 changed file(s)
# 2025-12-19 14:30:03 - Step 2/4: Validating schema...
# 2025-12-19 14:30:05 - Step 3/4: Building dashboard...
# 2025-12-19 14:30:25 - Step 4/4: Deploying to web server...
# 2025-12-19 14:30:26 - Deploy completed successfully!

# 3. 즉시 확인
curl http://localhost:8080 | head -20
```

---

### 시나리오 4: 멤버 추가

```yaml
# 1. members.yaml 수정
members:
  - id: "newmember"
    name: "신규"
    icon: "👤"
    role: "Member"
```

```bash
# 2. Dashboard 재생성
python3 scripts/build_dashboard.py .

# 3. Task에 새 멤버 할당
---
entity_type: Task
assignee: "newmember"
---

# 4. Dashboard 확인
# → 👤 신규 아이콘 표시됨 ✅
```

---

## 파일 구조

### Vault 파일

```
/Volumes/LOOP_CORE/vault/LOOP/
├── scripts/
│   ├── build_dashboard.py           # ⭐ Dashboard 생성기 (878줄)
│   │   ├── scan_vault()             # Vault 스캔
│   │   ├── extract_frontmatter()    # YAML 파싱
│   │   ├── load_members()           # 멤버 정보 로드
│   │   ├── generate_html()          # HTML 생성
│   │   └── render_task_card()       # Task 카드 렌더링
│   │
│   ├── deploy_to_nas.sh             # 로컬용 배포 스크립트 (106줄)
│   ├── validate_schema.py           # Schema 검증
│   ├── build_graph_index.py         # Graph Index 생성
│   └── check_orphans.py             # 고아 엔티티 검사
│
├── _dashboard/
│   └── index.html                   # ⭐ 생성된 칸반 보드 (standalone HTML)
│
├── 00_Meta/
│   └── members.yaml                 # ⭐ 멤버 정보 (id, name, icon, role)
│
├── 50_Projects/                     # Task/Project 파일들
│   ├── 2025/
│   │   ├── P001_Ontology/
│   │   │   ├── Project_정의.md
│   │   │   └── Tasks/
│   │   │       ├── tsk-prj001-001.md
│   │   │       ├── tsk-prj001-002.md
│   │   │       └── tsk-prj001-003.md
│   │   ├── P002_.../
│   │   └── ...
│
└── NAS_DASHBOARD_ARCHITECTURE.md    # 이 문서
```

### NAS 파일 (프로덕션)

```
Synology NAS:
/volume1/
├── LOOP_CORE/
│   ├── vault/LOOP/                  # Vault (AFP 마운트됨)
│   │   ├── scripts/
│   │   ├── _dashboard/
│   │   └── ...
│   │
│   ├── scripts/                     # ⭐ NAS 전용 스크립트
│   │   ├── deploy-kanban.sh         # Cron 배포 (검증+빌드)
│   │   └── watch-deploy-simple.sh   # 실시간 복사 (5초 주기)
│   │
│   └── logs/                        # ⭐ 로그 디렉토리
│       ├── kanban-deploy.log        # Cron 배포 로그
│       ├── kanban-watch-simple.log  # 실시간 복사 로그
│       └── .last_kanban_build       # 마지막 빌드 타임스탬프
│
├── scripts/
│   └── deploy-kanban.sh             # Cron에서 실행하는 스크립트 (심볼릭 링크)
│
└── web/
    └── kanban/
        └── index.html               # ⭐ Web Station이 서빙하는 파일
```

---

## 트러블슈팅

### 문제 1: Dashboard가 업데이트 안 됨

**증상**: Task 수정했는데 웹에서 변경사항이 안 보임

**원인**:
1. Cron이 아직 실행 안 됨 (15분 주기)
2. 변경 감지 실패 (타임스탬프 문제)
3. Schema 검증 실패로 빌드 중단
4. Web 복사 실패 (권한 문제)

**해결**:
```bash
# 1. 로그 확인
ssh admin@nas
tail -30 /volume1/logs/kanban-deploy.log

# 2. 마지막 빌드 시간 확인
ls -lh /volume1/logs/.last_kanban_build
# → 15분 이상 전이면 Cron 미실행

# 3. 수동 실행
sudo /volume1/scripts/deploy-kanban.sh

# 4. 변경 감지 강제 리셋
sudo rm /volume1/logs/.last_kanban_build
sudo /volume1/scripts/deploy-kanban.sh

# 5. Schema 검증 오류 확인
cd /volume1/vault/LOOP
python3 scripts/validate_schema.py .
```

---

### 문제 2: 실시간 복사 안 됨 (watch-deploy-simple.sh)

**증상**: MacBook에서 Dashboard 빌드했는데 5초 후에도 웹에 반영 안 됨

**원인**:
1. watch-deploy-simple.sh 프로세스가 종료됨
2. 파일 경로 오류
3. 권한 문제

**해결**:
```bash
# 1. 프로세스 확인
ssh admin@nas
ps aux | grep watch-deploy-simple

# 없으면 재시작:
nohup /volume1/LOOP_CORE/scripts/watch-deploy-simple.sh > /dev/null 2>&1 &

# 2. 로그 확인
tail -f /volume1/LOOP_CORE/logs/kanban-watch-simple.log

# 3. 파일 존재 확인
ls -lh /volume1/LOOP_CORE/vault/LOOP/_dashboard/index.html
ls -lh /volume1/web/kanban/index.html

# 4. 권한 확인
chmod 644 /volume1/web/kanban/index.html
chown http:http /volume1/web/kanban/index.html
```

---

### 문제 3: Obsidian URI가 작동 안 함

**증상**: Task 카드 클릭해도 Obsidian 열리지 않음

**원인**:
1. Obsidian URI handler 미등록 (macOS)
2. Vault 이름 불일치
3. 파일 경로 오류

**해결**:
```bash
# 1. Obsidian URI 테스트
open "obsidian://open?vault=LOOP&file=50_Projects/2025/P001_Ontology/Tasks/tsk-prj001-001.md"

# 2. Vault 이름 확인
# build_dashboard.py의 VAULT_NAME 변수 확인
grep "VAULT_NAME" scripts/build_dashboard.py
# → VAULT_NAME = "LOOP"

# 3. Obsidian에서 Vault 이름 확인
# 설정 → 일반 → Vault 이름

# 4. 불일치하면 수정
# build_dashboard.py 24번 줄:
VAULT_NAME = "실제_Vault_이름"
```

---

### 문제 4: 특정 Task가 칸반에 안 보임

**증상**: Obsidian에서는 Task 파일이 있는데 Dashboard에 안 나타남

**원인**:
1. frontmatter 형식 오류 (YAML 파싱 실패)
2. entity_type이 Task가 아님
3. status 값이 todo/doing/done/blocked가 아님
4. 스캔 폴더 범위 밖 (50_Projects 밖)

**해결**:
```bash
# 1. 해당 Task 파일의 frontmatter 확인
head -20 "파일경로.md"

# 필수 필드 확인:
---
entity_type: Task         # 대소문자 정확히
entity_id: "tsk:001-01"
status: todo              # 소문자, 정확한 값
assignee: "eunhyang"
project_id: "prj:001"
---

# 2. YAML 검증
python3 -c "
import yaml
with open('파일경로.md') as f:
    content = f.read()
    match = content.split('---')[1]
    data = yaml.safe_load(match)
    print(data)
"

# 3. Dashboard 재생성 시 출력 확인
python3 scripts/build_dashboard.py . | grep Task
# → Task: 25  (숫자 확인)

# 4. 스캔 폴더 확인
grep "SCAN_FOLDERS" scripts/build_dashboard.py
# → "50_Projects" 포함되어 있는지 확인
```

---

### 문제 5: 멤버 아이콘이 안 나옴

**증상**: Task 카드에 "👤 eunhyang" 대신 아이콘이 없음

**원인**:
1. members.yaml 파싱 실패
2. assignee ID가 members.yaml에 없음
3. members.yaml 경로 오류

**해결**:
```bash
# 1. members.yaml 검증
python3 -c "
import yaml
with open('00_Meta/members.yaml') as f:
    data = yaml.safe_load(f)
    print(data)
"

# 2. 멤버 목록 확인
python3 scripts/build_dashboard.py . | grep "Members loaded"
# 출력:
# Members loaded: 3
#   👩‍💻 은향 (eunhyang)
#   👨‍🔬 명학 (myunghak)
#   🧑‍🎨 단 (dan)

# 3. Task의 assignee 확인
grep "assignee:" 50_Projects/*/Tasks/*.md
# → "eunhyang" 등 members.yaml의 id와 일치하는지 확인

# 4. members.yaml에 추가
members:
  - id: "신규ID"
    name: "이름"
    icon: "👤"
    role: "Member"
```

---

### 문제 6: Web Station 접근 안 됨

**증상**: http://kkanban.sosilab.synology.me 접속 시 404 또는 연결 실패

**원인**:
1. Web Station 중지됨
2. Virtual Host 설정 오류
3. 방화벽 차단 (포트 8080)
4. index.html 파일 없음

**해결**:
```bash
# 1. Web Station 상태 확인
# DSM → Web Station → 실행 중?

# 2. index.html 존재 확인
ls -lh /volume1/web/kanban/index.html

# 3. 권한 확인
chmod 644 /volume1/web/kanban/index.html
chown http:http /volume1/web/kanban/index.html

# 4. 포트 확인
netstat -an | grep 8080
# → LISTEN 상태인지 확인

# 5. 로컬 접속 테스트
curl http://localhost:8080 | head -20
# → HTML이 정상 출력되면 Web Station은 정상

# 6. 외부 접속 테스트
curl http://kkanban.sosilab.synology.me | head -20

# 7. Virtual Host 설정 확인
# DSM → Web Station → 가상 호스트 → kkanban 설정
# - 포트: 8080
# - 문서 루트: /web/kanban
```

---

## 성능 최적화

### Cron 주기 조정

**빠른 업데이트 원하면** (5분마다):
```bash
# DSM → 제어판 → 작업 스케줄러
# "Kanban Auto Deploy" 편집
# 스케줄: */5 * * * *
```

**리소스 절약하려면** (30분마다):
```bash
# 스케줄: */30 * * * *
```

### 특정 폴더만 감지

**deploy-kanban.sh 수정** (라인 42):
```bash
# 전체 50_Projects 대신 특정 프로젝트만
CHANGED=$(find "$VAULT_DIR/50_Projects/2025/P001_Ontology" \
               -name "*.md" \
               -newer "$LAST_BUILD_FILE" \
               2>/dev/null | wc -l)
```

### 검증 스킵 (빠른 빌드)

**deploy-kanban.sh 수정** (라인 72-74):
```bash
# 2. Schema 검증 (주석 처리)
# log "Step 2/4: Validating schema..."
# $PYTHON scripts/validate_schema.py . >> "$LOG_FILE" 2>&1 || error "Schema validation failed"
```

**주의**: 검증 없이 빌드하면 잘못된 frontmatter로 인한 오류 발생 가능

---

## 향후 개선 사항

### 1. 실시간 업데이트 (WebSocket)
- 현재: 브라우저 수동 새로고침
- 개선: WebSocket으로 자동 업데이트

### 2. Task 드래그 앤 드롭
- 현재: Obsidian에서만 status 변경
- 개선: 웹에서 드래그로 status 변경 → Obsidian 파일 자동 수정

### 3. 필터링 및 검색
- assignee별 필터
- project별 필터
- 태그별 필터
- 텍스트 검색

### 4. 알림 기능
- Slack 연동
- 마감일 알림
- 상태 변경 알림

### 5. 통계 대시보드
- 프로젝트별 진행률 차트
- 멤버별 Task 분포
- 완료율 추이 (시계열)

---

## 참고 문서

- **배포 가이드**: `NAS_DEPLOYMENT_SIMPLE.md` - 10분 설정 가이드
- **Claude Code 가이드**: `CLAUDE.md` - NAS 배포 섹션 포함
- **README**: `README.md` - 칸반 대시보드 사용법
- **스키마 정의**: `00_Meta/schema_registry.md` - Task/Project 필드 정의
- **빌드 설정**: `00_Meta/build_config.md` - 스크립트 설정

---

**Document Version**: 1.0
**Last Updated**: 2025-12-19
**Author**: Claude Code
**Maintainer**: LOOP Team