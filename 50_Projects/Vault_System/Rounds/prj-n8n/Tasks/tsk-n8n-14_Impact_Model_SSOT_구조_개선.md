---
entity_type: Task
entity_id: "tsk-n8n-14"
entity_name: "Impact Model - SSOT 구조 개선"
created: 2026-01-03
updated: 2026-01-03
status: done

# === 계층 ===
parent_id: "prj-n8n"
project_id: "prj-n8n"
aliases: ["tsk-n8n-14"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-03
due: 2026-01-03
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: [ssot, impact-model, refactoring]
priority_flag: high
---

# Impact Model - SSOT 구조 개선

> Task ID: `tsk-n8n-14` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. `impact_model_config.yml`이 유일한 SSOT로 동작
2. 중복 판단 기준 제거 (프롬프트, n8n JavaScript 등)
3. API 엔드포인트로 yml 내용 노출

---

## 상세 내용

### 배경

현재 Impact A/B Score 판단 기준이 여러 곳에 분산/중복:
- `impact_model_config.yml` (SSOT라고 하지만...)
- `api/prompts/expected_impact.py` (하드코딩)
- `api/prompts/realized_impact.py` (하드코딩)
- `.claude/skills/auto-fill-project-impact/references/impact_fields.md` (복사본)
- n8n 워크플로우 JavaScript (하드코딩)

yml 수정해도 프롬프트/n8n에 반영 안 됨.

### 작업 내용

1. `/api/config/impact-model` 엔드포인트 추가
2. `prompts/*.py` → yml 동적 로드로 변경
3. `impact_fields.md` 삭제
4. n8n 워크플로우 → API fetch로 변경

---

## 체크리스트

- [x] `/api/config/impact-model` 엔드포인트 구현
- [x] `expected_impact.py` yml 동적 로드
- [x] `realized_impact.py` yml 동적 로드
- [x] `impact_fields.md` 삭제
- [ ] n8n 워크플로우 수정 (하드코딩 → API fetch) → tsk-n8n-15로 분리
- [x] CLAUDE.md 업데이트

---

## Notes

### Tech Spec

**아키텍처 (TO-BE):**
```
impact_model_config.yml (진짜 SSOT)
    │
    ├──→ GET /api/config/impact-model (신규)
    │         │
    │         ├──→ n8n workflows (API fetch)
    │         └──→ 외부 클라이언트
    │
    ├──→ impact_calculator.py ✓ (기존)
    │
    └──→ prompts/*.py (yml 동적 로드)
          ├── expected_impact.py
          ├── realized_impact.py
          └── evidence.py

❌ 삭제: impact_fields.md
```

**파일 구조:**
```
api/
├── routers/
│   └── config.py (신규)
├── prompts/
│   ├── expected_impact.py (수정)
│   ├── realized_impact.py (수정)
│   └── evidence.py (수정)
└── utils/
    └── impact_calculator.py (기존 load_impact_config 재사용)
```

**기존 로더 함수:**
```python
# api/utils/impact_calculator.py
@lru_cache(maxsize=1)
def load_impact_config() -> Dict[str, Any]:
    config_path = Path(__file__).parent.parent.parent / "impact_model_config.yml"
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)
```

### PRD

**구현 순서:**
1. `api/routers/config.py` 생성 - `/api/config/impact-model` 엔드포인트
2. `api/main.py` - config 라우터 등록
3. `expected_impact.py` - yml 동적 로드로 변경
4. `realized_impact.py` - yml 동적 로드로 변경
5. `evidence.py` - yml 동적 로드로 변경
6. `impact_fields.md` 삭제
7. CLAUDE.md 업데이트

**성공 기준:**
- [ ] `/api/config/impact-model` 엔드포인트 동작
- [ ] yml 수정 시 프롬프트에 자동 반영
- [ ] 기존 autofill API 정상 동작 (regression 없음)

### Todo
- [x] config.py 라우터 생성
- [x] main.py에 라우터 등록
- [x] expected_impact.py 수정
- [x] realized_impact.py 수정
- [ ] evidence.py 수정 (필요시) → 불필요 (realized_impact.py에서 처리)
- [x] impact_fields.md 삭제
- [x] CLAUDE.md 업데이트
- [x] 테스트

### 작업 로그

**2026-01-03**
- `api/routers/config.py` 생성 - `/api/config/impact-model` 엔드포인트
- `api/main.py` - config 라우터 등록
- `expected_impact.py` - `_build_criteria_from_config()` 함수 추가, yml 동적 로드
- `realized_impact.py` - `_build_realized_criteria_from_config()` 함수 추가, yml 동적 로드
- `.claude/skills/auto-fill-project-impact/references/impact_fields.md` 삭제
- `CLAUDE.md` v8.6 업데이트 - Impact Model SSOT 구조 문서화
- 테스트 통과: yml 로드, 프롬프트 생성, SSOT 참조 확인


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- `impact_model_config.yml` - SSOT
- `api/utils/impact_calculator.py` - 이미 yml 로드 구현됨

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
