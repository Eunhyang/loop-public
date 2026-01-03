"""
VaultCache - In-memory cache for Obsidian vault frontmatter

API 응답 속도 개선을 위한 인메모리 캐시.
- 서버 시작 시 vault 전체 스캔하여 캐시 초기화
- mtime 기반으로 파일 변경 감지 및 자동 갱신
- CRUD 시 파일과 캐시 동시 업데이트

지원 엔티티:
- Task, Project (CRUD)
- Hypothesis (CRUD)
- Track, Condition (Read-only)
- NorthStar, MetaHypothesis, ProductLine, PartnershipStage (Read-only)
"""

import re
import time
import yaml
import logging
import threading
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """캐시 엔트리"""
    data: Dict[str, Any]      # frontmatter 데이터
    path: Path                # 파일 경로
    mtime: float              # 마지막 수정 시간


class VaultCache:
    """
    Obsidian Vault 인메모리 캐시

    사용법:
        cache = VaultCache(vault_path)
        task = cache.get_task("tsk-001-01")
        tasks = cache.get_all_tasks(status="doing")
    """

    # exec vault에서 API 응답 시 제외할 민감 필드
    EXEC_SENSITIVE_FIELDS = {'contract', 'salary', 'rate', 'terms', 'contact'}

    def __init__(self, vault_path: Path, exec_vault_path: Optional[Path] = None):
        self.vault_path = vault_path
        self.projects_dir = vault_path / "50_Projects" / "2025"
        self.programs_dir = vault_path / "50_Projects"  # Programs are stored as subdirs in 50_Projects/

        # exec vault 경로 설정 (tsk-018-01: exec vault 프로젝트 로드)
        if exec_vault_path is None:
            from ..utils.vault_utils import get_exec_vault_dir
            self.exec_vault_path = get_exec_vault_dir()
        else:
            self.exec_vault_path = exec_vault_path
        self.exec_projects_dir = self.exec_vault_path / "50_Projects" if self.exec_vault_path else None

        # 스레드 안전성을 위한 RLock (읽기/쓰기 모두 보호)
        self._lock = threading.RLock()

        # 캐시 저장소 - 기존
        self.tasks: Dict[str, CacheEntry] = {}
        self.projects: Dict[str, CacheEntry] = {}
        self.programs: Dict[str, CacheEntry] = {}

        # Evidence 캐시 - project_id -> List[CacheEntry]
        # tsk-n8n-12: Server Skip 지원용
        self.evidence: Dict[str, List[CacheEntry]] = {}

        # 캐시 저장소 - 신규
        self.hypotheses: Dict[str, CacheEntry] = {}
        self.tracks: Dict[str, CacheEntry] = {}
        self.conditions: Dict[str, CacheEntry] = {}
        self.northstars: Dict[str, CacheEntry] = {}
        self.metahypotheses: Dict[str, CacheEntry] = {}
        self.productlines: Dict[str, CacheEntry] = {}
        self.partnershipstages: Dict[str, CacheEntry] = {}

        # 디렉토리 mtime 추적 (dir_path:entity_type -> mtime)
        # Codex 피드백: 같은 디렉토리를 공유하는 엔티티 간 간섭 방지
        self._dir_mtimes: Dict[str, float] = {}

        # 디렉토리 체크 타임스탬프 (TTL 기반 체크로 성능 최적화)
        # Codex 피드백: rglob 스캔을 매 요청마다 하지 않도록
        self._dir_last_check: Dict[str, float] = {}
        self._dir_check_interval: float = 5.0  # 5초 간격으로 체크

        # 통계
        self._load_time: float = 0
        self._task_count: int = 0
        self._project_count: int = 0
        self._exec_project_count: int = 0  # tsk-018-01: exec vault 프로젝트 수
        self._program_count: int = 0
        self._hypothesis_count: int = 0
        self._evidence_count: int = 0

        # 초기 로드
        self._initial_load()

    # ============================================
    # 초기화
    # ============================================

    def _initial_load(self) -> None:
        """서버 시작 시 vault 전체 스캔하여 캐시 초기화"""
        start = datetime.now()

        logger.info(f"VaultCache: Loading from {self.vault_path}")

        with self._lock:
            # 기존 엔티티
            self._load_tasks()
            self._load_projects()
            self._load_programs()

            # 신규 엔티티
            self._load_hypotheses()
            self._load_tracks()
            self._load_conditions()
            self._load_northstars()
            self._load_metahypotheses()
            self._load_productlines()
            self._load_partnershipstages()
            self._load_evidence()  # tsk-n8n-12: Evidence 캐시 로드

        elapsed = (datetime.now() - start).total_seconds()
        self._load_time = elapsed

        logger.info(
            f"VaultCache: Loaded {self._task_count} tasks, "
            f"{self._project_count} projects (public), "
            f"{self._exec_project_count} projects (exec), "
            f"{self._program_count} programs, "
            f"{self._hypothesis_count} hypotheses, "
            f"{self._evidence_count} evidence, "
            f"{len(self.tracks)} tracks, "
            f"{len(self.conditions)} conditions in {elapsed:.2f}s"
        )

    # ============================================
    # Task 로드/조회
    # ============================================

    def _load_tasks(self) -> None:
        """모든 Task 파일 로드 (기존 + Program Rounds)"""
        # 기존: 50_Projects/2025/*/Tasks/*.md
        if self.projects_dir.exists():
            for task_file in self.projects_dir.rglob("Tasks/*.md"):
                self._load_task_file(task_file)

        # 추가: 50_Projects/*/Rounds/*/Tasks/*.md (Program Rounds)
        if self.programs_dir.exists():
            for task_file in self.programs_dir.glob("*/Rounds/*/Tasks/*.md"):
                self._load_task_file(task_file)

        # mtime 업데이트 (두 경로 모두, 로드 완료 후)
        self._update_dir_mtime(self.projects_dir, 'Task')
        self._update_dir_mtime(self.programs_dir, 'Task_Rounds')

    def _load_task_file(self, file_path: Path) -> Optional[str]:
        """단일 Task 파일 로드하여 캐시에 저장"""
        data = self._extract_frontmatter(file_path)
        if not data:
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        data['_path'] = str(file_path.relative_to(self.vault_path))

        self.tasks[entity_id] = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        self._task_count += 1

        return entity_id

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Task 조회 (mtime 체크하여 변경 시 자동 갱신)"""
        with self._lock:
            entry = self.tasks.get(task_id)
            if not entry:
                return None

            if self._check_and_refresh_task(task_id, entry):
                entry = self.tasks.get(task_id)
                if not entry:
                    return None

            return entry.data.copy()

    def get_all_tasks(
        self,
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        assignee: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Task 목록 조회 (필터 지원, 디렉토리 mtime 체크 포함)"""
        with self._lock:
            # 두 디렉토리 모두 변경 감지 (기존 + Program Rounds)
            reload_needed = self._should_reload_dir(self.projects_dir, 'Task')
            if self._should_reload_dir(self.programs_dir, 'Task_Rounds'):
                reload_needed = True

            if reload_needed:
                self.tasks.clear()
                self._task_count = 0
                self._load_tasks()
                # tsk-018-01: exec vault task도 다시 로드
                self._load_exec_projects()  # exec vault project + task 함께 로드

            results = []

            for task_id, entry in list(self.tasks.items()):
                data = entry.data

                if project_id and data.get('project_id') != project_id:
                    continue
                if status and data.get('status') != status:
                    continue
                if assignee and data.get('assignee') != assignee:
                    continue

                results.append(data.copy())

            return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_task_path(self, task_id: str) -> Optional[Path]:
        """Task 파일 경로 조회"""
        with self._lock:
            entry = self.tasks.get(task_id)
            return entry.path if entry else None

    def set_task(self, task_id: str, data: Dict[str, Any], path: Path) -> None:
        """Task 캐시 업데이트 (생성/수정 후 호출)"""
        with self._lock:
            data['_path'] = str(path.relative_to(self.vault_path))
            self.tasks[task_id] = CacheEntry(
                data=data,
                path=path,
                mtime=path.stat().st_mtime
            )
            logger.debug(f"Cache updated: {task_id}")

    def remove_task(self, task_id: str) -> bool:
        """Task 캐시에서 제거 (삭제 후 호출)"""
        with self._lock:
            if task_id in self.tasks:
                del self.tasks[task_id]
                logger.debug(f"Cache removed: {task_id}")
                return True
            return False

    # ============================================
    # Project 로드/조회
    # ============================================

    def _load_projects(self) -> None:
        """모든 Project 파일 로드 (기존 + Program Rounds + exec vault)"""
        # 기존: 50_Projects/2025/P*
        if self.projects_dir.exists():
            for project_dir in self.projects_dir.glob("P*"):
                if not project_dir.is_dir():
                    continue

                for pattern in ["Project_정의.md", "Project_*.md", "*.md"]:
                    project_files = list(project_dir.glob(pattern))
                    for pf in project_files:
                        if pf.name.startswith("_") or "Tasks" in str(pf):
                            continue
                        self._load_project_file(pf)
                        break

        # 추가: 50_Projects/*/Rounds/prj-* (Program Rounds)
        if self.programs_dir.exists():
            for program_dir in self.programs_dir.iterdir():
                if not program_dir.is_dir():
                    continue
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

        # tsk-018-01: exec vault 프로젝트 로드
        self._load_exec_projects()

    def _load_project_file(self, file_path: Path) -> Optional[str]:
        """단일 Project 파일 로드 (본문 포함)"""
        data, body = self._extract_frontmatter_and_body(file_path)
        if not data:
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        data['_path'] = str(file_path.relative_to(self.vault_path))
        data['_dir'] = str(file_path.parent.relative_to(self.vault_path))
        data['_body'] = body

        self.projects[entity_id] = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        self._project_count += 1

        return entity_id

    def _load_exec_projects(self) -> None:
        """exec vault의 프로젝트 및 Task 로드 (tsk-018-01)

        exec vault 프로젝트는 민감 정보를 포함할 수 있으므로
        API 응답 시 EXEC_SENSITIVE_FIELDS에 정의된 필드를 제외함.

        구조:
        - 기존: exec/50_Projects/P{num}_{name}/_INDEX.md
        - Program Rounds: exec/50_Projects/{Program}/prj-*/{Project_정의.md|_INDEX.md}
        """
        if not self.exec_projects_dir or not self.exec_projects_dir.exists():
            logger.debug(f"Exec vault projects dir not found: {self.exec_projects_dir}")
            return

        self._update_dir_mtime(self.exec_projects_dir, 'ExecProject')

        # 1. 기존 패턴: P* 폴더 (P015, P016_다온_영상편집자 등)
        for project_dir in self.exec_projects_dir.glob("P*"):
            if not project_dir.is_dir():
                continue

            # exec vault는 _INDEX.md 사용
            index_file = project_dir / "_INDEX.md"
            if index_file.exists():
                self._load_exec_project_file(index_file)

            # exec vault Task 로드
            tasks_dir = project_dir / "Tasks"
            if tasks_dir.exists():
                for task_file in tasks_dir.glob("*.md"):
                    self._load_exec_task_file(task_file)

        # 2. Program Rounds 패턴: {Program}/prj-* 폴더 (Grants, TIPS_Batch 등)
        for program_dir in self.exec_projects_dir.iterdir():
            if not program_dir.is_dir() or program_dir.name.startswith(('P', '.', '@')):
                continue  # P* 폴더는 위에서 처리, 숨김/시스템 폴더 제외

            for project_dir in program_dir.glob("prj-*"):
                if not project_dir.is_dir():
                    continue

                # Project_정의.md 또는 _INDEX.md
                for index_name in ["Project_정의.md", "_INDEX.md"]:
                    index_file = project_dir / index_name
                    if index_file.exists():
                        self._load_exec_project_file(index_file)
                        break

                # Task 로드
                tasks_dir = project_dir / "Tasks"
                if tasks_dir.exists():
                    for task_file in tasks_dir.glob("*.md"):
                        self._load_exec_task_file(task_file)

    def _load_exec_project_file(self, file_path: Path) -> Optional[str]:
        """단일 exec vault Project 파일 로드 (민감 정보 필터링)"""
        data, body = self._extract_frontmatter_and_body(file_path)
        if not data:
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        # 민감 필드 필터링 (contract, salary, rate 등)
        filtered_data = {
            k: v for k, v in data.items()
            if k not in self.EXEC_SENSITIVE_FIELDS
        }

        # exec vault 마커 추가
        filtered_data['_vault'] = 'exec'
        filtered_data['_path'] = str(file_path.relative_to(self.exec_vault_path))
        filtered_data['_dir'] = str(file_path.parent.relative_to(self.exec_vault_path))
        filtered_data['_body'] = body

        self.projects[entity_id] = CacheEntry(
            data=filtered_data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        self._exec_project_count += 1

        logger.debug(f"Loaded exec project: {entity_id}")
        return entity_id

    def _load_exec_task_file(self, file_path: Path) -> Optional[str]:
        """단일 exec vault Task 파일 로드 (민감 정보 필터링)

        tsk-018-01: exec vault Task도 캐시에 로드하여 칸반보드에 표시
        """
        data, body = self._extract_frontmatter_and_body(file_path)
        if not data:
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        # 민감 필드 필터링 (contract, salary, rate 등)
        filtered_data = {
            k: v for k, v in data.items()
            if k not in self.EXEC_SENSITIVE_FIELDS
        }

        # exec vault 마커 추가
        filtered_data['_vault'] = 'exec'
        filtered_data['_path'] = str(file_path.relative_to(self.exec_vault_path))
        filtered_data['_dir'] = str(file_path.parent.relative_to(self.exec_vault_path))
        filtered_data['_body'] = body

        self.tasks[entity_id] = CacheEntry(
            data=filtered_data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        self._task_count += 1

        logger.debug(f"Loaded exec task: {entity_id}")
        return entity_id

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Project 조회"""
        with self._lock:
            entry = self.projects.get(project_id)
            if not entry:
                return None

            self._check_and_refresh_project(project_id, entry)
            entry = self.projects.get(project_id)
            if not entry:
                return None

            return entry.data.copy()

    def get_all_projects(self) -> List[Dict[str, Any]]:
        """모든 Project 조회"""
        with self._lock:
            results = []
            for project_id, entry in list(self.projects.items()):
                results.append(entry.data.copy())
            return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_projects_by_program_id(self, program_id: str) -> List[Dict[str, Any]]:
        """program_id로 프로젝트 조회 (exec vault 포함)

        tsk-018-01: exec vault 프로젝트도 포함하여 반환
        """
        with self._lock:
            results = []
            for entry in self.projects.values():
                if entry.data.get('program_id') == program_id:
                    results.append(entry.data.copy())
            return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_project_dir(self, project_id: str) -> Optional[Path]:
        """Project 디렉토리 경로 조회"""
        with self._lock:
            entry = self.projects.get(project_id)
            if not entry:
                return None
            return entry.path.parent

    def set_project(self, project_id: str, data: Dict[str, Any], path: Path) -> None:
        """Project 캐시 업데이트"""
        with self._lock:
            data['_path'] = str(path.relative_to(self.vault_path))
            data['_dir'] = str(path.parent.relative_to(self.vault_path))
            self.projects[project_id] = CacheEntry(
                data=data,
                path=path,
                mtime=path.stat().st_mtime
            )

    def remove_project(self, project_id: str) -> bool:
        """Project 캐시에서 제거"""
        with self._lock:
            if project_id in self.projects:
                del self.projects[project_id]
                return True
            return False

    # ============================================
    # Program 로드/조회
    # ============================================

    def _load_programs(self) -> None:
        """모든 Program 파일 로드

        Programs are stored as subdirectories under 50_Projects/ with _PROGRAM.md file.
        Examples:
            - 50_Projects/Youtube_Weekly/_PROGRAM.md
            - 50_Projects/Hiring/_PROGRAM.md
        """
        if not self.programs_dir.exists():
            logger.warning(f"Programs directory not found: {self.programs_dir}")
            return

        self._update_dir_mtime(self.programs_dir, 'Program')

        # Scan all subdirectories for _PROGRAM.md files
        for program_file in self.programs_dir.glob("*/_PROGRAM.md"):
            if program_file.is_file():
                self._load_program_file(program_file)

    def _load_program_file(self, file_path: Path) -> Optional[str]:
        """단일 Program 파일 로드"""
        data, body = self._extract_frontmatter_and_body(file_path)
        if not data or data.get('entity_type') != 'Program':
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        data['_path'] = str(file_path.relative_to(self.vault_path))
        data['_dir'] = str(file_path.parent.relative_to(self.vault_path))
        data['_body'] = body

        self.programs[entity_id] = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        self._program_count += 1

        return entity_id

    def get_program(self, program_id: str) -> Optional[Dict[str, Any]]:
        """Program 조회"""
        with self._lock:
            entry = self.programs.get(program_id)
            if not entry:
                return None
            return entry.data.copy()

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

    # ============================================
    # Hypothesis 로드/조회/CRUD
    # ============================================

    def _load_hypotheses(self) -> None:
        """모든 Hypothesis 파일 로드"""
        hypotheses_dir = self.vault_path / "60_Hypotheses"
        if not hypotheses_dir.exists():
            return

        self._update_dir_mtime(hypotheses_dir, 'Hypothesis')

        for hyp_file in hypotheses_dir.rglob("*.md"):
            if hyp_file.name.startswith("_"):
                continue
            self._load_hypothesis_file(hyp_file)

    def _load_hypothesis_file(self, file_path: Path) -> Optional[str]:
        """단일 Hypothesis 파일 로드"""
        data = self._extract_frontmatter(file_path)
        if not data or data.get('entity_type') != 'Hypothesis':
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        data['_path'] = str(file_path.relative_to(self.vault_path))

        self.hypotheses[entity_id] = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        self._hypothesis_count += 1

        return entity_id

    def get_hypothesis(self, hypothesis_id: str) -> Optional[Dict[str, Any]]:
        """Hypothesis 조회 (mtime 체크)"""
        with self._lock:
            entry = self.hypotheses.get(hypothesis_id)
            if not entry:
                return None

            self._check_and_refresh_hypothesis(hypothesis_id, entry)
            entry = self.hypotheses.get(hypothesis_id)
            if not entry:
                return None

            return entry.data.copy()

    def get_all_hypotheses(
        self,
        parent_id: Optional[str] = None,
        evidence_status: Optional[str] = None,
        horizon: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Hypothesis 목록 조회 (디렉토리 mtime 체크 포함)"""
        with self._lock:
            # 디렉토리 변경 감지 시 리로드
            hypotheses_dir = self.vault_path / "60_Hypotheses"
            if self._should_reload_dir(hypotheses_dir, 'Hypothesis'):
                self.hypotheses.clear()
                self._hypothesis_count = 0
                self._load_hypotheses()

            results = []

            for hyp_id, entry in list(self.hypotheses.items()):
                data = entry.data

                if parent_id and data.get('parent_id') != parent_id:
                    continue
                if evidence_status and data.get('evidence_status') != evidence_status:
                    continue
                if horizon and data.get('horizon') != horizon:
                    continue

                results.append(data.copy())

            return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_hypothesis_path(self, hypothesis_id: str) -> Optional[Path]:
        """Hypothesis 파일 경로 조회"""
        with self._lock:
            entry = self.hypotheses.get(hypothesis_id)
            return entry.path if entry else None

    def set_hypothesis(self, hypothesis_id: str, data: Dict[str, Any], path: Path) -> None:
        """Hypothesis 캐시 업데이트 (생성/수정 후 호출)"""
        with self._lock:
            data['_path'] = str(path.relative_to(self.vault_path))
            self.hypotheses[hypothesis_id] = CacheEntry(
                data=data,
                path=path,
                mtime=path.stat().st_mtime
            )
            logger.debug(f"Hypothesis cache updated: {hypothesis_id}")

    def remove_hypothesis(self, hypothesis_id: str) -> bool:
        """Hypothesis 캐시에서 제거 (삭제 후 호출)"""
        with self._lock:
            if hypothesis_id in self.hypotheses:
                del self.hypotheses[hypothesis_id]
                logger.debug(f"Hypothesis cache removed: {hypothesis_id}")
                return True
            return False

    def get_next_hypothesis_id(self, track_num: int) -> str:
        """
        다음 Hypothesis ID 생성

        Codex 피드백: 캐시 + 디스크 스캔 병행으로 신뢰성 확보
        """
        with self._lock:
            # 캐시에서 ID 수집
            cached_ids: Set[str] = set()
            prefix = f'hyp-{track_num}-'
            for entity_id in self.hypotheses.keys():
                if entity_id.startswith(prefix):
                    cached_ids.add(entity_id)

            # 디스크 폴백 스캔 (캐시 누락 대비)
            disk_ids: Set[str] = set()
            hypotheses_dir = self.vault_path / "60_Hypotheses"
            if hypotheses_dir.exists():
                for f in hypotheses_dir.rglob("*.md"):
                    if f.name.startswith("_"):
                        continue
                    fm = self._extract_frontmatter(f)
                    if fm:
                        eid = fm.get('entity_id', '')
                        if eid.startswith(prefix):
                            disk_ids.add(eid)

            all_ids = cached_ids | disk_ids

            # 최대 시퀀스 번호 찾기
            max_seq = 0
            for eid in all_ids:
                match = re.match(rf'hyp-{track_num}-(\d+)', eid)
                if match:
                    seq = int(match.group(1))
                    max_seq = max(max_seq, seq)

            return f'hyp-{track_num}-{max_seq + 1:02d}'

    # ============================================
    # Evidence 로드/조회 (tsk-n8n-12: Server Skip 지원)
    # ============================================

    def _load_evidence(self) -> None:
        """모든 Evidence 파일 로드 (50_Projects 하위에서 스캔)

        Evidence는 project_id를 키로 그룹화하여 저장.
        window_id로 특정 윈도우의 Evidence 존재 여부 확인 가능.
        """
        # Evidence는 50_Projects 하위에 저장됨
        if not self.programs_dir.exists():
            return

        self._update_dir_mtime(self.programs_dir, 'Evidence')

        for evidence_file in self.programs_dir.rglob("*.md"):
            if evidence_file.name.startswith("_"):
                continue
            self._load_evidence_file(evidence_file)

    def _load_evidence_file(self, file_path: Path) -> Optional[str]:
        """단일 Evidence 파일 로드"""
        data = self._extract_frontmatter(file_path)
        if not data or data.get('entity_type') != 'Evidence':
            return None

        entity_id = data.get('entity_id')
        project_id = data.get('project')  # Evidence.project 필드
        if not entity_id or not project_id:
            return None

        data['_path'] = str(file_path.relative_to(self.vault_path))

        entry = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )

        # project_id별로 그룹화
        if project_id not in self.evidence:
            self.evidence[project_id] = []
        self.evidence[project_id].append(entry)
        self._evidence_count += 1

        return entity_id

    def get_evidence_by_project(
        self,
        project_id: str,
        window_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        특정 Project의 Evidence 목록 조회

        Args:
            project_id: 프로젝트 ID (예: prj-001)
            window_id: 윈도우 ID 필터 (예: 2025-01, 2025-Q1)
                       None이면 해당 프로젝트의 모든 Evidence 반환

        Returns:
            Evidence frontmatter 리스트

        Note:
            Codex 피드백 반영: mtime 기반 자동 새로고침으로 캐시 정합성 유지
        """
        with self._lock:
            # 디렉토리 변경 감지 시 리로드
            if self._should_reload_dir(self.programs_dir, 'Evidence'):
                self.evidence.clear()
                self._evidence_count = 0
                self._load_evidence()

            entries = self.evidence.get(project_id, [])
            results = []

            for entry in entries:
                data = entry.data

                # window_id 필터
                if window_id and data.get('window_id') != window_id:
                    continue

                results.append(data.copy())

            return results

    def check_evidence_exists(
        self,
        project_id: str,
        window_id: Optional[str] = None
    ) -> tuple[bool, List[str]]:
        """
        Evidence 존재 여부 확인 (Server Skip 용)

        Args:
            project_id: 프로젝트 ID
            window_id: 윈도우 ID (None이면 프로젝트의 모든 Evidence 체크)

        Returns:
            (exists: bool, evidence_refs: List[entity_id])

        Note:
            Codex 피드백 반영: fail-open 패턴 적용
            - 캐시 조회 실패 시 (False, []) 반환하여 LLM 호출 진행
        """
        try:
            evidence_list = self.get_evidence_by_project(project_id, window_id)
            if evidence_list:
                refs = [e.get('entity_id', '') for e in evidence_list if e.get('entity_id')]
                return True, refs
            return False, []
        except Exception as e:
            # Fail-open: 캐시 오류 시 LLM 호출 진행하도록 False 반환
            logger.warning(f"Evidence cache check failed for {project_id}: {e}")
            return False, []

    # ============================================
    # Track 로드/조회 (Read-only)
    # ============================================

    def _load_tracks(self) -> None:
        """모든 Track 파일 로드"""
        tracks_dir = self.vault_path / "20_Strategy" / "12M_Tracks"
        if not tracks_dir.exists():
            return

        self._update_dir_mtime(tracks_dir, 'Track')

        for track_file in tracks_dir.rglob("Track_*.md"):
            self._load_track_file(track_file)

    def _load_track_file(self, file_path: Path) -> Optional[str]:
        """단일 Track 파일 로드"""
        data = self._extract_frontmatter(file_path)
        if not data or data.get('entity_type') != 'Track':
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        data['_path'] = str(file_path.relative_to(self.vault_path))

        self.tracks[entity_id] = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        return entity_id

    def get_all_tracks(self) -> List[Dict[str, Any]]:
        """Track 목록 조회 (디렉토리 mtime 체크 포함)"""
        with self._lock:
            tracks_dir = self.vault_path / "20_Strategy" / "12M_Tracks"
            if self._should_reload_dir(tracks_dir, 'Track'):
                self.tracks.clear()
                self._load_tracks()

            results = []
            for track_id, entry in list(self.tracks.items()):
                results.append(entry.data.copy())

            return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_track(self, track_id: str) -> Optional[Dict[str, Any]]:
        """Track 조회"""
        with self._lock:
            entry = self.tracks.get(track_id)
            if not entry:
                return None
            return entry.data.copy()

    # ============================================
    # Condition 로드/조회 (Read-only)
    # ============================================

    def _load_conditions(self) -> None:
        """모든 Condition 파일 로드"""
        conditions_dir = self.vault_path / "20_Strategy" / "3Y_Conditions_2026-2028"
        if not conditions_dir.exists():
            return

        self._update_dir_mtime(conditions_dir, 'Condition')

        for cond_file in conditions_dir.rglob("*.md"):
            if cond_file.name.startswith("_"):
                continue
            self._load_condition_file(cond_file)

    def _load_condition_file(self, file_path: Path) -> Optional[str]:
        """단일 Condition 파일 로드"""
        data = self._extract_frontmatter(file_path)
        if not data or data.get('entity_type') != 'Condition':
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        data['_path'] = str(file_path.relative_to(self.vault_path))

        self.conditions[entity_id] = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        return entity_id

    def get_all_conditions(self) -> List[Dict[str, Any]]:
        """Condition 목록 조회 (디렉토리 mtime 체크 포함)"""
        with self._lock:
            conditions_dir = self.vault_path / "20_Strategy" / "3Y_Conditions_2026-2028"
            if self._should_reload_dir(conditions_dir, 'Condition'):
                self.conditions.clear()
                self._load_conditions()

            results = []
            for cond_id, entry in list(self.conditions.items()):
                results.append(entry.data.copy())

            return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_condition(self, condition_id: str) -> Optional[Dict[str, Any]]:
        """Condition 조회"""
        with self._lock:
            entry = self.conditions.get(condition_id)
            if not entry:
                return None
            return entry.data.copy()

    # ============================================
    # Strategy 엔티티 로드/조회 (Read-only)
    # ============================================

    def _load_northstars(self) -> None:
        """NorthStar 로드"""
        ns_dir = self.vault_path / "01_North_Star"
        if not ns_dir.exists():
            return

        self._update_dir_mtime(ns_dir, 'NorthStar')

        for ns_file in ns_dir.rglob("*.md"):
            if ns_file.name.startswith("_"):
                continue
            data = self._extract_frontmatter(ns_file)
            if data and data.get('entity_type') == 'NorthStar':
                entity_id = data.get('entity_id')
                if entity_id:
                    data['_path'] = str(ns_file.relative_to(self.vault_path))
                    self.northstars[entity_id] = CacheEntry(
                        data=data, path=ns_file, mtime=ns_file.stat().st_mtime
                    )

    def _load_metahypotheses(self) -> None:
        """MetaHypothesis 로드"""
        ns_dir = self.vault_path / "01_North_Star"
        if not ns_dir.exists():
            return

        self._update_dir_mtime(ns_dir, 'MetaHypothesis')

        for mh_file in ns_dir.rglob("*.md"):
            if mh_file.name.startswith("_"):
                continue
            data = self._extract_frontmatter(mh_file)
            if data and data.get('entity_type') == 'MetaHypothesis':
                entity_id = data.get('entity_id')
                if entity_id:
                    data['_path'] = str(mh_file.relative_to(self.vault_path))
                    self.metahypotheses[entity_id] = CacheEntry(
                        data=data, path=mh_file, mtime=mh_file.stat().st_mtime
                    )

    def _load_productlines(self) -> None:
        """ProductLine 로드"""
        strategy_dir = self.vault_path / "20_Strategy"
        if not strategy_dir.exists():
            return

        self._update_dir_mtime(strategy_dir, 'ProductLine')

        for pl_file in strategy_dir.rglob("*.md"):
            if pl_file.name.startswith("_"):
                continue
            data = self._extract_frontmatter(pl_file)
            if data and data.get('entity_type') == 'ProductLine':
                entity_id = data.get('entity_id')
                if entity_id:
                    data['_path'] = str(pl_file.relative_to(self.vault_path))
                    self.productlines[entity_id] = CacheEntry(
                        data=data, path=pl_file, mtime=pl_file.stat().st_mtime
                    )

    def _load_partnershipstages(self) -> None:
        """PartnershipStage 로드"""
        strategy_dir = self.vault_path / "20_Strategy"
        if not strategy_dir.exists():
            return

        self._update_dir_mtime(strategy_dir, 'PartnershipStage')

        for ps_file in strategy_dir.rglob("*.md"):
            if ps_file.name.startswith("_"):
                continue
            data = self._extract_frontmatter(ps_file)
            if data and data.get('entity_type') == 'PartnershipStage':
                entity_id = data.get('entity_id')
                if entity_id:
                    data['_path'] = str(ps_file.relative_to(self.vault_path))
                    self.partnershipstages[entity_id] = CacheEntry(
                        data=data, path=ps_file, mtime=ps_file.stat().st_mtime
                    )

    def get_all_northstars(self) -> List[Dict[str, Any]]:
        """NorthStar 목록 조회"""
        with self._lock:
            ns_dir = self.vault_path / "01_North_Star"
            if self._should_reload_dir(ns_dir, 'NorthStar'):
                self.northstars.clear()
                self._load_northstars()

            return [entry.data.copy() for entry in self.northstars.values()]

    def get_all_metahypotheses(self) -> List[Dict[str, Any]]:
        """MetaHypothesis 목록 조회"""
        with self._lock:
            ns_dir = self.vault_path / "01_North_Star"
            if self._should_reload_dir(ns_dir, 'MetaHypothesis'):
                self.metahypotheses.clear()
                self._load_metahypotheses()

            results = list(entry.data.copy() for entry in self.metahypotheses.values())
            return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_all_productlines(self) -> List[Dict[str, Any]]:
        """ProductLine 목록 조회"""
        with self._lock:
            strategy_dir = self.vault_path / "20_Strategy"
            if self._should_reload_dir(strategy_dir, 'ProductLine'):
                self.productlines.clear()
                self._load_productlines()

            results = list(entry.data.copy() for entry in self.productlines.values())
            return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_all_partnershipstages(self) -> List[Dict[str, Any]]:
        """PartnershipStage 목록 조회"""
        with self._lock:
            strategy_dir = self.vault_path / "20_Strategy"
            if self._should_reload_dir(strategy_dir, 'PartnershipStage'):
                self.partnershipstages.clear()
                self._load_partnershipstages()

            results = list(entry.data.copy() for entry in self.partnershipstages.values())
            return sorted(results, key=lambda x: x.get('entity_id', ''))

    # ============================================
    # ID 생성
    # ============================================

    def get_next_task_id(self) -> str:
        """다음 Task ID 생성"""
        with self._lock:
            max_id = 0

            for entity_id in self.tasks.keys():
                match = re.match(r'tsk-(\d+)-(\d+)', entity_id)
                if match:
                    main_num = int(match.group(1))
                    sub_num = int(match.group(2))
                    combined = main_num * 100 + sub_num
                    max_id = max(max_id, combined)

            next_id = max_id + 1
            main = next_id // 100
            sub = next_id % 100

            if main == 0:
                main = 1

            return f"tsk-{main:03d}-{sub:02d}"

    def get_next_project_id(self) -> str:
        """다음 Project ID 생성"""
        with self._lock:
            max_num = 0

            for entity_id in self.projects.keys():
                match = re.match(r'prj-(\d+)', entity_id)
                if match:
                    num = int(match.group(1))
                    max_num = max(max_num, num)

            return f"prj-{max_num + 1:03d}"

    # ============================================
    # 디렉토리 mtime 관리
    # ============================================

    def _get_dir_mtime_key(self, dir_path: Path, entity_type: str) -> str:
        """디렉토리+엔티티 타입 조합 키 생성 (Codex 피드백 반영)"""
        return f"{dir_path}:{entity_type}"

    def _update_dir_mtime(self, dir_path: Path, entity_type: str) -> None:
        """디렉토리 mtime 기록 (로드 성공 후에만 호출)"""
        key = self._get_dir_mtime_key(dir_path, entity_type)
        try:
            mtime = self._get_recursive_mtime(dir_path)
            self._dir_mtimes[key] = mtime
        except FileNotFoundError:
            pass

    def _should_reload_dir(self, dir_path: Path, entity_type: str) -> bool:
        """
        디렉토리 변경 여부 확인

        Codex 피드백 반영:
        - 디렉토리 삭제 시 캐시 정리
        - 재귀적 mtime 체크
        - TTL 기반 스캔으로 성능 최적화 (매 요청마다 rglob 방지)
        """
        key = self._get_dir_mtime_key(dir_path, entity_type)
        now = time.time()

        # TTL 체크: 마지막 체크 후 interval 미경과 시 스킵
        last_check = self._dir_last_check.get(key, 0)
        if now - last_check < self._dir_check_interval:
            return False  # 최근에 체크했으므로 스킵

        # TTL 경과 → 실제 mtime 체크
        self._dir_last_check[key] = now

        try:
            current_mtime = self._get_recursive_mtime(dir_path)
            last_mtime = self._dir_mtimes.get(key, 0)

            if current_mtime > last_mtime:
                # mtime 업데이트는 로드 성공 후에 수행
                return True
            return False

        except FileNotFoundError:
            # 디렉토리 삭제됨 - 캐시 정리 필요
            if key in self._dir_mtimes:
                del self._dir_mtimes[key]
            return True

    def _get_recursive_mtime(self, dir_path: Path) -> float:
        """
        디렉토리의 재귀적 mtime 계산

        Codex 피드백: rglob 사용 시 하위 디렉토리 변경 감지
        """
        max_mtime = dir_path.stat().st_mtime

        for item in dir_path.rglob("*"):
            try:
                item_mtime = item.stat().st_mtime
                max_mtime = max(max_mtime, item_mtime)
            except (FileNotFoundError, PermissionError):
                continue

        return max_mtime

    # ============================================
    # 내부 메서드 - mtime 체크 및 갱신
    # ============================================

    def _check_and_refresh_task(self, task_id: str, entry: CacheEntry) -> bool:
        """Task mtime 체크 후 변경 시 갱신"""
        try:
            current_mtime = entry.path.stat().st_mtime
            if current_mtime > entry.mtime:
                new_data = self._extract_frontmatter(entry.path)
                if new_data:
                    new_data['_path'] = str(entry.path.relative_to(self.vault_path))
                    self.tasks[task_id] = CacheEntry(
                        data=new_data,
                        path=entry.path,
                        mtime=current_mtime
                    )
                    logger.debug(f"Cache refreshed: {task_id}")
                return True
        except FileNotFoundError:
            del self.tasks[task_id]
            logger.debug(f"Cache removed (file deleted): {task_id}")
            return True
        except Exception as e:
            logger.warning(f"Error checking mtime for {task_id}: {e}")

        return False

    def _check_and_refresh_project(self, project_id: str, entry: CacheEntry) -> bool:
        """Project mtime 체크 후 변경 시 갱신"""
        try:
            current_mtime = entry.path.stat().st_mtime
            if current_mtime > entry.mtime:
                new_data, body = self._extract_frontmatter_and_body(entry.path)
                if new_data:
                    new_data['_path'] = str(entry.path.relative_to(self.vault_path))
                    new_data['_dir'] = str(entry.path.parent.relative_to(self.vault_path))
                    new_data['_body'] = body
                    self.projects[project_id] = CacheEntry(
                        data=new_data,
                        path=entry.path,
                        mtime=current_mtime
                    )
                return True
        except FileNotFoundError:
            del self.projects[project_id]
            return True
        except Exception as e:
            logger.warning(f"Error checking mtime for {project_id}: {e}")

        return False

    def _check_and_refresh_hypothesis(self, hypothesis_id: str, entry: CacheEntry) -> bool:
        """Hypothesis mtime 체크 후 변경 시 갱신"""
        try:
            current_mtime = entry.path.stat().st_mtime
            if current_mtime > entry.mtime:
                new_data = self._extract_frontmatter(entry.path)
                if new_data:
                    new_data['_path'] = str(entry.path.relative_to(self.vault_path))
                    self.hypotheses[hypothesis_id] = CacheEntry(
                        data=new_data,
                        path=entry.path,
                        mtime=current_mtime
                    )
                    logger.debug(f"Hypothesis cache refreshed: {hypothesis_id}")
                return True
        except FileNotFoundError:
            del self.hypotheses[hypothesis_id]
            logger.debug(f"Hypothesis cache removed (file deleted): {hypothesis_id}")
            return True
        except Exception as e:
            logger.warning(f"Error checking mtime for hypothesis {hypothesis_id}: {e}")

        return False

    # ============================================
    # Frontmatter 추출
    # ============================================

    def _extract_frontmatter(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """YAML frontmatter 추출"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
            if not match:
                return None

            return yaml.safe_load(match.group(1))
        except Exception as e:
            logger.warning(f"Error parsing {file_path}: {e}")
            return None

    def _extract_frontmatter_and_body(self, file_path: Path) -> Tuple[Optional[Dict[str, Any]], str]:
        """YAML frontmatter와 본문을 함께 추출"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)', content, re.DOTALL)
            if match:
                frontmatter = yaml.safe_load(match.group(1))
                body = match.group(2).strip()
                return frontmatter, body
            return None, content.strip()
        except Exception as e:
            logger.warning(f"Error parsing {file_path}: {e}")
            return None, ""

    # ============================================
    # 유틸리티
    # ============================================

    def reload(self) -> None:
        """캐시 전체 재로드 (수동 갱신용)"""
        with self._lock:
            self.tasks.clear()
            self.projects.clear()
            self.programs.clear()
            self.hypotheses.clear()
            self.evidence.clear()  # tsk-n8n-12
            self.tracks.clear()
            self.conditions.clear()
            self.northstars.clear()
            self.metahypotheses.clear()
            self.productlines.clear()
            self.partnershipstages.clear()
            self._dir_mtimes.clear()
            self._dir_last_check.clear()

            self._task_count = 0
            self._project_count = 0
            self._exec_project_count = 0  # tsk-018-01
            self._program_count = 0
            self._hypothesis_count = 0
            self._evidence_count = 0  # tsk-n8n-12

            self._initial_load()

    def stats(self) -> Dict[str, Any]:
        """캐시 통계"""
        with self._lock:
            # Evidence는 project별로 그룹화되어 있으므로 전체 개수 계산
            evidence_total = sum(len(entries) for entries in self.evidence.values())
            return {
                "tasks": len(self.tasks),
                "projects": len(self.projects),
                "projects_public": self._project_count,
                "projects_exec": self._exec_project_count,  # tsk-018-01
                "programs": len(self.programs),
                "hypotheses": len(self.hypotheses),
                "evidence": evidence_total,  # tsk-n8n-12
                "evidence_projects": len(self.evidence),  # project 수
                "tracks": len(self.tracks),
                "conditions": len(self.conditions),
                "northstars": len(self.northstars),
                "metahypotheses": len(self.metahypotheses),
                "productlines": len(self.productlines),
                "partnershipstages": len(self.partnershipstages),
                "load_time_seconds": self._load_time,
                "vault_path": str(self.vault_path),
                "exec_vault_path": str(self.exec_vault_path) if self.exec_vault_path else None
            }
