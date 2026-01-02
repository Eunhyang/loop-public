"""
Attachment API Router

Task 첨부파일 업로드, 조회, 삭제 엔드포인트
- POST /{task_id}/attachments - 파일 업로드
- GET /{task_id}/attachments - 목록 조회
- GET /{task_id}/attachments/{filename} - 파일 서빙
- DELETE /{task_id}/attachments/{filename} - 파일 삭제

Storage: {VAULT_DIR}/_attachments/{task_id}/{filename}
"""

import os
import re
import mimetypes
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from ..models.entities import AttachmentInfo, AttachmentResponse, AttachmentListResponse, TextExtractionResponse
from ..services.text_extractor import get_text_extractor
from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir
from .audit import log_entity_action

router = APIRouter(prefix="/api/tasks", tags=["attachments"])

# Vault 경로
VAULT_DIR = get_vault_dir()
ATTACHMENTS_DIR = VAULT_DIR / "_attachments"

# ============================================
# Constants (PRD 정의)
# ============================================
ALLOWED_EXTENSIONS = {
    ".pdf", ".hwp", ".hwpx", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".mp3", ".wav", ".m4a", ".ogg", ".flac",
    ".mp4", ".mov", ".avi", ".mkv",
    ".txt", ".md", ".csv", ".json",
    ".zip", ".tar", ".gz",
}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB per file
MAX_TASK_SIZE = 500 * 1024 * 1024  # 500MB per task


# ============================================
# Security Helpers
# ============================================
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


def get_task_attachments_dir(task_id: str) -> Path:
    """Task별 첨부파일 디렉토리 경로"""
    # Task ID도 sanitize (path traversal 방지)
    safe_task_id = re.sub(r'[^\w\-]', '', task_id)
    return ATTACHMENTS_DIR / safe_task_id


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


# ============================================
# Endpoints
# ============================================

