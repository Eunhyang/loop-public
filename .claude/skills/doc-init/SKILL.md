---
name: doc-init
description: |
  프로젝트 문서 초기화 스킬. doc/{프로젝트}/ 폴더에 todo.md, techspec.md 템플릿 생성.
  사용 시점: (1) 새 프로젝트 문서 시작, (2) "/doc-init {프로젝트명}" 실행,
  (3) 사용자가 "프로젝트 문서 만들어줘", "todo.md 초기화" 요청 시.
---

# Doc Init

프로젝트 문서 초기화. `doc/{프로젝트}/` 폴더에 `todo.md`, `techspec.md` 생성.

## 실행 절차

1. 프로젝트명 확인 (인자 또는 질문)
2. `doc/{프로젝트}/` 폴더 생성
3. `todo.md` 생성 (아래 템플릿)
4. `techspec.md` 생성 (아래 템플릿)
5. 완료 메시지 출력

## todo.md 템플릿

```markdown
# {프로젝트명} - TODO

**Project**: {프로젝트명}
**Last Updated**: {오늘날짜}

---

## 완료된 작업

(없음)

---

## 진행 중

(없음)

---

## 예정된 작업

### Phase 1: 기본 구현

- [ ] **TASK-001** 첫 번째 작업
  - 예상 파일: `파일경로`
  - 작업 내용: 설명
  - 우선순위: High/Medium/Low

---

## 알려진 이슈

(없음)

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

**Last Updated**: {오늘날짜}
```

## techspec.md 템플릿

```markdown
# {프로젝트명} - Technical Specification

**Project**: {프로젝트명}
**Version**: 0.1.0
**Last Updated**: {오늘날짜}
**Status**: Planning

---

## 1. 개요

### 목적

{프로젝트 목적 설명}

### 핵심 기능

- 기능 1
- 기능 2
- 기능 3

---

## 2. 아키텍처

### 기술 스택

- **Language**:
- **Framework**:
- **Database**:

### 디렉토리 구조

```
{프로젝트}/
├── src/
├── tests/
└── docs/
```

### 데이터 흐름

```
Input → Processing → Output
```

---

## 3. API 엔드포인트

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/example | 예시 |

---

## 4. 데이터 모델

### ExampleModel

```python
class ExampleModel(BaseModel):
    id: str
    name: str
    created: datetime
```

---

## 5. 보안 고려사항

- [ ] 인증
- [ ] 권한 관리
- [ ] Input Validation

---

## 6. 성능 고려사항

- [ ] 캐싱
- [ ] 인덱싱
- [ ] 비동기 처리

---

## 7. 테스트 전략

- [ ] Unit Test
- [ ] Integration Test
- [ ] E2E Test

---

## 8. 배포

### 개발 환경

```bash
# 개발 서버 실행
```

### 프로덕션 환경

```bash
# 프로덕션 배포
```

---

## 9. 아키텍처 결정 기록 (ADR)

### ADR-001: {결정 제목}

- **날짜**: {오늘날짜}
- **결정**:
- **이유**:
- **영향**:

---

**Version**: 0.1.0
**Status**: Living Document
```

## 변수 치환

| 변수 | 설명 |
|------|------|
| `{프로젝트명}` | 사용자가 입력한 프로젝트 이름 |
| `{오늘날짜}` | 현재 날짜 (YYYY-MM-DD) |