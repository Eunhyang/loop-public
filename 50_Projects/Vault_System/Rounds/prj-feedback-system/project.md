---
entity_type: Project
entity_id: prj-feedback-system
entity_name: Feedback - 유저 피드백 수집 시스템
created: '2026-01-05'
updated: '2026-01-06'
status: doing
program_id: pgm-vault-system
program_path: '[[50_Projects/Vault_System/_PROGRAM]]'
parent_id: trk-2
aliases:
- prj-feedback-system
- Feedback System
- 유저 피드백 수집
owner: 김은향
priority: high
tasks:
- tsk-feedback-01
outgoing_relations: []
validates: []
validated_by: []
tags:
- project
- feedback
- api
- n8n
- dashboard
priority_flag: high
---
# Feedback - 유저 피드백 수집 시스템

> Project ID: `prj-feedback-system` | Program: `pgm-vault-system` | Status: doing

## 목표

앱스토어/플레이스토어 후기, 직접 수집 피드백을 통합 관리하여 가설 생성에 활용하는 시스템 구축

## 배경

- 현재 유저 피드백이 분산되어 있음 (앱스토어, 인터뷰, 코치 피드백 등)
- 피드백 → 가설 전환 프로세스가 없음
- 데이터 기반 제품 개선 필요

## 범위

### In Scope
1. Firestore `feedback` collection 설계
2. LOOP API `/api/feedback` CRUD 엔드포인트
3. n8n 워크플로우: 앱스토어 리뷰 자동 크롤링
4. 대시보드 UI: 피드백 입력/조회

### Out of Scope
- LLM 자동 가설 생성 (후속 프로젝트)
- 감정 분석 자동화 (후속)

## 아키텍처

```
[앱스토어/플레이스토어]     [대시보드 직접입력]
        │                         │
        ▼                         ▼
    n8n 크롤링              POST /api/feedback
        │                         │
        └────────┬────────────────┘
                 ▼
         Firestore (feedback collection)
                 │
                 ▼
         GET /api/feedback → 대시보드 조회
```

## 데이터 스키마

```yaml
feedback:
  id: fb-{NNN}
  source: appstore | playstore | direct | interview | coach
  product: kkokkkok_app | kkokkkokfit
  created: 2026-01-05
  raw_text: "타이머 기능이 너무 좋아요..."
  sentiment: positive | negative | neutral
  tags: [timer, ux, onboarding]
  hypothesis_id: hyp-x-xx  # 연결된 가설 (optional)
```

---

## Tasks

| Task ID | 이름 | 상태 |
|---------|------|------|
| tsk-feedback-01 | API 엔드포인트 + Firestore 스키마 구현 | todo |

---

**Created**: 2026-01-05
**Owner**: 김은향
