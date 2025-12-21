# New Project

> 새 프로젝트를 생성합니다.

---

## 실행 시 동작

이 커맨드는 `loop-entity-creator` 스킬을 **Project 생성 모드**로 실행합니다.

**워크플로우 위치**: [[TEAM_WORKFLOW]] 1단계 (일의 시작)

---

## 수행 단계

1. **정보 수집**
   - 프로젝트 이름 (entity_name)
   - 책임자 (owner) - members.yaml에서 선택
   - 상위 Track/Hypothesis ID (parent_id)
   - 우선순위 (priority_flag) - 선택사항

2. **Expected Impact 설정** (통합됨)
   - **자동 채우기** → LLM이 tier/magnitude/confidence 제안
   - **None으로 설정** → Impact 계산 불필요한 operational 프로젝트
   - **나중에 채우기** → 일단 null로 생성

3. **자동 처리**
   - 다음 Project ID 자동 생성 (prj-NNN)
   - 프로젝트 폴더 구조 생성
   - Project_정의.md 파일 생성 (expected_impact 포함)
   - Schema validation 실행
   - Graph index 업데이트

4. **결과 확인**
   - 생성된 파일 경로 표시
   - validation 결과 표시

---

## 사용 예시

```
사용자: 와디즈 펀딩 프로젝트를 진행할거야. 목표는 매출 1200만원이고,
      코칭 서비스의 첫 크라우드펀딩 테스트야.

/new-project
```

또는:

```
/new-project 패턴 발견 v2 프로젝트
```

---

## 다음 단계

프로젝트 생성 후:
1. `/new-task` 로 세부 태스크 추가
2. (선택) Impact를 "나중에"로 설정했다면 → `/auto-fill-project-impact` 실행

---

## 참조

- [[TEAM_GUIDE_Task_Project_생성#Project 만들기]] - 상세 가이드
- `loop-entity-creator` 스킬 - 실제 실행 로직