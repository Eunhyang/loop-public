---
name: workthrough
description: Automatically document all development work and code modifications in a structured workthrough format. Use this skill after completing any development task, bug fix, feature implementation, or code refactoring to create comprehensive documentation.
---

# Workthrough (LOOP Vault 버전)

**개발 작업 완료 후 Task 파일에 자동으로 작업 로그를 기록하는 스킬**

## 핵심 차이점 (원본 vs LOOP 버전)

| 항목 | 원본 workthrough | LOOP 버전 |
|------|-----------------|-----------|
| 저장 위치 | `workthrough/` 폴더 | Task 파일 내 `### 작업 로그` 섹션 |
| 파일 형식 | 별도 md 파일 | 기존 Task 파일에 추가 |
| 연동 | 독립 실행 | Task ID 기반 연동 |

## When to Use

- 개발 작업 완료 후
- 버그 수정 완료 후
- 리팩토링 완료 후
- `/done-dev-task` 실행 전

## Workflow

### Step 1: 현재 Task 확인

작업 중인 Task ID 확인:
```bash
# Git 브랜치에서 Task ID 추출 (외부 프로젝트)
git branch --show-current
# → tsk-015-03

# 또는 사용자에게 질문
```

### Step 2: Task 파일 찾기

```bash
# LOOP Vault에서 Task 파일 검색
grep -r "entity_id: \"tsk-015-03\"" /Volumes/LOOP_CORE/vault/LOOP/50_Projects/
```

### Step 3: 변경사항 분석

1. **Git diff 확인** (외부 프로젝트):
   ```bash
   git diff --stat HEAD~1
   git log -1 --pretty=format:"%s"
   ```

2. **작업 내용 정리**:
   - 개발한 것
   - 수정한 것
   - 개선한 것

3. **결과 확인**:
   - 빌드 성공 여부
   - 테스트 통과 여부

### Step 4: 작업 로그 생성

다음 형식으로 생성:

```markdown
#### 2025-12-26 18:30
**개요**: OAuth 인증 기능 구현. FastAPI에 OAuth 2.0 Dynamic Client Registration 추가.

**변경사항**:
- 개발: `api/oauth/routes.py` OAuth 엔드포인트 추가
- 개발: `api/oauth/models.py` Pydantic 모델 정의
- 수정: `api/main.py` OAuth 라우터 등록
- 개선: 토큰 검증 로직 분리

**핵심 코드**:
```python
@router.post("/token")
async def token(form_data: OAuth2PasswordRequestForm):
    # JWT 토큰 발급 로직
```

**결과**: ✅ 빌드 성공, Swagger UI 테스트 통과

**다음 단계**:
- 리프레시 토큰 구현
- 토큰 만료 처리
```

### Step 5: Task 파일에 삽입

Task 파일의 `### 작업 로그` 섹션 찾아서 내용 추가:

```bash
# Edit 도구로 삽입
# 기존 주석 템플릿 아래에 새 로그 추가
```

**삽입 위치**:
```markdown
### 작업 로그
<!-- 템플릿 주석 -->

#### 2025-12-26 18:30   ← 새 로그 (최신이 위)
...

#### 2025-12-25 14:00   ← 이전 로그
...
```

### Step 6: Todo 체크 업데이트

완료된 Todo 항목 체크:
```markdown
### Todo
- [x] OAuth 엔드포인트 구현   ← 완료 처리
- [ ] 리프레시 토큰 구현
```

## 자동 실행 트리거

다음 상황에서 자동 실행:
1. 개발 작업 완료 시
2. `/done-dev-task` 명령어 실행 전
3. 사용자가 "작업 기록해줘" 요청 시

## Example

**작업 전 Task 파일:**
```markdown
### Todo
- [ ] 로그인 API 구현
- [ ] 에러 처리

### 작업 로그
<!-- 템플릿 -->
```

**작업 후 Task 파일:**
```markdown
### Todo
- [x] 로그인 API 구현
- [ ] 에러 처리

### 작업 로그
<!-- 템플릿 -->

#### 2025-12-26 18:30
**개요**: 로그인 API 구현 완료. JWT 토큰 발급 및 검증 로직 추가.

**변경사항**:
- 개발: POST /api/auth/login 엔드포인트
- 개발: JWT 토큰 생성 유틸리티
- 수정: User 모델에 password_hash 필드 추가

**결과**: ✅ 빌드 성공

**다음 단계**:
- 에러 처리 추가
- 로그아웃 기능
```

## 연동

- **loop-dev-task**: Task 생성 시 작업 로그 섹션 포함
- **done-dev-task**: Task 완료 시 최종 작업 로그 자동 생성
- **prompt-enhancer**: PRD와 작업 로그 연계

## Tips

- 작업 로그는 **최신이 위**로 쌓임
- 하루에 여러 작업 시 각각 기록
- 핵심 코드는 **꼭 필요한 경우만** 포함
- 다음 단계는 **구체적**으로 작성
