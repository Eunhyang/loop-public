# NAS Git Status

NAS Git 동기화 상태를 확인합니다 (읽기 전용).

## 사용 시점
- NAS git-sync가 제대로 동작하는지 확인할 때
- 동기화 로그를 확인할 때
- NAS와 GitHub 간 차이를 확인할 때

## 실행 절차

### 1. 동기화 로그 확인
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
echo "=== 최근 동기화 로그 (최근 30줄) ==="
tail -30 /volume1/LOOP_CORE/vault/LOOP/_build/git-sync.log 2>/dev/null || echo "로그 파일 없음"
'
```

### 2. NAS Git 상태 확인
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null

echo "=== NAS Git Status ==="
git status --short

echo ""
echo "=== 최근 커밋 (5개) ==="
git log --oneline -5

echo ""
echo "=== Remote 상태 ==="
git remote -v
'
```

### 3. Cron 등록 상태 확인
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
echo "=== Cron 등록 상태 ==="
cat /etc/crontab | grep nas-git-sync || echo "cron 미등록"
'
```

## 결과 해석

| 로그 메시지 | 의미 |
|------------|------|
| `커밋 완료: N files` | 정상 - N개 파일 커밋됨 |
| `로컬 변경사항 없음` | 정상 - 변경 없음 |
| `Pull 완료` / `Push 완료` | 정상 동기화 |
| `ERROR: Pull 실패` | 충돌 발생 - `/nas-git reset` 필요 |
| `ERROR: Push 실패` | 권한 또는 네트워크 문제 |
