"""
Attachment Service (tsk-023-1768204346395)

첨부파일 비즈니스 로직 (Clean Architecture - service layer)
- 파일 저장 + 텍스트 즉시 추출
- 파일 삭제 + 캐시 .txt 삭제
- 인라인 표시 여부 판단
"""

import logging
import re
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

from ..utils.file_security import (
    secure_filename,
    validate_extension,
    validate_path_safety,
    find_file_with_unicode_normalization,
    get_unique_filename,
    get_task_total_size,
)
from .text_extractor import TextExtractor

logger = logging.getLogger(__name__)


# 파일 크기 제한
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
MAX_TASK_SIZE = 500 * 1024 * 1024  # 500MB (Task당 총합)


@dataclass
class AttachmentInfo:
    """첨부파일 정보"""
    filename: str
    size: int
    is_text_available: bool  # 텍스트 추출 가능 여부


class AttachmentService:
    """첨부파일 비즈니스 로직"""

    # 인라인 표시 허용 MIME 타입
    INLINE_MIME_TYPES = {
        'text/plain',
        'text/markdown',
        'text/html',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/svg+xml',
        'image/webp',
        'application/pdf',
    }

    def __init__(self, attachments_dir: Path, text_extractor: TextExtractor):
        """
        Args:
            attachments_dir: _attachments 루트 디렉토리
            text_extractor: 텍스트 추출 서비스
        """
        self.attachments_dir = attachments_dir
        self.text_extractor = text_extractor

    def save_file(
        self,
        task_id: str,
        filename: str,
        content: bytes
    ) -> AttachmentInfo:
        """
        파일 저장 + 텍스트 즉시 추출

        Args:
            task_id: Task ID
            filename: 원본 파일명
            content: 파일 내용 (bytes)

        Returns:
            AttachmentInfo

        Raises:
            ValueError: 검증 실패
            RuntimeError: 파일 시스템 오류
        """
        # 1. 검증
        if not filename:
            raise ValueError("Filename is empty")

        if len(content) > MAX_FILE_SIZE:
            raise ValueError(f"File too large (max {MAX_FILE_SIZE // 1024 // 1024}MB)")

        safe_filename_str = secure_filename(filename)
        if not validate_extension(safe_filename_str):
            raise ValueError(f"Extension not allowed: {filename}")

        # 2. Task 디렉토리 준비
        task_dir = self._get_task_dir(task_id)
        task_dir.mkdir(parents=True, exist_ok=True)

        # 3. Task당 총 크기 확인
        current_size = get_task_total_size(task_dir)
        if current_size + len(content) > MAX_TASK_SIZE:
            raise ValueError(
                f"Task attachments exceed limit "
                f"(max {MAX_TASK_SIZE // 1024 // 1024}MB)"
            )

        # 4. 중복 파일명 처리
        unique_filename = get_unique_filename(task_dir, safe_filename_str)
        file_path = task_dir / unique_filename

        # 5. 파일 저장
        try:
            file_path.write_bytes(content)
            logger.info(f"Saved attachment: {task_id}/{unique_filename}")
        except Exception as e:
            logger.error(f"Failed to save file: {e}")
            raise RuntimeError(f"Failed to save file: {e}")

        # 6. 텍스트 즉시 추출 (Feature 1)
        is_text_available = False
        if self.text_extractor.is_supported(unique_filename):
            try:
                result = self.text_extractor.extract(file_path, force=False)
                if result.error:
                    logger.warning(
                        f"Text extraction failed for {unique_filename}: {result.error}"
                    )
                else:
                    is_text_available = True
                    logger.info(
                        f"Text extracted: {unique_filename} "
                        f"({result.chars} chars, cached={result.cached})"
                    )
            except Exception as e:
                logger.warning(f"Text extraction error: {e}")

        return AttachmentInfo(
            filename=unique_filename,
            size=len(content),
            is_text_available=is_text_available
        )

    def delete_file(self, task_id: str, filename: str) -> bool:
        """
        파일 삭제 + 캐시 .txt도 삭제 (Feature 2)

        Args:
            task_id: Task ID
            filename: 파일명

        Returns:
            True if deleted, False if not found

        Raises:
            RuntimeError: 파일 시스템 오류
        """
        # CRITICAL: Sanitize filename first to prevent path traversal
        safe_filename = secure_filename(filename)

        task_dir = self._get_task_dir(task_id)
        if not task_dir.exists():
            return False

        # Unicode 정규화를 고려한 파일 찾기
        file_path = find_file_with_unicode_normalization(task_dir, safe_filename)
        if not file_path:
            return False

        # Path traversal 검증 (against task_dir, not attachments_dir)
        if not validate_path_safety(task_dir, file_path):
            raise RuntimeError("Path traversal detected")

        try:
            # 원본 파일 삭제
            file_path.unlink()
            logger.info(f"Deleted attachment: {task_id}/{filename}")

            # 캐시 .txt 삭제 (Feature 2)
            cache_path = self._get_cache_path(file_path)
            if cache_path.exists():
                cache_path.unlink()
                logger.info(f"Deleted cache: {cache_path.name}")

            return True

        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            raise RuntimeError(f"Failed to delete file: {e}")

    def list_files(self, task_id: str) -> list[AttachmentInfo]:
        """
        파일 목록 (캐시 .txt 포함)

        Args:
            task_id: Task ID

        Returns:
            List of AttachmentInfo
        """
        task_dir = self._get_task_dir(task_id)
        if not task_dir.exists():
            return []

        files = []
        for file_path in sorted(task_dir.iterdir()):
            if not file_path.is_file():
                continue

            # .txt 캐시 파일은 원본이 없으면 스킵
            # (예: report.pdf.txt는 report.pdf가 있어야 표시)
            if file_path.suffix == '.txt' and not self._is_original_file(file_path):
                # report.pdf.txt인지 확인
                if file_path.stem and file_path.stem.endswith(('.pdf', '.hwp', '.hwpx', '.doc', '.docx')):
                    # 원본 파일이 없으면 스킵
                    original_path = file_path.parent / file_path.stem
                    if not original_path.exists():
                        continue
                # 독립적인 .txt 파일이면 표시
                else:
                    pass

            is_text_available = self._is_text_available(file_path)

            files.append(AttachmentInfo(
                filename=file_path.name,
                size=file_path.stat().st_size,
                is_text_available=is_text_available
            ))

        return files

    def get_file_path(self, task_id: str, filename: str) -> Optional[Path]:
        """
        파일 경로 반환 (Unicode 정규화 포함)

        Args:
            task_id: Task ID
            filename: 파일명

        Returns:
            Path or None if not found

        Raises:
            RuntimeError: Path traversal 검증 실패
        """
        # CRITICAL: Sanitize filename first to prevent path traversal
        safe_filename = secure_filename(filename)

        task_dir = self._get_task_dir(task_id)
        if not task_dir.exists():
            return None

        file_path = find_file_with_unicode_normalization(task_dir, safe_filename)
        if not file_path:
            return None

        # Path traversal 검증 (against task_dir, not attachments_dir)
        if not validate_path_safety(task_dir, file_path):
            raise RuntimeError("Path traversal detected")

        return file_path

    def should_display_inline(self, content_type: Optional[str]) -> bool:
        """
        인라인 표시 여부 판단 (Feature 3)

        Args:
            content_type: MIME type (e.g., "text/plain")

        Returns:
            True if should display inline, False otherwise
        """
        if not content_type:
            return False

        # MIME type 정규화 (charset 제거)
        # 예: "text/plain; charset=utf-8" → "text/plain"
        content_type = content_type.split(';')[0].strip().lower()

        return content_type in self.INLINE_MIME_TYPES

    def _get_task_dir(self, task_id: str) -> Path:
        """Task별 첨부파일 디렉토리 경로"""
        # Task ID sanitization (path traversal 방지)
        safe_task_id = re.sub(r'[^\w\-]', '', task_id)
        return self.attachments_dir / safe_task_id

    def _get_cache_path(self, file_path: Path) -> Path:
        """캐시 파일 경로 (.txt 확장자 추가)"""
        return file_path.with_suffix(file_path.suffix + '.txt')

    def _is_text_available(self, file_path: Path) -> bool:
        """텍스트 추출 가능 여부 (캐시 존재 여부)"""
        if file_path.suffix == '.txt' or file_path.suffix == '.md':
            return True  # 텍스트 파일 자체

        cache_path = self._get_cache_path(file_path)
        return cache_path.exists()

    def _is_original_file(self, file_path: Path) -> bool:
        """
        원본 파일인지 캐시 파일인지 판단

        report.pdf → True
        report.pdf.txt → False
        notes.txt → True
        """
        # .txt가 아니면 원본
        if file_path.suffix != '.txt':
            return True

        # .txt이지만 stem에 확장자가 없으면 원본
        # (예: notes.txt)
        stem_ext = Path(file_path.stem).suffix
        if not stem_ext:
            return True

        # stem에 확장자가 있으면 캐시 파일
        # (예: report.pdf.txt → stem=report.pdf, stem_ext=.pdf)
        return False


# 싱글톤 인스턴스
_service: Optional[AttachmentService] = None


def get_attachment_service(
    attachments_dir: Path,
    text_extractor: TextExtractor
) -> AttachmentService:
    """AttachmentService 싱글톤 반환"""
    global _service
    if _service is None:
        _service = AttachmentService(attachments_dir, text_extractor)
    return _service
