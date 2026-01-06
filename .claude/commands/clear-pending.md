---
description: Clear Pending Reviews (delete/reset pending_reviews.json on NAS server)
---

# Clear Pending Reviews

Reset `_build/pending_reviews.json` file on NAS server.
Use when too many pending reviews created by n8n AI Autofill have accumulated.

## File Info

| Item | Value |
|-----|-----|
| File | `_build/pending_reviews.json` |
| NAS path | `/volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json` |
| Container path | `/vault/_build/pending_reviews.json` |

## User Input

$ARGUMENTS

(reset / delete / count)

- **reset**: Reset to empty JSON (keep file)
- **delete**: Delete file completely
- **count**: Check current pending count only

## Execution Steps

### Check current count (count)
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -c "
import json, sys
from collections import Counter
data = json.load(sys.stdin)
reviews = data.get('reviews', [])
status_counts = Counter(r.get('status') for r in reviews)
print(f'Total: {len(reviews)}개')
for status, count in status_counts.most_common():
    print(f'  {status}: {count}개')
"
```

### Reset to empty JSON (reset)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
echo '"'"'{\"reviews\": [], \"metadata\": {\"version\": \"1.0.0\", \"reset_at\": \"$(date -Iseconds)\"}}'"'"' > /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"pending_reviews.json 리셋 완료\"
cat /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
" 2>&1'
```

### Delete file (delete)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
rm -f /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"pending_reviews.json 삭제 완료\"
ls -la /volume1/LOOP_CORE/vault/LOOP/_build/ | grep pending || echo \"파일 없음 확인\"
" 2>&1'
```

## Verify after reset
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -m json.tool
```

## Important Notes

- **reset**: API auto-recreates empty file, recommended
- **delete**: API auto-creates empty file on first call
- n8n workflows may create new pending items when run again
