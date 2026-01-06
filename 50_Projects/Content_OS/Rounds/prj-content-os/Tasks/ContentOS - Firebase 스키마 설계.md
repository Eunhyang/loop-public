---
entity_type: Task
entity_id: "tsk-content-os-13"
entity_name: "ContentOS - Firebase 스키마 설계"
created: 2026-01-06
updated: 2026-01-06
closed: 2026-01-06
status: done

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

> Task ID: `tsk-content-os-13` | Project: `prj-content-os` | Status: done

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

- [x] Firebase Firestore 스키마 정의 문서 작성
- [x] contentos_* subcollections 필드 정의
- [x] vault_* subcollections 필드 정의
- [x] kpi_* subcollections 필드 정의
- [x] 서비스 계정 키 경로 검증

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

#### 2026-01-06 21:40
**개요**: Firebase Firestore 스키마 설계 완료. 8개 subcollection 필드 정의, Security Rules, Composite Indexes 작성 완료.

**변경사항**:
- 개발:
  - `firebase_schema.md`: 8개 subcollection 상세 스키마 문서 (필드 정의, 타입, 예시 포함)
  - `firestore.rules`: Security Rules (인증 기반 접근 제어, 필드 검증)
  - `firestore.indexes.json`: 16개 복합 인덱스 정의 (쿼리 패턴 기반)
- 검증:
  - 서비스 계정 키 파일 경로 확인 (exec/sosi-4a8ee-firebase-adminsdk-3ds3s-3eae8a3e2d.json, 2.3KB)

**핵심 구조**:
```
loop/main/
├── contentos_contents     # 콘텐츠 후보 (finalScore 기반 정렬)
├── contentos_publishes    # 발행 기록 (YouTube 성과 추적)
├── contentos_assets       # 미디어 자산 (썸네일, 스크립트)
├── vault_projects         # LOOP Vault 동기화 (읽기 전용)
├── vault_tasks            # LOOP Vault 동기화 (읽기 전용)
├── vault_pending_reviews  # Pending Review 동기화
├── kpi_defs               # KPI 정의
└── kpi_rollups/{scopeId}/days/{yyyyMMdd}  # KPI 집계 (nested subcollection)
```

**결과**: ✅ 스키마 설계 완료, 문서화 완료

**다음 단계**:
1. Firebase Admin SDK 초기화 코드 작성 (Python)
2. n8n 워크플로우로 LOOP Vault → Firestore 동기화 구현
3. Firestore Security Rules 배포
4. Composite Indexes 배포 (`firebase deploy --only firestore:indexes`)

---

#### 2026-01-06 21:45
**코드 리뷰 완료**

**검증 항목**:
- ✅ JSON 문법 검증: `firestore.indexes.json` 유효성 확인
- ✅ 파일 생성 확인: 3개 파일 총 890줄 생성
  - `firebase_schema.md`: 515줄 (8개 subcollection 상세 문서)
  - `firestore.rules`: 162줄 (Security Rules + 헬퍼 함수)
  - `firestore.indexes.json`: 213줄 (16개 복합 인덱스)
- ✅ 스키마 일관성: 모든 subcollection 필드 정의 일치
- ✅ 보안 규칙: 인증 기반 접근 제어 + 필드 검증 함수 구현
- ✅ 인덱스 최적화: 쿼리 패턴 기반 16개 복합 인덱스 정의
- ✅ 서비스 계정 키: 경로 검증 완료 (2.3KB)

**아키텍처 검증**:
1. **Root 구조**: `loop/main` → 8개 subcollection (확정)
2. **ContentOS 전용** (3개):
   - `contentos_contents`: 콘텐츠 후보 (finalScore 기반)
   - `contentos_publishes`: 발행 기록 (YouTube 성과)
   - `contentos_assets`: 미디어 자산 (썸네일, 스크립트)
3. **Vault 동기화** (3개):
   - `vault_projects`: LOOP Vault Project 동기화
   - `vault_tasks`: LOOP Vault Task 동기화
   - `vault_pending_reviews`: Pending Review 동기화
4. **KPI 시스템** (2개):
   - `kpi_defs`: KPI 정의
   - `kpi_rollups/{scopeId}/days/{yyyyMMdd}`: 일별 집계 (nested)

**보안 전략**:
- 인증된 사용자: 읽기 허용
- Admin 사용자: 쓰기 허용 (n8n 동기화)
- 필드 검증: `isValidContent()`, `isValidPublish()`, `isValidAsset()`
- Status enum 검증: candidate/selected/rejected, published/scheduled/failed

**인덱스 전략**:
- Single-field: 4개 (syncedAt, due, window, date)
- Composite: 12개 (status+owner, project_id+status, publishedAt+views 등)
- Collection Group: 1개 (days subcollection)

**결과**: ✅ 코드 리뷰 통과, 배포 준비 완료

---

#### 2026-01-06 22:00
**개요**: Task 완료 처리

**결과**:
- Task 상태: doing → done
- closed 필드 추가: 2026-01-06
- 모든 완료 조건 충족 확인

**최종 상태**: done

---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[pgm-content-os]] - 소속 Program

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
