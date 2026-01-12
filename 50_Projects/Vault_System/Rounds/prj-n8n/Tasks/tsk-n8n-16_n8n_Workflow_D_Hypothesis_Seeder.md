---
entity_type: Task
entity_id: tsk-n8n-16
entity_name: n8n - Workflow D Hypothesis Seeder
created: 2026-01-03
updated: '2026-01-13'
status: doing
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-16
outgoing_relations:
- tsk-n8n-15
- tsk-n8n-11
validates: []
assignee: 김은향
start_date: '2026-01-15'
due: '2026-01-15'
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
conditions_3y:
- cond-e
tags:
- n8n
- workflow
- hypothesis
- automation
priority_flag: high
notes: "# n8n - Workflow D Hypothesis Seeder\n\n> Task ID: `tsk-n8n-16` | Project:\
  \ `prj-n8n` | Status: doing\n\n## 목표\n\nn8n Workflow D를 구축하여 **가설 없는 Project를 자동\
  \ 감지**하고 **Hypothesis 초안을 생성**합니다.\n\n**완료 조건**:\n\n1. Workflow D 트리거: Project (planning/active)\
  \ + validates=\\[\\]\n2. Hypothesis Seeder API 호출하여 draft 생성\n3. Pending Review\
  \ 등록 (Dashboard에서 승인)\n4. n8n에 워크플로우 배포\n\n---\n\n## 상세 내용\n\n### 배경\n\ntsk-n8n-15에서\
  \ \"고객중심 가설 강제 시스템\"을 구현:\n\n- Project active/done 전환 시 가설 필수 게이트\n- Hypothesis\
  \ 품질 검증에 고객중심 휴리스틱\n\n이제 **자동 감지 + 생성 파이프라인**이 필요:\n\n- 가설 없는 프로젝트를 cron으로 감지\n\
  - 자동으로 Hypothesis draft 생성\n- Pending Review로 승인 대기\n\n### Workflow D 설계\n\n```\n\
  [Cron Trigger: 매일 09:00]\n    ↓\n[GET /api/projects]\n    ↓\n[Filter: status in\
  \ [planning, active] AND validates=[]]\n    ↓\n[Loop Each Project]\n    ├─→ [POST\
  \ /api/ai/infer/hypothesis_draft]\n    │       - project_id\n    │       - provider:\
  \ \"openai\" (default)\n    │   ↓\n    └─→ [Response 처리]\n            - success:\
  \ pending review 자동 생성됨\n            - failure: 에러 로깅\n    ↓\n[Slack/Discord 알림\
  \ (선택)]\n```\n\n### API 엔드포인트\n\n**트리거 조건 확인:**\n\n```bash\nGET /api/projects\n\
  # 필터: status in [planning, active] AND validates empty\n```\n\n**가설 생성:**\n\n```bash\n\
  POST /api/ai/infer/hypothesis_draft\n{\n  \"project_id\": \"prj-001\",\n  \"provider\"\
  : \"openai\"\n}\n# Response: pending review ID 포함\n```\n\n### n8n 노드 구성\n\n| \\\
  # | 노드 | 유형 | 설명 |\n| --- | --- | --- | --- |\n| 1 | Cron | Schedule Trigger | 매일\
  \ 09:00 실행 |\n| 2 | Get Projects | HTTP Request | GET /api/projects |\n| 3 | Filter\
  \ | IF | status + validates 조건 |\n| 4 | Loop | SplitInBatches | 프로젝트별 처리 |\n| 5\
  \ | Create Hypothesis | HTTP Request | POST hypothesis_draft |\n| 6 | Merge Results\
  \ | Merge | 결과 집계 |\n| 7 | Notify | (선택) | Slack 알림 |\n\n---\n\n## 체크리스트\n\n- [\
  \ ] n8n 워크플로우 JSON 생성\n\n- [ ] Cron 트리거 설정 (09:00 KST)\n\n- [ ] GET /api/projects\
  \ 노드 구성\n\n- [ ] validates=\\[\\] 필터링 로직 구현\n\n- [ ] POST hypothesis_draft 노드 구성\n\
  \n- [ ] Credential 연결 (LOOP API Token)\n\n- [ ] 워크플로우 테스트\n\n- [ ] n8n 배포\n\n---\n\
  \n## Notes\n\n### PRD (Product Requirements Document)\n\n1.1 프로젝트 개요\n\n| 항목 | 내용\
  \ |\n| --- | --- |\n| Task ID | `tsk-n8n-16` |\n| Task Name | n8n - Workflow D Hypothesis\
  \ Seeder |\n| Project | `prj-n8n` (n8n Vault 자동화) |\n| 목표 | 가설 없는 Project를 자동 감지하고\
  \ Hypothesis 초안 생성 |\n\n1.2 선행 작업\n\n| Task | 설명 | 상태 |\n| --- | --- | --- |\n|\
  \ `tsk-n8n-11` | Hypothesis Seeder API (`/api/ai/infer/hypothesis_draft`) | done\
  \ |\n| `tsk-n8n-15` | 고객중심 가설 강제 시스템 | done |\n\n1.3 문제 정의\n\n**현재 상태:**\n\n- API\
  \ 레벨에서 Hypothesis draft 생성 기능 완성\n- Project active/done 전환 시 가설 필수 게이트 구현\n- **BUT**:\
  \ 자동 감지 + 트리거 파이프라인 없음\n\n**핵심 Pain Point:**\n\n1. 수동 트리거 필요: API 직접 호출 필요\n2. 일괄\
  \ 처리 불가: 여러 프로젝트에 대해 반복 작업\n3. 알림 없음: 가설 생성 대기 중인 프로젝트 파악 어려움\n\n1.4 해결 방안\n\nn8n\
  \ Workflow D를 구축하여:\n\n1. **자동 감지**: Cron으로 매일 09:00에 실행\n2. **조건 필터링**: `status\
  \ in [planning, active] AND validates=[]`\n3. **API 호출**: `/api/ai/infer/hypothesis_draft`\
  \ 자동 호출\n4. **Pending 생성**: Dashboard에서 승인 가능\n\n1.5 성공 기준\n\n- [ ] n8n 워크플로우 정상\
  \ import 및 credential 연결\n\n- [ ] 09:00 KST cron 트리거 동작\n\n- [ ] 조건 필터 정상 작동 (validates\
  \ 빈 배열만 처리)\n\n- [ ] API 호출 후 pending review 생성\n\n- [ ] 워크플로우 활성화 후 7일간 에러 없음\n\
  \n---\n\n### Tech Spec\n\n2.1 워크플로우 아키텍처\n\n```\n┌─────────────────┐\n│ Cron Trigger\
  \    │  매일 09:00 KST\n│ (Schedule)      │\n└────────┬────────┘\n         ↓\n┌─────────────────┐\n\
  │ Get Projects    │  GET /api/projects\n│ (HTTP Request)  │\n└────────┬────────┘\n\
  \         ↓\n┌─────────────────┐\n│ Filter Projects │  status in [planning, active]\n\
  │ (IF + Code)     │  AND validates.length == 0\n└────────┬────────┘\n         ↓\n\
  ┌─────────────────┐\n│ Loop Projects   │  SplitInBatches\n│ (Iterator)      │\n\
  └────────┬────────┘\n         ↓\n┌─────────────────────┐\n│ Create Hypothesis  \
  \ │  POST /api/ai/infer/hypothesis_draft\n│ Draft (HTTP)        │  mode=pending,\
  \ provider=openai\n└────────┬────────────┘\n         ↓\n┌─────────────────┐\n│ Aggregate\
  \       │  결과 집계\n│ Results         │\n└────────┬────────┘\n         ↓\n┌─────────────────┐\n\
  │ (Optional)      │  Slack/Discord 알림\n│ Notify          │\n└─────────────────┘\n\
  ```\n\n2.2 노드 상세 설계\n\n| \\# | 노드 이름 | 유형 | 설정 |\n| --- | --- | --- | --- |\n| 1\
  \ | `Schedule Trigger` | Schedule Trigger | cron: `0 9 * * *` (09:00 KST) |\n| 2\
  \ | `Get Projects` | HTTP Request | GET `{{$env.LOOP_API_URL}}/api/projects` |\n\
  | 3 | `Filter Valid Projects` | Code | 필터 로직 (아래 참조) |\n| 4 | `Loop Projects` |\
  \ SplitInBatches | batchSize: 1 |\n| 5 | `Hypothesis Draft` | HTTP Request | POST\
  \ `{{$env.LOOP_API_URL}}/api/ai/infer/hypothesis_draft` |\n| 6 | `Wait` | Wait |\
  \ 2초 (rate limiting) |\n| 7 | `Aggregate Results` | Aggregate | 처리 결과 수집 |\n\n2.3\
  \ 필터 코드 (노드 3)\n\n```javascript\n// Filter: status in [planning, active] AND validates\
  \ empty\nconst projects = $input.all()[0].json.projects || [];\n\nconst filtered\
  \ = projects.filter(p => {\n  // 1. status 조건\n  const validStatus = ['planning',\
  \ 'active'].includes(p.status);\n\n  // 2. validates 빈 배열 조건\n  const noHypothesis\
  \ = !p.validates || p.validates.length === 0;\n\n  // 3. primary_hypothesis_id도\
  \ 없어야 함\n  const noPrimaryHyp = !p.primary_hypothesis_id;\n\n  return validStatus\
  \ && noHypothesis && noPrimaryHyp;\n});\n\nreturn filtered.map(p => ({ json: p }));\n\
  ```\n\n2.4 API 호출 설정 (노드 5)\n\n**Request:**\n\n```json\n{\n  \"method\": \"POST\"\
  ,\n  \"url\": \"{{$env.LOOP_API_URL}}/api/ai/infer/hypothesis_draft\",\n  \"authentication\"\
  : \"predefinedCredentialType\",\n  \"nodeCredentialType\": \"httpHeaderAuth\",\n\
  \  \"body\": {\n    \"project_id\": \"={{$json.entity_id}}\",\n    \"mode\": \"\
  pending\",\n    \"provider\": \"openai\",\n    \"actor\": \"n8n-workflow-d\"\n \
  \ }\n}\n```\n\n**Headers (Credential):**\n\n- Name: `LOOP API Token`\n- Header Name:\
  \ `Authorization`\n- Header Value: `Bearer {{$credentials.loopApiToken}}`\n\n2.5\
  \ 에러 처리\n\n| 시나리오 | 처리 |\n| --- | --- |\n| Project 조회 실패 | 워크플로우 중단, 로그 기록 |\n|\
  \ API 호출 실패 | 해당 프로젝트 스킵, 다음 진행 |\n| 전체 실패 | Slack 알림 (선택) |\n\n2.6 Credential 설정\n\
  \nn8n Credentials에서 생성 필요:\n\n| Credential 이름 | 유형 | 설정 |\n| --- | --- | --- |\n\
  | `LOOP API Token` | Header Auth | Header: `Authorization`, Value: `Bearer ${LOOP_API_TOKEN}`\
  \ |\n\n**주의**: 워크플로우 import 후 반드시 수동으로 Credential 연결 필요\n\n2.7 테스트 케이스\n\n| \\#\
  \ | 테스트 | 조건 | 예상 결과 |\n| --- | --- | --- | --- |\n| 1 | 빈 validates 프로젝트 | status=planning,\
  \ validates=\\[\\] | Hypothesis draft 생성 |\n| 2 | 이미 가설 있는 프로젝트 | validates=\\['hyp-1-01'\\\
  ] | 스킵 |\n| 3 | done 상태 프로젝트 | status=done | 스킵 |\n| 4 | archived 프로젝트 | status=archived\
  \ | 스킵 |\n\n2.8 모니터링\n\n- n8n Execution History에서 실행 로그 확인\n- `_build/ai_audit/`\
  \ 디렉토리에서 API 호출 로그 확인\n- Dashboard Pending Reviews에서 생성된 Hypothesis 확인\n\n---\n\n\
  ### Workflow File\n\n**JSON 파일 경로**: `_build/n8n_workflows/workflow_d_hypothesis_seeder.json`\n\
  \n**import 방법**:\n\n1. n8n UI (https://n8n.sosilab.synology.me) 접속\n2. Workflows\
  \ → Import from File\n3. `workflow_d_hypothesis_seeder.json` 선택\n4. Credential 연결:\
  \ 모든 HTTP Request 노드에 `LOOP API Token` 선택\n5. 워크플로우 활성화\n\n---\n\n### Todo\n\n|\
  \ \\# | 상태 | 작업 내용 |\n| --- | --- | --- |\n| 1 | done | n8n 워크플로우 JSON 파일 생성 |\n\
  | 2 | todo | n8n에 워크플로우 import (UI) |\n| 3 | todo | Credential 연결 (`LOOP API Token`)\
  \ |\n| 4 | todo | 수동 테스트 실행 |\n| 5 | todo | Cron 활성화 (09:00 KST) |\n| 6 | todo |\
  \ 7일 모니터링 |\n\n---\n\n## 참고 문서\n\n- \\[\\[tsk-n8n-15\\]\\] - 선행 Task (고객중심 가설 강제\
  \ 시스템)\n- \\[\\[tsk-n8n-11\\]\\] - 선행 Task (Hypothesis Seeder API)\n- \\[\\[prj-n8n\\\
  ]\\] - 소속 Project\n\n---\n\n**Created**: 2026-01-03 **Assignee**: 김은향 **Due**: 2026-01-07"
