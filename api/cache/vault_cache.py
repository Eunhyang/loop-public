"""
VaultCache - In-memory cache for Obsidian vault frontmatter

API 응답 속도 개선을 위한 인메모리 캐시.
- 서버 시작 시 vault 전체 스캔하여 캐시 초기화
- mtime 기반으로 파일 변경 감지 및 자동 갱신
- CRUD 시 파일과 캐시 동시 업데이트
"""

import re
import yaml
import logging
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
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
        task = cache.get_task("tsk:001-01")
        tasks = cache.get_all_tasks(status="doing")
    """

    def __init__(self, vault_path: Path):
        self.vault_path = vault_path
        self.projects_dir = vault_path / "50_Projects" / "2025"

        # 캐시 저장소
        self.tasks: Dict[str, CacheEntry] = {}
        self.projects: Dict[str, CacheEntry] = {}

        # 통계
        self._load_time: float = 0
        self._task_count: int = 0
        self._project_count: int = 0

        # 초기 로드
        self._initial_load()

    # ============================================
    # 초기화
    # ============================================

    def _initial_load(self) -> None:
        """서버 시작 시 vault 전체 스캔하여 캐시 초기화"""
        start = datetime.now()

        logger.info(f"VaultCache: Loading from {self.vault_path}")

        # Tasks 로드
        self._load_tasks()

        # Projects 로드
        self._load_projects()

        elapsed = (datetime.now() - start).total_seconds()
        self._load_time = elapsed

        logger.info(
            f"VaultCache: Loaded {self._task_count} tasks, "
            f"{self._project_count} projects in {elapsed:.2f}s"
        )

    def _load_tasks(self) -> None:
        """모든 Task 파일 로드"""
        if not self.projects_dir.exists():
            logger.warning(f"Projects directory not found: {self.projects_dir}")
            return

        for task_file in self.projects_dir.rglob("Tasks/*.md"):
            self._load_task_file(task_file)

    def _load_task_file(self, file_path: Path) -> Optional[str]:
        """단일 Task 파일 로드하여 캐시에 저장"""
        data = self._extract_frontmatter(file_path)
        if not data:
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        # 상대 경로 추가
        data['_path'] = str(file_path.relative_to(self.vault_path))

        self.tasks[entity_id] = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        self._task_count += 1

        return entity_id

    def _load_projects(self) -> None:
        """모든 Project 파일 로드"""
        if not self.projects_dir.exists():
            return

        for project_dir in self.projects_dir.glob("P*"):
            if not project_dir.is_dir():
                continue

            # Project_정의.md 찾기
            for pattern in ["Project_정의.md", "Project_*.md", "*.md"]:
                project_files = list(project_dir.glob(pattern))
                for pf in project_files:
                    if pf.name.startswith("_") or "Tasks" in str(pf):
                        continue
                    self._load_project_file(pf)
                    break

    def _load_project_file(self, file_path: Path) -> Optional[str]:
        """단일 Project 파일 로드하여 캐시에 저장"""
        data = self._extract_frontmatter(file_path)
        if not data:
            return None

        entity_id = data.get('entity_id')
        if not entity_id:
            return None

        data['_path'] = str(file_path.relative_to(self.vault_path))
        data['_dir'] = str(file_path.parent.relative_to(self.vault_path))

        self.projects[entity_id] = CacheEntry(
            data=data,
            path=file_path,
            mtime=file_path.stat().st_mtime
        )
        self._project_count += 1

        return entity_id

    # ============================================
    # Task 조회
    # ============================================

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Task 조회 (mtime 체크하여 변경 시 자동 갱신)

        Args:
            task_id: Task entity_id (예: "tsk:001-01")

        Returns:
            Task frontmatter dict 또는 None
        """
        entry = self.tasks.get(task_id)
        if not entry:
            return None

        # mtime 체크
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
        """
        Task 목록 조회 (필터 지원)

        Args:
            project_id: 프로젝트 ID로 필터
            status: 상태로 필터 (todo, doing, done, blocked)
            assignee: 담당자로 필터

        Returns:
            Task frontmatter 리스트
        """
        results = []

        for task_id, entry in list(self.tasks.items()):
            # mtime 체크
            self._check_and_refresh_task(task_id, entry)
            entry = self.tasks.get(task_id)
            if not entry:
                continue

            data = entry.data

            # 필터 적용
            if project_id and data.get('project_id') != project_id:
                continue
            if status and data.get('status') != status:
                continue
            if assignee and data.get('assignee') != assignee:
                continue

            results.append(data.copy())

        # entity_id로 정렬
        return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_task_path(self, task_id: str) -> Optional[Path]:
        """Task 파일 경로 조회"""
        entry = self.tasks.get(task_id)
        return entry.path if entry else None

    # ============================================
    # Project 조회
    # ============================================

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Project 조회"""
        entry = self.projects.get(project_id)
        if not entry:
            return None

        # mtime 체크
        self._check_and_refresh_project(project_id, entry)
        entry = self.projects.get(project_id)
        if not entry:
            return None

        return entry.data.copy()

    def get_all_projects(self) -> List[Dict[str, Any]]:
        """모든 Project 조회"""
        results = []

        for project_id, entry in list(self.projects.items()):
            self._check_and_refresh_project(project_id, entry)
            entry = self.projects.get(project_id)
            if not entry:
                continue
            results.append(entry.data.copy())

        return sorted(results, key=lambda x: x.get('entity_id', ''))

    def get_project_dir(self, project_id: str) -> Optional[Path]:
        """Project 디렉토리 경로 조회"""
        entry = self.projects.get(project_id)
        if not entry:
            return None
        return entry.path.parent

    # ============================================
    # 캐시 업데이트 (CRUD 후 호출)
    # ============================================

    def set_task(self, task_id: str, data: Dict[str, Any], path: Path) -> None:
        """Task 캐시 업데이트 (생성/수정 후 호출)"""
        data['_path'] = str(path.relative_to(self.vault_path))

        self.tasks[task_id] = CacheEntry(
            data=data,
            path=path,
            mtime=path.stat().st_mtime
        )
        logger.debug(f"Cache updated: {task_id}")

    def remove_task(self, task_id: str) -> bool:
        """Task 캐시에서 제거 (삭제 후 호출)"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.debug(f"Cache removed: {task_id}")
            return True
        return False

    def set_project(self, project_id: str, data: Dict[str, Any], path: Path) -> None:
        """Project 캐시 업데이트"""
        data['_path'] = str(path.relative_to(self.vault_path))
        data['_dir'] = str(path.parent.relative_to(self.vault_path))

        self.projects[project_id] = CacheEntry(
            data=data,
            path=path,
            mtime=path.stat().st_mtime
        )

    def remove_project(self, project_id: str) -> bool:
        """Project 캐시에서 제거"""
        if project_id in self.projects:
            del self.projects[project_id]
            return True
        return False

    # ============================================
    # ID 생성
    # ============================================

    def get_next_task_id(self) -> str:
        """다음 Task ID 생성 (캐시 기반, O(n) 스캔 불필요)"""
        max_id = 0

        for entity_id in self.tasks.keys():
            match = re.match(r'tsk:(\d+)-(\d+)', entity_id)
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

        return f"tsk:{main:03d}-{sub:02d}"

    def get_next_project_id(self) -> str:
        """다음 Project ID 생성"""
        max_num = 0

        for entity_id in self.projects.keys():
            match = re.match(r'prj:(\d+)', entity_id)
            if match:
                num = int(match.group(1))
                max_num = max(max_num, num)

        return f"prj:{max_num + 1:03d}"

    # ============================================
    # 내부 메서드
    # ============================================

    def _check_and_refresh_task(self, task_id: str, entry: CacheEntry) -> bool:
        """
        Task mtime 체크 후 변경 시 갱신

        Returns:
            True if refreshed or deleted, False if unchanged
        """
        try:
            current_mtime = entry.path.stat().st_mtime
            if current_mtime > entry.mtime:
                # 파일 변경됨 → 다시 로드
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
            # 파일 삭제됨
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
                new_data = self._extract_frontmatter(entry.path)
                if new_data:
                    new_data['_path'] = str(entry.path.relative_to(self.vault_path))
                    new_data['_dir'] = str(entry.path.parent.relative_to(self.vault_path))
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

    # ============================================
    # 유틸리티
    # ============================================

    def reload(self) -> None:
        """캐시 전체 재로드 (수동 갱신용)"""
        self.tasks.clear()
        self.projects.clear()
        self._task_count = 0
        self._project_count = 0
        self._initial_load()

    def stats(self) -> Dict[str, Any]:
        """캐시 통계"""
        return {
            "tasks": len(self.tasks),
            "projects": len(self.projects),
            "load_time_seconds": self._load_time,
            "vault_path": str(self.vault_path)
        }
