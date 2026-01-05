---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-22"
entity_name: "Dashboard - PDF 첨부파일 500 에러 진단"
created: 2026-01-05
updated: 2026-01-06
status: done

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-22"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-05
due: 2026-01-05
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["bug", "pdf", "attachments", "500-error"]
priority_flag: high
---

# Dashboard - PDF 첨부파일 500 에러 진단

> Task ID: `tsk-dashboard-ux-v1-22` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

**완료 조건**:
1. 500 에러의 근본 원인 파악
2. 에러 재현 및 수정 방안 도출

---

## 상세 내용

### 배경

대시보드 Detail View에서 PDF 첨부파일 열기 시 HTTP 500 에러 발생:

```
GET https://mcp.sosilab.synology.me/api/tasks/tsk-019-20/attachments/프라이머_크리에이터_이코노미_파운드1기_지원_사업계획서_-_소식연구소_김은향.pdf 500 (Internal Server Error)
```

관련 코드:
- `api.js:75` - authFetch 호출
- `pdf-viewer.js:198` - PDFViewer.open()
- `task-panel.js:1201` - 이벤트 핸들러

### 의심 원인

1. **한글 파일명 Unicode 정규화 문제** (NFD vs NFC)
2. **secure_filename() 함수의 URL 디코딩 처리**
3. **_attachments 디렉토리 접근 권한/경로 문제**

---

## 체크리스트

- [x] Step 1: NAS 서버 로그 확인 (docker logs loop-api)
- [x] Step 2: OAuth 인증 코드 분석
- [x] Step 3: secure_filename 함수 테스트
- [x] Step 4: 근본 원인 확정
- [x] Step 5: 코드 수정 및 배포

---

## 진단 결과

### 1차 진단 (2026-01-05): 401 Unauthorized

**초기 증상**: 브라우저에서 HTTP 500 표시
**실제 원인**: 서버는 401 Unauthorized 반환 (JWT 토큰 누락/만료)

### 2차 진단 (2026-01-06): UnicodeEncodeError (진짜 500)

**실제 서버 에러**:
```
UnicodeEncodeError: 'latin-1' codec can't encode characters in position 22-29: ordinal not in range(256)
```

**근본 원인**: `FileResponse`의 `Content-Disposition` 헤더에 한글 파일명 직접 삽입
- HTTP 헤더는 Latin-1로만 인코딩 가능
- 한글 파일명이 포함되면 인코딩 에러 → 500 Internal Server Error

**수정**: `api/routers/attachments.py` Line 424-430
```python
# Before (에러 발생)
return FileResponse(
    path=file_path,
    media_type=content_type,
    filename=safe_filename,
    headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'}
)

# After (수정)
return FileResponse(
    path=file_path,
    media_type=content_type,
    filename=safe_filename  # FileResponse가 RFC 5987로 자동 처리
)
```

---

### 참고: 기존 401 분석

| 구분 | 값 |
|------|-----|
| 브라우저 표시 | 500 Internal Server Error (잘못된 표시) |
| **실제 서버 응답** | **401 Unauthorized** |
| 원인 | JWT 토큰 누락/유효하지 않음 |

### 서버 로그 증거

```
WARNING:oauth.security:[API] FAILED | IP:117.110.136.19 | path=/api/tasks/tsk-019-20/attachments/프라이머_크리에이터.pdf
INFO: "GET /api/tasks/tsk-019-20/attachments/...pdf HTTP/1.1" 401 Unauthorized
JWT verification failed: Not enough segments
```

### 왜 다른 API는 성공하고 PDF만 실패?

- 첨부파일 **목록 조회**: `200 OK` ✅ (토큰 유효)
- 개별 파일 **다운로드**: `401` ❌ (토큰 누락/만료)

**시간차 문제**: 목록 조회 후 PDF 다운로드 요청 사이에 토큰이 만료되었거나, 브라우저 fetch 과정에서 Authorization 헤더가 누락됨.

