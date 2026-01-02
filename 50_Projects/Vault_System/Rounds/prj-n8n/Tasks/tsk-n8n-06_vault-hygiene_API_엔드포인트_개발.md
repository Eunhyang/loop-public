---
entity_type: Task
entity_id: "tsk-n8n-06"
entity_name: "vault-hygiene - API 엔드포인트 개발"
created: 2025-12-29
updated: 2025-12-29
status: doing

# === 계층 ===
parent_id: "prj-n8n"
project_id: "prj-n8n"
aliases: ["tsk-n8n-06"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-29
due: 2025-12-30
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 ===
# === 분류 ===
tags: [vault-system, api, automation]
priority_flag: medium
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
