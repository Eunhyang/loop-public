---
name: doc-init
description: "범용 프로젝트 문서 초기화. doc/{프로젝트명}/ 폴더에 todo.md, techspec.md 템플릿 생성. LOOP, sosi-flutter, kkokkkok-web 모든 프로젝트에서 사용 가능. 사용 시점: (1) 새 개발 작업 시작, (2) /doc-init {프로젝트명} 실행, (3) 사용자가 프로젝트 문서 만들어줘, todo 초기화, techspec 생성 요청 시."
---

# Doc Init

범용 프로젝트 문서 초기화 스킬. 모든 프로젝트(LOOP, sosi-flutter, kkokkkok-web 등)에서 `doc/{프로젝트명}/` 폴더에 `todo.md`, `techspec.md` 템플릿을 생성합니다.

## When to Use

이 스킬은 다음 상황에서 사용합니다:
- 새 개발 작업을 시작할 때 문서 구조가 필요한 경우
- `/doc-init {프로젝트명}` 명령 실행 시
- 사용자가 "문서 만들어줘", "todo 초기화", "techspec 생성" 요청 시

**지원 프로젝트:**
- LOOP vault: `/Volumes/LOOP_CORE/vault/LOOP/doc/`
- SoSi Flutter: `/Users/gim-eunhyang/dev/flutter/sosi/doc/`
- KkokKkokFit Web: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web/doc/`
- 기타: 현재 작업 디렉토리의 `doc/` 폴더

## Workflow

```
[1. 프로젝트 정보 수집]
├── 프로젝트명 확인 (인자 또는 질문)
├── 프로젝트 루트 결정 (자동 감지 또는 질문)
└── 기존 문서 존재 여부 확인

[2. 폴더 생성]
├── doc/{프로젝트명}/ 폴더 생성
└── 이미 존재하면 덮어쓰기 확인

[3. todo.md 생성]
├── 템플릿 적용
├── 프로젝트명, 날짜 치환
└── Phase 구조로 태스크 정리

[4. techspec.md 생성]
├── 템플릿 적용
├── 프로젝트명, 날짜 치환
└── 기술 스펙 섹션 구성

[5. 완료 안내]
├── 생성된 파일 경로 출력
└── 다음 단계 안내
```

## Step-by-Step Execution

### Step 1: 프로젝트 정보 수집

**1.1 프로젝트명 확인**

인자로 전달되지 않은 경우 AskUserQuestion으로 질문:
```
프로젝트명을 입력해주세요 (예: chatgpt-mcp-oauth, api-refactor)
```

**1.2 프로젝트 루트 결정**

현재 작업 디렉토리를 기반으로 자동 감지:

| 현재 디렉토리 패턴 | doc 경로 |
|-------------------|----------|
| `/Volumes/LOOP_CORE/vault/LOOP` | `./doc/` |
| `*/sosi*` | `./doc/` |
| `*/kkokkkokfit*` | `./doc/` |
| 기타 | 질문으로 확인 |

**1.3 기존 문서 확인**

`doc/{프로젝트명}/` 폴더가 이미 존재하는 경우:
```
이 프로젝트에 이미 문서가 존재합니다:
- doc/{프로젝트명}/todo.md
- doc/{프로젝트명}/techspec.md

덮어쓸까요? [Y/n]
```

### Step 2: 폴더 생성

```bash
mkdir -p doc/{프로젝트명}
```

### Step 3: todo.md 생성

Write 도구로 다음 템플릿 적용:

```markdown
# {프로젝트명} - Task List

> {프로젝트 한 줄 설명}

## Current Status: Planning

---

## Phase 1: 기본 구현

- [ ] **{PREFIX}-001** 첫 번째 태스크
  - 파일: `경로/파일.확장자`
  - 작업: 작업 내용 설명
  - 의존성: 필요한 패키지/모듈

- [ ] **{PREFIX}-002** 두 번째 태스크
  - 파일: `경로/파일.확장자`
  - 작업: 작업 내용 설명

---

## Phase 2: 고급 기능

- [ ] **{PREFIX}-003** 세 번째 태스크
  - 파일: `경로/파일.확장자`
  - 작업: 작업 내용 설명

---

## Phase 3: 테스트 및 배포

- [ ] **{PREFIX}-004** 테스트
  - 작업: 단위 테스트, 통합 테스트

- [ ] **{PREFIX}-005** 배포
  - 작업: 빌드, 배포, 검증

---

## Completed Tasks

(완료된 태스크는 여기로 이동)

---

