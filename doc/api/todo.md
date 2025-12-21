# Dashboard API - TODO

**Project**: Dashboard API
**Last Updated**: 2025-12-21

---

## 완료된 작업

### API-001: Task 본문(body) 표시 기능

- [x] **API-001-1** API 서버에서 body 추출
  - 수정 파일: `scripts/api_server.py`
  - 작업 내용: `extract_frontmatter_and_body()` 함수 추가, `get_tasks()`에 `include_body` 파라미터 추가
  - 변경 사항:
    - `Tuple` import 추가
    - 새 함수: body를 함께 추출하여 `_body` 필드로 반환
    - 경로 검증: `is_relative_to(VAULT_DIR)` 추가
  - 완료일: 2025-12-21

- [x] **API-001-2** Dashboard에서 _body 표시
  - 수정 파일: `_dashboard/js/components/task-panel.js`
  - 작업 내용: `task.notes || task._body || ''` 폴백 로직 추가
  - 완료일: 2025-12-21

- [x] **API-001-3** Obsidian 링크 아이콘 추가
  - 수정 파일: `_dashboard/js/components/task-card.js`, `_dashboard/css/kanban.css`
  - 작업 내용:
    - `getObsidianUri()` 헬퍼 함수 추가
    - Task 카드에 📝 아이콘 버튼 추가
    - `.btn-obsidian` CSS 스타일 추가
  - 완료일: 2025-12-21

---

## 진행 중

(없음)

---

## 예정된 작업

### Phase 2: 추가 기능

- [ ] **API-002** Project 본문 표시
- [ ] **API-003** 검색 기능

---

## 알려진 이슈

### ISS-001: Task 본문이 대시보드에서 안 보임
- **원인**: `extract_frontmatter()`가 YAML만 추출, body 무시
- **영향**: tsk:008-01 등 상세 내용이 있는 Task의 본문이 보이지 않음
- **해결**: API-001 작업으로 해결 예정

---

## 작업 기록 가이드

**작업 시작 시**:
```
- [ ] **TASK-XXX** 태스크 제목
  - 예상 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 무엇을 할 것인지
  - 우선순위: High/Medium/Low
```

**작업 완료 시**:
```
- [x] **TASK-XXX** 태스크 제목
  - 수정 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 실제 수행한 작업 설명
  - 변경 사항: 구체적인 변경 내용
  - 완료일: YYYY-MM-DD
```

---

**Last Updated**: 2025-12-21
