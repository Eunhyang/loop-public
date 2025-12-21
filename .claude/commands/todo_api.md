# API 개발 작업 워크플로우

> LOOP Dashboard API 개발 전용 커맨드

---

## ⚠️ 작업 시작 전 필수 체크

**출력해야 할 항목:**
- [ ] codex-claude-loop 스킬 사용 언급
- [ ] OK 받기 전 코드 수정 금지 언급
- [ ] 완료 후 문서 업데이트 언급

---

## 0. 새 프로젝트 시작 시 (doc-init 스킬 사용)

⚠️ **새로운 API 프로젝트를 시작할 때는 반드시 `doc-init` 스킬을 사용:**

```
새 프로젝트 시작
    ↓
1️⃣ doc-init 스킬 호출 → doc/{프로젝트}/ 폴더 자동 생성
    ├─ techspec.md (기술 스펙 템플릿)
    └─ todo.md (작업 목록 템플릿)
    ↓
2️⃣ techspec.md 작성 → 프로젝트 목표, 아키텍처, API 설계
    ↓
3️⃣ todo.md 작성 → 태스크 목록 정의
    ↓
4️⃣ 작업 시작 (아래 워크플로우 따름)
```

**doc-init 스킬 호출 방법:**
```
/doc-init {프로젝트명}
```

---

## 0-1. /todo_api 실행 시 자동 수행

⚠️ **이 명령어 실행 시 아래 순서로 자동 확인:**

```
/todo_api 실행
    ↓
1️⃣ doc/{프로젝트}/todo.md 읽기 → 현재 작업 확인
    ↓
2️⃣ doc/{프로젝트}/techspec.md 확인 → 기술 스펙 참조
    ↓
3️⃣ 작업 준비 완료 → 아래 규칙 숙지 후 작업 시작
```

---

## 1. TODO 파일 확인

작업 시작 전 반드시 읽기:
- `doc/{프로젝트}/todo.md` - 현재 진행중인 작업 및 예정 작업
- `doc/{프로젝트}/techspec.md` - 기술 스펙 및 아키텍처

**작업 추적 방식:**
- API 개발 작업은 `doc/{프로젝트}/todo.md`에 기록
- Vault 전체 작업은 `50_Projects/` Task 엔티티 사용

**태스크 시작 시 기록:**
- 태스크 작업 시작 전 `doc/{프로젝트}/todo.md`에 **작업 계획** 상세 기록
- 태스크 항목 아래에 들여쓰기로 상세 내용 추가

**작업 완료 후 반드시 기록:**
- 스킬, Agent, 코드 수정 등 모든 작업 완료 시 `doc/{프로젝트}/todo.md` 업데이트 필수
- 완료된 태스크는 `[ ]` → `[x]`로 변경
- 새로 발견된 태스크는 추가
- **작업 내용은 최대한 상세하게 기술** (무엇을, 어떻게, 어떤 파일을 수정했는지)

**태스크 상세 기록 포맷:**
```markdown
- [x] **TASK-XXX** 태스크 제목
  - 수정 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 실제 수행한 작업 설명
  - 변경 사항: 구체적인 변경 내용
  - 완료일: 2025-12-19
```

**예시:**
```markdown
- [x] **API-001** Hypothesis CRUD 엔드포인트 추가
  - 수정 파일: `api/routers/hypotheses.py`, `api/models/entities.py`, `api/main.py`
  - 작업 내용: Hypothesis 생성/조회/수정/삭제 API 구현
  - 변경 사항:
    - HypothesisCreate, HypothesisResponse 모델 추가
    - POST /api/hypotheses 엔드포인트
    - GET /api/hypotheses 엔드포인트
  - 완료일: 2025-12-19
```

---

## 2. 작업 흐름 (codex-claude-loop 기반)

⚠️ **모든 중요한 코드 작업은 `codex-claude-loop` 스킬을 통해 실행**

