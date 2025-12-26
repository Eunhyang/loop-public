---
name: prompt-enhancer
description: 프로젝트 컨텍스트 분석으로 간단한 요청을 상세 요구사항으로 변환. User provides brief development request → skill analyzes project structure, dependencies, patterns → generates detailed PRD/requirements for confirmation.
---

# Prompt Enhancer

간단한 개발 요청을 상세한 요구사항 문서로 변환하는 스킬.

## Overview

사용자가 "로그인 기능 추가해줘" 같은 간략한 요청을 하면, 프로젝트 컨텍스트를 분석해서 상세한 PRD(Product Requirements Document)를 생성합니다.

**핵심 원칙**: 구현 전에 반드시 사용자 확인을 받음

## When to Use

- 사용자가 간략한 개발 요청을 할 때
- Project Notes에 PRD가 비어있을 때 (loop-dev-task에서 호출)
- 새 기능 추가 시 요구사항 정리가 필요할 때

## Workflow

### Step 1: 프로젝트 컨텍스트 분석

**수집할 정보:**

1. **기술 스택 파악**
   ```bash
   # Flutter
   cat pubspec.yaml 2>/dev/null

   # Next.js/React
   cat package.json 2>/dev/null

   # Python
   cat pyproject.toml requirements.txt 2>/dev/null
   ```

2. **아키텍처 패턴 파악**
   - 디렉토리 구조 확인
   - 기존 코드 패턴 분석
   - 상태 관리 방식 확인

3. **기존 구현 확인**
   - 유사 기능이 있는지 검색
   - 코드 컨벤션 파악

### Step 2: 의도 추출

사용자 요청에서 추출:
- **기능 유형**: 새 기능 / 버그 수정 / 리팩토링 / 개선
- **범위**: 단일 파일 / 다중 파일 / 아키텍처 변경
- **의존성**: 외부 라이브러리 필요 여부

### Step 3: 상세 요구사항 생성

다음 형식으로 PRD 생성:

```markdown
### PRD (Product Requirements Document)

**문제 정의**:
[현재 상황과 해결해야 할 문제]

**목표**:
[이 기능/작업으로 달성하려는 것]

**핵심 요구사항**:
1. [구체적 요구사항 1]
2. [구체적 요구사항 2]
3. [구체적 요구사항 3]

**기술 스펙**:
- 기술 스택: [분석된 스택]
- 영향 범위: [수정될 파일/모듈]
- 의존성: [필요한 라이브러리]

**제약 조건**:
- [기술적 제약]
- [비즈니스 제약]

**성공 지표**:
- [측정 가능한 성공 기준]
```

### Step 4: 사용자 확인

생성된 PRD를 사용자에게 보여주고 확인 요청:

```
위 요구사항으로 진행해도 될까요?
수정이 필요하면 말씀해주세요.
```

**중요**: 사용자가 OK하기 전까지 구현 시작 금지

## Stack-Specific Patterns

### Flutter (Clean Architecture)
```
분석 대상:
- lib/features/ 구조
- state management (Riverpod, Bloc, Provider)
- navigation 패턴
- repository/datasource 구조
```

### Next.js/React
```
분석 대상:
- App Router vs Pages Router
- state management (Zustand, Redux, Context)
- styling 방식 (Tailwind, CSS Modules)
- API 패턴 (Route Handlers, Server Actions)
```

### Python (FastAPI/Django)
```
분석 대상:
- ORM 패턴
- API 라우터 구조
- Pydantic 모델
- 인증 방식
```

### LOOP Vault (Obsidian)
```
분석 대상:
- 50_Projects/ 구조
- YAML frontmatter 스키마
- 기존 Task/Project 패턴
- validation 스크립트
```

## Example

**Input:**
```
로그인 기능 추가해줘
```

**Context Analysis:**
```
- 프로젝트: Flutter app (sosi)
- 스택: Riverpod 3.0, GoRouter, Drift
- 기존 인증: 없음 (신규)
- 관련 파일: lib/features/auth/ (생성 필요)
```

**Output (PRD):**
```markdown
### PRD (Product Requirements Document)

**문제 정의**:
현재 sosi 앱에는 사용자 인증 기능이 없어 개인화된 데이터 관리가 불가능함.

**목표**:
이메일/비밀번호 기반 로그인 기능을 구현하여 사용자별 데이터 분리 가능하게 함.

**핵심 요구사항**:
1. 로그인 화면 UI (이메일, 비밀번호 입력)
2. Firebase Auth 연동
3. 로그인 상태 유지 (토큰 저장)
4. 로그아웃 기능

**기술 스펙**:
- 기술 스택: Flutter 3.x, Riverpod 3.0, Firebase Auth
- 영향 범위: lib/features/auth/, lib/core/router.dart
- 의존성: firebase_auth, flutter_secure_storage

**제약 조건**:
- 기존 GoRouter 패턴 유지
- Riverpod provider 패턴 준수

**성공 지표**:
- 로그인/로그아웃 정상 동작
- 앱 재시작 시 로그인 상태 유지
```

## Integration with loop-dev-task

loop-dev-task 스킬에서 호출 시:

1. Task 이름과 Project 정보 전달받음
2. Project 컨텍스트 분석
3. PRD 생성
4. Project_정의.md Notes 섹션에 삽입

```
loop-dev-task → prompt-enhancer 호출
             → PRD 생성
             → Project Notes 업데이트
             → Task 생성 계속
```

## Sources

Based on:
- [prompt-enhancer by @dayoumin](https://claude-plugins.dev/skills/@dayoumin/Skills/prompt-enhancer)
- [claude-code-prompt-improver](https://github.com/severity1/claude-code-prompt-improver)
