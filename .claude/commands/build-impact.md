# Build Impact

> Impact 점수를 계산하고 impact.json을 업데이트합니다.

---

## 실행 시 동작

`scripts/build_impact.py` 스크립트를 실행합니다.

**워크플로우 위치**: [[TEAM_WORKFLOW]] 6단계 (자동 계산 & 판정)

---

## 수행 단계

1. **스크립트 실행**
   ```bash
   python3 scripts/build_impact.py .
   ```

2. **자동 처리**
   - 모든 Project의 Expected Score (A) 계산
   - 모든 Evidence의 Realized Score (B) 계산
   - Tier 정책 적용 (operational 제외)
   - impact.json 파일 생성/업데이트

3. **결과 확인**
   - 처리된 Project 수
   - 계산된 점수 요약
   - 제외된 Project 목록 (operational tier)

---

## 사용 예시

```
/build-impact
```

---

## 출력 파일

**`_build/impact.json`**

```json
{
  "model_version": "IM-2025-01",
  "generated_at": "2025-12-20T12:00:00",
  "projects": {
    "prj-010": {
      "name": "와디즈 펀딩",
      "tier": "strategic",
      "expected_score": 7.0,
      "realized_score": 0.147,
      "realized_status": "failed_but_high_signal"
    }
  },
  "projects_excluded": ["prj-015"]
}
```

---

## 자동 실행 시점

일반적으로 이 커맨드를 직접 실행할 필요 없음:

- `/retro` 실행 후 자동으로 호출됨
- Git commit 시 pre-commit hook으로 실행 가능

---

## 수동 실행이 필요한 경우

- Project frontmatter를 직접 수정한 후
- Evidence 파일을 직접 수정한 후
- 점수 재계산이 필요한 경우

---

## 참조

- [[impact_model_config]] - 점수 계산 설정
- `scripts/build_impact.py` - 실제 스크립트