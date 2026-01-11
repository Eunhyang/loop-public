---
entity_type: Task
entity_id: tsk-n8n-06
entity_name: vault-hygiene - API 엔드포인트 개발
created: 2025-12-29
updated: '2026-01-12'
status: doing
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-06
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: '2026-01-12'
due: '2026-01-13'
priority: medium
estimated_hours: null
actual_hours: null
type: dev
target_project: loop-api
tags:
- vault-system
- api
- automation
priority_flag: medium
notes: "# vault-hygiene - API 엔드포인트 개발\n\n> Task ID: `tsk-n8n-06` | Project: `prj-n8n`\
  \ | Status: doing\n\n## 목표\n\nVault 파일 구조 정리를 자동화하는 API 엔드포인트 개발\n\n**완료 조건**:\n\
  \n1. `/api/vault-hygiene/scan` 엔드포인트 구현 (빈 폴더, 명명 규칙 위반, 잘못된 위치 감지)\n2. `/api/vault-hygiene/suggest`\
  \ 엔드포인트 구현 (AI 기반 수정 제안)\n3. `pending_reviews.json`에 제안 추가 기능\n4. n8n 워크플로우 연동 테스트\n\
  \n---\n\n## 상세 내용\n\n### 배경\n\nVault 파일 구조 정리 작업(빈 폴더 감지, 명명 규칙 검증, 파일 위치 검증)을 수동으로\
  \ 수행 중. 이를 자동화하여 n8n 스케줄 워크플로우로 정기 실행하고, 인간 승인 후 실행하는 구조 필요.\n\n### 작업 내용\n\n1.\
  \ **규칙 기반 검사** (Python)\n\n   - 빈 폴더 감지\n   - 명명 규칙 위반 (Task/Project 이름 형식)\n  \
  \ - 파일 위치 검증 (Task → 올바른 Project 폴더 내)\n   - 고아 엔티티 감지\n\n2. **AI 기반 제안** (Claude\
  \ API)\n\n   - 명명 규칙 수정안 제안\n   - 파일 이동 위치 제안\n\n3. **승인 구조**\n\n   - pending_reviews.json에\
  \ 제안 추가\n   - Dashboard에서 승인/거부 가능\n\n---\n\n## 체크리스트\n\n- [ ] FastAPI 라우터 생성 (`api/routers/vault_hygiene.py`)\n\
  \n- [ ] 검사 로직 구현\n\n- [ ] AI 제안 로직 구현\n\n- [ ] pending_reviews 연동\n\n- [ ] n8n 워크플로우\
  \ 생성\n\n---\n\n## Notes\n\n### PRD (Product Requirements Document)\n\n프로젝트 컨텍스트\n\
  \n| 항목 | 값 |\n| --- | --- |\n| **Framework** | FastAPI 0.104+ |\n| **Python** |\
  \ 3.9+ |\n| **Architecture** | Router-based REST API |\n| **Dependency** | Poetry\
  \ |\n| **Key Patterns** | `pending_reviews.json` 승인 워크플로우, `decision_log.jsonl`\
  \ audit |\n| **기존 검증 스크립트** | `validate_schema.py`, `check_orphans.py` |\n\n구현 범위\n\
  \n1. **Vault Hygiene Scan** - 빈 폴더, 명명 규칙 위반, 잘못된 위치 파일 감지\n2. **AI 기반 수정 제안** -\
  \ Claude API로 수정안 생성\n3. **Pending 연동** - `pending_reviews.json`에 제안 추가\n4. **n8n\
  \ 웹훅 지원** - 자동화 워크플로우 트리거\n\n성공 기준\n\n- [ ] `GET /api/vault-hygiene/scan` - 빈 폴더\
  \ 감지\n\n- [ ] `GET /api/vault-hygiene/scan` - 명명 규칙 위반 감지\n\n- [ ] `POST /api/vault-hygiene/suggest`\
  \ - AI 수정안 생성\n\n- [ ] `POST /api/vault-hygiene/suggest-all` - pending_reviews.json에\
  \ 추가\n\n- [ ] n8n 워크플로우에서 정기 호출 테스트\n\n---\n\n### Tech Spec\n\n파일 구조\n\n```\napi/\n\
  ├── routers/\n│   └── vault_hygiene.py      # NEW - 메인 라우터\n├── services/\n│   └──\
  \ hygiene_scanner.py    # NEW - 검사 로직\n└── prompts/\n    └── hygiene_suggestions.py\
  \ # NEW - AI 프롬프트\n```\n\n엔드포인트 설계\n\n| Method | Path | 설명 |\n| --- | --- | ---\
  \ |\n| `GET` | `/scan` | Vault 전체 스캔 → 이슈 목록 반환 |\n| `POST` | `/suggest` | 특정 이슈에\
  \ 대한 AI 수정 제안 |\n| `POST` | `/suggest-all` | 전체 이슈에 대한 AI 수정 제안 + pending 추가 |\n\
  | `POST` | `/execute/{review_id}` | pending 승인 후 실제 실행 |\n\n검사 항목\n\n| 검사 | 규칙 |\
  \ 심각도 |\n| --- | --- | --- |\n| 빈 폴더 | `.md` 파일 0개 | warning |\n| 명명 규칙 | Task/Project\
  \ 이름에 `-` 없음 | error |\n| 파일 위치 | Task가 `Tasks/` 폴더 외부 | error |\n| 고아 엔티티 | `parent_id`\
  \ 참조 끊김 | warning |\n| 민감 데이터 | `.env`, `credentials` 패턴 | critical |\n\nPydantic\
  \ Models\n\n```python\nclass HygieneIssue(BaseModel):\n    id: str             \
  \       # issue-{timestamp}-{random}\n    issue_type: str            # empty_folder\
  \ | naming_violation | misplaced_file | orphan | sensitive\n    severity: str  \
  \            # critical | error | warning\n    path: str                  # 문제 파일/폴더\
  \ 경로\n    description: str           # 문제 설명\n    suggested_action: Optional[str]\n\
  \nclass ScanResponse(BaseModel):\n    scan_id: str\n    timestamp: str\n    issues:\
  \ List[HygieneIssue]\n    summary: Dict[str, int]    # severity별 count\n```\n\n\
  연관 모듈\n\n- `api/routers/pending.py` - 승인/거부 처리 재사용\n- `api/services/llm_service.py`\
  \ - Claude API 호출 재사용\n- `scripts/validate_schema.py` - 스키마 검증 로직\n- `scripts/check_orphans.py`\
  \ - 고아 엔티티 검사 로직\n\n---\n\n### Todo\n\n- [ ] `api/routers/vault_hygiene.py` 라우터\
  \ 생성\n\n- [ ] `api/services/hygiene_scanner.py` 서비스 생성\n\n- [ ] `api/prompts/hygiene_suggestions.py`\
  \ 프롬프트 생성\n\n- [ ] `main.py`에 라우터 등록\n\n- [ ] 기존 validate_schema.py, check_orphans.py\
  \ 로직 재사용\n\n- [ ] pending_reviews 연동 테스트\n\n- [ ] n8n 워크플로우 연동\n\n### 작업 로그\n\n\
  ---\n\n## 참고 문서\n\n- \\[\\[prj-n8n\\]\\] - 소속 Project\n- `scripts/validate_schema.py`\
  \ - 스키마 검증 로직\n- `scripts/check_orphans.py` - 고아 엔티티 검사 로직\n- `api/routers/pending.py`\
  \ - pending_reviews 연동\n\n---\n\n**Created**: 2025-12-29 **Assignee**: 김은향 **Due**:\
  \ 2025-12-30"
