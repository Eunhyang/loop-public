---
description: Pending Reviews 통합 관리 (조회, 필터, 초기화)
---

# Pending Reviews 관리

n8n AI Autofill 및 Hypothesis Seeder가 생성한 pending review를 관리합니다.

## 파일 정보

| 항목 | 값 |
|-----|-----|
| 파일 | `_build/pending_reviews.json` |
| NAS 경로 | `/volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json` |
| API | `https://mcp.sosilab.synology.me/api/pending` |

## 사용자 입력

$ARGUMENTS

### 명령어

| 명령 | 설명 |
|-----|------|
| `status` | 전체 현황 (개수, 상태별, 타입별 분류) |
| `list` | 상세 목록 (최근 10개) |
| `list all` | 전체 목록 |
| `list hypothesis` | Hypothesis Seeder 결과만 |
| `list pending` | pending 상태만 |
| `reset` | 빈 JSON으로 초기화 |
| `delete` | 파일 완전 삭제 |
| `clear-done` | approved/rejected만 삭제 (pending 유지) |

---

## 실행 절차

### status - 전체 현황
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -c "
import json, sys
from collections import Counter
from datetime import datetime

data = json.load(sys.stdin)
reviews = data.get('reviews', [])

print('=' * 50)
print('📊 Pending Reviews 현황')
print('=' * 50)
print(f'\n총 개수: {len(reviews)}개')

if not reviews:
    print('\n(비어 있음)')
    sys.exit(0)

# 상태별 분류
status_counts = Counter(r.get('status') for r in reviews)
print('\n📌 상태별:')
for status, count in status_counts.most_common():
    emoji = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}.get(status, '•')
    print(f'  {emoji} {status}: {count}개')

# 엔티티 타입별 분류
type_counts = Counter(r.get('entity_type') for r in reviews)
print('\n📁 엔티티 타입별:')
for etype, count in type_counts.most_common():
    print(f'  • {etype}: {count}개')

# Hypothesis Seeder 결과 (source=ai_infer)
hyp_seeder = [r for r in reviews if r.get('source') == 'ai_infer' and r.get('entity_type') == 'Hypothesis']
if hyp_seeder:
    print(f'\n🧪 Hypothesis Seeder 결과: {len(hyp_seeder)}개')
    pending_hyp = len([r for r in hyp_seeder if r.get('status') == 'pending'])
    if pending_hyp:
        print(f'   → 승인 대기 중: {pending_hyp}개')

# 최근 생성일
dates = [r.get('created_at', '')[:10] for r in reviews if r.get('created_at')]
if dates:
    print(f'\n📅 기간: {min(dates)} ~ {max(dates)}')
"
```

### list - 목록 조회

#### 기본 (최근 10개)
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -c "
import json, sys
data = json.load(sys.stdin)
reviews = data.get('reviews', [])

# 최신순 정렬
reviews.sort(key=lambda x: x.get('created_at', ''), reverse=True)
reviews = reviews[:10]

print('=' * 60)
print('📋 Pending Reviews 목록 (최근 10개)')
print('=' * 60)

for r in reviews:
    status_emoji = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}.get(r.get('status'), '•')
    entity_type = r.get('entity_type', 'Unknown')
    source = r.get('source', '')
    source_tag = ' [Seeder]' if source == 'ai_infer' else ''

    print(f\"\n{status_emoji} {r.get('id', 'N/A')}\")
    print(f\"   Entity: [{entity_type}] {r.get('entity_id')} - {r.get('entity_name', '')[:30]}{source_tag}\")
    print(f\"   Created: {r.get('created_at', 'N/A')[:16]}\")

    if r.get('status') == 'approved':
        print(f\"   Approved: {r.get('approved_at', 'N/A')[:16]}\")
    elif r.get('status') == 'rejected':
        print(f\"   Rejected: {r.get('rejected_at', 'N/A')[:16]} - {r.get('reject_reason', '')[:40]}\")

if not reviews:
    print('\n(비어 있음)')
"
```

#### 전체 (list all)
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -c "
import json, sys
data = json.load(sys.stdin)
reviews = data.get('reviews', [])
reviews.sort(key=lambda x: x.get('created_at', ''), reverse=True)

print('=' * 60)
print(f'📋 Pending Reviews 전체 목록 ({len(reviews)}개)')
print('=' * 60)

