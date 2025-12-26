---
entity_type: StatusStub
entity_id: status-team
entity_name: Team_Status
created: 2025-12-22
updated: 2025-12-22
status: doing
source: "[[loop_exec::40_People/Hiring_Gate]]"
aliases:
- 팀 상태
- Hiring Gate
tags:
- status
- team
- hiring
---

# Team Status

> 마지막 업데이트: 2025-12-22

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| **Hiring Gate** | 🔒 Freeze |
| **현재 팀** | 코어 멤버 유지 |
| **신규 채용** | 잠김 (Runway Red) |

---

## Hiring Gate 정의

| 상태 | 조건 | 의미 |
|------|------|------|
| 🟢 Open | Runway Green + 매출 조건 충족 | 채용 가능 |
| 🔒 Freeze | Runway Yellow/Red | 채용 동결 |
| 🚀 Expand | Runway Green + 매출 조건 초과 | 추가 채용 검토 |

---

## 팀 구성 원칙

### 현재 (5명)
- 코어 멤버 유지
- 역할별 1인 체제

### 6번째 채용 조건
- Runway Green (>= 12개월)
- 월매출 조건 2개월 연속 충족
- 전략적 포지션 확정

---

## 관련 상태

- [[Runway_Status]] - 런웨이 상태
- [[Budget_Mode]] - 예산 모드

---

## 코어 멤버 약속

> Runway 상태와 관계없이 보장되는 것:

1. **지급 안정성**: 계약 기간 내 지급일 준수
2. **투명한 소통**: 상태 변화 시 사전 공유
3. **전환 조건**: 정규직 전환 조건 명확화

---

> ⚠️ **구체적 급여/계약 조건은 Exec Vault에만 존재**

---

**Source**: `loop_exec::40_People/Hiring_Gate`
