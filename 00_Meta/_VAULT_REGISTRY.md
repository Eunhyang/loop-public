# _VAULT_REGISTRY.md

> **LLM 진입점**: 이 문서로 전체 vault 생태계를 파악

---

## Vault 생태계 개요

Inner Loop OS는 **두 개의 분리된 vault**로 운영된다.

```
┌─────────────────────────────────────────────────────────────┐
│                    Inner Loop OS Vaults                      │
├─────────────────────────┬───────────────────────────────────┤
│  LOOP (Shared)          │  loop_exec (C-Level Only)         │
│  /Volumes/LOOP_CORE/    │  /Volumes/LOOP_CLevel/            │
│  vault/LOOP             │  vault/loop_exec                  │
├─────────────────────────┼───────────────────────────────────┤
│  전략 (What & Why)      │  실행 (How & When)                │
│  프로젝트/태스크        │  런웨이/캐시플로우                │
│  온톨로지/스키마        │  파이프라인 (투자/지원사업)       │
│  가설/실험              │  인사/계약 (민감)                 │
│  팀 역할 정의           │  세무/법무                        │
├─────────────────────────┼───────────────────────────────────┤
│  접근: 팀 전체          │  접근: C-Level Only               │
└─────────────────────────┴───────────────────────────────────┘
```

---

## Vault 상세

### 1. LOOP (Shared Vault)

| 항목 | 값 |
|------|-----|
| **경로** | `/Volumes/LOOP_CORE/vault/LOOP` |
| **GitHub** | (private) |
| **진입점** | `_HOME.md`, `_Graph_Index.md` |
| **CLAUDE.md** | 전략/온톨로지/프로젝트 가이드 |

**포함 내용**:
- 01_North_Star: 10년 비전, MH1-4
- 20_Strategy: Condition A-E, Track 1-6
- 30_Ontology: 스키마 v0.1
- 50_Projects: 프로젝트/태스크
- 60_Hypotheses: 가설 검증

### 2. loop_exec (Exec Vault)

| 항목 | 값 |
|------|-----|
| **경로** | `/Volumes/LOOP_CLevel/vault/loop_exec` |
| **GitHub** | https://github.com/Eunhyang/loop_exec |
| **진입점** | `_ENTRY_POINT.md`, `_HOME.md` |
| **CLAUDE.md** | 실행/재무/인사 가이드 |

**포함 내용**:
- 10_Runway: 런웨이 상태, 의사결정 트리거
- 20_Cashflow: 월별 수입/지출
- 30_Pipeline: 투자/지원사업/B2B
- 40_People: 팀/급여/계약
- 60_Contingency: 최악 시나리오

---

## Vault 간 연결 규칙

### Exec → LOOP 반영

| Exec 상태 | LOOP 반영 위치 | 영향 |
|-----------|----------------|------|
| Runway: Green/Yellow/Red | `20_Strategy/Status/Runway_Status.md` | Track 우선순위 조정 |
| Hiring Gate: Open/Freeze | `20_Strategy/Status/Team_Status.md` | 채용 Task 활성화 |
| Budget Mode: Lite/Normal/Aggressive | `20_Strategy/Status/Budget_Mode.md` | 프로젝트 예산 범위 |

### 공개 원칙

| 분류 | 예시 | 공개 |
|------|------|------|
| 상태 | Green/Yellow/Red | O |
| 조건 (숫자 없이) | ">= 12개월이면 Green" | O |
| 구체적 금액 | 매출 1000만원 | X |
| 개인 정보 | 급여, 계약 조건 | X |

---

## LLM 질문별 Vault 선택

| 질문 유형 | 접근 Vault | 시작 문서 |
|-----------|------------|-----------|
| "프로젝트 만들어줘" | LOOP | `50_Projects/` |
| "Track 2 상태?" | LOOP | `20_Strategy/12M_Tracks/2026/Track_2_Data.md` |
| "런웨이 몇 개월?" | loop_exec | `10_Runway/Current_Status.md` |
| "채용 가능해?" | loop_exec | `40_People/Hiring_Gate.md` |
| "이번 달 지출?" | loop_exec | `20_Cashflow/` |
| "투자 파이프라인?" | loop_exec | `30_Pipeline/Investment_Pipeline.md` |
| "온톨로지 스키마?" | LOOP | `30_Ontology/Schema/v0.1/` |
| "최악 시나리오?" | loop_exec | `60_Contingency/Worst_Case.md` |

---

## 상태 동기화 체크리스트

Runway 상태가 변경되면:

1. **loop_exec**에서:
   - [ ] `10_Runway/Current_Status.md` 업데이트
   - [ ] `40_People/Hiring_Gate.md` 재평가
   - [ ] Budget Mode 재평가

2. **LOOP**에 반영:
   - [ ] `20_Strategy/Status/Runway_Status.md` 업데이트
   - [ ] `20_Strategy/Status/Team_Status.md` 업데이트
   - [ ] 관련 Track/Project 우선순위 조정

---

## 버전 정보

| Vault | 버전 | 최종 업데이트 |
|-------|------|---------------|
| LOOP | - | 2025-12-22 |
| loop_exec | 1.0 | 2025-12-22 |

---

**Last Updated**: 2025-12-22
