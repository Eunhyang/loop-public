---
entity_type: StatusStub
entity_id: status-budget
entity_name: Budget_Mode
created: 2025-12-22
updated: 2025-12-22
status: doing
source: "[[loop_exec::20_Cashflow/Budget_Mode]]"
aliases:
- 예산 모드
tags:
- status
- budget
---

# Budget Mode

> 마지막 업데이트: 2025-12-22

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| **Budget Mode** | 💡 Lite |
| **의미** | 필수 비용만 집행 |

---

## Budget Mode 정의

| 상태 | 조건 | 의미 |
|------|------|------|
| 🚀 Aggressive | Runway Green + 파이프라인 확정 2+ | 마케팅/채용/인프라 투자 가능 |
| ⚖️ Normal | Runway Green | 계획된 비용만 집행 |
| 💡 Lite | Runway Yellow/Red | 필수 비용만 집행 |

---

## Lite 모드 원칙

### 집행 가능
- 급여/4대보험
- 필수 인프라 (서버, 핵심 SaaS)
- 기존 계약 비용

### 집행 보류
- 신규 마케팅 비용
- 신규 도구/서비스 구독
- 출장/행사 비용
- 채용 관련 비용

---

## 관련 상태

- [[Runway_Status]] - 런웨이 상태
- [[Team_Status]] - 채용 게이트

---

## Normal/Aggressive 전환 조건

### Normal로 전환
- Runway Green (>= 12개월)

### Aggressive로 전환
- Runway Green
- 투자 또는 지원사업 확정 2건 이상

---

> ⚠️ **구체적 예산/비용은 Exec Vault에만 존재**

---

**Source**: `loop_exec::20_Cashflow/Budget_Mode`