---
# vault-hygiene - API 엔드포인트 개발

> Task ID: `tsk-n8n-06` | Project: `prj-n8n` | Status: doing

## 목표

Vault 파일 구조 정리를 자동화하는 API 엔드포인트 개발

**완료 조건**:
1. `/api/vault-hygiene/scan` 엔드포인트 구현 (빈 폴더, 명명 규칙 위반, 잘못된 위치 감지)
2. `/api/vault-hygiene/suggest` 엔드포인트 구현 (AI 기반 수정 제안)
3. `pending_reviews.json`에 제안 추가 기능
4. n8n 워크플로우 연동 테스트

---

## 상세 내용

### 배경

Vault 파일 구조 정리 작업(빈 폴더 감지, 명명 규칙 검증, 파일 위치 검증)을 수동으로 수행 중.
이를 자동화하여 n8n 스케줄 워크플로우로 정기 실행하고, 인간 승인 후 실행하는 구조 필요.

### 작업 내용

1. **규칙 기반 검사** (Python)
   - 빈 폴더 감지
   - 명명 규칙 위반 (Task/Project 이름 형식)
   - 파일 위치 검증 (Task → 올바른 Project 폴더 내)
   - 고아 엔티티 감지

2. **AI 기반 제안** (Claude API)
   - 명명 규칙 수정안 제안
   - 파일 이동 위치 제안

