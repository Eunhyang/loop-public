---
entity_type: Task
entity_id: tsk-n8n-22
entity_name: Retro Synth - B Score 계산 fallback 시스템
created: 2026-01-06
updated: '2026-01-12'
status: doing
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-22
- Retro Synth
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: '2026-01-12'
due: '2026-01-12'
priority: high
estimated_hours: 8
actual_hours: null
type: dev
target_project: loop
tags:
- n8n
- evidence
- llm
- automation
- b-score
priority_flag: high
notes: "# Retro Synth - B Score 계산 fallback 시스템\n\n> Task ID: `tsk-n8n-22` | Project:\
  \ `prj-n8n` | Status: doing\n\n## 목표\n\n회고가 부족할 때 첨부파일/회의록에서 **출처 기반 증거 패키지**를 자동\
  \ 합성하여 B Score 계산의 공백을 메우는 fallback 시스템 구현.\n\n**완료 조건**:\n\n1. Evidence Quality\
  \ Gate 노드가 weak/medium/strong 판정\n2. weak 판정 시 Retro Synth 노드가 LLM으로 Facts + Unknowns\
  \ 추출\n3. 출처 없는 수치/성과 자동 제거 (환각 방지)\n4. Audit Log 파일 생성 및 Pending Review에 경로 전달\n\
  5. Dashboard에서 AUTO-SYNTH 뱃지 및 Audit Log 버튼 표시\n\n---\n\n## 상세 내용\n\n### 배경\n\n\
  B Score 계산을 위해서는 프로젝트 종료 후 회고(retrospective)가 필요합니다. 하지만 현실에서는:\n\n- 회고를 작성하지 않거나\n\
  - 회고 내용이 빈약하거나\n- 정량적 데이터가 누락되는 경우가 많습니다.\n\n이로 인해 B Score 계산이 불가능하거나, Evidence\
  \ Router가 부정확한 결과를 생성합니다.\n\n### 핵심 원칙\n\n1. **출처 없는 수치/성과 금지**: LLM이 생성하더라도 원본\
  \ 문서에서 인용 불가하면 제거\n2. **기존 Evidence API 최대 재활용**: 새로운 API 없이 기존 인프라 활용\n3. **인간\
  \ 승인 게이트 유지**: 자동 생성된 Evidence도 Pending Review 거침\n\n### 아키텍처\n\n**현재 흐름:**\n\n\
  ```\nExtract Attachment Texts → Call AI Router (Evidence) → Pending Review\n```\n\
  \n**변경 후 흐름:**\n\n```\nExtract Attachment Texts\n    → Evidence Quality Gate (신규)\n\
  \        → Route by Quality (신규)\n            ├─ strong/medium → [직접 Evidence API]\n\
  \            └─ weak → Get First Task (신규)\n                    → Retro Synth (신규)\n\
  \                        → Save Retro Logs (신규)\n                            → [병합]\n\
  \    → Call AI Router (Evidence) (기존)\n        → Pending Review (audit_log_path\
  \ 추가)\n```\n\n---\n\n## 구현 범위\n\n### 1. n8n 워크플로우 수정\n\n**파일**: `public/_build/n8n_workflows/entity_validator_autofiller.json`\n\
  \n**추가 노드** (6개):\n\n- A. Evidence Quality Gate (Code 노드)\n- B. Route by Quality\
  \ (Switch 노드)\n- C. Get First Task (HTTP Request 노드)\n- D. Retro Synth (Code 노드\
  \ with OpenAI)\n- E. Save Retro Logs (Code 노드)\n- F. Merge Point\n\n### 2. API 수정\n\
  \n**파일**: `public/api/routers/ai.py`\n\n**변경사항**:\n\n- InferEvidenceRequest에 `synth_audit_log_path`\
  \ 필드 추가\n- create_pending_review에 `audit_log_path` 파라미터 추가\n- Pending Review 응답에\
  \ audit_log_path 포함\n\n### 3. Dashboard 연동\n\n**파일**: `public/_dashboard/js/components/pending.js`\n\
  \n**변경사항**:\n\n- AUTO-SYNTH 뱃지 (source_workflow='retro-synth'일 때)\n- Audit Log 버튼\
  \ + 모달\n\n---\n\n## 체크리스트\n\n- [x] Evidence Quality Gate 노드 구현\n\n- [x] Route by\
  \ Quality (Switch) 노드 구현\n\n- [x] Get First Task (HTTP) 노드 구현\n\n- [x] Retro Synth\
  \ (LLM) 노드 구현\n\n- [x] Save Retro Logs 노드 구현\n\n- [x] 노드 연결 및 Merge Point 설정\n\n\
  - [x] InferEvidenceRequest 모델 수정\n\n- [x] create_pending_review 함수 수정\n\n- [x] Dashboard\
  \ AUTO-SYNTH 뱃지 추가\n\n- [x] Dashboard Audit Log 버튼/모달 추가\n\n- [ ] 수동 테스트 완료\n\n\
  - [x] 코드 리뷰 통과\n\n---\n\n## Notes\n\n### Tech Spec\n\n**n8n 노드 상세:**\n\nA. Evidence\
  \ Quality Gate\n\n```javascript\nconst text = $json.api_request.retrospective_content\
  \ || \"\";\nconst totalChars = text.length;\nconst numericMentions = (text.match(/\\\
  d+[.%]|\\$\\d+|₩\\d+/g) || []).length;\nconst kpiHits = (text.match(/매출|전환율|DAU|MAU|리텐션/gi)\
  \ || []).length;\nconst hasGoalActual = /목표.*?실제|달성|대비/.test(text);\nconst hasTimeframe\
  \ = /\\d{4}-\\d{2}|\\d+월/.test(text);\n\nlet verdict = \"weak\";\nif (totalChars\
  \ >= 8000 && numericMentions >= 8 && kpiHits >= 3 && hasTimeframe) {\n  verdict\
  \ = \"strong\";\n} else if (totalChars >= 3000 && numericMentions >= 3 && kpiHits\
  \ >= 1) {\n  verdict = \"medium\";\n}\n\nconst needsRetroSynth = (verdict === \"\
  weak\") && (totalChars < 1500 || numericMentions < 2);\n```\n\nD. Retro Synth 시스템\
  \ 프롬프트\n\n```\nYou are a retrospective synthesis expert. Extract ONLY facts explicitly\
  \ stated in documents.\n\nCRITICAL RULES:\n1. NO SPECULATION - If not stated, mark\
  \ as \"unknown\"\n2. SOURCE CITATION REQUIRED - Every fact needs source_quote +\
  \ source_id\n3. ZERO is better than GUESSING\n\nOutput: JSON (no markdown)\n```\n\
  \n**API 스키마:**\n\n```python\nclass InferEvidenceRequest(BaseModel):\n    # ... 기존\
  \ 필드 ...\n    synth_audit_log_path: Optional[str] = Field(default=None, description=\"\
  Retro Synth 로그 경로\")\n```\n\n### Todo\n\n- [x] n8n 워크플로우 JSON 분석\n\n- [x] 노드 추가\
  \ 위치 확정\n\n- [x] LLM 프롬프트 최적화\n\n- [x] 환각 방지 후처리 검증\n\n- [x] Dashboard 컴포넌트 구조 파악\n\
  \n- [ ] E2E 테스트 시나리오 작성\n\n### 작업 로그\n\n2026-01-06 (Claude Code)\n\n**개요**: Retro\
  \ Synth - B Score 계산 fallback 시스템 구현 완료. 회고가 부족할 때 첨부파일에서 출처 기반 사실을 자동 추출하여 B Score\
  \ 계산의 공백을 메우는 시스템.\n\n**변경사항**:\n\n1. **n8n 워크플로우** (`_build/n8n_workflows/entity_validator_autofiller.json`):\n\
  \n   - 6개 노드 추가: Evidence Quality Gate, Route by Quality, Get First Task, Retro\
  \ Synth, Save Retro Logs, Merge Quality Routes\n   - connections 업데이트: Extract Attachment\
  \ Texts -&gt; Evidence Quality Gate -&gt; Route by Quality -&gt; (분기)\n   - 버전 v7\
  \ -&gt; v8 업그레이드\n\n2. **API** (`api/routers/ai.py`):\n\n   - `InferEvidenceRequest`\
  \ 모델에 `synth_audit_log_path` 필드 추가\n   - `create_pending_review()` 함수에 `audit_log_path`\
  \ 파라미터 추가\n   - Evidence pending review 생성 시 audit_log_path 포함\n\n3. **Dashboard**\
  \ (`_dashboard/js/components/pending-panel.js`, `_dashboard/css/panel.css`):\n\n\
  \   - AUTO-SYNTH 뱃지 추가 (source_workflow === 'retro-synth')\n   - Audit Log 버튼/모달\
  \ 추가 (audit_log_path 존재 시)\n   - viewAuditLog(), showAuditLogModal(), closeAuditLogModal()\
  \ 함수 추가\n   - 관련 CSS 스타일 추가\n\n**핵심 코드**:\n\n```javascript\n// Evidence Quality\
  \ Gate - 품질 판정 로직\nlet verdict = 'weak';\nif (totalChars >= 8000 && numericMentions\
  \ >= 8 && kpiHits >= 3 && hasTimeframe) {\n  verdict = 'strong';\n} else if (totalChars\
  \ >= 3000 && numericMentions >= 3 && kpiHits >= 1) {\n  verdict = 'medium';\n}\n\
  const needsRetroSynth = verdict === 'weak' && (totalChars < 1500 || numericMentions\
  \ < 2);\n\n// Retro Synth - 환각 방지 후처리\nconst validFacts = (parsed.facts || []).filter(f\
  \ =>\n  f.source_quote && f.source_quote.length > 10 &&\n  f.source_id && f.source_id.length\
  \ > 0\n);\n```\n\n**결과**: JSON/Python 구문 검증 통과\n\n**다음 단계**:\n\n- n8n에서 실제 워크플로우\
  \ 테스트\n- E2E 테스트 시나리오 작성\n\n2026-01-06 v8.1 업데이트\n\n**개요**: 첨부파일 분기 로직 추가. 첨부파일이\
  \ 없으면 Retro Synth 스킵하고 기본 Evidence API 호출.\n\n**변경사항**:\n\n1. **Evidence Quality\
  \ Gate 노드 수정** (`entity_validator_autofiller.json`):\n   - `hasAttachments` 체크 추가:\
  \ `item.attachment_stats?.total_extracted > 0`\n   - `needsRetroSynth` 조건 수정: `hasAttachments\
  \ && verdict === 'weak'`\n   - quality_gate 출력에 `has_attachments` 필드 추가\n\n**핵심\
  \ 코드**:\n\n```javascript\n// 첨부파일 존재 여부 확인\nconst hasAttachments = item.attachment_stats?.total_extracted\
  \ > 0;\n\n// Retro Synth 필요 여부 - 첨부파일이 있는 경우에만 판정\nconst needsRetroSynth = hasAttachments\
  \ && verdict === 'weak' && (totalChars < 1500 || numericMentions < 2);\n```\n\n\
  **분기 로직**:\n\n```\nExtract Attachment Texts → Evidence Quality Gate\n          \
  \                 ├─ 첨부파일 없음 (has_attachments=false) → 기본 Evidence API\n       \
  \                    ├─ 첨부파일 있음 + strong/medium → 기본 Evidence API\n            \
  \               └─ 첨부파일 있음 + weak → Retro Synth 경로\n```\n\n**결과**: v8 → v8.1 버전\
  \ 업그레이드\n\n---\n\n## 참고 문서\n\n- \\[\\[prj-n8n\\]\\] - 소속 Project\n- Plan: `/Users/gim-eunhyang/.claude/plans/joyful-zooming-moonbeam.md`\n\
  - `_build/n8n_workflows/entity_validator_autofiller.json` - 수정 대상\n- `api/routers/ai.py`\
  \ - API 수정 대상\n- `_dashboard/js/components/pending.js` - Dashboard 수정 대상\n\n---\n\
  \n**Created**: 2026-01-06 **Assignee**: 김은향 **Due**: 2026-01-06"
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