---
# n8n - Workflow D Hypothesis Seeder

> Task ID: `tsk-n8n-16` | Project: `prj-n8n` | Status: doing

## 목표

n8n Workflow D를 구축하여 **가설 없는 Project를 자동 감지**하고 **Hypothesis 초안을 생성**합니다.

**완료 조건**:
1. Workflow D 트리거: Project (planning/active) + validates=[]
2. Hypothesis Seeder API 호출하여 draft 생성
3. Pending Review 등록 (Dashboard에서 승인)
4. n8n에 워크플로우 배포

---

## 상세 내용

### 배경

tsk-n8n-15에서 "고객중심 가설 강제 시스템"을 구현:
- Project active/done 전환 시 가설 필수 게이트
- Hypothesis 품질 검증에 고객중심 휴리스틱

이제 **자동 감지 + 생성 파이프라인**이 필요:
- 가설 없는 프로젝트를 cron으로 감지
- 자동으로 Hypothesis draft 생성
- Pending Review로 승인 대기

### Workflow D 설계

```
[Cron Trigger: 매일 09:00]
    ↓
[GET /api/projects]
    ↓
[Filter: status in [planning, active] AND validates=[]]
    ↓
[Loop Each Project]
    ├─→ [POST /api/ai/infer/hypothesis_draft]
    │       - project_id
    │       - provider: "openai" (default)
    │   ↓
    └─→ [Response 처리]
            - success: pending review 자동 생성됨
            - failure: 에러 로깅
    ↓
[Slack/Discord 알림 (선택)]
```

