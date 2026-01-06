---
entity_type: Task
entity_id: tsk-n8n-21
entity_name: Pending Review - 새로고침 기능 (개별 엔티티 재추론 API 및 Dashboard UI)
created: 2026-01-06
updated: '2026-01-06'
closed: '2026-01-06'
status: done
project_id: prj-n8n
parent_project: prj-n8n
assignee: 김은향
type: dev
target_project: loop
due: null
conditions_3y:
  - cond-e
priority: medium
tags:
  - task
  - dev
  - pending-reviews
  - api
  - dashboard
---

# Pending Review - 새로고침 기능 (개별 엔티티 재추론 API 및 Dashboard UI)

> Task ID: `tsk-n8n-21` | Project: `prj-n8n` | Status: done

---

## Goal

사용자가 Pending Reviews에서 특정 review의 suggested_fields가 마음에 안 들 때, 해당 엔티티에 대해 LLM 추론을 다시 실행하여 새로운 제안값을 받을 수 있는 기능 구현.

---

## Background

### 현재 구조

- pending review에는 `source_workflow` 필드가 있음 (어떤 워크플로우에서 생성되었는지)
- 각 워크플로우별 개별 추론 API가 이미 존재:
  - `POST /api/autofill/expected-impact` - project_id로 A Score 재추론
  - `POST /api/autofill/realized-impact` - project_id로 B Score 재추론
  - `POST /api/ai/infer/hypothesis_draft` - project_id로 Hypothesis 재추론
  - `POST /api/ai/infer/evidence` - project_id로 Evidence 재추론

### 구현 필요 사항

1. **API**: `POST /api/pending/{review_id}/refresh` 엔드포인트
   - pending review의 source_workflow + entity_id 확인
   - 해당 추론 API 재호출
   - 기존 pending review의 suggested_fields 갱신

2. **Dashboard UI**: Pending Reviews 뷰에 새로고침 버튼 추가
   - 각 pending review 항목에 새로고침 버튼
   - 클릭 시 refresh API 호출
   - 결과 반영 후 UI 갱신

---

## Tech Spec

### API 구현

**파일**: `api/routers/pending.py`

**엔드포인트**: `POST /api/pending/{review_id}/refresh`

**로직**:
```python
1. review_id로 pending review 조회
2. source_workflow 확인
3. 워크플로우별 재추론 API 호출:
   - entity-validator-expected-impact → POST /api/autofill/expected-impact
   - entity-validator-realized-impact → POST /api/autofill/realized-impact
   - hypothesis-seeder → POST /api/ai/infer/hypothesis_draft
   - evidence-seeder → POST /api/ai/infer/evidence
   - 기타 task/project schema → POST /api/ai/infer/{type}_schema
4. 기존 pending review의 suggested_fields, reasoning 갱신
5. updated_at 갱신
6. 결과 반환
```

**응답 모델**:
```python
class RefreshResponse(BaseModel):
    success: bool
    review_id: str
    previous_fields: Dict[str, Any]
    new_fields: Dict[str, Any]
    reasoning: Dict[str, str]
    run_id: str
    error: Optional[str] = None
```

### Dashboard UI 구현

**파일**: `_dashboard/js/components/pending-panel.js`

**변경사항**:
1. 각 pending review 카드 또는 상세 패널에 새로고침 버튼 추가
2. `refreshReview(reviewId)` 메서드 구현
3. API.refreshPendingReview(reviewId) 호출
4. 성공 시 currentReview 갱신 + UI 리렌더

**UI 배치**:
- 상세 패널 헤더에 새로고침 아이콘 버튼
- 또는 Approve/Reject 버튼 옆에 Refresh 버튼

---

## Todo

- [ ] `POST /api/pending/{review_id}/refresh` 엔드포인트 구현
- [ ] source_workflow → 추론 API 매핑 로직 구현
- [ ] pending review 갱신 로직 구현
- [ ] Dashboard API.refreshPendingReview 메서드 추가
- [ ] PendingPanel.refreshReview 메서드 구현
- [ ] UI에 새로고침 버튼 추가
- [ ] 로딩 상태 및 에러 처리
- [ ] 테스트

---

## Notes

### source_workflow 매핑 테이블

| source_workflow | 재추론 API | 필요 파라미터 |
|----------------|-----------|--------------|
| `entity-validator-expected-impact` | `/api/autofill/expected-impact` | project_id |
| `entity-validator-realized-impact` | `/api/autofill/realized-impact` | project_id |
| `hypothesis-seeder` | `/api/ai/infer/hypothesis_draft` | project_id |
| `evidence-seeder` | `/api/ai/infer/evidence` | project_id |
| `entity-validator-task` | `/api/ai/infer/task_schema` | task_id |
| `entity-validator-project` | `/api/ai/infer/project_schema` | project_id |

### 주의사항

- entity_type이 Evidence인 경우 entity_id가 project_id임 (evidence는 approve 시 생성)
- refresh 후에도 pending 상태 유지 (approve/reject는 별도)
- run_id를 새로 생성하여 audit log에 기록

---

### 작업 로그

#### 2026-01-06 완료
**개요**: Pending Review 새로고침 기능 구현 완료. 사용자가 suggested_fields가 마음에 안 들 때 개별 엔티티에 대해 LLM 추론을 재실행할 수 있는 기능을 API와 Dashboard UI에 추가.

**변경사항**:
- 개발: `POST /api/pending/{review_id}/refresh` 엔드포인트 구현
- 개발: source_workflow별 재추론 API 매핑 로직 구현
- 개발: pending review 갱신 로직 (suggested_fields, reasoning, updated_at)
- 개발: Dashboard API.refreshPendingReview 메서드 추가
- 개발: PendingPanel.refreshReview 메서드 구현
- 개발: Refresh 버튼 UI 추가 (상세 패널 헤더)
- 개발: 로딩 상태 및 에러 처리 구현

**파일 변경**:
- `api/routers/pending.py` - refresh 엔드포인트 및 워크플로우 매핑 로직
- `_dashboard/js/api.js` - refreshPendingReview API 메서드
- `_dashboard/js/components/pending-panel.js` - refreshReview 핸들러 및 Refresh 버튼 UI
- `_dashboard/css/panel.css` - Refresh 버튼 스타일

**결과**: Task 완료 (status: doing -> done)

---

## Related

- [[prj-n8n]] - 소속 Project
- tsk-n8n-18 - Pending Reviews 워크플로우 필터링 및 일괄 삭제
- tsk-n8n-13 - Pending Reviews 필드 선택 UX 개선
