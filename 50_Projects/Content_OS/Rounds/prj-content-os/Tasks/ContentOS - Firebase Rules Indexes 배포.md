---
entity_type: Task
entity_id: "tsk-022-15"
entity_name: "ContentOS - Firebase Rules/Indexes 배포"
created: 2026-01-07
updated: 2026-01-07
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-022-15"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-07
due: 2026-01-07
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["firebase", "deployment", "security-rules", "indexes"]
priority_flag: high
---

# ContentOS - Firebase Rules/Indexes 배포

> Task ID: `tsk-022-15` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. firestore.rules 정합성 패치 완료 및 배포
2. firestore.indexes.json 배포 완료
3. 모든 Smoke Test 통과
4. 롤백 플랜 문서화

---

## 상세 내용

### 배경

firebase_schema.md는 tsk-022-03에서 업데이트 완료되었으나, firestore.rules의 validation 로직이 실제 운영 시 문제를 일으킬 수 있음.

**현재 상태 (확인됨)**:
- `isServer()` ✅ 있음 (line 30-34)
- `isValidPublish()` status 값 ✅ 새 상태 포함됨 (queued/running/success/failed)
- `isValidPublish()` 필수 필드 ❌ `youtubeVideoId`/`publishedAt` 여전히 필수 (queued/running에서 문제)
- `isValidContent()` ❌ legacy 필드만 필수, source-only 문서 불가
- rootId 경로 ❌ `main` 고정 (`loop/main`), 확장 불가
- firestore.indexes.json ✅ 있음

### 핵심 문제

| 상태 | youtubeVideoId | publishedAt | 현재 validation |
|------|----------------|-------------|-----------------|
| `queued` | ❌ 없음 | ❌ 없음 | ❌ 실패 |
| `running` | ❌ 없음 | ❌ 없음 | ❌ 실패 |
| `success` | ✅ 있음 | ✅ 있음 | ✅ 통과 |
| `failed` | ⚠️ 있을 수도 | ⚠️ 있을 수도 | ⚠️ 조건부 |

### 작업 내용

#### Part 1: firestore.rules 정합성 패치

1. **rootId 정책 확정**: `main` 고정 유지 (현재 상태 그대로)
   - 향후 확장 시 별도 태스크로 처리

2. **isValidPublish() 조건부 validation**:
```javascript
function isValidPublish() {
  let data = request.resource.data;
  let baseValid = data.keys().hasAll(['contentId', 'status', 'createdAt', 'updatedAt'])
    && data.status in ['published', 'scheduled', 'failed', 'queued', 'running', 'success'];

  // success/published 상태만 youtubeVideoId, publishedAt 필수
  let completionFields = data.status in ['success', 'published']
    ? data.keys().hasAll(['youtubeVideoId', 'publishedAt'])
    : true;

  return baseValid && completionFields;
}
```

3. **isValidContent() 완화**:
```javascript
function isValidContent() {
  let data = request.resource.data;

  // 공통 필수 필드
  let commonValid = data.keys().hasAll(['title', 'status', 'createdAt', 'updatedAt'])
    && data.status in ['candidate', 'selected', 'rejected', 'published']
    && data.finalScore >= 0 && data.finalScore <= 100;

  // Legacy OR Source map 허용
  let hasLegacy = data.keys().hasAll(['videoId', 'channelName', 'keyword', 'marketScore', 'fitScore', 'saturation']);
  let hasSource = data.keys().hasAny(['source']);

  return commonValid && (hasLegacy || hasSource);
}
```

4. **권한 모델 유지**: contentos_* = admin만 write (현재 유지)

#### Part 2: indexes 배포

```bash
firebase deploy --only firestore:indexes
```

인덱스 빌드 완료 대기 (Firebase Console에서 확인)

---

## 체크리스트

### 배포 전
- [ ] 현재 rules 백업 커밋 SHA 기록
- [ ] firestore.rules 수정 완료
- [ ] 로컬 Emulator 테스트 (선택)

### 배포
- [ ] firebase deploy --only firestore:rules
- [ ] firebase deploy --only firestore:indexes

### Smoke Test (배포 후 필수)
- [ ] contentos_contents create/update 1건 성공
- [ ] contentos_publishes queued 생성 성공 (youtubeVideoId 없이)
- [ ] contentos_publishes success 업데이트 성공 (youtubeVideoId/publishedAt 포함)
- [ ] status in ['published','success'] 쿼리 동작
- [ ] vault_tasks read 쿼리 동작 (project_id+status)
- [ ] kpi_rollups days collectionGroup 쿼리 동작

### 롤백
- [ ] 이상 시 즉시 롤백 절차 실행

---

## Notes

### PRD (Product Requirements Document)