### API 엔드포인트

**트리거 조건 확인:**
```bash
GET /api/projects
# 필터: status in [planning, active] AND validates empty
```

**가설 생성:**
```bash
POST /api/ai/infer/hypothesis_draft
{
  "project_id": "prj-001",
  "provider": "openai"
}
# Response: pending review ID 포함
```

### n8n 노드 구성

| # | 노드 | 유형 | 설명 |
|---|------|------|------|
| 1 | Cron | Schedule Trigger | 매일 09:00 실행 |
| 2 | Get Projects | HTTP Request | GET /api/projects |
| 3 | Filter | IF | status + validates 조건 |
| 4 | Loop | SplitInBatches | 프로젝트별 처리 |
| 5 | Create Hypothesis | HTTP Request | POST hypothesis_draft |
| 6 | Merge Results | Merge | 결과 집계 |
| 7 | Notify | (선택) | Slack 알림 |

---

## 체크리스트

- [ ] n8n 워크플로우 JSON 생성
- [ ] Cron 트리거 설정 (09:00 KST)
- [ ] GET /api/projects 노드 구성
- [ ] validates=[] 필터링 로직 구현
- [ ] POST hypothesis_draft 노드 구성
- [ ] Credential 연결 (LOOP API Token)
- [ ] 워크플로우 테스트
- [ ] n8n 배포