- [x] Evidence Quality Gate 노드 구현
- [x] Route by Quality (Switch) 노드 구현
- [x] Get First Task (HTTP) 노드 구현
- [x] Retro Synth (LLM) 노드 구현
- [x] Save Retro Logs 노드 구현
- [x] 노드 연결 및 Merge Point 설정
- [x] InferEvidenceRequest 모델 수정
- [x] create_pending_review 함수 수정
- [x] Dashboard AUTO-SYNTH 뱃지 추가
- [x] Dashboard Audit Log 버튼/모달 추가
- [ ] 수동 테스트 완료
- [x] 코드 리뷰 통과

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
- [x] n8n 워크플로우 JSON 분석
- [x] 노드 추가 위치 확정
- [x] LLM 프롬프트 최적화
- [x] 환각 방지 후처리 검증
- [x] Dashboard 컴포넌트 구조 파악
- [ ] E2E 테스트 시나리오 작성

### 작업 로그

#### 2026-01-06 (Claude Code)

**개요**: Retro Synth - B Score 계산 fallback 시스템 구현 완료. 회고가 부족할 때 첨부파일에서 출처 기반 사실을 자동 추출하여 B Score 계산의 공백을 메우는 시스템.

**변경사항**:

1. **n8n 워크플로우** (`_build/n8n_workflows/entity_validator_autofiller.json`):
   - 6개 노드 추가: Evidence Quality Gate, Route by Quality, Get First Task, Retro Synth, Save Retro Logs, Merge Quality Routes
   - connections 업데이트: Extract Attachment Texts -> Evidence Quality Gate -> Route by Quality -> (분기)
   - 버전 v7 -> v8 업그레이드

