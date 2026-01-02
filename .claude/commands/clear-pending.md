---
description: Pending Reviews 초기화 (NAS 서버의 pending_reviews.json 삭제/리셋)
---

# Clear Pending Reviews

NAS 서버의 `_build/pending_reviews.json` 파일을 초기화합니다.
n8n AI Autofill이 생성한 pending review가 너무 많이 쌓였을 때 사용합니다.

## 파일 정보

| 항목 | 값 |
|-----|-----|
| 파일 | `_build/pending_reviews.json` |
| NAS 경로 | `/volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json` |
| 컨테이너 경로 | `/vault/_build/pending_reviews.json` |

## 사용자 입력

$ARGUMENTS

(reset / delete / count)

- **reset**: 빈 JSON으로 초기화 (파일 유지)
- **delete**: 파일 완전 삭제
- **count**: 현재 pending 개수만 확인

## 실행 절차

### 현재 개수 확인 (count)
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

### 빈 JSON으로 리셋 (reset)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
echo '"'"'{\"reviews\": [], \"metadata\": {\"version\": \"1.0.0\", \"reset_at\": \"$(date -Iseconds)\"}}'"'"' > /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"pending_reviews.json 리셋 완료\"
cat /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
" 2>&1'
```

### 파일 삭제 (delete)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
rm -f /volume1/LOOP_CORE/vault/LOOP/_build/pending_reviews.json
echo \"pending_reviews.json 삭제 완료\"
ls -la /volume1/LOOP_CORE/vault/LOOP/_build/ | grep pending || echo \"파일 없음 확인\"
" 2>&1'
```

## 리셋 후 확인
```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" "https://mcp.sosilab.synology.me/api/pending" | python3 -m json.tool
```

## 주의사항

- **reset**: API가 자동으로 빈 파일을 다시 생성하므로 권장
- **delete**: API 첫 호출 시 빈 파일이 자동 생성됨
- n8n 워크플로우가 다시 실행되면 pending이 다시 쌓일 수 있음