---

## Notes

### PRD (Product Requirements Document)

#### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| Task ID | `tsk-n8n-16` |
| Task Name | n8n - Workflow D Hypothesis Seeder |
| Project | `prj-n8n` (n8n Vault 자동화) |
| 목표 | 가설 없는 Project를 자동 감지하고 Hypothesis 초안 생성 |

#### 1.2 선행 작업

| Task | 설명 | 상태 |
|------|------|------|
| `tsk-n8n-11` | Hypothesis Seeder API (`/api/ai/infer/hypothesis_draft`) | done |
| `tsk-n8n-15` | 고객중심 가설 강제 시스템 | done |

#### 1.3 문제 정의

**현재 상태:**
- API 레벨에서 Hypothesis draft 생성 기능 완성
- Project active/done 전환 시 가설 필수 게이트 구현
- **BUT**: 자동 감지 + 트리거 파이프라인 없음

**핵심 Pain Point:**
1. 수동 트리거 필요: API 직접 호출 필요
2. 일괄 처리 불가: 여러 프로젝트에 대해 반복 작업
3. 알림 없음: 가설 생성 대기 중인 프로젝트 파악 어려움

#### 1.4 해결 방안

n8n Workflow D를 구축하여:
1. **자동 감지**: Cron으로 매일 09:00에 실행
2. **조건 필터링**: `status in [planning, active] AND validates=[]`
3. **API 호출**: `/api/ai/infer/hypothesis_draft` 자동 호출
4. **Pending 생성**: Dashboard에서 승인 가능