for r in reviews:
    status_emoji = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}.get(r.get('status'), '•')
    source_tag = ' [Seeder]' if r.get('source') == 'ai_infer' else ''
    print(f\"{status_emoji} {r.get('entity_type')}: {r.get('entity_id')} - {r.get('entity_name', '')[:25]}{source_tag} ({r.get('status')})\")

if not reviews:
    print('\n(비어 있음)')
"
```

#### Hypothesis만 (list hypothesis)
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -c "
import json, sys
data = json.load(sys.stdin)
reviews = [r for r in data.get('reviews', []) if r.get('entity_type') == 'Hypothesis' or r.get('source') == 'ai_infer']
reviews.sort(key=lambda x: x.get('created_at', ''), reverse=True)

print('=' * 60)
print(f'🧪 Hypothesis Seeder 결과 ({len(reviews)}개)')
print('=' * 60)

for r in reviews:
    status_emoji = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}.get(r.get('status'), '•')

    print(f\"\n{status_emoji} {r.get('id')}\")
    print(f\"   Entity: {r.get('entity_id')} - {r.get('entity_name', '')[:40]}\")
    print(f\"   Status: {r.get('status')} | Created: {r.get('created_at', '')[:16]}\")

    # Hypothesis draft 정보
    suggested = r.get('suggested_fields', {})
    if 'hypothesis_draft' in suggested:
        draft = suggested['hypothesis_draft']
        print(f\"   Question: {draft.get('hypothesis_question', 'N/A')[:50]}\")
        print(f\"   Track: {draft.get('parent_id', 'N/A')} | Horizon: {draft.get('horizon', 'N/A')}\")

    if r.get('status') == 'approved' and r.get('hypothesis_result'):
        hr = r['hypothesis_result']
        print(f\"   → Created: {hr.get('file_path', 'N/A')}\")

if not reviews:
    print('\n(비어 있음)')
"
```

#### pending 상태만 (list pending)
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending?status=pending" | python3 -c "
import json, sys
data = json.load(sys.stdin)
reviews = data.get('reviews', [])
reviews.sort(key=lambda x: x.get('created_at', ''), reverse=True)

print('=' * 60)
print(f'⏳ 승인 대기 중 ({len(reviews)}개)')
print('=' * 60)

for r in reviews:
    source_tag = ' [Seeder]' if r.get('source') == 'ai_infer' else ''
    print(f\"\n• {r.get('id')}\")
    print(f\"  [{r.get('entity_type')}] {r.get('entity_id')} - {r.get('entity_name', '')[:35]}{source_tag}\")
    print(f\"  Created: {r.get('created_at', '')[:16]}\")

if not reviews:
    print('\n(승인 대기 항목 없음)')
"
```

### reset - 빈 JSON으로 초기화
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
echo '"'"'{\"reviews\": [], \"metadata\": {\"version\": \"1.0.0\", \"reset_at\": \"$(date -Iseconds)\"}}'"'"' > /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"✅ pending_reviews.json 리셋 완료\"
echo \"\"
cat /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
" 2>&1'
```

### delete - 파일 삭제
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
rm -f /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"✅ pending_reviews.json 삭제 완료\"
ls -la /volume1/LOOP_CORE/vault/LOOP/_build/ | grep pending || echo \"(파일 없음 확인)\"
" 2>&1'
```

### clear-done - approved/rejected만 삭제
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -c "
import json, sys

data = json.load(sys.stdin)
reviews = data.get('reviews', [])

# pending만 유지
pending_only = [r for r in reviews if r.get('status') == 'pending']
removed_count = len(reviews) - len(pending_only)

# 새 JSON 생성
new_data = {
    'reviews': pending_only,
    'metadata': data.get('metadata', {'version': '1.0.0'})
}

print(json.dumps(new_data, ensure_ascii=False))
print(f'# 삭제: {removed_count}개, 유지: {len(pending_only)}개', file=sys.stderr)
" 2>/tmp/pending_clear_log.txt > /tmp/pending_cleared.json

# 결과 출력
cat /tmp/pending_clear_log.txt

# 파일 업로드
sshpass -p 'Dkssud272902*' scp -P 22 -o StrictHostKeyChecking=no /tmp/pending_cleared.json Sosilab@100.93.242.60:/tmp/

sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cp /tmp/pending_cleared.json /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"✅ approved/rejected 삭제 완료\"
" 2>&1'
```

---

## 관련 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/pending` | 목록 조회 |
| `GET /api/pending?status=pending` | 상태 필터 |
| `POST /api/pending/{id}/approve` | 승인 |
| `POST /api/pending/{id}/reject` | 거부 |
| `DELETE /api/pending/{id}` | 개별 삭제 |

## 주의사항

- **reset**: API가 빈 파일을 다시 생성하므로 권장
- **delete**: API 첫 호출 시 빈 파일 자동 생성
- **clear-done**: pending만 남기고 처리 완료된 항목 정리
- n8n 워크플로우가 실행되면 pending이 다시 쌓일 수 있음
