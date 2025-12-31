---
entity_type: Program
entity_id: pgm-content-os
entity_name: Content OS
created: 2025-12-31
updated: 2025-12-31
status: doing

# === Program 정의 ===
program_type: infrastructure
owner: 김은향

# === 원칙/프로세스 ===
principles:
  - "시장(유사 채널/핫키워드/성과 상위 영상) + 우리 채널(Analytics) 결합"
  - "Vault 온톨로지 기반 콘텐츠 태스크 자동 생성"
  - "결과를 A/B로 학습 축적하는 내부 운영 OS"
  - "계산은 코드가, 판단/승인은 사람이"

process_steps:
  - "수집: 시장 신호(채널/키워드/영상) + Analytics 동기화"
  - "스코어링: MarketScore × FitScore × (1-Saturation)"
  - "태스크 생성: 후보 → Draft Task → 승인 → Vault Task"
  - "실행: 촬영/편집/업로드"
  - "회고: Evidence 자동 수집 → A/B 리포트 → 학습 축적"

templates: []

# === 운영 KPI ===
kpis:
  - name: "운영 효율"
    description: "회의 준비 시간 감소 (주간 기획 준비 시간 -50%)"
  - name: "생산성"
    description: "태스크 초안 → 승인 전환율 (>60%)"
  - name: "학습 축적"
    description: "프로젝트당 유효 학습 카드 수 (월 10개+)"
  - name: "성과 개선"
    description: "CTR/시청지속/구독전환 중 1개라도 베이스라인 대비 상승"

# === Cross-Vault ===
exec_rounds_path: null

# === 계층 ===
parent_id: trk-3
conditions_3y: ["cond-a"]
aliases:
  - pgm-content-os
  - Content OS

outgoing_relations: []
validates: []
validated_by: []
tags: ["program", "content", "infrastructure", "automation"]
priority_flag: high
---

# Content OS

> Program ID: `pgm-content-os` | Type: infrastructure | Status: doing

## 프로그램 개요

시장(유사 채널/핫키워드/성과 상위 영상) + 우리 채널(Analytics)을 결합해, Vault 온톨로지 기반의 콘텐츠 태스크를 자동 생성하고, 결과를 A/B로 학습 축적하는 내부 운영 OS.

**핵심 원칙**: "계산은 코드가, 판단/승인은 사람이"

---

## 시스템 구성

### 모듈 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    Content OS (독립 DB)                      │
├─────────────────────────────────────────────────────────────┤
│  Ingest        │ 시장 수집 (채널/키워드/영상)                 │
│  Analytics     │ YouTube Analytics 동기화                   │
│  Scoring       │ Market × Fit × (1-Saturation)             │
│  TaskGenerator │ Draft Task → 승인 → Vault Task            │
│  EvidenceLog   │ Evidence 자동 분류/Negative 감지           │
└────────────────────────┬────────────────────────────────────┘
                         │ API 연동
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOOP Vault                                │
├─────────────────────────────────────────────────────────────┤
│  Task / Project / Evidence / Hypothesis                      │
└─────────────────────────────────────────────────────────────┘
```

### 대시보드 (4개 화면)

1. **Opportunity**: 키워드/FinalScore/"왜 지금?"/추천 번들
2. **Video Explorer**: 후보 영상 테이블 (Viewtrap 유사)
3. **Task Pipeline**: 칸반 (Draft → Approved → Published → Reviewed)
4. **Retro**: A/B 회고 + 학습 카드

---

## 운영 원칙

1. 시장(유사 채널/핫키워드/성과 상위 영상) + 우리 채널(Analytics) 결합
2. Vault 온톨로지 기반 콘텐츠 태스크 자동 생성
3. 결과를 A/B로 학습 축적하는 내부 운영 OS
4. 계산은 코드가, 판단/승인은 사람이

---

## 프로세스

```
수집 → 스코어링 → 태스크 생성 → 실행 → 회고 → 학습
  ↑                                           │
  └───────────────────────────────────────────┘
```

---

## Rounds (MVP 및 후속 프로젝트)

| Round | Cycle | Status | Link |
|-------|-------|--------|------|
| MVP 개발 | 2025-12 | active | [[prj-018]] |

---

## Evidence 자동화 기능

1. **Evidence Type 자동 분류**: CTR/시청지속 조합으로 태깅
2. **Negative Evidence 자동 수집**: FinalScore ↑ + 결과 ↓ → 자동 카드
3. **Hypothesis 자동 연결**: 동일 패턴 3회 반복 시 confidence 조정 제안
4. **Evidence → Rule 승격**: 누적 패턴 임계치 초과 시 Rule 후보 제안

---

**Created**: 2025-12-31
**Owner**: 김은향