@router.post("/{task_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(task_id: str, file: UploadFile = File(...)):
    """
    Task에 첨부파일 업로드

    - 허용 확장자: PDF, HWP, Office 문서, 이미지, 오디오, 비디오, 텍스트, 압축 파일
    - 파일당 최대 100MB
    - Task당 최대 500MB
    - 중복 파일명 자동 리네임
    """
    cache = get_cache()

    # 1. Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 2. 파일명 검증
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    safe_filename = secure_filename(file.filename)

    # 3. 확장자 검증
    if not validate_extension(safe_filename):
        ext = os.path.splitext(safe_filename)[1].lower()
        raise HTTPException(
            status_code=400,
            detail=f"File extension not allowed: {ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # 4. 저장 디렉토리 준비
    task_dir = get_task_attachments_dir(task_id)
    task_dir.mkdir(parents=True, exist_ok=True)

    # 5. Task 총 용량 검증
    current_total = get_task_total_size(task_dir)
    if current_total >= MAX_TASK_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Task attachment limit exceeded ({MAX_TASK_SIZE // (1024*1024)}MB max)"
        )

    # 6. 중복 파일명 처리
    final_filename = get_unique_filename(task_dir, safe_filename)
    target_path = task_dir / final_filename

    # 7. Path safety 검증
    if not validate_path_safety(ATTACHMENTS_DIR, target_path):
        raise HTTPException(status_code=400, detail="Invalid file path")

    # 8. 파일 저장 (청크 단위로 읽어서 크기 제한 적용)
    # Codex 피드백: finally 블록에서 UploadFile.close() 호출하여 모든 경로에서 리소스 정리
    file_size = 0
    try:
        with open(target_path, 'wb') as f:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB 청크
                if not chunk:
                    break
                file_size += len(chunk)

                # 파일 크기 제한 검증
                if file_size > MAX_FILE_SIZE:
                    f.close()
                    target_path.unlink()  # 실패 시 삭제
                    raise HTTPException(
                        status_code=400,
                        detail=f"File too large ({MAX_FILE_SIZE // (1024*1024)}MB max)"
                    )

                # Task 총 용량 제한 검증
                if current_total + file_size > MAX_TASK_SIZE:
                    f.close()
                    target_path.unlink()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Task attachment limit exceeded ({MAX_TASK_SIZE // (1024*1024)}MB max)"
                    )

                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        # 저장 실패 시 정리
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        # 9. UploadFile 정리 - 성공/실패 모든 경로에서 리소스 정리
        await file.close()

    # 10. Content-Type 추론
    content_type, _ = mimetypes.guess_type(final_filename)
    if not content_type:
        content_type = "application/octet-stream"

    # 11. 응답 생성
    uploaded_at = datetime.now().isoformat()
    attachment_info = AttachmentInfo(
        filename=final_filename,
        size=file_size,
        content_type=content_type,
        uploaded_at=uploaded_at,
        url=f"/api/tasks/{task_id}/attachments/{final_filename}"
    )

    # 12. 감사 로그
    log_entity_action(
        action="attachment_upload",
        entity_type="Task",
        entity_id=task_id,
        entity_name=final_filename,
        details={
            "original_filename": file.filename,
            "saved_filename": final_filename,
            "size": file_size,
            "content_type": content_type
        }
    )

    return AttachmentResponse(
        success=True,
        task_id=task_id,
        message=f"File uploaded successfully: {final_filename}",
        attachment=attachment_info
    )


@router.get("/{task_id}/attachments", response_model=AttachmentListResponse)
def list_attachments(task_id: str):
    """
    Task 첨부파일 목록 조회

    Returns:
        - attachments: 파일 목록 (filename, size, content_type, uploaded_at, url)
        - total_count: 총 파일 수
        - total_size: 총 파일 크기 (bytes)
    """
    cache = get_cache()

    # Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    task_dir = get_task_attachments_dir(task_id)

    if not task_dir.exists():
        return AttachmentListResponse(
            success=True,
            task_id=task_id,
            attachments=[],
            total_count=0,
            total_size=0
        )

    attachments = []
    total_size = 0

    for file_path in sorted(task_dir.iterdir()):
        if not file_path.is_file():
            continue

        stat = file_path.stat()
        content_type, _ = mimetypes.guess_type(file_path.name)
        if not content_type:
            content_type = "application/octet-stream"

        attachments.append(AttachmentInfo(
            filename=file_path.name,
            size=stat.st_size,
            content_type=content_type,
            uploaded_at=datetime.fromtimestamp(stat.st_mtime).isoformat(),
            url=f"/api/tasks/{task_id}/attachments/{file_path.name}"
        ))
        total_size += stat.st_size

    return AttachmentListResponse(
        success=True,
        task_id=task_id,
        attachments=attachments,
        total_count=len(attachments),
        total_size=total_size
    )


@router.get("/{task_id}/attachments/{filename}")
def get_attachment(task_id: str, filename: str):
    """
    첨부파일 다운로드/서빙

    - Content-Type 자동 설정
    - Content-Disposition: attachment (다운로드 유도)
    """
    cache = get_cache()

    # Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 파일명 sanitize
    safe_filename = secure_filename(filename)

    task_dir = get_task_attachments_dir(task_id)
    file_path = task_dir / safe_filename

    # Path safety 검증
    if not validate_path_safety(ATTACHMENTS_DIR, file_path):
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Attachment not found: {filename}")

    # Content-Type 추론
    content_type, _ = mimetypes.guess_type(safe_filename)
    if not content_type:
        content_type = "application/octet-stream"

    # FileResponse로 스트리밍 (대용량 파일 처리)
    return FileResponse(
        path=file_path,
        media_type=content_type,
        filename=safe_filename,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"'
        }
    )


@router.delete("/{task_id}/attachments/{filename}", response_model=AttachmentResponse)
def delete_attachment(task_id: str, filename: str):
    """
    첨부파일 삭제
    """
    cache = get_cache()

    # Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 파일명 sanitize
    safe_filename = secure_filename(filename)

    task_dir = get_task_attachments_dir(task_id)
    file_path = task_dir / safe_filename

    # Path safety 검증
    if not validate_path_safety(ATTACHMENTS_DIR, file_path):
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Attachment not found: {filename}")

    # 파일 정보 백업 (로그용)
    file_size = file_path.stat().st_size

    # 파일 삭제
    try:
        file_path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

    # 빈 디렉토리 정리 (옵션, Codex 피드백: OSError 처리)
    try:
        if task_dir.exists() and not any(task_dir.iterdir()):
            task_dir.rmdir()
    except OSError:
        pass  # 디렉토리 삭제 실패 시 무시 (다른 프로세스가 사용 중일 수 있음)

    # 감사 로그
    log_entity_action(
        action="attachment_delete",
        entity_type="Task",
        entity_id=task_id,
        entity_name=safe_filename,
        details={
            "filename": safe_filename,
            "size": file_size
        }
    )

    return AttachmentResponse(
        success=True,
        task_id=task_id,
        message=f"Attachment deleted: {safe_filename}"
    )


@router.get("/{task_id}/attachments/{filename}/text", response_model=TextExtractionResponse)
def extract_attachment_text(
    task_id: str,
    filename: str,
    force: bool = False,
    max_chars: Optional[int] = None
):
    """
    첨부파일 텍스트 추출 (tsk-dashboard-ux-v1-21)

    지원 형식:
    - PDF: pdfplumber
    - HWP/HWPX/DOC/DOCX: LibreOffice CLI
    - TXT/MD: 직접 읽기

    Query Parameters:
        force: True면 캐시 무시하고 재추출 (기본값: False)
        max_chars: 최대 문자 수 (LLM 토큰 절약용, 선택)

    캐싱:
        - 추출 결과를 {filename}.txt로 저장
        - 다음 요청 시 .txt에서 바로 반환
    """
    cache = get_cache()
    extractor = get_text_extractor()

    # 1. Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 2. 파일명 sanitize
    safe_filename = secure_filename(filename)

    # 3. 파일 경로 확인
    task_dir = get_task_attachments_dir(task_id)
    file_path = task_dir / safe_filename

    # 4. Path safety 검증
    if not validate_path_safety(ATTACHMENTS_DIR, file_path):
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Attachment not found: {filename}")

    # 5. 지원 형식 확인
    if not extractor.is_supported(safe_filename):
        ext = os.path.splitext(safe_filename)[1].lower()
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported format for text extraction: {ext}. "
                   f"Supported: {', '.join(sorted(extractor.SUPPORTED_FORMATS))}"
        )

    # 6. 텍스트 추출
    result = extractor.extract(file_path, force=force)

    if result.error:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {result.error}")

    # 7. max_chars 적용
    text = result.text
    truncated = False
    if max_chars and len(text) > max_chars:
        text = text[:max_chars]
        truncated = True

    # 8. 상대 경로 계산 (cache_path)
    cache_path_relative = None
    if result.cache_path:
        try:
            cache_path_relative = str(result.cache_path.relative_to(VAULT_DIR))
        except ValueError:
            cache_path_relative = str(result.cache_path)

    # 9. 파일 형식 추출
    file_format = os.path.splitext(safe_filename)[1].lower().lstrip('.')

    return TextExtractionResponse(
        success=True,
        task_id=task_id,
        filename=safe_filename,
        format=file_format,
        text=text,
        chars=len(text),
        cached=result.cached,
        cache_path=cache_path_relative,
        truncated=truncated
    )