```
/todo_api 실행
    ↓
1️⃣ doc/{프로젝트}/todo.md 읽기 → 작업할 태스크 선택
    ↓
2️⃣ 태스크 상세 계획 작성 (todo.md에 기록)
    ↓
3️⃣ codex-claude-loop 스킬 호출
    ├─ Claude: 계획 수립
    ├─ Codex: 계획 검증 (read-only)
    ├─ Claude: 구현 (API 코드 작성)
    ├─ Codex: 코드 리뷰
    └─ 반복 → 품질 통과
    ↓
4️⃣ 테스트 (Swagger UI, curl)
    ↓
5️⃣ doc/{프로젝트}/todo.md 업데이트 ([ ] → [x], 실제 작업 내용 기록)
    ↓
6️⃣ 문서 업데이트 (api/README.md, techspec.md)
    ↓
7️⃣ Git commit
```

**작업 요청 시 흐름:**
1. **작업 요청 받음**
2. **작업 내용 설명 및 확인 요청** ← 여기서 OK 받아야 함
3. **"OK" 확인 후 codex-claude-loop 시작**

⚠️ **중요**: 작업 요청 → 내가 설명 → OK 받으면 → codex-claude-loop 실행

---

## 3. 코드 작성 원칙

### 일반 원칙
1. **절대 쉽게 작성 금지** - 깊이 있는 분석 필수
2. **기존 코드 최우선 재사용** - 중복 코드 절대 금지
3. **관련 코드 전부 파악** - 작업 전 철저한 코드 리뷰
4. **코드 업데이트 시 해당 기능/docs 먼저 읽기**

### Python/FastAPI 원칙
1. **Type Hints 필수**: 모든 함수에 타입 힌트
2. **Pydantic Models**: 모든 요청/응답에 Pydantic 모델 사용
3. **Router 분리**: 엔티티별로 router 파일 분리
4. **Error Handling**: HTTPException으로 일관된 에러 응답
5. **Logging**: print 대신 logging 모듈 사용

---

## 4. 개발 가이드

### API 개발 체크리스트

**새 엔드포인트 추가 시:**
1. [ ] Pydantic 모델 작성 (`api/models/entities.py`)
2. [ ] Router 함수 작성 (`api/routers/*.py`)
3. [ ] Vault 파일 처리 로직 (`api/utils/vault_utils.py`)
4. [ ] main.py에 router 등록
5. [ ] Swagger UI에서 테스트
6. [ ] curl로 테스트
7. [ ] Obsidian에서 파일 확인
8. [ ] api/README.md 업데이트 (엔드포인트 목록)
9. [ ] techspec.md 업데이트 (필요 시)

**코드 수정 시:**
1. 중요한 수정사항은 함부로 고치지 말고 먼저 물어볼 것
2. 단계별로 작은 단위로 접근, 승인 후 다음 단계
3. 에러 발생 시 다른 곳 수정하지 말고 원상복구 후 디버깅
4. 큰 기능은 작은 단위로 리스트업 후 허락받으며 진행

---

## 5. 위험 작업 경고

⚠️ 아래 작업은 반드시 사전 확인 필요:
- 코드 삭제 (특히 api/ 폴더)
- pyproject.toml 수정 (의존성 변경)
- YAML frontmatter 스키마 변경
- CORS 설정 변경
- 파일 I/O 로직 변경 (Vault 파일 손상 위험)

---

## 6. 테스트

### API 서버 실행

```bash
cd /Volumes/LOOP_CORE/vault/LOOP

# 서버 시작
poetry run uvicorn api.main:app --reload --host 0.0.0.0 --port 8081

# 또는 스크립트 사용
./scripts/start_api_server.sh
```

### 테스트 방법

**1. Swagger UI** (추천)
```
http://localhost:8081/docs
```

**2. curl**
```bash
# Task 생성
curl -X POST http://localhost:8081/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "Test Task",
    "project_id": "prj-001",
    "assignee": "eunhyang",
    "priority": "high",
    "status": "todo"
  }'

# Task 목록 조회
curl http://localhost:8081/api/tasks
```

**3. Obsidian 확인**
- `50_Projects/2025/P{N}_{ProjectName}/Tasks/` 에서 파일 생성 확인

---

## 7. 태스크 완료 시 필수 프로세스

⚠️ **태스크 완료할 때마다 반드시 순서대로 수행:**

```
codex-claude-loop 완료 (Codex 리뷰 통과)
    ↓
1️⃣ 테스트 (Swagger UI / curl)
    ↓
2️⃣ doc/{프로젝트}/todo.md 업데이트
    - [ ] → [x]
    - 상세 작업 내용 기록
    ↓
3️⃣ 문서 업데이트
    - api/README.md (엔드포인트 목록)
    - techspec.md (아키텍처 변경 시)
    ↓
4️⃣ Git commit
```

