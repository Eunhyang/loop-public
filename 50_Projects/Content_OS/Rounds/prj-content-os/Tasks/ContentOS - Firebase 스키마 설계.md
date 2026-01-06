---
entity_type: Task
entity_id: "tsk-content-os-13"
entity_name: "ContentOS - Firebase 스키마 설계"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-13"]

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
type: dev                   # dev | bug | strategy | research | ops | meeting | null
target_project: loop  # type=dev일 때만: sosi | kkokkkok | loop-api | null

# === 분류 ===
tags: []
priority_flag: medium
---

# ContentOS - Firebase 스키마 설계

> Task ID: `tsk-content-os-13` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. Firebase Firestore 스키마 설계 완료
2. Collection/Subcollection 구조 정의
3. 서비스 계정 키 설정 확인

---

## 상세 내용

### 배경

ContentOS용 Firebase DB 구조를 다음과 같이 확정:

```
Firestore Database: loop (sosi-4a8ee 프로젝트)
서비스 계정 키: exec/sosi-4a8ee-firebase-adminsdk-3ds3s-3eae8a3e2d.json

loop (collection)
└── main (document, rootId)
    │
    ├── contentos_contents (subcollection)
    │   └── {contentId} (documents)
    │
    ├── contentos_publishes (subcollection)
    │   └── {publishId} (documents)
    │
    ├── contentos_assets (subcollection)
    │   └── {assetId} (documents)
    │
    ├── vault_projects (subcollection)
    │   └── {projectId} (documents)
    │
    ├── vault_tasks (subcollection)
    │   └── {taskId} (documents)
    │
    ├── vault_pending_reviews (subcollection)
    │   └── {reviewId} (documents)
    │
    ├── kpi_defs (subcollection)
    │   └── {kpiId} (documents)
    │
    └── kpi_rollups (subcollection)
        └── {scopeId} (document)
            └── days (subcollection)
                └── {yyyyMMdd} (documents)
```

### 작업 내용

1. Firebase Admin SDK 스키마 정의
2. Collection/Subcollection 구조 문서화
3. 각 Collection별 필드 정의
4. 서비스 계정 키 경로 확인

---

## 체크리스트

- [ ] Firebase Firestore 스키마 정의 문서 작성
- [ ] contentos_* subcollections 필드 정의
- [ ] vault_* subcollections 필드 정의
- [ ] kpi_* subcollections 필드 정의
- [ ] 서비스 계정 키 경로 검증

---

## Notes

### Firebase 구조 컨텍스트

**Database**: `loop` (Firestore, sosi-4a8ee 프로젝트)
**Root Document**: `main`
**Service Account**: `exec/sosi-4a8ee-firebase-adminsdk-3ds3s-3eae8a3e2d.json`

**Subcollections**:
1. **contentos_contents**: 콘텐츠 후보 (키워드, 영상, 스코어링)
2. **contentos_publishes**: 발행 기록 (YouTube 업로드 메타)
3. **contentos_assets**: 미디어 자산 (썸네일, 스크립트)
4. **vault_projects**: LOOP Vault Project 동기화
5. **vault_tasks**: LOOP Vault Task 동기화
6. **vault_pending_reviews**: Pending Review 동기화
7. **kpi_defs**: KPI 정의 (메트릭, 타겟, 윈도우)
8. **kpi_rollups**: KPI 집계 (days subcollection으로 일별 데이터)

### PRD (Product Requirements Document)

**목표**: ContentOS용 Firebase Firestore 데이터베이스 스키마 설계 및 구현

**배경**:
- ContentOS는 콘텐츠 기획-실행-회고 자동화를 위한 독립 시스템
- LOOP Vault와 별도의 데이터베이스 필요 (빠른 쿼리, 실시간 업데이트)
- Firebase Firestore를 사용하여 구조화된 데이터 저장

