---
description: Pending Reviews management (list, filter, reset)
---

# Pending Reviews Management

Manage pending reviews created by n8n AI Autofill and Hypothesis Seeder.

## File Info

| Item | Value |
|-----|-----|
| File | `_build/pending_reviews.json` |
| NAS path | `/volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json` |
| API | `https://mcp.sosilab.synology.me/api/pending` |

## User Input

$ARGUMENTS

### Commands

| Command | Description |
|-----|------|
| `status` | Overview (count, by status, by type) |
| `list` | Detailed list (recent 10) |
| `list all` | Full list |
| `list hypothesis` | Hypothesis Seeder results only |
| `list pending` | pending status only |
| `reset` | Reset to empty JSON |
| `delete` | Delete file completely |
| `clear-done` | Delete approved/rejected only (keep pending) |

---

## Execution Steps

### status - Overview
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

# By status
status_counts = Counter(r.get('status') for r in reviews)
print('\n📌 상태별:')
for status, count in status_counts.most_common():
    emoji = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}.get(status, '•')
    print(f'  {emoji} {status}: {count}개')

# By entity type
type_counts = Counter(r.get('entity_type') for r in reviews)
print('\n📁 엔티티 타입별:')
for etype, count in type_counts.most_common():
    print(f'  • {etype}: {count}개')

# Hypothesis Seeder results (source=ai_infer)
hyp_seeder = [r for r in reviews if r.get('source') == 'ai_infer' and r.get('entity_type') == 'Hypothesis']
if hyp_seeder:
    print(f'\n🧪 Hypothesis Seeder 결과: {len(hyp_seeder)}개')
    pending_hyp = len([r for r in hyp_seeder if r.get('status') == 'pending'])
    if pending_hyp:
        print(f'   → 승인 대기 중: {pending_hyp}개')

# Date range
dates = [r.get('created_at', '')[:10] for r in reviews if r.get('created_at')]
if dates:
    print(f'\n📅 기간: {min(dates)} ~ {max(dates)}')
"
```

### list - List view

#### Basic (recent 10)
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -c "
import json, sys
data = json.load(sys.stdin)
reviews = data.get('reviews', [])

# Sort by newest
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

#### Full list (list all)
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

#### Hypothesis only (list hypothesis)
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

    # Hypothesis draft info
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

#### pending status only (list pending)
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

### reset - Reset to empty JSON
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
echo '"'"'{\"reviews\": [], \"metadata\": {\"version\": \"1.0.0\", \"reset_at\": \"$(date -Iseconds)\"}}'"'"' > /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"✅ pending_reviews.json 리셋 완료\"
echo \"\"
cat /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
" 2>&1'
```

### delete - Delete file
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
rm -f /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"✅ pending_reviews.json 삭제 완료\"
ls -la /volume1/LOOP_CORE/vault/LOOP/_build/ | grep pending || echo \"(파일 없음 확인)\"
" 2>&1'
```

### clear-done - Delete approved/rejected only
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -c "
import json, sys

data = json.load(sys.stdin)
reviews = data.get('reviews', [])

# Keep pending only
pending_only = [r for r in reviews if r.get('status') == 'pending']
removed_count = len(reviews) - len(pending_only)

# Create new JSON
new_data = {
    'reviews': pending_only,
    'metadata': data.get('metadata', {'version': '1.0.0'})
}

print(json.dumps(new_data, ensure_ascii=False))
print(f'# 삭제: {removed_count}개, 유지: {len(pending_only)}개', file=sys.stderr)
" 2>/tmp/pending_clear_log.txt > /tmp/pending_cleared.json

# Output result
cat /tmp/pending_clear_log.txt

# Upload file
sshpass -p 'Dkssud272902*' scp -P 22 -o StrictHostKeyChecking=no /tmp/pending_cleared.json Sosilab@100.93.242.60:/tmp/

sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cp /tmp/pending_cleared.json /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"✅ approved/rejected 삭제 완료\"
" 2>&1'
```

---

## Related Endpoints

| Endpoint | Description |
|-----------|------|
| `GET /api/pending` | List view |
| `GET /api/pending?status=pending` | Status filter |
| `POST /api/pending/{id}/approve` | Approve |
| `POST /api/pending/{id}/reject` | Reject |
| `DELETE /api/pending/{id}` | Delete individual |

## Important Notes

- **reset**: API recreates empty file, recommended
- **delete**: API auto-creates empty file on first call
- **clear-done**: Clean up completed items, keep pending
- n8n workflows may create new pending items when run