---

## 7-1. 프로젝트 완료 시 아카이브 (doc/done/ 이동)

⚠️ **프로젝트의 모든 태스크가 완료되면 아카이브:**

**완료 조건:**
- todo.md 내 모든 태스크가 `[x]` 상태
- 추가 작업 예정 없음
- 문서화 완료

**아카이브 프로세스:**
```
todo.md 100% 완료 확인
    ↓
1️⃣ 최종 문서 정리
    - techspec.md 최종 업데이트
    - 결과물 및 성과 기록
    ↓
2️⃣ 프로젝트 폴더 이동
    doc/{프로젝트}/ → doc/done/{프로젝트}/
    ↓
3️⃣ Git commit (아카이브 완료)
```

**이동 명령어:**
```bash
mv doc/{프로젝트} doc/done/
```

**doc/done/ 폴더 구조:**
```
doc/
├── {진행중 프로젝트}/     # 현재 작업중
│   ├── techspec.md
│   └── todo.md
└── done/                  # 완료된 프로젝트 아카이브
    └── {완료된 프로젝트}/
        ├── techspec.md
        └── todo.md
```

---

## 8. codex-claude-loop 스킬

**핵심 루프:**
```
Claude 계획 → Codex 검증 → Claude 구현 → Codex 리뷰 → 반복
```

**수행 작업:**
- Claude: 계획 수립, 코드 구현, 이슈 수정
- Codex: 계획 검증, 코드 리뷰, 버그/보안/성능 검사

**통과 조건:**
- ✅ Codex 계획 검증 통과
- ✅ Codex 코드 리뷰 통과
- ✅ 보안/성능 이슈 없음

---

## 9. 문서 업데이트 규칙

### 업데이트가 필요한 문서

| 변경 내용 | 업데이트 문서 |
|-----------|--------------|
| 새 엔드포인트 추가 | `api/README.md`, `techspec.md` |
| 데이터 모델 변경 | `techspec.md` (데이터 모델 섹션) |
| 아키텍처 변경 | `techspec.md` (ADR 섹션 추가) |
| 배포 방법 변경 | `START_API_SERVER.md` |
| 의존성 추가 | `techspec.md` (의존성 섹션) |

---

## 10. 빠른 참조

### 자주 사용하는 명령어

```bash
# API 서버 시작
poetry run uvicorn api.main:app --reload --port 8081

# 또는
./scripts/start_api_server.sh

# 의존성 재설치
poetry install --extras api

# Swagger UI
open http://localhost:8081/docs

# Health check
curl http://localhost:8081/health
```

### 자주 보는 문서

- **아키텍처**: `doc/api/architecture.md` ⭐ (엔티티 계층, 캐시, 필터링 설계)
- **작업 목록**: `doc/api/todo.md`
- **기술 스펙**: `doc/api/techspec.md`
- **API 문서**: `api/README.md`
- **Quick Start**: `START_API_SERVER.md`
- **Vault 스키마**: `00_Meta/schema_registry.md`

---

## 11. 프로젝트 구조

```
api/
├── main.py              # FastAPI 앱 엔트리포인트
├── routers/             # API 라우터
│   ├── tasks.py         # Task CRUD
│   └── projects.py      # Project CRUD
├── models/              # Pydantic 모델
│   └── entities.py      # 요청/응답 스키마
└── utils/               # 유틸리티
    └── vault_utils.py   # Vault 파일 처리

doc/
├── {진행중 프로젝트}/    # 현재 작업중인 프로젝트
│   ├── techspec.md      # 기술 스펙
│   └── todo.md          # 작업 목록
└── done/                # 완료된 프로젝트 아카이브
    └── {완료 프로젝트}/
        ├── techspec.md
        └── todo.md
```

---

**Version**: 1.1.0
**Last Updated**: 2025-12-21

**Changes (v1.1.0):**
- 섹션 0 추가: 새 프로젝트 시작 시 `doc-init` 스킬 사용
- 섹션 7-1 추가: 프로젝트 완료 시 `doc/done/` 아카이브 프로세스