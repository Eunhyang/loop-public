"""
File Security Utilities (tsk-023-1768204346395)

보안 헬퍼 함수 분리 (Clean Architecture - utils layer)
- 파일명 sanitization
- Path traversal 방지
- 확장자 검증
- Unicode 정규화
"""

import os
import re
import unicodedata
from pathlib import Path
from typing import Optional


# 허용된 확장자
ALLOWED_EXTENSIONS = {
    '.pdf',
    '.hwp', '.hwpx',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.md', '.csv', '.json',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.mp3', '.wav', '.m4a', '.ogg', '.flac',
    '.mp4', '.mov', '.avi', '.mkv',
    '.zip', '.tar', '.gz'
}


def secure_filename(filename: str) -> str:
    """
    파일명 안전하게 변환 (path traversal 방지)

    - Unicode normalization
    - 위험 문자 제거 (../, ..\, /, \, :, 등)
    - 공백 → 언더스코어
    - 최대 255자 제한
    """
    # 기본 파일명 추출 (경로 제거)
    filename = os.path.basename(filename)

    # Null bytes 제거
    filename = filename.replace('\x00', '')

    # Path traversal 패턴 제거
    filename = re.sub(r'\.\.+', '', filename)  # .., ..., 등
    filename = re.sub(r'[/\\:]', '_', filename)  # /, \, : → _

    # URL 인코딩된 시퀀스 제거 (%2e, %2f 등)
    filename = re.sub(r'%[0-9a-fA-F]{2}', '', filename)

    # 위험한 특수문자 제거 (알파벳, 숫자, -, _, . 만 허용)
    filename = re.sub(r'[^\w\s\-.]', '', filename, flags=re.UNICODE)

    # 연속 공백/언더스코어 정리
    filename = re.sub(r'[\s]+', '_', filename)
    filename = re.sub(r'_+', '_', filename)

    # 앞뒤 공백/점/언더스코어 제거
    filename = filename.strip(' ._')

    # 파일명 길이 제한 (확장자 포함 255자)
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255 - len(ext)] + ext

    # 빈 파일명 방지
    if not filename:
        filename = "unnamed"

    return filename


def validate_extension(filename: str) -> bool:
    """확장자 검증 (대소문자 무시, 마지막 확장자만 검사)"""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def validate_path_safety(base_dir: Path, target_path: Path) -> bool:
    """
    Path traversal 공격 방지
    target_path가 base_dir 내부에 있는지 검증

    Codex 피드백: startswith는 안전하지 않음 (예: /tmp/attachments_evil/file)
    Path.is_relative_to (Python 3.9+) 사용
    """
    try:
        resolved_base = base_dir.resolve()
        resolved_target = target_path.resolve()
        # Python 3.9+ is_relative_to 사용 (startswith보다 안전)
        return resolved_target.is_relative_to(resolved_base)
    except (ValueError, OSError):
        return False


def find_file_with_unicode_normalization(task_dir: Path, filename: str) -> Optional[Path]:
    """
    Unicode 정규화를 고려한 파일 찾기

    macOS는 파일명을 NFD(분해형)로 저장하지만,
    API 요청은 NFC(조합형)로 들어올 수 있음.
    양쪽 형태로 검색하여 파일을 찾음.
    """
    if not task_dir.exists():
        return None

    # 1. 원본 파일명으로 시도
    file_path = task_dir / filename
    if file_path.exists():
        return file_path

    # 2. NFC 정규화로 시도
    nfc_filename = unicodedata.normalize('NFC', filename)
    file_path = task_dir / nfc_filename
    if file_path.exists():
        return file_path

    # 3. NFD 정규화로 시도
    nfd_filename = unicodedata.normalize('NFD', filename)
    file_path = task_dir / nfd_filename
    if file_path.exists():
        return file_path

    # 4. 디렉토리 내 파일들과 정규화 비교
    nfc_target = unicodedata.normalize('NFC', filename)
    for existing_file in task_dir.iterdir():
        if unicodedata.normalize('NFC', existing_file.name) == nfc_target:
            return existing_file

    return None


def get_unique_filename(target_dir: Path, filename: str) -> str:
    """
    중복 파일명 처리 - 자동 리네임

    filename.pdf → filename.pdf
    filename.pdf (exists) → filename_1.pdf
    filename_1.pdf (exists) → filename_2.pdf
    """
    if not (target_dir / filename).exists():
        return filename

    name, ext = os.path.splitext(filename)
    counter = 1
    while (target_dir / f"{name}_{counter}{ext}").exists():
        counter += 1

    return f"{name}_{counter}{ext}"


def get_task_total_size(task_dir: Path) -> int:
    """Task 첨부파일 총 크기 계산"""
    if not task_dir.exists():
        return 0

    total = 0
    for file in task_dir.iterdir():
        if file.is_file():
            total += file.stat().st_size
    return total
