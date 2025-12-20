# New Task

> 새 태스크를 생성합니다.

---

## 실행 시 동작

이 커맨드는 `loop-entity-creator` 스킬을 **Task 생성 모드**로 실행합니다.

**워크플로우 위치**: [[TEAM_WORKFLOW]] 3단계 (실행 단계)

---

## 수행 단계

1. **정보 수집**
   - 태스크 이름 (entity_name)
   - 프로젝트 ID (project_id) - 필수
   - 담당자 (assignee) - members.yaml에서 선택
   - 상위 태스크 ID (parent_id) - 선택사항
   - 우선순위 (priority_flag) - 선택사항

2. **자동 처리**
   - 다음 Task ID 자동 생성 (tsk:NNN-NN)
   - Task 파일 생성
   - Schema validation 실행
   - Graph index 업데이트

3. **결과 확인**
   - 생성된 파일 경로 표시
   - validation 결과 표시

---

## 사용 예시

```
사용자: 상세페이지 제작 태스크 만들어줘

/new-task
```

또는:

```
/new-task prj:010에 광고 소재 제작 태스크 추가
```

---

## Task의 특성

- 전략 판단 ❌ (Project에서만)
- Impact 필드 ❌ (Project에서만)
- 실행 기록만 ⭕

> Task는 많아도 상관없고, 아무리 사소해도 괜찮다.

---

## 참조

- [[TEAM_GUIDE_Task_Project_생성#Task 만들기]] - 상세 가이드
- `loop-entity-creator` 스킬 - 실제 실행 로직