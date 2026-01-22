---
entity_type: Task
entity_id: tsk-feedback-01
entity_name: Feedback - API 엔드포인트 + Firestore 스키마 구현
created: '2026-01-05'
updated: '2026-01-22'
status: todo
project_id: prj-feedback-system
parent_id: prj-feedback-system
assignee: 김은향
priority: high
due: '2026-01-24'
aliases:
- tsk-feedback-01
outgoing_relations: []
validates: []
validated_by: []
tags:
- task
- api
- firestore
- feedback
priority_flag: high
start_date: '2026-01-24'
start_time: 04:30
end_time: 05:30
---
# Feedback - API 엔드포인트 + Firestore 스키마 구현

> Task ID: `tsk-feedback-01` | Project: `prj-feedback-system` | Status: todo

## 목표

LOOP API에 `/api/feedback` CRUD 엔드포인트 추가 및 Firestore `feedback` collection 연동

---

## Notes

### PRD

#### 배경
- 유저 피드백(앱스토어, 직접 수집)을 통합 관리하여 가설 생성에 활용
- Firestore DB 생성 완료: `loop` (asia-northeast3)

#### 요구사항

**Firestore 스키마:**
```yaml
feedback/{fb_id}:
  id: string           # fb-001, fb-002...
  source: string       # appstore | playstore | direct | interview | coach
  product: string      # kkokkkok_app | kkokkkokfit
  created: timestamp
  raw_text: string     # 원문
  sentiment: string    # positive | negative | neutral (optional)
  tags: array          # [timer, ux, onboarding] (optional)
  hypothesis_id: string # hyp-x-xx (optional, 연결된 가설)
```

**API 엔드포인트:**
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/feedback` | 목록 조회 (필터: source, product, sentiment) |
| GET | `/api/feedback/{id}` | 단일 조회 |
| POST | `/api/feedback` | 생성 |
| PUT | `/api/feedback/{id}` | 수정 |
| DELETE | `/api/feedback/{id}` | 삭제 |

**구현 위치:**
- `public/api/routers/feedback.py` - 라우터
- `public/api/models/feedback.py` - Pydantic 모델
- `public/api/services/firestore_client.py` - Firestore 클라이언트 (신규)

#### 기술 스펙

**Firebase 연결:**
- 프로젝트: `sosi-4a8ee`
- DB: `loop` (asia-northeast3)
- 인증: 서비스 계정 (환경변수로 경로 지정)

**의존성 추가:**
```toml
firebase-admin = "^6.0.0"
```

#### 완료 조건
- [ ] Firestore 연결 테스트 통과
- [ ] CRUD 엔드포인트 동작 확인
- [ ] API 문서 (/docs) 업데이트

---

## 체크리스트

- [ ] firebase-admin 의존성 추가
- [ ] 서비스 계정 키 설정
- [ ] Firestore 클라이언트 구현
- [ ] feedback 라우터 구현
- [ ] 테스트

---

## 참고 문서

- [[prj-feedback-system]] - 소속 Project
- Firestore DB: `loop` (asia-northeast3)

---

**Created**: 2026-01-05
**Assignee**: 김은향
**Due**: 2026-01-10