2. **API** (`api/routers/ai.py`):
   - `InferEvidenceRequest` 모델에 `synth_audit_log_path` 필드 추가
   - `create_pending_review()` 함수에 `audit_log_path` 파라미터 추가
   - Evidence pending review 생성 시 audit_log_path 포함

3. **Dashboard** (`_dashboard/js/components/pending-panel.js`, `_dashboard/css/panel.css`):
   - AUTO-SYNTH 뱃지 추가 (source_workflow === 'retro-synth')
   - Audit Log 버튼/모달 추가 (audit_log_path 존재 시)
   - viewAuditLog(), showAuditLogModal(), closeAuditLogModal() 함수 추가
   - 관련 CSS 스타일 추가

**핵심 코드**:

```javascript
// Evidence Quality Gate - 품질 판정 로직
let verdict = 'weak';
if (totalChars >= 8000 && numericMentions >= 8 && kpiHits >= 3 && hasTimeframe) {
  verdict = 'strong';
} else if (totalChars >= 3000 && numericMentions >= 3 && kpiHits >= 1) {
  verdict = 'medium';
}
const needsRetroSynth = verdict === 'weak' && (totalChars < 1500 || numericMentions < 2);

// Retro Synth - 환각 방지 후처리
const validFacts = (parsed.facts || []).filter(f =>
  f.source_quote && f.source_quote.length > 10 &&
  f.source_id && f.source_id.length > 0
);
```