3. **승인 구조**
   - pending_reviews.json에 제안 추가
   - Dashboard에서 승인/거부 가능

---

## 체크리스트

- [ ] FastAPI 라우터 생성 (`api/routers/vault_hygiene.py`)
- [ ] 검사 로직 구현
- [ ] AI 제안 로직 구현
- [ ] pending_reviews 연동
- [ ] n8n 워크플로우 생성

---

## Notes

### PRD (Product Requirements Document)

#### 프로젝트 컨텍스트
| 항목 | 값 |
|------|-----|
| **Framework** | FastAPI 0.104+ |
| **Python** | 3.9+ |
| **Architecture** | Router-based REST API |
| **Dependency** | Poetry |
| **Key Patterns** | `pending_reviews.json` 승인 워크플로우, `decision_log.jsonl` audit |
| **기존 검증 스크립트** | `validate_schema.py`, `check_orphans.py` |

#### 구현 범위
1. **Vault Hygiene Scan** - 빈 폴더, 명명 규칙 위반, 잘못된 위치 파일 감지
2. **AI 기반 수정 제안** - Claude API로 수정안 생성
3. **Pending 연동** - `pending_reviews.json`에 제안 추가
4. **n8n 웹훅 지원** - 자동화 워크플로우 트리거

#### 성공 기준
- [ ] `GET /api/vault-hygiene/scan` - 빈 폴더 감지
- [ ] `GET /api/vault-hygiene/scan` - 명명 규칙 위반 감지
- [ ] `POST /api/vault-hygiene/suggest` - AI 수정안 생성
- [ ] `POST /api/vault-hygiene/suggest-all` - pending_reviews.json에 추가
- [ ] n8n 워크플로우에서 정기 호출 테스트

---

### Tech Spec

#### 파일 구조
```
api/
├── routers/
│   └── vault_hygiene.py      # NEW - 메인 라우터
├── services/
│   └── hygiene_scanner.py    # NEW - 검사 로직
└── prompts/
    └── hygiene_suggestions.py # NEW - AI 프롬프트
```

#### 엔드포인트 설계
| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/scan` | Vault 전체 스캔 → 이슈 목록 반환 |
| `POST` | `/suggest` | 특정 이슈에 대한 AI 수정 제안 |
| `POST` | `/suggest-all` | 전체 이슈에 대한 AI 수정 제안 + pending 추가 |
| `POST` | `/execute/{review_id}` | pending 승인 후 실제 실행 |

#### 검사 항목
| 검사 | 규칙 | 심각도 |
|------|------|--------|
| 빈 폴더 | `.md` 파일 0개 | warning |
| 명명 규칙 | Task/Project 이름에 ` - ` 없음 | error |
| 파일 위치 | Task가 `Tasks/` 폴더 외부 | error |
| 고아 엔티티 | `parent_id` 참조 끊김 | warning |
| 민감 데이터 | `.env`, `credentials` 패턴 | critical |

#### Pydantic Models
```python
class HygieneIssue(BaseModel):
    id: str                    # issue-{timestamp}-{random}
    issue_type: str            # empty_folder | naming_violation | misplaced_file | orphan | sensitive
    severity: str              # critical | error | warning
    path: str                  # 문제 파일/폴더 경로
    description: str           # 문제 설명
    suggested_action: Optional[str]

class ScanResponse(BaseModel):
    scan_id: str
    timestamp: str
    issues: List[HygieneIssue]
    summary: Dict[str, int]    # severity별 count
```

#### 연관 모듈
- `api/routers/pending.py` - 승인/거부 처리 재사용
- `api/services/llm_service.py` - Claude API 호출 재사용
- `scripts/validate_schema.py` - 스키마 검증 로직
- `scripts/check_orphans.py` - 고아 엔티티 검사 로직

---

### Todo
- [ ] `api/routers/vault_hygiene.py` 라우터 생성
- [ ] `api/services/hygiene_scanner.py` 서비스 생성
- [ ] `api/prompts/hygiene_suggestions.py` 프롬프트 생성
- [ ] `main.py`에 라우터 등록
- [ ] 기존 validate_schema.py, check_orphans.py 로직 재사용
- [ ] pending_reviews 연동 테스트
- [ ] n8n 워크플로우 연동

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- `scripts/validate_schema.py` - 스키마 검증 로직
- `scripts/check_orphans.py` - 고아 엔티티 검사 로직
- `api/routers/pending.py` - pending_reviews 연동

---

**Created**: 2025-12-29
**Assignee**: 김은향
**Due**: 2025-12-30
