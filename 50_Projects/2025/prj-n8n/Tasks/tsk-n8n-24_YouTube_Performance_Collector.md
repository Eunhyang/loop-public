---
entity_type: Task
entity_id: tsk-n8n-24
entity_name: n8n - YouTube Performance Collector
created: 2026-01-11
updated: '2026-01-25'
closed: null
status: done
type: dev
project_id: prj-n8n
assignee: 김은향
priority_flag: medium
revision_count: 1
tags:
- n8n
- youtube
- discord
- automation
due: '2026-01-25'
priority: high
target_project: sosi
notes: "# n8n - YouTube Performance Collector\n\n> Task ID: `tsk-n8n-24` | Project:\
  \ `prj-n8n` | Status: doing\n\n---\n\n## 목적\n\nYouTube Studio 성과 데이터를 n8n 웹 폼으로\
  \ 입력받아 파싱 후 Discord로 결과 전송하는 워크플로우 개발\n\n---\n\n## 요구사항\n\n### A. 데이터 수집 워크플로우\n\
  \n1. n8n Form Trigger - YouTube 데이터 입력\n2. Code 노드 - 탭 구분 데이터 파싱\n3. HTTP Request\
  \ - Discord Webhook 호출\n\n### B. 리마인더 워크플로우\n\n1. Schedule Trigger - 매일 15:00 KST\n\
  2. HTTP Request - Discord Webhook 호출\n\n---\n\n## 설정값\n\n```yaml\nDiscord Webhook:\
  \ https://discord.com/api/webhooks/1459607313148284973/V-YQWF_NAYyflgwzhB_oDgpYtbihK6A6-inyglXSc4j2p5qnjQm6ZWvxHdzWikFPnUkF\n\
  Schedule: 0 15 * * * (매일 15:00 KST)\nForm webhookId: youtube-performance\nForm URL:\
  \ https://n8n.sosilab.synology.me/form/youtube-performance\n```\n\n---\n\n## 산출물\n\
  \n- `_build/n8n_workflows/youtube_performance_collector.json`\n\n---\n\n## Tech\
  \ Spec\n\n### 아키텍처 (단일 워크플로우, 이중 트리거)\n\n```\n┌─────────────────────┐     ┌─────────────────────┐\n\
  │ Schedule Trigger    │     │ Form Trigger        │\n│ (매일 15:00 KST)    │     │\
  \ (YouTube 데이터)    │\n└─────────┬───────────┘     └─────────┬───────────┘\n    \
  \      │                           │\n          └─────────┬─────────────────┘\n\
  \                    ▼\n          ┌─────────────────┐\n          │ Route by Source\
  \ │  (Switch 노드)\n          └─────────┬───────┘\n                    │\n       \
  \ ┌───────────┴───────────┐\n        ▼                       ▼\n┌───────────────┐\
  \       ┌───────────────┐\n│ Build         │       │ Parse Tab     │\n│ Reminder\
  \ Msg  │       │ Data          │\n└───────┬───────┘       └───────┬───────┘\n  \
  \      │                       │\n        │               ┌───────▼───────┐\n  \
  \      │               │ Build Summary │\n        │               │ Message    \
  \   │\n        │               └───────┬───────┘\n        │                    \
  \   │\n        └───────────┬───────────┘\n                    ▼\n          ┌─────────────────┐\n\
  \          │ Send to Discord │\n          │ (HTTP Request)  │\n          └─────────────────┘\n\
  ```\n\n### 노드 구성\n\n| 노드 | 타입 | 용도 |\n| --- | --- | --- |\n| `Daily 15:00 KST` |\
  \ scheduleTrigger | 매일 15:00 리마인더 |\n| `YouTube Data Form` | formTrigger | 데이터 입력\
  \ 폼 |\n| `Route by Source` | switch | 트리거 소스별 분기 |\n| `Parse Tab Data` | code |\
  \ YouTube 탭 데이터 파싱 |\n| `Build Reminder Msg` | code | 리마인더 메시지 생성 |\n| `Build Summary\
  \ Msg` | code | 저장 완료 메시지 생성 |\n| `Send to Discord` | httpRequest | Discord Webhook\
  \ 호출 |\n\n### 파싱 로직 (Revision 1: 라인 기반 파싱)\n\n> **IMPORTANT**: YouTube Studio는 탭\
  \ 구분이 아닌 라인 구분 데이터 (13줄/비디오)\n\n```javascript\n// Parse YouTube Studio Line Data\
  \ (13 lines per video)\nconst input = $input.first().json['YouTube Data'] || '';\n\
  const lines = input\n  .replace(/\\r\\n/g, '\\n')\n  .replace(/\\r/g, '\\n')\n \
  \ .split('\\n')\n  .map(l => l.trim());\n\nconst videos = [];\n\nfor (let i = 0;\
  \ i < lines.length; i++) {\n  // 비디오 시작 감지: \"Video thumbnail:\" 패턴\n  if (lines[i].startsWith('Video\
  \ thumbnail:')) {\n    // 제목 추출: \"Video thumbnail: {제목}\" 에서 제목 부분\n    const title\
  \ = lines[i].replace('Video thumbnail:', '').trim();\n\n    // 상대 위치로 데이터 추출\n \
  \   // Line +3: Views (e.g., \"2,356\")\n    // Line +11: Impressions (e.g., \"\
  1,609\")\n    const viewsLine = lines[i + 3] || '0';\n    const impressionsLine\
  \ = lines[i + 11] || '0';\n\n    const views = parseInt(viewsLine.replace(/,/g,\
  \ ''), 10) || 0;\n    const impressions = parseInt(impressionsLine.replace(/,/g,\
  \ ''), 10) || 0;\n\n    if (title) {\n      videos.push({ title, views, impressions\
  \ });\n    }\n\n    // 다음 비디오로 점프 (13줄 단위)\n    i += 12;\n  }\n}\n\nvideos.sort((a,\
  \ b) => b.views - a.views);\n\nconst summary = {\n  video_count: videos.length,\n\
  \  total_views: videos.reduce((sum, v) => sum + v.views, 0),\n  total_impressions:\
  \ videos.reduce((sum, v) => sum + v.impressions, 0),\n  top_3: videos.slice(0, 3)\n\
  };\n\nreturn [{ json: { videos, summary, parsed_at: new Date().toISOString() } }];\n\
  ```\n\n### Discord 메시지 포맷\n\n**리마인더 (매일 15:00)**\n\n```\n\U0001F4CA YouTube 데이터를\
  \ 입력해주세요!\n\n\U0001F517 입력 폼: https://n8n.sosilab.synology.me/form/youtube-performance\n\
  ```\n\n**저장 완료**\n\n```\n\U0001F4CA YouTube 데이터 저장 완료!\n\n\U0001F4F9 영상 수: 50개\n\
  \U0001F440 총 조회수: 123,456\n\U0001F4C8 총 노출수: 456,789\n\U0001F4C5 저장 시간: 2026-01-11\
  \ 15:30\n\n**상위 3개 영상:**\n1. 제목1 - 5,678 views\n2. 제목2 - 4,567 views\n3. 제목3 - 3,456\
  \ views\n```\n\n---\n\n## Todo\n\n### Completed (v1 - 탭 구분 파싱)\n\n- [x] youtube_performance_collector.json\
  \ 파일 생성\n\n- [x] 노드 ID, position 정의\n\n- [x] connections 정의\n\n- [x] n8n에 Import\
  \ 및 Activate\n\n### Revision 1 - 라인 기반 파싱 수정\n\n- [ ] Parse Tab Data 노드를 라인 기반 파싱으로\
  \ 교체\n\n- [ ] \"Video thumbnail:\" 패턴 감지 로직 구현\n\n- [ ] 상대 위치 데이터 추출 (Views: +3,\
  \ Impressions: +11)\n\n- [ ] 에러 핸들링 추가 (빈 줄, 잘못된 숫자)\n\n- [ ] n8n 워크플로우 업데이트 및 재활성화\n\
  \n- [ ] 실제 YouTube Studio 데이터로 테스트\n\n- [ ] Discord 메시지 확인 (영상 수 &gt; 0)\n\n###\
  \ Integration Testing\n\n- [ ] Form URL 테스트\n\n- [ ] Discord 메시지 확인\n\n- [ ] Schedule\
  \ Trigger 테스트\n\n---\n\n## 확장 포인트 (향후)\n\n### Content OS 연동\n\n`Parse Tab Data`\
  \ 노드 후에 HTTP Request 추가:\n\n- Endpoint: `POST /api/youtube/snapshots`\n- Body: `{\
  \ snapshot: { snapshotDate, data, source: 'n8n' } }`\n\n---\n\n## Codex Review\n\
  \n### Findings\n\n1. **에러 핸들링 부족**: 파싱 실패 시 동작 정의 필요 (잘못된 행, 누락된 컬럼, 비숫자 값)\n2.\
  \ **타임존 명시 필요**: n8n 서버 타임존 (Asia/Seoul) 확인, DST 고려\n3. **동시 실행 처리**: Form + Schedule\
  \ 동시 트리거 시 중복 메시지 방지\n4. **폼 검증 부족**: 필수 필드, 허용 포맷, 크기 제한, 인증 (현재 누구나 접근 가능)\n5.\
  \ **Discord Webhook 보안**: 환경변수 저장, 메시지 길이 제한 (2000자)\n6. **엣지 케이스**: 3개 미만 영상, 동일\
  \ 조회수, 음수/소수점 값\n7. **모니터링 부재**: 실패 시 재시도 정책, 알림, 로깅\n\n### 대응 방안\n\n| 항목 | 대응 |\n\
  | --- | --- |\n| 파싱 에러 | 잘못된 행 스킵, 파싱 성공 개수 리포트 |\n| 타임존 | n8n 서버 Asia/Seoul 설정\
  \ 확인 |\n| 동시 실행 | 현재는 허용 (중복 메시지 OK) |\n| 폼 인증 | v1은 공개, v2에서 토큰 추가 검토 |\n| Webhook\
  \ 보안 | n8n Credential로 관리 (환경변수) |\n| 엣지 케이스 | top_3.slice(0, videos.length) 처리\
  \ |\n| 모니터링 | onError: continueRegularOutput (실패해도 진행) |\n\n---\n\n## Notes\n\n\
  - v1 MVP로 먼저 구현 후 피드백 반영\n- Content OS 연동은 별도 Task로 분리\n\n---\n\n## Execution Log\
  \ (2026-01-11)\n\n### Plan Review (Codex Phase 2)\n\n**Command**: `codex exec -m\
  \ gpt-5.1-codex-max --config model_reasoning_effort=\"medium\" --sandbox read-only`\n\
  \n**Key Findings**:\n\n- Hardcoded Discord webhook (MVP decision: accepted for v1)\n\
  - Switch condition underspecified → Changed to IF node with existence check\n- Route\
  \ to single HTTP node needs consistent payload shape\n- Parse edge cases: blank\
  \ lines, Windows line endings, header detection\n- Double JSON.stringify bug identified\
  \ (CRITICAL)\n\n**Action**: Revised plan to use IF node, ensure payload consistency,\
  \ improve parsing\n\n### Implementation\n\n**Modified**: 1 file\n\n- Created: `_build/n8n_workflows/youtube_performance_collector.json`\n\
  \n**Key Changes**:\n\n- 7 nodes: 2 triggers, 1 IF router, 3 code nodes, 1 HTTP request\n\
  - Dual-trigger architecture (Schedule + Form)\n- IF node routes by \"YouTube Data\"\
  \ field existence\n- Both code paths emit `{ content: string }` for Discord\n- Parsing\
  \ handles Windows/Mac line endings, blank lines, header skip\n- Workflow timezone:\
  \ Asia/Seoul\n\n### Code Review (Codex Phase 5)\n\n**Command**: `codex exec -m gpt-5.1-codex-max\
  \ --config model_reasoning_effort=\"medium\" --sandbox read-only`\n\n**Critical\
  \ Issues Found**:\n\n1. Double JSON.stringify bug in HTTP node → Fixed to `$json`\n\
  2. Header detection too broad (could skip video titles) → Changed to skip first\
  \ line unconditionally\n3. Missing lone `\\r` handling → Added `.replace(/\\r/g,\
  \ '\\n')`\n4. Inconsistent locale in toLocaleString → Added 'ko-KR' throughout\n\
  \n**Re-validation**: `codex exec resume --last`\n\n- Confirmed JSON payload structure\
  \ correct\n- Confirmed CR/LF handling and ko-KR formatting\n- Noted: First-line\
  \ skip may drop data if no header (acceptable for MVP - YouTube Studio always has\
  \ headers)\n\n### Result\n\n**Status**: Implementation complete **Output**: `_build/n8n_workflows/youtube_performance_collector.json`\
  \ (valid JSON, 7 nodes) **Next**: Import to n8n, test both triggers, verify Discord\
  \ messages\n\n### Revision 1 Implementation (2026-01-11)\n\n**Modified**: 1 file\n\
  \n- Updated: `_build/n8n_workflows/youtube_performance_collector.json`\n\n**Key\
  \ Changes**:\n\n- Replaced tab-based parsing with line-based parsing\n- Added \"\
  Video thumbnail:\" marker detection\n- Extract data from relative line positions:\
  \ +3 (views), +11 (impressions)\n- Tested JSON syntax: ✅ Valid\n\n### Testing Checklist\n\
  \n- [x] Import workflow to n8n\n\n- [x] Activate workflow\n\n- [ ] Test Schedule\
  \ Trigger (wait for 15:00 or trigger manually)\n\n- [x] Test Form Trigger with sample\
  \ YouTube data\n\n- [ ] Verify Discord reminder message format\n\n- [x] Verify Discord\
  \ summary message with top 3 videos\n\n- [ ] Test edge cases (&lt; 3 videos, empty\
  \ input, Windows line endings)\n\n### Test Results (2026-01-11)\n\n**Form Trigger\
  \ 성공**:\n\n- 영상 수: 50개\n- 총 조회수: 12,282\n- 총 노출수: 39,022\n- 상위 3개 정상 표시\n\n---\n\
  \n## Revision History\n\n### Revision 1 (2026-01-11)\n\n**Issue**: YouTube Studio\
  \ 데이터 파싱이 0개 영상으로 반환됨\n\n**Root Cause**:\n\n- 기존 파싱 로직이 탭 구분 데이터(`title\\tviews\\\
  timpressions`)를 기대\n- 실제 YouTube Studio 복사 데이터는 **라인 구분** (13줄/비디오)\n\n**YouTube\
  \ Studio 실제 데이터 구조 (13줄/비디오)**:\n\n```\nLine 0:  Video thumbnail: {제목}     <- 시작점\
  \ 감지\nLine 1:  1:58                        (Duration)\nLine 2:  새벽에 먹어도 덜 찌는...\
  \     (Title clean)\nLine 3:  2,356                       <- Views 추출\nLine 4-10:\
  \ 기타 metrics\nLine 11: 1,609                       <- Impressions 추출\nLine 12: 6.7%\
  \                        (CTR)\n```\n\n**Impact**: 폼 제출 시 Discord에 \"영상 수: 0개\"\
  \ 표시됨\n\n**Fix Direction**:\n\n1. \"Video thumbnail:\" 패턴으로 비디오 시작 감지\n2. 상대 위치로\
  \ 데이터 추출 (Views: +3, Impressions: +11)\n3. 에러 핸들링: 빈 줄, 잘못된 숫자 처리"
