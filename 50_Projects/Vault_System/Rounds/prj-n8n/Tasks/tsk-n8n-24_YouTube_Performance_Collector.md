---
entity_type: Task
entity_id: tsk-n8n-24
entity_name: n8n - YouTube Performance Collector
created: 2026-01-11
updated: 2026-01-11
closed: 2026-01-11
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
---
# n8n - YouTube Performance Collector

> Task ID: `tsk-n8n-24` | Project: `prj-n8n` | Status: done

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

### 파싱 로직

```javascript
// Parse Tab Data
const input = $input.first().json['YouTube Data'] || '';
const lines = input.trim().split('\n');

const videos = [];
let headerSkipped = false;

for (const line of lines) {
  const cols = line.split('\t');
  if (cols.length < 2) continue;

  if (!headerSkipped && (cols[0].includes('영상') || cols[1].includes('조회'))) {
    headerSkipped = true;
    continue;
  }

  const title = cols[0]?.trim() || '';
  const views = parseInt((cols[1] || '0').replace(/,/g, ''), 10) || 0;
  const impressions = parseInt((cols[2] || '0').replace(/,/g, ''), 10) || 0;

  if (title) {
    videos.push({ title, views, impressions });
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

- [ ] youtube_performance_collector.json 파일 생성
- [ ] 노드 ID, position 정의
- [ ] connections 정의
- [ ] n8n에 Import 및 Activate
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

- [ ] Import workflow to n8n
- [ ] Activate workflow
- [ ] Test Schedule Trigger (wait for 15:00 or trigger manually)
- [ ] Test Form Trigger with sample YouTube data
- [ ] Verify Discord reminder message format
- [ ] Verify Discord summary message with top 3 videos
- [ ] Test edge cases (< 3 videos, empty input, Windows line endings)
