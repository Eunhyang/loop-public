"""
Text Extractor Service (tsk-dashboard-ux-v1-21)

첨부파일에서 텍스트를 추출하는 서비스
- PDF: pdfplumber
- HWP/HWPX/DOC/DOCX: LibreOffice CLI
- TXT/MD: 직접 읽기
- 결과를 {filename}.txt로 캐싱

Codex 피드백 반영:
- 원자적 캐시 쓰기 (write-to-temp-and-rename)
- TXT 인코딩 fallback (chardet + errors="replace")
- LibreOffice TimeoutExpired 명시적 처리
- 캐시 mtime 검증
"""

import os
import subprocess
import tempfile
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


class TimeoutError(Exception):
    """LibreOffice 타임아웃 예외"""
    pass


@dataclass
class TextExtractionResult:
    """텍스트 추출 결과"""
    text: str
    chars: int
    cached: bool
    cache_path: Optional[Path]
    error: Optional[str] = None
    is_timeout: bool = False  # 타임아웃 여부 (Codex 피드백)


class TextExtractor:
    """텍스트 추출기"""

    # 지원 형식
    SUPPORTED_FORMATS = {'.pdf', '.hwp', '.hwpx', '.doc', '.docx', '.txt', '.md'}
    LIBREOFFICE_FORMATS = {'.hwp', '.hwpx', '.doc', '.docx'}

    # LibreOffice 타임아웃 (초)
    LIBREOFFICE_TIMEOUT = 60

    def __init__(self):
        pass

    def extract(self, file_path: Path, force: bool = False) -> TextExtractionResult:
        """
        파일에서 텍스트 추출

        Args:
            file_path: 원본 파일 경로
            force: True면 캐시 무시하고 재추출

        Returns:
            TextExtractionResult
        """
        # 지원 형식 확인
        ext = file_path.suffix.lower()
        if ext not in self.SUPPORTED_FORMATS:
            return TextExtractionResult(
                text="",
                chars=0,
                cached=False,
                cache_path=None,
                error=f"Unsupported format: {ext}"
            )

        # 캐시 경로
        cache_path = self._get_cache_path(file_path)

        # 캐시 확인 (force=False일 때)
        # Codex 피드백: mtime 검증으로 stale 캐시 방지
        if not force and cache_path.exists():
            try:
                # 원본 파일보다 캐시가 최신인지 확인
                if self._is_cache_valid(file_path, cache_path):
                    text = cache_path.read_text(encoding='utf-8')
                    return TextExtractionResult(
                        text=text,
                        chars=len(text),
                        cached=True,
                        cache_path=cache_path
                    )
                else:
                    logger.info(f"Cache stale, re-extracting: {file_path.name}")
            except Exception as e:
                logger.warning(f"Failed to read cache: {e}")

        # 추출 실행
        try:
            if ext == '.pdf':
                text = self._extract_pdf(file_path)
            elif ext in self.LIBREOFFICE_FORMATS:
                text = self._extract_with_libreoffice(file_path)
            else:
                # TXT, MD (Codex 피드백: 인코딩 fallback)
                text = self._extract_text_file(file_path)

            # 캐시 저장 (Codex 피드백: 원자적 쓰기)
            self._write_cache_atomic(cache_path, text)

            return TextExtractionResult(
                text=text,
                chars=len(text),
                cached=False,
                cache_path=cache_path
            )

        except TimeoutError as e:
            # Codex 피드백: 타임아웃 명시적 처리
            logger.error(f"Text extraction timeout: {e}")
            return TextExtractionResult(
                text="",
                chars=0,
                cached=False,
                cache_path=None,
                error=str(e),
                is_timeout=True
            )
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return TextExtractionResult(
                text="",
                chars=0,
                cached=False,
                cache_path=None,
                error=str(e)
            )

    def _is_cache_valid(self, file_path: Path, cache_path: Path) -> bool:
        """
        캐시 유효성 검증 (Codex 피드백)

        원본 파일보다 캐시가 최신이면 True
        """
        try:
            file_mtime = file_path.stat().st_mtime
            cache_mtime = cache_path.stat().st_mtime
            return cache_mtime >= file_mtime
        except OSError:
            return False

    def _write_cache_atomic(self, cache_path: Path, text: str) -> None:
        """
        원자적 캐시 쓰기 (Codex 피드백)

        임시 파일에 쓴 후 rename으로 덮어씀
        → Race condition 방지
        """
        try:
            # 같은 디렉토리에 임시 파일 생성 (rename을 위해)
            fd, tmp_path = tempfile.mkstemp(
                dir=cache_path.parent,
                suffix='.tmp'
            )
            try:
                with os.fdopen(fd, 'w', encoding='utf-8') as f:
                    f.write(text)
                # 원자적 rename
                os.replace(tmp_path, cache_path)
            except Exception:
                # 실패 시 임시 파일 정리
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass
                raise
        except Exception as e:
            logger.warning(f"Failed to write cache: {e}")

    def _get_cache_path(self, file_path: Path) -> Path:
        """캐시 파일 경로 (.txt 확장자 추가)"""
        return file_path.with_suffix(file_path.suffix + '.txt')

    def _extract_pdf(self, path: Path) -> str:
        """PDF 텍스트 추출 (pdfplumber)"""
        try:
            import pdfplumber
        except ImportError:
            raise RuntimeError("pdfplumber not installed")

        texts = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    texts.append(page_text)

        return '\n'.join(texts)

    def _extract_with_libreoffice(self, path: Path) -> str:
        """
        LibreOffice CLI로 텍스트 추출 (HWP, HWPX, DOC, DOCX)

        Codex 피드백: TimeoutExpired 명시적 처리
        """
        process = None
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                # LibreOffice로 TXT 변환
                process = subprocess.Popen(
                    [
                        'soffice',
                        '--headless',
                        '--convert-to', 'txt:Text',
                        '--outdir', tmpdir,
                        str(path)
                    ],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

                stdout, stderr = process.communicate(timeout=self.LIBREOFFICE_TIMEOUT)

                if process.returncode != 0:
                    raise RuntimeError(f"LibreOffice conversion failed: {stderr}")

                # 변환된 TXT 파일 읽기
                txt_path = Path(tmpdir) / (path.stem + '.txt')
                if not txt_path.exists():
                    raise RuntimeError(f"Converted file not found: {txt_path}")

                return txt_path.read_text(encoding='utf-8')

            except subprocess.TimeoutExpired:
                # Codex 피드백: 타임아웃 시 프로세스 강제 종료
                if process:
                    process.kill()
                    process.wait()  # 좀비 프로세스 방지
                raise TimeoutError(
                    f"LibreOffice conversion timed out after {self.LIBREOFFICE_TIMEOUT}s"
                )

    def _extract_text_file(self, path: Path) -> str:
        """
        TXT/MD 파일 직접 읽기

        Codex 피드백: 인코딩 fallback (UTF-8 → CP949 → errors="replace")
        """
        # 1차: UTF-8 시도
        try:
            return path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            pass

        # 2차: CP949 시도 (한글 Windows 파일)
        try:
            return path.read_text(encoding='cp949')
        except UnicodeDecodeError:
            pass

        # 3차: UTF-8 with replace (손실 허용)
        logger.warning(f"Using fallback encoding for: {path.name}")
        return path.read_text(encoding='utf-8', errors='replace')

    def is_supported(self, filename: str) -> bool:
        """파일 형식 지원 여부 확인"""
        ext = Path(filename).suffix.lower()
        return ext in self.SUPPORTED_FORMATS


# 싱글톤 인스턴스
_extractor: Optional[TextExtractor] = None


def get_text_extractor() -> TextExtractor:
    """TextExtractor 싱글톤 반환"""
    global _extractor
    if _extractor is None:
        _extractor = TextExtractor()
    return _extractor
