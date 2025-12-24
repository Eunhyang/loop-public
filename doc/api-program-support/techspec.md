# API Program Support - Technical Specification

**Project**: api-program-support
**Version**: 0.1.0
**Last Updated**: 2025-12-23
**Status**: Planning

---

## 1. 개요

### 목적

VaultCache에 Program 엔티티 지원을 추가하여 대시보드에서 `50_Programs/` 폴더의 Program 및 하위 Round(Project)를 표시할 수 있도록 함.

### 배경

- 현재 `50_Projects/2025/P*`만 스캔
- `50_Programs/pgm-*/` 폴더는 스캔되지 않음
- Program + Round 구조 (예: YouTube 주간 업로드)가 대시보드에 표시 안 됨

### 핵심 기능

- Program 엔티티 캐싱
- Program 하위 Rounds(Project) 스캔
- API를 통한 Program 조회

---

## 2. 아키텍처

### 현재 구조

```
VaultCache
├── self.projects_dir = vault_path / "50_Projects" / "2025"
├── self.projects: Dict[str, CacheEntry]
├── _load_projects() → 50_Projects/2025/P*만 스캔
└── get_all_projects()
```

### 변경 후 구조

```
VaultCache
├── self.projects_dir = vault_path / "50_Projects" / "2025"
├── self.programs_dir = vault_path / "50_Programs"  # 추가
├── self.projects: Dict[str, CacheEntry]
├── self.programs: Dict[str, CacheEntry]  # 추가
├── _load_projects() → 50_Projects/2025/P* + 50_Programs/*/Rounds/prj-*
├── _load_programs() → 50_Programs/pgm-*/_PROGRAM.md  # 추가
├── get_all_projects()
└── get_all_programs()  # 추가
```

### 스캔 경로

| 엔티티 | 현재 스캔 경로 | 추가 스캔 경로 |
|--------|----------------|----------------|
| Project | `50_Projects/2025/P*/` | `50_Programs/pgm-*/Rounds/prj-*/` |
| Program | (없음) | `50_Programs/pgm-*/_PROGRAM.md` |

---

## 3. 데이터 모델

### Program Entity (schema_registry.md v3.7)

```yaml
entity_type: Program
entity_id: pgm-{name}  # 예: pgm-youtube-weekly
entity_name: string
status: active  # 항상 active (닫지 않음)
program_type: hiring | fundraising | grants | launch | experiments
owner: string
principles: [string]
process_steps: [string]
kpis:
  - name: string
    description: string
```

### Project with Program Link

```yaml
entity_type: Project
entity_id: prj-{number}
program_id: pgm-{name}  # Program 연결 (optional)
cycle: string  # 예: "W33", "2026Q1"
```

---

## 4. 구현 상세

### TASK-001: programs 캐시 저장소 추가

```python
# __init__() 에 추가
self.programs_dir = vault_path / "50_Programs"
self.programs: Dict[str, CacheEntry] = {}
self._program_count: int = 0
```

### TASK-002: _load_programs() 구현

```python
def _load_programs(self) -> None:
    """모든 Program 파일 로드"""
    if not self.programs_dir.exists():
        return

    self._update_dir_mtime(self.programs_dir, 'Program')

    for program_dir in self.programs_dir.glob("pgm-*"):
        if not program_dir.is_dir():
            continue
        program_file = program_dir / "_PROGRAM.md"
        if program_file.exists():
            self._load_program_file(program_file)

def _load_program_file(self, file_path: Path) -> Optional[str]:
    """단일 Program 파일 로드"""
    data = self._extract_frontmatter(file_path)
    if not data or data.get('entity_type') != 'Program':
        return None

    entity_id = data.get('entity_id')
    if not entity_id:
        return None

    data['_path'] = str(file_path.relative_to(self.vault_path))
    data['_dir'] = str(file_path.parent.relative_to(self.vault_path))

    self.programs[entity_id] = CacheEntry(
        data=data,
        path=file_path,
        mtime=file_path.stat().st_mtime
    )
    self._program_count += 1
    return entity_id
```

### TASK-003: _load_projects() 확장

```python
def _load_projects(self) -> None:
    """모든 Project 파일 로드 (기존 + Program Rounds)"""
    # 기존: 50_Projects/2025/P*
    if self.projects_dir.exists():
        for project_dir in self.projects_dir.glob("P*"):
            # ... 기존 로직 ...

    # 추가: 50_Programs/pgm-*/Rounds/prj-*
    if self.programs_dir.exists():
        for program_dir in self.programs_dir.glob("pgm-*"):
            rounds_dir = program_dir / "Rounds"
            if not rounds_dir.exists():
                continue
            for round_dir in rounds_dir.glob("prj-*"):
                if not round_dir.is_dir():
                    continue
                for pattern in ["Project_정의.md", "*.md"]:
                    project_files = list(round_dir.glob(pattern))
                    for pf in project_files:
                        if pf.name.startswith("_") or "Tasks" in str(pf):
                            continue
                        self._load_project_file(pf)
                        break
```

### TASK-004: get_all_programs()

```python
def get_all_programs(self) -> List[Dict[str, Any]]:
    """Program 목록 조회 (디렉토리 mtime 체크 포함)"""
    with self._lock:
        if self._should_reload_dir(self.programs_dir, 'Program'):
            self.programs.clear()
            self._program_count = 0
            self._load_programs()

        results = []
        for program_id, entry in list(self.programs.items()):
            results.append(entry.data.copy())

        return sorted(results, key=lambda x: x.get('entity_id', ''))
```

---

## 5. 테스트 계획

### 수동 테스트

1. API 서버 재시작
2. `/api/programs` 엔드포인트 호출 (TASK-005 완료 시)
3. `/api/projects` 에서 Program Round 프로젝트 확인
4. 대시보드에서 pgm-youtube-weekly 및 prj-014 표시 확인

### curl 테스트

```bash
# Program 목록
curl http://localhost:8081/api/programs

# Project 목록 (Program Rounds 포함)
curl http://localhost:8081/api/projects
```

---

## 6. 영향 범위

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `api/cache/vault_cache.py` | Program 캐시, 로드, 조회 메서드 |
| `api/routers/programs.py` | 새 파일 (선택) |
| `api/main.py` | programs 라우터 등록 (선택) |

### 호환성

- 기존 API 영향 없음 (추가만)
- 기존 Project 스캔에 Program Rounds 추가

---

**Version**: 0.1.0
**Status**: Living Document