---
# n8n - YouTube Performance Collector

> Task ID: `tsk-n8n-24` | Project: `prj-n8n` | Status: doing

---

## 목적

YouTube Studio 성과 데이터를 n8n 웹 폼으로 입력받아 파싱 후 Discord로 결과 전송하는 워크플로우 개발

---

## 요구사항

### A. 데이터 수집 워크플로우
1. n8n Form Trigger - YouTube 데이터 입력
2. Code 노드 - 탭 구분 데이터 파싱
3. HTTP Request - Discord Webhook 호출

### B. 리마인더 워크플로우
1. Schedule Trigger - 매일 15:00 KST
2. HTTP Request - Discord Webhook 호출

---

## 설정값

```yaml
Discord Webhook: https://discord.com/api/webhooks/1459607313148284973/V-YQWF_NAYyflgwzhB_oDgpYtbihK6A6-inyglXSc4j2p5qnjQm6ZWvxHdzWikFPnUkF
Schedule: 0 15 * * * (매일 15:00 KST)
Form webhookId: youtube-performance
Form URL: https://n8n.sosilab.synology.me/form/youtube-performance
```

---

## 산출물

- `_build/n8n_workflows/youtube_performance_collector.json`

---

## Tech Spec

### 아키텍처 (단일 워크플로우, 이중 트리거)

