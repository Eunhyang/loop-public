# vault-cache - TODO

**Project**: vault-cache
**Last Updated**: 2025-12-21

---

## 완료된 작업

- [x] **CACHE-001** VaultCache 클래스 구현
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: CacheEntry 데이터클래스, VaultCache 클래스 구현
  - 변경 사항:
    - tasks/projects 딕셔너리로 캐시 저장
    - mtime 기반 변경 감지
    - get_task(), get_all_tasks() 등 조회 메서드
    - set_task(), remove_task() 등 업데이트 메서드
  - 완료일: 2025-12-21

- [x] **CACHE-002** mtime 기반 갱신 로직
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: 개별 조회 시 파일 수정 시간 체크하여 변경된 파일만 다시 로드
  - 변경 사항:
    - `_check_and_refresh_task()` 메서드
    - `_check_and_refresh_project()` 메서드
    - FileNotFoundError 처리 (삭제된 파일 캐시에서 제거)
  - 완료일: 2025-12-21

- [x] **CACHE-003** 초기 로드 함수
  - 수정 파일: `api/cache/vault_cache.py`, `api/cache/__init__.py`
  - 작업 내용: 서버 시작 시 전체 vault 스캔하여 캐시 초기화
  - 변경 사항:
    - `_initial_load()` 메서드
    - `_load_tasks()`, `_load_projects()` 메서드
    - 싱글톤 패턴 (`get_cache()` 함수)
  - 완료일: 2025-12-21

- [x] **CACHE-004** tasks.py 캐시 적용
  - 수정 파일: `api/routers/tasks.py`
  - 작업 내용: 기존 파일 스캔 → 캐시 조회로 변경
  - 변경 사항:
    - `get_tasks()`: 캐시에서 목록 조회
    - `get_task()`: 캐시에서 경로 조회 후 파일 읽기
    - `create_task()`: 캐시에서 ID 생성, 생성 후 캐시 업데이트
    - `update_task()`: 캐시에서 경로 조회, 수정 후 캐시 업데이트
    - `delete_task()`: 삭제 후 캐시에서 제거
  - 완료일: 2025-12-21

- [x] **CACHE-005** projects.py 캐시 적용
  - 수정 파일: `api/routers/projects.py`
  - 작업 내용: 기존 파일 스캔 → 캐시 조회로 변경
  - 변경 사항:
    - `get_projects()`: 캐시에서 목록 조회
    - `get_project()`: 캐시에서 조회
    - `create_project()`: 생성 후 캐시 업데이트
    - `update_project()`: 수정 후 캐시 업데이트
    - `delete_project()`: 삭제 후 캐시에서 제거 (하위 Task 포함)
  - 완료일: 2025-12-21

- [x] **CACHE-006** main.py 캐시 통계 엔드포인트 추가
  - 수정 파일: `api/main.py`
  - 작업 내용: 캐시 통계 및 리로드 엔드포인트 추가
  - 변경 사항:
    - `GET /api/cache/stats`: 캐시 통계 조회
    - `POST /api/cache/reload`: 캐시 강제 리로드
    - `GET /health`: 캐시 정보 포함
  - 완료일: 2025-12-21

- [x] **CACHE-007** 목록 조회 최적화
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: 목록 조회 시 mtime 체크 제거 (캐시만 반환)
  - 변경 사항:
    - `get_all_tasks()`: mtime 체크 제거
    - `get_all_projects()`: mtime 체크 제거
    - 개별 조회(`get_task`, `get_project`)는 mtime 체크 유지
  - 완료일: 2025-12-21

---

## 진행 중

(없음)

---

## 예정된 작업

(없음 - 기본 구현 완료)

---

## 성능 테스트 결과

| 엔드포인트 | 이전 | 현재 | 개선 |
|-----------|------|------|------|
| GET /api/tasks | ~3초 | **185ms** | 16x |
| GET /api/projects | ~2초 | **192ms** | 10x |
| GET /api/tasks?status=todo | ~2초 | **8ms** | 250x |
| GET /api/tasks/{id} | ~2초 | **219ms** | 9x |

**캐시 초기 로드**: ~21초 (48 tasks, 14 projects)

---

## 알려진 이슈

1. **초기 로드 시간**: NAS 네트워크 마운트로 인해 ~21초 소요
   - 해결책: 서버 시작 시 백그라운드 로딩 또는 lazy loading 고려

2. **Obsidian 편집 반영**: 목록 조회는 캐시만 반환하므로 즉시 반영 안 됨
   - 해결책: `POST /api/cache/reload` 호출 또는 개별 조회로 갱신

---

## 생성된 파일

```
api/cache/
├── __init__.py          # 싱글톤 인스턴스 export
└── vault_cache.py       # VaultCache 클래스 (350줄)
```

---

**Last Updated**: 2025-12-21
