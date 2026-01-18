---
entity_type: Project
entity_id: prj-infra-ops-2026q1
entity_name: Infra Ops - 2026 Q1
created: '2026-01-16'
updated: '2026-01-19'
status: doing
parent_id: trk-6
program_id: pgm-kkokkkokfit-web
conditions_3y:
- cond-d
owner: 김은향
aliases:
- Infra Ops 2026 Q1
- 인프라 운영 2026 Q1
outgoing_relations: []
validates: []
validated_by: []
tags:
- project
- infra
- ops
- quarterly
priority_flag: high
track_contributes: []
---
# Infra Ops - 2026 Q1

> Project ID: `prj-infra-ops-2026q1` | Track: `trk-6` | Status: doing

## 목적
분기 동안의 인프라/계정/결제/도메인/가용성 이슈를 **한 컨테이너에서 운영**하고,
사건(Event) 발생 시 타임라인 + 영향 + 재발방지 체크리스트를 누적한다.

## 운영 루틴(분기)
- Billing/Payment health 점검
- 핵심 계정(Cloud) 권한/연락처 점검
- 장애/사고 발생 시 Incident 태스크 생성

## Tasks
```dataview
TABLE
  status as "Status",
  assignee as "담당자",
  priority as "우선순위",
  due as "마감일"
FROM "50_Projects/2026/Infra_Ops_2026_Q1/Tasks"
WHERE entity_type = "Task"
SORT status ASC, priority DESC
```

---
**Created**: 2026-01-16  
**Owner**: 한명학