```
┌─────────────────────┐     ┌─────────────────────┐
│ Schedule Trigger    │     │ Form Trigger        │
│ (매일 15:00 KST)    │     │ (YouTube 데이터)    │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          └─────────┬─────────────────┘
                    ▼
          ┌─────────────────┐
          │ Route by Source │  (Switch 노드)
          └─────────┬───────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ Build         │       │ Parse Tab     │
│ Reminder Msg  │       │ Data          │
└───────┬───────┘       └───────┬───────┘
        │                       │
        │               ┌───────▼───────┐
        │               │ Build Summary │
        │               │ Message       │
        │               └───────┬───────┘
        │                       │
        └───────────┬───────────┘
                    ▼
          ┌─────────────────┐
          │ Send to Discord │
          │ (HTTP Request)  │
          └─────────────────┘
```

### 노드 구성

| 노드 | 타입 | 용도 |
|------|------|------|
| `Daily 15:00 KST` | scheduleTrigger | 매일 15:00 리마인더 |
| `YouTube Data Form` | formTrigger | 데이터 입력 폼 |
| `Route by Source` | switch | 트리거 소스별 분기 |
| `Parse Tab Data` | code | YouTube 탭 데이터 파싱 |
| `Build Reminder Msg` | code | 리마인더 메시지 생성 |
| `Build Summary Msg` | code | 저장 완료 메시지 생성 |
| `Send to Discord` | httpRequest | Discord Webhook 호출 |

