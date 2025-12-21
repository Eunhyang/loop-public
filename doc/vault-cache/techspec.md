# vault-cache - Technical Specification

**Project**: vault-cache
**Version**: 0.1.0
**Last Updated**: 2025-12-21
**Status**: Planning

---

## 1. 개요

### 목적

API 응답 속도 개선을 위한 인메모리 캐시 시스템 구현.
현재 매 요청마다 파일시스템 전체 스캔(O(n)) → 캐시 조회(O(1))로 변경.

### 핵심 기능

- 서버 시작 시 vault 전체 스캔하여 캐시 초기화
- entity_id → {data, file_path, mtime} 매핑
- mtime 기반 변경 감지 (Obsidian 편집 반영)
- API CRUD 시 캐시 + 파일 동시 업데이트

### 예상 성능 개선

| 작업 | 현재 | 개선 후 |
|------|------|---------|
| Task 목록 | 2-5초 | 10-50ms |
| Task 조회 | 1-3초 | 5-10ms |
| Task 수정 | 1-3초 | 20-50ms |

---

## 2. 아키텍처

### 기술 스택

- **Language**: Python 3.9+
- **Framework**: FastAPI
- **Cache**: In-memory (dict)
- **Sync**: mtime-based lazy refresh

### 디렉토리 구조

```
api/
├── cache/
│   ├── __init__.py
│   └── vault_cache.py    # VaultCache 클래스
├── routers/
│   ├── tasks.py          # 캐시 적용
│   └── projects.py       # 캐시 적용
└── main.py               # 서버 시작 시 캐시 초기화
```

### 데이터 흐름

```
[서버 시작]
    ↓
VaultCache._initial_load()
    ↓ vault 전체 스캔
cache.tasks = {entity_id: {data, path, mtime}}
cache.projects = {entity_id: {data, path, mtime}}

[API 조회 요청]
    ↓
cache.get_task(task_id)
    ↓ mtime 체크
변경됨? → 파일에서 다시 로드
변경안됨? → 캐시 반환

[API 수정 요청]
    ↓
cache.update_task(task_id, data)
    ↓
파일 쓰기 + 캐시 업데이트 (동시)
```

---

## 3. 핵심 클래스

### VaultCache

```python
class VaultCache:
    def __init__(self, vault_path: Path):
        self.vault_path = vault_path
        self.tasks: Dict[str, CacheEntry] = {}
        self.projects: Dict[str, CacheEntry] = {}
        self.path_map: Dict[str, Path] = {}  # entity_id → file_path
        self._initial_load()

    # 조회
    def get_task(self, task_id: str) -> Optional[Dict]
    def get_all_tasks(self, filters: Dict = None) -> List[Dict]
    def get_project(self, project_id: str) -> Optional[Dict]

    # 수정 (파일 + 캐시 동시)
    def update_task(self, task_id: str, data: Dict) -> bool
    def create_task(self, data: Dict, project_dir: Path) -> str
    def delete_task(self, task_id: str) -> bool

    # 내부
    def _initial_load(self) -> None
    def _check_mtime(self, task_id: str) -> bool
    def _reload_file(self, file_path: Path) -> Dict
```

### CacheEntry

```python
@dataclass
class CacheEntry:
    data: Dict[str, Any]      # frontmatter
    path: Path                # 파일 경로
    mtime: float              # 수정 시간
```

---

## 4. API 변경 사항

### Before (tasks.py)

```python
@router.get("")
def get_tasks():
    tasks = []
    for task_file in PROJECTS_DIR.rglob("Tasks/*.md"):  # O(n) 스캔
        frontmatter = extract_frontmatter(task_file)    # 매번 파싱
        tasks.append(frontmatter)
    return {"tasks": tasks}
```

### After (tasks.py)

```python
from ..cache import vault_cache

@router.get("")
def get_tasks():
    return {"tasks": vault_cache.get_all_tasks()}  # O(1) 캐시
```

---

## 5. 동기화 전략

### Obsidian 편집 반영

```python
def get_task(self, task_id: str) -> Optional[Dict]:
    entry = self.tasks.get(task_id)
    if not entry:
        return None

    # mtime 체크 (stat은 빠름 ~1-5ms)
    current_mtime = entry.path.stat().st_mtime
    if current_mtime > entry.mtime:
        # 변경됨 → 다시 로드
        entry = self._reload_file(entry.path)
        self.tasks[task_id] = entry

    return entry.data
```

### API 수정 시

```python
def update_task(self, task_id: str, data: Dict) -> bool:
    entry = self.tasks.get(task_id)
    if not entry:
        return False

    # 1. 파일 쓰기
    self._write_file(entry.path, data)

    # 2. 캐시 업데이트
    self.tasks[task_id] = CacheEntry(
        data=data,
        path=entry.path,
        mtime=time.time()
    )
    return True
```

---

## 6. 메모리 사용량 예측

| 문서 수 | 예상 메모리 |
|---------|------------|
| 1,000개 | ~2MB |
| 10,000개 | ~20MB |
| 100,000개 | ~200MB |

계산: 문서당 평균 2KB (frontmatter + 메타데이터)

---

## 7. 테스트 전략

- [ ] Unit Test: VaultCache 메서드별
- [ ] Integration Test: API 응답 시간 측정
- [ ] Stress Test: 만 개 문서 시뮬레이션

---

## 8. 배포

### 개발 환경

```bash
poetry run uvicorn api.main:app --reload --port 8081
```

### 프로덕션 환경

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8081 --workers 2
```

---

## 9. 아키텍처 결정 기록 (ADR)

### ADR-001: 인메모리 캐시 선택

- **날짜**: 2025-12-21
- **결정**: SQLite 대신 인메모리 캐시 사용
- **이유**:
  - 스키마 유연성 (frontmatter 필드 변경에 자유로움)
  - 구현 복잡도 낮음
  - 동기화 문제 최소화
- **영향**: 서버 재시작 시 캐시 rebuild 필요 (수 초)

### ADR-002: mtime 기반 갱신

- **날짜**: 2025-12-21
- **결정**: 파일 watcher 대신 mtime 체크
- **이유**:
  - NAS 마운트에서 watcher 불안정
  - stat() 호출은 빠름 (~1-5ms)
  - 구현 단순
- **영향**: 조회 시 stat() 오버헤드 (무시 가능)

---

**Version**: 0.1.0
**Status**: Living Document
