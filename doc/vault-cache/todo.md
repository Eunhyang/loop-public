# vault-cache - TODO

**Project**: vault-cache
**Last Updated**: 2025-12-21

---

## 완료된 작업

(없음)

---

## 진행 중

(없음)

---

## 예정된 작업

### Phase 1: 인메모리 캐시 구현

- [ ] **CACHE-001** VaultCache 클래스 구현
  - 예상 파일: `api/cache/vault_cache.py`
  - 작업 내용: 인메모리 캐시 클래스 (tasks, projects 저장)
  - 우선순위: High

- [ ] **CACHE-002** mtime 기반 갱신 로직
  - 예상 파일: `api/cache/vault_cache.py`
  - 작업 내용: 파일 수정 시간 체크하여 변경된 파일만 다시 로드
  - 우선순위: High

- [ ] **CACHE-003** 초기 로드 함수
  - 예상 파일: `api/cache/vault_cache.py`
  - 작업 내용: 서버 시작 시 전체 vault 스캔하여 캐시 초기화
  - 우선순위: High

### Phase 2: API 라우터 연동

- [ ] **CACHE-004** tasks.py 캐시 적용
  - 예상 파일: `api/routers/tasks.py`
  - 작업 내용: 기존 파일 스캔 → 캐시 조회로 변경
  - 우선순위: High

- [ ] **CACHE-005** projects.py 캐시 적용
  - 예상 파일: `api/routers/projects.py`
  - 작업 내용: 기존 파일 스캔 → 캐시 조회로 변경
  - 우선순위: Medium

- [ ] **CACHE-006** 캐시 + 파일 동시 업데이트
  - 예상 파일: `api/cache/vault_cache.py`, `api/routers/tasks.py`
  - 작업 내용: CRUD 시 파일과 캐시 동시 업데이트
  - 우선순위: High

### Phase 3: 테스트 및 최적화

- [ ] **CACHE-007** 성능 테스트
  - 예상 파일: `tests/test_cache_performance.py`
  - 작업 내용: 캐시 적용 전/후 응답 시간 비교
  - 우선순위: Medium

- [ ] **CACHE-008** 문서 업데이트
  - 예상 파일: `api/README.md`, `doc/vault-cache/techspec.md`
  - 작업 내용: 캐시 아키텍처 문서화
  - 우선순위: Low

---

## 알려진 이슈

(없음)

---

## 작업 기록 가이드

**작업 시작 시**:
```
- [ ] **TASK-XXX** 태스크 제목
  - 예상 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 무엇을 할 것인지
  - 우선순위: High/Medium/Low
```

**작업 완료 시**:
```
- [x] **TASK-XXX** 태스크 제목
  - 수정 파일: `파일경로1`, `파일경로2`
  - 작업 내용: 실제 수행한 작업 설명
  - 변경 사항: 구체적인 변경 내용
  - 완료일: YYYY-MM-DD
```

---

**Last Updated**: 2025-12-21