### 파싱 로직 (Revision 1: 라인 기반 파싱)

> **IMPORTANT**: YouTube Studio는 탭 구분이 아닌 라인 구분 데이터 (13줄/비디오)

```javascript
// Parse YouTube Studio Line Data (13 lines per video)
const input = $input.first().json['YouTube Data'] || '';
const lines = input
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n')
  .split('\n')
  .map(l => l.trim());

const videos = [];

for (let i = 0; i < lines.length; i++) {
  // 비디오 시작 감지: "Video thumbnail:" 패턴
  if (lines[i].startsWith('Video thumbnail:')) {
    // 제목 추출: "Video thumbnail: {제목}" 에서 제목 부분
    const title = lines[i].replace('Video thumbnail:', '').trim();

    // 상대 위치로 데이터 추출
    // Line +3: Views (e.g., "2,356")
    // Line +11: Impressions (e.g., "1,609")
    const viewsLine = lines[i + 3] || '0';
    const impressionsLine = lines[i + 11] || '0';

    const views = parseInt(viewsLine.replace(/,/g, ''), 10) || 0;
    const impressions = parseInt(impressionsLine.replace(/,/g, ''), 10) || 0;

    if (title) {
      videos.push({ title, views, impressions });
    }

    // 다음 비디오로 점프 (13줄 단위)
    i += 12;
  }
}

videos.sort((a, b) => b.views - a.views);

const summary = {
  video_count: videos.length,
  total_views: videos.reduce((sum, v) => sum + v.views, 0),
  total_impressions: videos.reduce((sum, v) => sum + v.impressions, 0),
  top_3: videos.slice(0, 3)
};

return [{ json: { videos, summary, parsed_at: new Date().toISOString() } }];
```