---

## 수정 방안

### 1. pdf-viewer.js 에러 핸들링 개선
- 401 에러 시 로그인 모달 표시 (현재는 일반 에러로 처리)

### 2. api.js 토큰 만료 버퍼 확대
- 현재: 만료 5분 전부터 만료 처리
- 개선: 만료 10분 전부터 만료 처리

### 3. 에러 메시지 명확화
- 500이 아닌 401임을 사용자에게 정확히 표시

---

## Notes

### Tech Spec

#### 문제 분석
- **표시 증상**: 브라우저에서 HTTP 500 에러로 표시
- **실제 원인**: 서버는 401 Unauthorized 반환 (JWT 토큰 누락/만료)
- **근본 원인**: 목록 조회 후 개별 파일 다운로드 시 토큰 만료 시간차

#### 수정 대상 파일

1. **`public/_dashboard/js/components/pdf-viewer.js`**
   - Line 208: 현재 `throw new Error('HTTP ${response.status}')` - 모든 에러를 일반 에러로 처리
   - 개선: 401 에러 시 로그인 모달 표시, 사용자에게 명확한 메시지 제공

2. **`public/_dashboard/js/api.js`**
   - Line 53-54: 현재 만료 5분 전부터 만료 처리
   - 개선: 만료 10분 전부터 만료 처리 (버퍼 확대)

#### 구현 세부사항

**pdf-viewer.js 수정:**
```javascript
// Before
if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
}

// After
if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
        API.clearToken();
        if (window.showLoginModal) {
            window.showLoginModal();
        }
        this.showError('Authentication required', 'Please log in again to view this file.');
        return;
    }
    throw new Error(`HTTP ${response.status}`);
}
```

**api.js 수정:**
```javascript
// Before: 5분 전부터 만료 처리
return Date.now() >= (payload.exp * 1000) - (5 * 60 * 1000);

// After: 10분 전부터 만료 처리
return Date.now() >= (payload.exp * 1000) - (10 * 60 * 1000);
```

### Todo
- [x] ~~Step 1: api.js 토큰 만료 버퍼 확대 (5분 → 10분)~~ - Codex 피드백으로 취소 (역효과)
- [x] Step 2: pdf-viewer.js catch 블록에서 인증 에러 구분 및 명확한 메시지 표시
- [x] Step 3: codex-claude-loop 검증

### Codex Review Summary
1. **Plan Validation**: 토큰 버퍼 확대는 역효과 (세션 더 짧아짐) → 제외
2. **Implementation Review**: catch 블록에서 에러 메시지 기반 인증 에러 감지 구현
3. **Final Review**: 문자열 매칭 취약성 지적 (향후 개선 가능), 현재 구현은 핵심 문제 해결

### 관련 파일
- `public/api/routers/attachments.py` - 첨부파일 API
- `public/_dashboard/js/components/pdf-viewer.js` - PDF 뷰어
- `public/_dashboard/js/api.js` - API 클라이언트 (authFetch)

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-20]] - PDF 인라인 뷰어 구현 Task

---

**Created**: 2026-01-05
**Assignee**: 김은향
**Due**: 2026-01-05
**Closed**: 2026-01-06

---

## 작업 로그

### 2026-01-06 최종 수정

**개요**: PDF 첨부파일 500 에러의 진짜 원인 발견 및 수정

**변경사항**:
1. `api/routers/attachments.py` - FileResponse 커스텀 Content-Disposition 헤더 제거
   - 한글 파일명 UnicodeEncodeError 해결
   - FileResponse가 RFC 5987 방식으로 UTF-8 파일명 자동 처리

**배포**:
- GitHub push → NAS sync → Docker rebuild 완료
- Health check 통과: `{"status":"healthy","cache":{"tasks":199,"projects":33}}`

**결과**: 한글 파일명 PDF 첨부파일 정상 로드 확인 필요