**요구사항**:
1. **Root Collection**: `loop` → Root Document: `main`
2. **Subcollections**:
   - `contentos_contents`: 콘텐츠 후보 (키워드, 영상 메타, 스코어)
   - `contentos_publishes`: 발행 기록 (YouTube 메타, 성과)
   - `contentos_assets`: 미디어 자산 (썸네일, 스크립트 파일)
   - `vault_projects`: LOOP Vault Project 동기화
   - `vault_tasks`: LOOP Vault Task 동기화
   - `vault_pending_reviews`: Pending Review 동기화
   - `kpi_defs`: KPI 정의 (메트릭, 타겟, 윈도우)
   - `kpi_rollups`: KPI 집계 (nested days subcollection)

**성공 기준**:
- 모든 subcollection 필드 정의 완료
- 쿼리 패턴 기반 인덱스 설계 완료
- Firestore Security Rules 작성 완료
- 서비스 계정 키 경로 검증 완료

### Tech Spec

**기술 스택**:
- Database: Firebase Firestore (NoSQL, Document-based)
- Auth: Firebase Admin SDK (서비스 계정)
- 프로젝트: sosi-4a8ee
- 서비스 계정 키: `exec/sosi-4a8ee-firebase-adminsdk-3ds3s-3eae8a3e2d.json`

**스키마 구조**:
```
loop (collection)
  └── main (document, rootId)
      ├── contentos_contents (subcollection)
      │   └── {contentId}
      │       ├── keyword: string
      │       ├── videoId: string
      │       ├── title: string
      │       ├── channelName: string
      │       ├── marketScore: number
      │       ├── fitScore: number
      │       ├── saturation: number
      │       ├── finalScore: number
      │       ├── createdAt: timestamp
      │       └── updatedAt: timestamp
      │
      ├── contentos_publishes (subcollection)
      │   └── {publishId}
      │       ├── contentId: string (ref)
      │       ├── youtubeVideoId: string
      │       ├── publishedAt: timestamp
      │       ├── views: number
      │       ├── ctr: number
      │       ├── avgViewDuration: number
      │       └── status: string
      │
      ├── contentos_assets (subcollection)
      │   └── {assetId}
      │       ├── type: string (thumbnail | script | video)
      │       ├── url: string
      │       ├── contentId: string (ref)
      │       └── createdAt: timestamp
      │
      ├── vault_projects (subcollection)
      │   └── {projectId}
      │       ├── entity_id: string
      │       ├── entity_name: string
      │       ├── status: string
      │       ├── owner: string
      │       └── syncedAt: timestamp
      │
      ├── vault_tasks (subcollection)
      │   └── {taskId}
      │       ├── entity_id: string
      │       ├── entity_name: string
      │       ├── project_id: string (ref)
      │       ├── status: string
      │       ├── assignee: string
      │       └── syncedAt: timestamp
      │
      ├── vault_pending_reviews (subcollection)
      │   └── {reviewId}
      │       ├── entity_type: string
      │       ├── entity_id: string
      │       ├── reason: string
      │       ├── suggested_changes: map
      │       ├── status: string
      │       └── createdAt: timestamp
      │
      ├── kpi_defs (subcollection)
      │   └── {kpiId}
      │       ├── name: string
      │       ├── metric: string
      │       ├── target: number
      │       ├── window: string
      │       └── createdAt: timestamp
      │
      └── kpi_rollups (subcollection)
          └── {scopeId}
              └── days (subcollection)
                  └── {yyyyMMdd}
                      ├── date: string
                      ├── metrics: map
                      └── computed: timestamp
```

**인덱스 전략**:
- `contentos_contents`: `finalScore DESC, createdAt DESC`
- `contentos_publishes`: `publishedAt DESC, views DESC`
- `vault_tasks`: `status ASC, assignee ASC`
- `kpi_rollups/{scopeId}/days`: `date DESC`

**보안 규칙** (Firestore Security Rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // loop collection은 인증된 사용자만 접근
    match /loop/main/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**의존성**:
- `firebase-admin` SDK
- Service Account JSON 키 파일

### Todo
- [ ] 각 subcollection별 필수 필드 정의
- [ ] 인덱스 설계 (쿼리 패턴 기반)
- [ ] 보안 규칙 작성 (Firestore Security Rules)
- [ ] 서비스 계정 권한 확인
- [ ] Firebase Admin SDK 초기화 코드 작성
- [ ] 스키마 문서화 (README 또는 별도 문서)

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
- [[pgm-content-os]] - 소속 Program

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