### Discord 메시지 포맷

**리마인더 (매일 15:00)**
```
📊 YouTube 데이터를 입력해주세요!

🔗 입력 폼: https://n8n.sosilab.synology.me/form/youtube-performance
```

**저장 완료**
```
📊 YouTube 데이터 저장 완료!

📹 영상 수: 50개
👀 총 조회수: 123,456
📈 총 노출수: 456,789
📅 저장 시간: 2026-01-11 15:30

**상위 3개 영상:**
1. 제목1 - 5,678 views
2. 제목2 - 4,567 views
3. 제목3 - 3,456 views
```

---

## Todo

### Completed (v1 - 탭 구분 파싱)
- [x] youtube_performance_collector.json 파일 생성
- [x] 노드 ID, position 정의
- [x] connections 정의
- [x] n8n에 Import 및 Activate

### Revision 1 - 라인 기반 파싱 수정
- [ ] Parse Tab Data 노드를 라인 기반 파싱으로 교체
- [ ] "Video thumbnail:" 패턴 감지 로직 구현
- [ ] 상대 위치 데이터 추출 (Views: +3, Impressions: +11)
- [ ] 에러 핸들링 추가 (빈 줄, 잘못된 숫자)
- [ ] n8n 워크플로우 업데이트 및 재활성화
- [ ] 실제 YouTube Studio 데이터로 테스트
- [ ] Discord 메시지 확인 (영상 수 > 0)

