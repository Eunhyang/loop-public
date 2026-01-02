"""
Text Extractor Service (tsk-dashboard-ux-v1-21)

첨부파일에서 텍스트를 추출하는 서비스
- PDF: pdfplumber
- HWP/HWPX/DOC/DOCX: LibreOffice CLI
- TXT/MD: 직접 읽기
- 결과를 {filename}.txt로 캐싱
"""

import subprocess
import tempfile
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class TextExtractionResult:
    """텍스트 추출 결과"""
    text: str
    chars: int
    cached: bool
    cache_path: Optional[Path]
    error: Optional[str] = None


class TextExtractor:
    """텍스트 추출기"""

    # 지원 형식
    SUPPORTED_FORMATS = {'.pdf', '.hwp', '.hwpx', '.doc', '.docx', '.txt', '.md'}
    LIBREOFFICE_FORMATS = {'.hwp', '.hwpx', '.doc', '.docx'}

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
        if not force and cache_path.exists():
            try:
                text = cache_path.read_text(encoding='utf-8')
                return TextExtractionResult(
                    text=text,
                    chars=len(text),
                    cached=True,
                    cache_path=cache_path
                )
            except Exception as e:
                logger.warning(f"Failed to read cache: {e}")

        # 추출 실행
        try:
            if ext == '.pdf':
                text = self._extract_pdf(file_path)
            elif ext in self.LIBREOFFICE_FORMATS:
                text = self._extract_with_libreoffice(file_path)
            else:
                # TXT, MD
                text = self._extract_text_file(file_path)

            # 캐시 저장
            try:
                cache_path.write_text(text, encoding='utf-8')
            except Exception as e:
                logger.warning(f"Failed to write cache: {e}")

            return TextExtractionResult(
                text=text,
                chars=len(text),
                cached=False,
                cache_path=cache_path
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
        """LibreOffice CLI로 텍스트 추출 (HWP, HWPX, DOC, DOCX)"""
        with tempfile.TemporaryDirectory() as tmpdir:
            # LibreOffice로 TXT 변환
            result = subprocess.run(
                [
                    'soffice',
                    '--headless',
                    '--convert-to', 'txt:Text',
                    '--outdir', tmpdir,
                    str(path)
                ],
                capture_output=True,
                text=True,
                timeout=60  # 1분 타임아웃
            )

            if result.returncode != 0:
                raise RuntimeError(f"LibreOffice conversion failed: {result.stderr}")

            # 변환된 TXT 파일 읽기
            txt_path = Path(tmpdir) / (path.stem + '.txt')
            if not txt_path.exists():
                raise RuntimeError(f"Converted file not found: {txt_path}")

            return txt_path.read_text(encoding='utf-8')

    def _extract_text_file(self, path: Path) -> str:
        """TXT/MD 파일 직접 읽기"""
        return path.read_text(encoding='utf-8')

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