**문제 정의**:
firestore.rules의 validation 로직이 새 상태값(queued/running)과 호환되지 않아, n8n 워크플로우에서 document 생성 실패 가능성 있음.

**목표**:
1. isValidPublish() 조건부 validation으로 queued/running 상태 지원
2. isValidContent() 완화로 source map 구조 지원
3. 인덱스 배포로 쿼리 성능 확보

**핵심 요구사항**:
1. Backward compatibility 유지 (기존 legacy 문서 계속 동작)
2. 새 상태값/구조 지원
3. 보안 규칙 유지 (admin만 write)

**기술 스펙**:
- Firebase CLI 사용
- sosi-4a8ee 프로젝트
- loop/main 경로

**제약 조건**:
- 프로덕션 DB 직접 배포 (staging 없음)
- 롤백 플랜 필수

**성공 지표**:
- 모든 Smoke Test 통과
- n8n 워크플로우에서 queued 상태 문서 생성 성공

### Tech Spec

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `firestore.rules` | isValidPublish(), isValidContent() 수정 |
| `firestore.indexes.json` | 변경 없음 (배포만) |

#### isValidPublish() 상세

**Before**:
```javascript
function isValidPublish() {
  return request.resource.data.keys().hasAll([
    'contentId', 'youtubeVideoId', 'publishedAt',
    'status', 'createdAt', 'updatedAt'
  ])
  && request.resource.data.status in ['published', 'scheduled', 'failed', 'queued', 'running', 'success'];
}
```

**After**:
```javascript
function isValidPublish() {
  let data = request.resource.data;
  let baseValid = data.keys().hasAll(['contentId', 'status', 'createdAt', 'updatedAt'])
    && data.status in ['published', 'scheduled', 'failed', 'queued', 'running', 'success'];

  let completionFields = data.status in ['success', 'published']
    ? data.keys().hasAll(['youtubeVideoId', 'publishedAt'])
    : true;

  return baseValid && completionFields;
}
```

#### isValidContent() 상세

**Before**:
```javascript
function isValidContent() {
  return request.resource.data.keys().hasAll([
    'keyword', 'videoId', 'title', 'channelName',
    'marketScore', 'fitScore', 'saturation', 'finalScore',
    'status', 'createdAt', 'updatedAt'
  ])
  && request.resource.data.status in ['candidate', 'selected', 'rejected']
  && request.resource.data.marketScore >= 0 && request.resource.data.marketScore <= 100
  && request.resource.data.fitScore >= 0 && request.resource.data.fitScore <= 100
  && request.resource.data.saturation >= 0 && request.resource.data.saturation <= 1;
}
```

**After**:
```javascript
function isValidContent() {
  let data = request.resource.data;

  let commonValid = data.keys().hasAll(['title', 'status', 'finalScore', 'createdAt', 'updatedAt'])
    && data.status in ['candidate', 'selected', 'rejected', 'published']
    && data.finalScore >= 0 && data.finalScore <= 100;

  let hasLegacy = data.keys().hasAll(['videoId', 'channelName', 'keyword', 'marketScore', 'fitScore', 'saturation'])
    && data.marketScore >= 0 && data.marketScore <= 100
    && data.fitScore >= 0 && data.fitScore <= 100
    && data.saturation >= 0 && data.saturation <= 1;

  let hasSource = data.keys().hasAny(['source']);

  return commonValid && (hasLegacy || hasSource);
}
```

### Todo
- [ ] firestore.rules 수정
- [ ] 로컬 테스트 (선택)
- [ ] firebase deploy --only firestore:rules
- [ ] firebase deploy --only firestore:indexes
- [ ] Smoke Test 실행
- [ ] 결과 기록

### 롤백 플랜

**배포 전 백업**:
```bash
# 현재 커밋 SHA 기록
git log -1 --format="%H" -- firestore.rules
```

**롤백 절차**:
```bash
# 1. 이전 버전으로 복원
git checkout <backup-sha> -- firestore.rules

# 2. 즉시 재배포
firebase deploy --only firestore:rules

# 3. 상태 확인
firebase firestore:rules list
```

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
- [[tsk-022-03]] - 선행 Task (Firebase 스키마 보완 패치)
- `/Users/gim-eunhyang/dev/loop/public/50_Projects/Content_OS/Rounds/prj-content-os/firebase_schema.md`
- `/Users/gim-eunhyang/dev/loop/public/50_Projects/Content_OS/Rounds/prj-content-os/firestore.rules`
- `/Users/gim-eunhyang/dev/loop/public/50_Projects/Content_OS/Rounds/prj-content-os/firestore.indexes.json`

---

**Created**: 2026-01-07
**Assignee**: 김은향
**Due**: 2026-01-07