### Integration Testing
- [ ] Form URL 테스트
- [ ] Discord 메시지 확인
- [ ] Schedule Trigger 테스트

---

## 확장 포인트 (향후)

### Content OS 연동
`Parse Tab Data` 노드 후에 HTTP Request 추가:
- Endpoint: `POST /api/youtube/snapshots`
- Body: `{ snapshot: { snapshotDate, data, source: 'n8n' } }`

---

## Codex Review

### Findings

1. **에러 핸들링 부족**: 파싱 실패 시 동작 정의 필요 (잘못된 행, 누락된 컬럼, 비숫자 값)
2. **타임존 명시 필요**: n8n 서버 타임존 (Asia/Seoul) 확인, DST 고려
3. **동시 실행 처리**: Form + Schedule 동시 트리거 시 중복 메시지 방지
4. **폼 검증 부족**: 필수 필드, 허용 포맷, 크기 제한, 인증 (현재 누구나 접근 가능)
5. **Discord Webhook 보안**: 환경변수 저장, 메시지 길이 제한 (2000자)
6. **엣지 케이스**: 3개 미만 영상, 동일 조회수, 음수/소수점 값
7. **모니터링 부재**: 실패 시 재시도 정책, 알림, 로깅

### 대응 방안

| 항목 | 대응 |
|------|------|
| 파싱 에러 | 잘못된 행 스킵, 파싱 성공 개수 리포트 |
| 타임존 | n8n 서버 Asia/Seoul 설정 확인 |
| 동시 실행 | 현재는 허용 (중복 메시지 OK) |
| 폼 인증 | v1은 공개, v2에서 토큰 추가 검토 |
| Webhook 보안 | n8n Credential로 관리 (환경변수) |
| 엣지 케이스 | top_3.slice(0, videos.length) 처리 |
| 모니터링 | onError: continueRegularOutput (실패해도 진행) |

---

## Notes

- v1 MVP로 먼저 구현 후 피드백 반영
- Content OS 연동은 별도 Task로 분리

---

## Execution Log (2026-01-11)

### Plan Review (Codex Phase 2)

**Command**: `codex exec -m gpt-5.1-codex-max --config model_reasoning_effort="medium" --sandbox read-only`

