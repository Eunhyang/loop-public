# API Program Support - TODO

**Project**: api-program-support
**Last Updated**: 2025-12-23

---

## 완료된 작업

### Phase 1: VaultCache Program 지원

- [x] **TASK-001** VaultCache에 programs 캐시 저장소 추가
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: `self.programs`, `self.programs_dir`, `self._program_count` 추가
  - 변경 사항:
    - `__init__()`: programs_dir, programs 캐시, _program_count 추가
    - `_initial_load()`: _load_programs() 호출 추가
    - 로그 메시지에 programs 수 추가
  - 완료일: 2025-12-23

- [x] **TASK-002** _load_programs() 메서드 구현
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: `50_Programs/pgm-*/_PROGRAM.md` 스캔 로직
  - 변경 사항:
    - `_load_programs()`: 50_Programs 폴더 스캔
    - `_load_program_file()`: 단일 Program 파일 로드
  - 완료일: 2025-12-23

- [x] **TASK-003** _load_projects() 확장 - Program Rounds 지원
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: `50_Programs/pgm-*/Rounds/prj-*` 스캔 추가
  - 변경 사항:
    - `_load_projects()`: 기존 50_Projects/2025/P* + 추가 50_Programs/*/Rounds/prj-*
  - 완료일: 2025-12-23

- [x] **TASK-004** get_all_programs() 메서드 추가
  - 수정 파일: `api/cache/vault_cache.py`
  - 작업 내용: API용 Program 목록 조회 메서드
  - 변경 사항:
    - `get_program()`: 단일 Program 조회
    - `get_all_programs()`: Program 목록 조회 (mtime 체크 포함)
    - `reload()`, `stats()`: programs 추가
  - 완료일: 2025-12-23

### Phase 2: API Router

- [x] **TASK-005** programs.py 라우터 생성
  - 수정 파일: `api/routers/programs.py` (신규), `api/main.py`
  - 작업 내용: GET /api/programs, GET /api/programs/{program_id} 엔드포인트
  - 변경 사항:
    - `api/routers/programs.py`: 신규 생성
    - `api/main.py`: programs 라우터 import 및 등록
  - 완료일: 2025-12-23

---

## 진행 중

(없음)

---

## 예정된 작업

(없음 - 프로젝트 완료)

---

## 알려진 이슈

(해결됨) ~~현재 `50_Programs/` 폴더가 스캔되지 않아 대시보드에 Program이 표시되지 않음~~

---

**Last Updated**: 2025-12-23
**Status**: Completed
