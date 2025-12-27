---
entity_type: Task
entity_id: tsk-n8n-02
entity_name: n8n 자동화 워크플로우 구축
created: 2025-12-27
updated: 2025-12-27
status: done

# === 계층 ===
parent_id: prj-n8n-entity-autofill
project_id: prj-n8n-entity-autofill
aliases:
- tsk-n8n-02

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: 김은향
start_date: 2025-12-27
due: 2025-12-27
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y:
- cond-e

# === 분류 ===
tags:
- n8n
- automation
- dashboard
- llm
priority_flag: high
---

# n8n 자동화 워크플로우 구축

> Task ID: `tsk-n8n-02` | Project: `prj-n8n-entity-autofill` | Status: doing

## 목표

**완료 조건**:
1. n8n REST API로 Entity Auto-filler 워크플로우 생성
2. 스키마 불일치 엔티티 탐지 + LLM 추론으로 제안값 생성
3. Dashboard에 "Pending Review" 뷰 추가
4. 사용자가 대시보드에서 제안값 승인/수정/거부 가능

---

## 상세 내용

### 배경

tsk-n8n-01에서 n8n Docker 배포 완료 (https://n8n.sosilab.synology.me).
이제 실제 워크플로우를 구성하고, 대시보드에 승인 UI를 추가해야 함.

### 작업 내용

1. **n8n REST API 설정**
   - n8n API 키 생성
   - API로 워크플로우 생성/활성화

2. **Workflow 1: Schema Validator + Auto-filler**
   - GET /api/tasks로 전체 Task 조회
   - 스키마 검증 (필수 필드 누락, 잘못된 값)
   - 확정적 추론 → 바로 채움
   - LLM 추론 필요 → pending 상태로 저장

3. **Dashboard Pending Review 뷰**
   - 승인 대기 엔티티 필터 뷰
   - 제안값 미리보기
   - 승인/수정/거부 버튼

---

## 체크리스트

- [ ] n8n API 키 생성 (Settings → API)
- [ ] n8n REST API로 워크플로우 생성 테스트
- [x] Schema Validator 워크플로우 구현 (`_build/n8n_workflows/entity_schema_validator.json`)
- [x] LLM 추론 노드 구현 (OpenAI GPT-4)
- [x] pending 상태 저장 방식 결정 (Option B: `_build/pending_reviews.json`)
- [x] Dashboard Pending Review 뷰 추가 (`_dashboard/js/components/pending-panel.js`)
- [x] 승인 API 엔드포인트 추가 (`api/routers/pending.py`)
- [x] End-to-End 테스트 (2025-12-27 완료)

---

## Notes

### 기술 스택

- **n8n API**: https://n8n.sosilab.synology.me/api/v1
- **LOOP API**: https://mcp.sosilab.synology.me
- **LLM**: OpenAI GPT-4
- **Dashboard**: _dashboard/ (Vanilla JS)

### 제안값 저장 방식 (결정 필요)

| 옵션 | 장점 | 단점 |
|------|------|------|
| A) Entity frontmatter에 `_pending` 필드 | 엔티티와 함께 관리 | 스키마 변경 필요 |
| B) 별도 `_pending_reviews.json` | 스키마 변경 없음 | 별도 파일 관리 |

### Todo
- [ ] n8n API 키 생성
- [ ] 워크플로우 JSON 구조 설계
- [ ] pending 저장 방식 결정
- [ ] Dashboard 뷰 설계

### 작업 로그

#### 2025-12-27 13:30 (최종 완료)
**개요**: n8n Entity Schema Validator 워크플로우 구축 완료. 스키마 검증 → LLM 추론 → Pending Review 생성 파이프라인 정상 작동 확인.

**변경사항**:
- 수정: `_build/n8n_workflows/entity_schema_validator.json` - VALID_STATUS에 'hold' 추가
- 수정: n8n IF 노드 커넥션 버그 수정 (TRUE/FALSE 분기 뒤바뀜 문제)
- 삭제: 28개 오염된 pending reviews (커넥션 버그로 생성된 데이터)

**테스트 결과**:
- n8n 워크플로우 실행 → ✅ 12/12 LLM 응답 성공
- 스키마 검증 로직 → ✅ 이슈 탐지 정확
- Pending Review API → ✅ GET/POST/DELETE 정상

**결과**: ✅ 기본 기능 완료

**다음 단계**:
- ⚠️ LLM 프롬프트 템플릿 치환 문제 (별도 Task로 진행)
- n8n original_task 데이터가 LLM에 전달되지 않는 이슈

---

#### 2025-12-27 11:00
**완료된 작업:**
1. `_build/pending_reviews.json` - Pending review 저장 파일 생성
2. `api/routers/pending.py` - REST API (GET/POST/APPROVE/REJECT/DELETE)
3. `_dashboard/js/components/pending-panel.js` - UI 패널 구현
4. `_build/n8n_workflows/entity_schema_validator.json` - n8n 워크플로우 JSON

**Codex 리뷰 피드백 수정:**
- Review ID 충돌 방지 (timestamp + random suffix)
- Badge async 로딩 이슈 수정 (await 추가)
- JSON 에러 처리 개선 (load_pending)
- 타입 보존 로직 추가 (parseFieldValue)

**E2E 테스트 완료 (2025-12-27 11:06):**
- GET /api/pending → ✅
- POST /api/pending → ✅
- DELETE /api/pending/{id} → ✅

---

## 참고 문서

- [[prj-n8n-entity-autofill]] - 소속 Project
- [[tsk-n8n-01]] - n8n Docker 배포 (선행 Task)
- https://docs.n8n.io/api/ - n8n API 문서

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