**Key Findings**:
- Hardcoded Discord webhook (MVP decision: accepted for v1)
- Switch condition underspecified → Changed to IF node with existence check
- Route to single HTTP node needs consistent payload shape
- Parse edge cases: blank lines, Windows line endings, header detection
- Double JSON.stringify bug identified (CRITICAL)

**Action**: Revised plan to use IF node, ensure payload consistency, improve parsing

### Implementation

**Modified**: 1 file
- Created: `_build/n8n_workflows/youtube_performance_collector.json`

**Key Changes**:
- 7 nodes: 2 triggers, 1 IF router, 3 code nodes, 1 HTTP request
- Dual-trigger architecture (Schedule + Form)
- IF node routes by "YouTube Data" field existence
- Both code paths emit `{ content: string }` for Discord
- Parsing handles Windows/Mac line endings, blank lines, header skip
- Workflow timezone: Asia/Seoul

### Code Review (Codex Phase 5)

**Command**: `codex exec -m gpt-5.1-codex-max --config model_reasoning_effort="medium" --sandbox read-only`

**Critical Issues Found**:
1. Double JSON.stringify bug in HTTP node → Fixed to `$json`
2. Header detection too broad (could skip video titles) → Changed to skip first line unconditionally
3. Missing lone `\r` handling → Added `.replace(/\r/g, '\n')`
4. Inconsistent locale in toLocaleString → Added 'ko-KR' throughout

**Re-validation**: `codex exec resume --last`
- Confirmed JSON payload structure correct
- Confirmed CR/LF handling and ko-KR formatting
- Noted: First-line skip may drop data if no header (acceptable for MVP - YouTube Studio always has headers)

### Result

**Status**: Implementation complete
**Output**: `_build/n8n_workflows/youtube_performance_collector.json` (valid JSON, 7 nodes)
**Next**: Import to n8n, test both triggers, verify Discord messages

### Revision 1 Implementation (2026-01-11)

**Modified**: 1 file
- Updated: `_build/n8n_workflows/youtube_performance_collector.json`

**Key Changes**:
- Replaced tab-based parsing with line-based parsing
- Added "Video thumbnail:" marker detection
- Extract data from relative line positions: +3 (views), +11 (impressions)
- Tested JSON syntax: ✅ Valid

### Testing Checklist

- [x] Import workflow to n8n
- [x] Activate workflow
- [ ] Test Schedule Trigger (wait for 15:00 or trigger manually)
- [x] Test Form Trigger with sample YouTube data
- [ ] Verify Discord reminder message format
- [x] Verify Discord summary message with top 3 videos
- [ ] Test edge cases (< 3 videos, empty input, Windows line endings)

### Test Results (2026-01-11)

**Form Trigger 성공**:
- 영상 수: 50개
- 총 조회수: 12,282
- 총 노출수: 39,022
- 상위 3개 정상 표시

---

## Revision History

### Revision 1 (2026-01-11)

**Issue**: YouTube Studio 데이터 파싱이 0개 영상으로 반환됨

**Root Cause**:
- 기존 파싱 로직이 탭 구분 데이터(`title\tviews\timpressions`)를 기대
- 실제 YouTube Studio 복사 데이터는 **라인 구분** (13줄/비디오)

**YouTube Studio 실제 데이터 구조 (13줄/비디오)**:
```
Line 0:  Video thumbnail: {제목}     <- 시작점 감지
Line 1:  1:58                        (Duration)
Line 2:  새벽에 먹어도 덜 찌는...     (Title clean)
Line 3:  2,356                       <- Views 추출
Line 4-10: 기타 metrics
Line 11: 1,609                       <- Impressions 추출
Line 12: 6.7%                        (CTR)
```

**Impact**: 폼 제출 시 Discord에 "영상 수: 0개" 표시됨

**Fix Direction**:
1. "Video thumbnail:" 패턴으로 비디오 시작 감지
2. 상대 위치로 데이터 추출 (Views: +3, Impressions: +11)
3. 에러 핸들링: 빈 줄, 잘못된 숫자 처리
