---
entity_type: StatusStub
entity_id: status-runway
entity_name: Runway_Status
created: 2025-12-22
updated: 2025-12-22
status: doing
source: "[[loop_exec::10_Runway/Current_Status]]"
aliases:
- Runway 상태
tags:
- status
- runway
---

# Runway Status

> 마지막 업데이트: 2025-12-22

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| **Runway** | 🔴 Red |
| **의미** | 경고, 긴급 대응 필요 |

---

## 상태 정의

| 상태 | 조건 | 의미 |
|------|------|------|
| 🟢 Green | >= 12개월 | 정상 운영, 채용/투자 가능 |
| 🟡 Yellow | 9~12개월 | 주의, 비용 관리, 채용 동결 |
| 🔴 Red | < 9개월 | 경고, 긴급 대응 필요 |

---

## 관련 상태

- [[Team_Status]] - 채용 게이트
- [[Budget_Mode]] - 예산 모드

---

## 의사결정 트리거

### Red일 때 (현재)
- 채용 동결
- 신규 기능 보류, PMF 집중
- 비용 최소화 모드 (Lite)
- 매출 증대 방안 검토
- 지원사업/투자 파이프라인 확인

### Yellow로 전환 시
- 비용 관리 모드 유지
- 채용 동결 유지

### Green으로 전환 시
- 채용 검토 가능
- 투자/신규 기능 진행 가능

---

> ⚠️ **구체적 금액은 Exec Vault에만 존재**
>
> 이 문서는 상태(Green/Yellow/Red)만 공개하며, 구체적인 잔고/매출/비용은 C-Level만 접근 가능한 Exec Vault에 있음.

---

**Source**: `loop_exec::10_Runway/Current_Status`
