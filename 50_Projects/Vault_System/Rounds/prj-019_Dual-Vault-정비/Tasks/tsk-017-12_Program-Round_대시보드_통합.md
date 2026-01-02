---
entity_type: Task
entity_id: "tsk-017-12"
entity_name: "Dual-Vault - Program-Round 대시보드 통합"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-017-12"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["dashboard", "api", "dual-vault", "admin", "oauth"]
priority_flag: high
---

# Dual-Vault - Program-Round 대시보드 통합

> Task ID: `tsk-017-12` | Project: `prj-019` | Status: doing

## 목표

**완료 조건**:
1. api.js에 `getProgramRounds(pgmId)` 함수 추가
2. auth.js에 `isAdmin()` 헬퍼 함수 추가
3. Role 기반 UI 분기 구현 (admin만 Program 뷰 접근)
4. Program-Round 뷰 컴포넌트 구현 (Program 선택 → Round 목록)
5. Round 카드 클릭 시 ProjectPanel 연동
6. 권한 부족 시 적절한 에러 처리

---

## 상세 내용

### 배경

현재 대시보드(`_dashboard/`)는 Task 중심의 칸반 뷰만 제공합니다. tsk-017-09에서 구현된 `GET /api/admin/programs/{pgm_id}/rounds` API가 있지만, 대시보드 UI에 통합되지 않아 Admin 사용자가 Program-Round 관계를 시각적으로 조회할 수 없습니다. 또한 현재 대시보드는 사용자 role(admin/exec/member)에 따른 UI 분기가 없어, 권한별 차별화된 기능 제공이 불가능합니다.

### 작업 내용

1. **API 통합** (`api.js`)
   - `getProgramRounds(pgmId)` 함수 추가
   - Admin 권한 체크 후 `/api/admin/programs/{pgm_id}/rounds` 호출

2. **Role 기반 UI 분기**
   - `Auth.isAdmin()` 헬퍼 추가
   - Admin 전용 UI 요소 조건부 렌더링

3. **Program-Round 뷰 컴포넌트** (신규)
   - Program 선택 드롭다운
   - Round(Project) 목록 카드 뷰
   - Round 클릭 시 기존 `ProjectPanel` 연동

4. **뷰 전환 UI**
   - 기존 Kanban/Calendar/Graph 토글에 "Program" 뷰 추가 (Admin only)

---

## 체크리스트

- [x] api.js에 getProgramRounds() 함수 추가
- [x] auth.js에 isAdmin() 헬퍼 추가
- [x] state.js에 programRoundsData, loadProgramRounds() 추가
- [x] program-rounds-view.js 컴포넌트 생성
- [x] app.js switchView에 'program' 뷰 추가
- [x] index.html에 Program 뷰 버튼 및 컨테이너 추가
- [x] program-rounds.css 스타일 파일 생성
- [x] 권한 체크 및 에러 처리
- [ ] 빌드 확인

---

## Notes

### PRD (Product Requirements Document)

**문제 정의**:
현재 대시보드는 Task 중심의 칸반 뷰만 제공. Program-Round API는 구현됐으나 UI 통합 없음. Role별 UI 분기도 없음.

**목표**:
1. Admin 권한 사용자가 대시보드에서 Program과 연결된 Round(Project) 목록을 조회
2. Role 기반 UI 분기를 통해 권한에 맞는 기능만 노출
3. 기존 칸반 뷰 구조를 확장하여 Program-Round 뷰를 추가

**핵심 요구사항**:
1. api.js에 `getProgramRounds(pgmId, limit)` 함수 추가
2. auth.js에 `isAdmin()` 헬퍼 추가
3. state.js에 `programRoundsData`, `loadProgramRounds()` 추가
4. program-rounds-view.js 신규 컴포넌트
5. app.js switchView 확장, updateAdminUI() 추가
6. index.html Program 뷰 버튼 및 컨테이너 추가
7. program-rounds.css 신규 스타일 파일

