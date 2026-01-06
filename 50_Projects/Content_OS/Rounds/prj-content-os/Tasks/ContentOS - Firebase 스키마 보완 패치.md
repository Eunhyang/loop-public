---
entity_type: Task
entity_id: "tsk-022-03"
entity_name: "ContentOS - Firebase 스키마 보완 패치"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-022-03"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: []
priority_flag: medium
---

# ContentOS - Firebase 스키마 보완 패치

> Task ID: `tsk-022-03` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. firebase_schema.md - rootId 확장 가능 명시
2. firebase_schema.md - contentos_contents 확장성 개선 (공통 필드 + source map)
3. firebase_schema.md - contentos_publishes status 확장 (queued/running/success/failed)
4. firestore.rules - Security Rules 강화 (vault/kpi 서버 전용, contentos 인증 사용자)

---

## 상세 내용

### 배경

ContentOS Firebase 스키마에 다음 4가지 보완 사항이 필요:
- (A) rootId 확장 가능 명시: 현재 main 고정 → 향후 prod/staging/exec 확장 대비
- (B) contentos_contents 확장성 개선: 공통 필드 추가 + source map 구조화
- (C) contentos_publishes status 확장: 더 세분화된 상태 관리
- (D) Security Rules 강화: 컬렉션별 권한 분리

### 작업 내용

#### (A) rootId 확장 가능 명시
- loop/{rootId} 패턴 문서화
- 현재: main (고정)
- 향후: prod, staging, exec 확장 가능

#### (B) contentos_contents 확장성 개선
- 공통 필드 추가: type, status, title, owner, tags, finalScore, createdAt
- source map 구조: source.youtube.videoId, source.youtube.channelName 등
- 플랫폼 확장 대비 (블로그/쇼츠/뉴스레터)

#### (C) contentos_publishes status 확장
- 기존: published | scheduled | failed
- 변경: queued | running | success | failed
- 추가 필드: scheduledAt, executedAt, externalUrl, platformId

#### (D) Security Rules 강화
- vault_*, kpi_rollups: 서버만 write (admin claim 체크)
- contentos_*: 인증된 사용자 read/write 가능
- 컬렉션별 권한 분리

---

## 체크리스트

- [ ] firebase_schema.md - rootId 확장 가능 명시
- [ ] firebase_schema.md - contentos_contents 확장성 개선
- [ ] firebase_schema.md - contentos_publishes status 확장
- [ ] firestore.rules - Security Rules 강화
- [ ] 변경사항 검토 및 확인

---

## Notes

### Tech Spec

#### Patch (A): rootId 확장 가능 명시
**Current**: `loop/main` 고정 (hardcoded)
**Change**: 명시적 문서화 - 현재 main, 향후 prod/staging/exec 확장 가능
**Files**: firebase_schema.md
**Location**:
- Line 4-5: Root Document 섹션
- Line 14-15: Database Structure 다이어그램

**Implementation**:
```markdown
> **Root Document**: `loop/{rootId}` (현재: `main`, 향후: `prod`, `staging`, `exec` 확장 가능)
```

#### Patch (B): contentos_contents 확장성 개선
**Current**: YouTube 영상 전용 필드 (videoId, channelName)
**Change**: 공통 필드 + source map 구조로 플랫폼 확장 대비
**Files**: firebase_schema.md
**Location**: Line 48-95 (contentos_contents 섹션)

**Common Fields** (모든 플랫폼 공통):
- `type`: "youtube" | "blog" | "shorts" | "newsletter"
- `status`: "candidate" | "selected" | "rejected" | "published"
- `title`: string
- `owner`: string (담당자)
- `tags`: array<string> (분류 태그)
- `finalScore`: number (최종 점수)
- `createdAt`, `updatedAt`: timestamp

**Source Map** (플랫폼별 구조):
```typescript
source: {
  youtube?: {
    videoId: string
    channelName: string
    views?: number
    likes?: number
  }
  blog?: {
    url: string
    platform: "medium" | "notion" | "tistory"
  }
  shorts?: {
    videoId: string
    duration: number
  }
}
```

#### Patch (C): contentos_publishes status 확장
**Current**: `published | scheduled | failed` (3가지)
**Change**: `queued | running | success | failed` (4가지, 진행 상태 추가)
**Files**: firebase_schema.md, firestore.rules
**Locations**:
- firebase_schema.md: Line 99-146 (contentos_publishes)
- firestore.rules: Line 49 (validation)

**Additional Fields**:
- `scheduledAt`: timestamp (예약 시각)
- `executedAt`: timestamp (실행 시각)
- `externalUrl`: string (발행된 외부 URL)
- `platformId`: string ("youtube" | "tiktok" | "instagram")

**State Transition**:
```
queued → running → success
                ↘ failed
```

#### Patch (D): Security Rules 강화
**Current**: 모든 컬렉션 admin 권한 필요
**Change**: 컬렉션별 권한 분리
**Files**: firestore.rules
**Location**: Line 82-150 (각 subcollection rules)

**New Permission Model**:
| Collection | Read | Write | Rationale |
|------------|------|-------|-----------|
| `contentos_*` | 인증 사용자 | 인증 사용자 | 콘텐츠 협업 가능 |
| `vault_*` | 인증 사용자 | 서버 전용 (admin) | LOOP Vault SSOT 보호 |
| `kpi_*` | 인증 사용자 | 서버 전용 (admin) | KPI 집계 무결성 보호 |

**Helper Function** (추가):
```javascript
function isServer() {
  return isAuthenticated() && request.auth.token.service_account == true;
}
```

### Todo
- [x] Tech Spec 작성
- [ ] firebase_schema.md 수정 (A, B, C)
- [ ] firestore.rules 수정 (D)
- [ ] 코드 리뷰 (codex-claude-loop)

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- `/Users/gim-eunhyang/dev/loop/public/50_Projects/Content_OS/Rounds/prj-content-os/firebase_schema.md`
- `/Users/gim-eunhyang/dev/loop/public/50_Projects/Content_OS/Rounds/prj-content-os/firestore.rules`

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