**Last Updated**: {날짜}
```

**변수 치환:**
- `{프로젝트명}`: 사용자 입력 (예: chatgpt-mcp-oauth)
- `{PREFIX}`: 프로젝트명에서 추출한 대문자 약어 (예: OAUTH, API)
- `{날짜}`: 현재 날짜 (YYYY-MM-DD)

### Step 4: techspec.md 생성

Write 도구로 다음 템플릿 적용:

```markdown
# {프로젝트명} - Technical Specification

> {프로젝트 목표 한 줄 설명}

## 1. Project Overview

### 1.1 Goal

{프로젝트 목표 상세 설명}

### 1.2 Current State

{현재 상태 설명}

### 1.3 Target State

{목표 상태 설명}

---

## 2. Architecture

### 2.1 System Flow

```
[컴포넌트 1] ──> [컴포넌트 2] ──> [컴포넌트 3]
```

### 2.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Language | |
| Framework | |
| Database | |
| Deployment | |

### 2.3 Directory Structure

```
project/
├── src/
├── tests/
└── docs/
```

---

## 3. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/example | 예시 |

---

## 4. Data Models

### 4.1 ExampleModel

```python
class ExampleModel:
    id: str
    name: str
    created_at: datetime
```

---

## 5. Implementation Plan

### Phase 1: Core

| Task | Files | Description |
|------|-------|-------------|
| 001 | `file.py` | 설명 |

### Phase 2: Advanced

| Task | Files | Description |
|------|-------|-------------|
| 002 | `file.py` | 설명 |

---

## 6. Testing Strategy

- [ ] Unit Tests
- [ ] Integration Tests
- [ ] E2E Tests

---

## 7. Deployment

### Development

```bash
# 개발 서버 실행
```

### Production

```bash
# 프로덕션 배포
```

---

## 8. ADR (Architecture Decision Records)

### ADR-001: {결정 제목}

- **Date**: {날짜}
- **Decision**:
- **Reason**:
- **Impact**:

---

**Version**: 0.1.0
**Last Updated**: {날짜}
```

### Step 5: 완료 안내

```
## 문서 초기화 완료

**프로젝트**: {프로젝트명}
**경로**: doc/{프로젝트명}/

### 생성된 파일
- `todo.md` - 태스크 관리
- `techspec.md` - 기술 명세

### 다음 단계
1. `techspec.md`에서 프로젝트 목표/아키텍처 정의
2. `todo.md`에서 Phase별 태스크 구체화
3. 작업 시작!
```

## Example Usage

### 기본 사용

```
사용자: /doc-init chatgpt-mcp-oauth

Claude: 문서를 초기화합니다.

        **프로젝트**: chatgpt-mcp-oauth
        **경로**: doc/chatgpt-mcp-oauth/

        폴더를 생성하고 템플릿을 적용합니다...

        ## 문서 초기화 완료

        ### 생성된 파일
        - `doc/chatgpt-mcp-oauth/todo.md`
        - `doc/chatgpt-mcp-oauth/techspec.md`

        다음 단계: techspec.md에서 프로젝트 목표를 정의하세요.
```

### 프로젝트명 없이 실행

```
사용자: /doc-init

Claude: 프로젝트명을 입력해주세요.

        예시:
        - api-refactor
        - oauth-implementation
        - dashboard-redesign

사용자: oauth-implementation

Claude: 문서를 초기화합니다...
```

### 기존 문서가 있는 경우

```
사용자: /doc-init chatgpt-mcp-oauth

Claude: 이 프로젝트에 이미 문서가 존재합니다:
        - doc/chatgpt-mcp-oauth/todo.md (12KB)
        - doc/chatgpt-mcp-oauth/techspec.md (8KB)

        덮어쓸까요?

        1. 덮어쓰기 (기존 내용 삭제)
        2. 취소 (기존 유지)
        3. 백업 후 덮어쓰기

사용자: 취소

Claude: 취소되었습니다. 기존 문서를 유지합니다.
```

## Prefix Generation Rules

프로젝트명에서 태스크 PREFIX 자동 생성:

| 프로젝트명 | PREFIX | 규칙 |
|-----------|--------|------|
| chatgpt-mcp-oauth | OAUTH | 마지막 단어 대문자 |
| api-refactor | API | 첫 번째 단어 대문자 |
| dashboard-colors | DASH | 첫 4글자 대문자 |
| simple-name | SN | 각 단어 첫 글자 |

사용자가 원하면 PREFIX를 직접 지정할 수 있음.

## Notes

- 이 스킬은 **문서 구조만 생성**합니다. 내용은 사용자가 채워야 합니다.
- LOOP vault의 50_Projects/와는 별개입니다. 개발 작업용 임시 문서입니다.
- 프로젝트 완료 후 `doc/done/` 폴더로 이동하여 아카이빙합니다.