**결과**: JSON/Python 구문 검증 통과

**다음 단계**:
- n8n에서 실제 워크플로우 테스트
- E2E 테스트 시나리오 작성

#### 2026-01-06 v8.1 업데이트

**개요**: 첨부파일 분기 로직 추가. 첨부파일이 없으면 Retro Synth 스킵하고 기본 Evidence API 호출.

**변경사항**:

1. **Evidence Quality Gate 노드 수정** (`entity_validator_autofiller.json`):
   - `hasAttachments` 체크 추가: `item.attachment_stats?.total_extracted > 0`
   - `needsRetroSynth` 조건 수정: `hasAttachments && verdict === 'weak'`
   - quality_gate 출력에 `has_attachments` 필드 추가

**핵심 코드**:
```javascript
// 첨부파일 존재 여부 확인
const hasAttachments = item.attachment_stats?.total_extracted > 0;

// Retro Synth 필요 여부 - 첨부파일이 있는 경우에만 판정
const needsRetroSynth = hasAttachments && verdict === 'weak' && (totalChars < 1500 || numericMentions < 2);
```

**분기 로직**:
```
Extract Attachment Texts → Evidence Quality Gate
                           ├─ 첨부파일 없음 (has_attachments=false) → 기본 Evidence API
                           ├─ 첨부파일 있음 + strong/medium → 기본 Evidence API
                           └─ 첨부파일 있음 + weak → Retro Synth 경로
```

**결과**: v8 → v8.1 버전 업그레이드


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