#### 1.5 성공 기준

- [ ] n8n 워크플로우 정상 import 및 credential 연결
- [ ] 09:00 KST cron 트리거 동작
- [ ] 조건 필터 정상 작동 (validates 빈 배열만 처리)
- [ ] API 호출 후 pending review 생성
- [ ] 워크플로우 활성화 후 7일간 에러 없음

---

### Tech Spec

#### 2.1 워크플로우 아키텍처

```
┌─────────────────┐
│ Cron Trigger    │  매일 09:00 KST
│ (Schedule)      │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Get Projects    │  GET /api/projects
│ (HTTP Request)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Filter Projects │  status in [planning, active]
│ (IF + Code)     │  AND validates.length == 0
└────────┬────────┘
         ↓
┌─────────────────┐
│ Loop Projects   │  SplitInBatches
│ (Iterator)      │
└────────┬────────┘
         ↓
┌─────────────────────┐
│ Create Hypothesis   │  POST /api/ai/infer/hypothesis_draft
│ Draft (HTTP)        │  mode=pending, provider=openai
└────────┬────────────┘
         ↓
┌─────────────────┐
│ Aggregate       │  결과 집계
│ Results         │
└────────┬────────┘
         ↓
┌─────────────────┐
│ (Optional)      │  Slack/Discord 알림
│ Notify          │
└─────────────────┘
```

#### 2.2 노드 상세 설계

| # | 노드 이름 | 유형 | 설정 |
|---|-----------|------|------|
| 1 | `Schedule Trigger` | Schedule Trigger | cron: `0 9 * * *` (09:00 KST) |
| 2 | `Get Projects` | HTTP Request | GET `{{$env.LOOP_API_URL}}/api/projects` |
| 3 | `Filter Valid Projects` | Code | 필터 로직 (아래 참조) |
| 4 | `Loop Projects` | SplitInBatches | batchSize: 1 |
| 5 | `Hypothesis Draft` | HTTP Request | POST `{{$env.LOOP_API_URL}}/api/ai/infer/hypothesis_draft` |
| 6 | `Wait` | Wait | 2초 (rate limiting) |
| 7 | `Aggregate Results` | Aggregate | 처리 결과 수집 |