**기술 스펙**:
- Dashboard: `_dashboard/` (HTML + vanilla JS)
- API 호출: `authFetch()` 사용
- 권한: `Auth.isAdmin()` 체크 후 UI 표시
- Round 카드: 클릭 시 ProjectPanel.open(projectId)

**제약 조건**:
- Admin role 외 사용자는 Program-Round API 호출 불가
- exec vault 민감 정보는 API에서 이미 필터링됨
- 기존 칸반/캘린더/그래프 뷰에 영향 없음

**성공 지표**:
- Admin 사용자가 Program 선택 후 3초 내에 Round 목록 조회 가능
- member/exec role 사용자에게 Program 뷰 버튼이 노출되지 않음
- Round 카드 클릭 시 ProjectPanel이 정상 열림
- 403 에러 발생 시 사용자에게 명확한 권한 안내 표시

### Todo
- [ ] api.js: getProgramRounds(pgmId, limit) 함수 추가
- [ ] auth.js: isAdmin() 헬퍼 추가
- [ ] state.js: programRoundsData, selectedProgramId, loadProgramRounds() 추가
- [ ] program-rounds-view.js: 신규 컴포넌트 생성
- [ ] app.js: switchView에 'program' 뷰 추가, updateAdminUI() 추가
- [ ] index.html: viewProgram 버튼 + programRoundsView 컨테이너 추가
- [ ] program-rounds.css: 스타일 파일 생성
- [ ] 빌드 및 테스트

### 작업 로그

#### 2026-01-02 18:47
**개요**: Program-Round 대시보드 통합 구현 완료. Admin 전용 Program 뷰를 추가하여 Program 선택 시 Round(Project) 목록을 조회하고 ProjectPanel과 연동.

**변경사항**:
- 개발:
  - `api.js`: `getProgramRounds(pgmId, limit)` 함수 추가 (`/api/admin/programs/{pgm_id}/rounds` 호출)
  - `auth.js`: `isAdmin()` 헬퍼 함수 추가
  - `state.js`: `programRoundsData`, `selectedProgramId`, `loadProgramRounds()`, `clearProgramRounds()` 추가
  - `program-rounds-view.js`: 신규 컴포넌트 (Program 선택 드롭다운, Round 카드 그리드, ProjectPanel 연동)
  - `app.js`: `switchView()` 'program' 뷰 추가, `updateAdminUI()` 함수 추가
  - `index.html`: viewProgram 버튼 (Admin only), programRoundsView 컨테이너, CSS/JS 참조 추가
  - `program-rounds.css`: 신규 스타일 파일 (헤더, 카드 그리드, 상태 배지, 반응형)
- 수정: 기존 뷰 전환 로직에 program 뷰 분기 추가
- 개선: Role 기반 UI 분기로 Admin 외 사용자에게 버튼 숨김

**핵심 코드**:
```javascript
// api.js - Admin API 호출
async getProgramRounds(pgmId, limit = 20) {
    const url = `${this.baseUrl}/api/admin/programs/${encodeURIComponent(pgmId)}/rounds`;
    const res = await this.authFetch(url);
    return (await res.json()).rounds || [];
}

// auth.js - Admin 체크
isAdmin() {
    return this.getRole() === 'admin';
}

// app.js - UI 분기
function updateAdminUI() {
    const viewProgramBtn = document.getElementById('viewProgram');
    if (viewProgramBtn) {
        viewProgramBtn.style.display = Auth.isAdmin() ? 'inline-block' : 'none';
    }
}
```

**결과**: 대기 (브라우저 테스트 필요)

**다음 단계**:
- 브라우저에서 Admin 로그인 후 Program 뷰 동작 확인
- Round 카드 클릭 시 ProjectPanel 연동 테스트


---

## 참고 문서

- [[prj-019]] - 소속 Project (Dual-Vault - 정비)
- [[tsk-017-09]] - Program-Round 조인 API (선행 Task)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
