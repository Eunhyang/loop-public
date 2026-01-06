---
entity_type: Task
entity_id: "tsk-n8n-22"
entity_name: "Retro Synth - B Score 계산 fallback 시스템"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-n8n"
project_id: "prj-n8n"
aliases: ["tsk-n8n-22", "Retro Synth"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: 8
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["n8n", "evidence", "llm", "automation", "b-score"]
priority_flag: high
---

# Retro Synth - B Score 계산 fallback 시스템

> Task ID: `tsk-n8n-22` | Project: `prj-n8n` | Status: doing

## 목표

회고가 부족할 때 첨부파일/회의록에서 **출처 기반 증거 패키지**를 자동 합성하여 B Score 계산의 공백을 메우는 fallback 시스템 구현.

**완료 조건**:
1. Evidence Quality Gate 노드가 weak/medium/strong 판정
2. weak 판정 시 Retro Synth 노드가 LLM으로 Facts + Unknowns 추출
3. 출처 없는 수치/성과 자동 제거 (환각 방지)
4. Audit Log 파일 생성 및 Pending Review에 경로 전달
5. Dashboard에서 AUTO-SYNTH 뱃지 및 Audit Log 버튼 표시

---

## 상세 내용

### 배경

B Score 계산을 위해서는 프로젝트 종료 후 회고(retrospective)가 필요합니다. 하지만 현실에서는:
- 회고를 작성하지 않거나
- 회고 내용이 빈약하거나
- 정량적 데이터가 누락되는 경우가 많습니다.

이로 인해 B Score 계산이 불가능하거나, Evidence Router가 부정확한 결과를 생성합니다.

### 핵심 원칙

1. **출처 없는 수치/성과 금지**: LLM이 생성하더라도 원본 문서에서 인용 불가하면 제거
2. **기존 Evidence API 최대 재활용**: 새로운 API 없이 기존 인프라 활용
3. **인간 승인 게이트 유지**: 자동 생성된 Evidence도 Pending Review 거침

### 아키텍처

**현재 흐름:**
```
Extract Attachment Texts → Call AI Router (Evidence) → Pending Review
```

**변경 후 흐름:**
```
Extract Attachment Texts
    → Evidence Quality Gate (신규)
        → Route by Quality (신규)
            ├─ strong/medium → [직접 Evidence API]
            └─ weak → Get First Task (신규)
                    → Retro Synth (신규)
                        → Save Retro Logs (신규)
                            → [병합]
    → Call AI Router (Evidence) (기존)
        → Pending Review (audit_log_path 추가)
```

---

## 구현 범위

### 1. n8n 워크플로우 수정

**파일**: `public/_build/n8n_workflows/entity_validator_autofiller.json`

**추가 노드** (6개):
- A. Evidence Quality Gate (Code 노드)
- B. Route by Quality (Switch 노드)
- C. Get First Task (HTTP Request 노드)
- D. Retro Synth (Code 노드 with OpenAI)
- E. Save Retro Logs (Code 노드)
- F. Merge Point

### 2. API 수정

**파일**: `public/api/routers/ai.py`

**변경사항**:
- InferEvidenceRequest에 `synth_audit_log_path` 필드 추가
- create_pending_review에 `audit_log_path` 파라미터 추가
- Pending Review 응답에 audit_log_path 포함

### 3. Dashboard 연동

**파일**: `public/_dashboard/js/components/pending.js`

**변경사항**:
- AUTO-SYNTH 뱃지 (source_workflow='retro-synth'일 때)
- Audit Log 버튼 + 모달

---

## 체크리스트

- [ ] Evidence Quality Gate 노드 구현
- [ ] Route by Quality (Switch) 노드 구현
- [ ] Get First Task (HTTP) 노드 구현
- [ ] Retro Synth (LLM) 노드 구현
- [ ] Save Retro Logs 노드 구현
- [ ] 노드 연결 및 Merge Point 설정
- [ ] InferEvidenceRequest 모델 수정
- [ ] create_pending_review 함수 수정
- [ ] Dashboard AUTO-SYNTH 뱃지 추가
- [ ] Dashboard Audit Log 버튼/모달 추가
- [ ] 수동 테스트 완료
- [ ] 코드 리뷰 통과

---

## Notes

### Tech Spec

**n8n 노드 상세:**

#### A. Evidence Quality Gate
```javascript
const text = $json.api_request.retrospective_content || "";
const totalChars = text.length;
const numericMentions = (text.match(/\d+[.%]|\$\d+|₩\d+/g) || []).length;
const kpiHits = (text.match(/매출|전환율|DAU|MAU|리텐션/gi) || []).length;
const hasGoalActual = /목표.*?실제|달성|대비/.test(text);
const hasTimeframe = /\d{4}-\d{2}|\d+월/.test(text);

let verdict = "weak";
if (totalChars >= 8000 && numericMentions >= 8 && kpiHits >= 3 && hasTimeframe) {
  verdict = "strong";
} else if (totalChars >= 3000 && numericMentions >= 3 && kpiHits >= 1) {
  verdict = "medium";
}

const needsRetroSynth = (verdict === "weak") && (totalChars < 1500 || numericMentions < 2);
```

#### D. Retro Synth 시스템 프롬프트
```
You are a retrospective synthesis expert. Extract ONLY facts explicitly stated in documents.

CRITICAL RULES:
1. NO SPECULATION - If not stated, mark as "unknown"
2. SOURCE CITATION REQUIRED - Every fact needs source_quote + source_id
3. ZERO is better than GUESSING

Output: JSON (no markdown)
```

**API 스키마:**
```python
class InferEvidenceRequest(BaseModel):
    # ... 기존 필드 ...
    synth_audit_log_path: Optional[str] = Field(default=None, description="Retro Synth 로그 경로")
```

### Todo
- [ ] n8n 워크플로우 JSON 분석
- [ ] 노드 추가 위치 확정
- [ ] LLM 프롬프트 최적화
- [ ] 환각 방지 후처리 검증
- [ ] Dashboard 컴포넌트 구조 파악
- [ ] E2E 테스트 시나리오 작성

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- Plan: `/Users/gim-eunhyang/.claude/plans/joyful-zooming-moonbeam.md`
- `_build/n8n_workflows/entity_validator_autofiller.json` - 수정 대상
- `api/routers/ai.py` - API 수정 대상
- `_dashboard/js/components/pending.js` - Dashboard 수정 대상

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