#### 2.3 필터 코드 (노드 3)

```javascript
// Filter: status in [planning, active] AND validates empty
const projects = $input.all()[0].json.projects || [];

const filtered = projects.filter(p => {
  // 1. status 조건
  const validStatus = ['planning', 'active'].includes(p.status);

  // 2. validates 빈 배열 조건
  const noHypothesis = !p.validates || p.validates.length === 0;

  // 3. primary_hypothesis_id도 없어야 함
  const noPrimaryHyp = !p.primary_hypothesis_id;

  return validStatus && noHypothesis && noPrimaryHyp;
});

return filtered.map(p => ({ json: p }));
```

#### 2.4 API 호출 설정 (노드 5)

**Request:**
```json
{
  "method": "POST",
  "url": "{{$env.LOOP_API_URL}}/api/ai/infer/hypothesis_draft",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "body": {
    "project_id": "={{$json.entity_id}}",
    "mode": "pending",
    "provider": "openai",
    "actor": "n8n-workflow-d"
  }
}
```

**Headers (Credential):**
- Name: `LOOP API Token`
- Header Name: `Authorization`
- Header Value: `Bearer {{$credentials.loopApiToken}}`

#### 2.5 에러 처리

| 시나리오 | 처리 |
|---------|------|
| Project 조회 실패 | 워크플로우 중단, 로그 기록 |
| API 호출 실패 | 해당 프로젝트 스킵, 다음 진행 |
| 전체 실패 | Slack 알림 (선택) |

#### 2.6 Credential 설정

n8n Credentials에서 생성 필요:

| Credential 이름 | 유형 | 설정 |
|----------------|------|------|
| `LOOP API Token` | Header Auth | Header: `Authorization`, Value: `Bearer ${LOOP_API_TOKEN}` |

**주의**: 워크플로우 import 후 반드시 수동으로 Credential 연결 필요

#### 2.7 테스트 케이스

| # | 테스트 | 조건 | 예상 결과 |
|---|--------|------|----------|
| 1 | 빈 validates 프로젝트 | status=planning, validates=[] | Hypothesis draft 생성 |
| 2 | 이미 가설 있는 프로젝트 | validates=['hyp-1-01'] | 스킵 |
| 3 | done 상태 프로젝트 | status=done | 스킵 |
| 4 | archived 프로젝트 | status=archived | 스킵 |

#### 2.8 모니터링

- n8n Execution History에서 실행 로그 확인
- `_build/ai_audit/` 디렉토리에서 API 호출 로그 확인
- Dashboard Pending Reviews에서 생성된 Hypothesis 확인

---

### Workflow File

**JSON 파일 경로**: `_build/n8n_workflows/workflow_d_hypothesis_seeder.json`

**import 방법**:
1. n8n UI (https://n8n.sosilab.synology.me) 접속
2. Workflows → Import from File
3. `workflow_d_hypothesis_seeder.json` 선택
4. Credential 연결: 모든 HTTP Request 노드에 `LOOP API Token` 선택
5. 워크플로우 활성화

---

### Todo

| # | 상태 | 작업 내용 |
|---|------|----------|
| 1 | done | n8n 워크플로우 JSON 파일 생성 |
| 2 | todo | n8n에 워크플로우 import (UI) |
| 3 | todo | Credential 연결 (`LOOP API Token`) |
| 4 | todo | 수동 테스트 실행 |
| 5 | todo | Cron 활성화 (09:00 KST) |
| 6 | todo | 7일 모니터링 |

---

## 참고 문서

- [[tsk-n8n-15]] - 선행 Task (고객중심 가설 강제 시스템)
- [[tsk-n8n-11]] - 선행 Task (Hypothesis Seeder API)
- [[prj-n8n]] - 소속 Project

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-07
