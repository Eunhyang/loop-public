"""
Attachment API Router (tsk-023-1768204346395)

Task 첨부파일 업로드, 조회, 삭제 엔드포인트
- POST /{task_id}/attachments - 파일 업로드 + 텍스트 즉시 추출
- GET /{task_id}/attachments - 목록 조회
- GET /{task_id}/attachments/{filename} - 파일 서빙 (인라인 표시)
- DELETE /{task_id}/attachments/{filename} - 파일 삭제 + 캐시 삭제

Clean Architecture:
- Router: HTTP 핸들링만
- Service: 비즈니스 로직
- Utils: 보안/파일 헬퍼
"""

import os
import mimetypes
from pathlib import Path
from datetime import datetime
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, Response

from ..models.entities import AttachmentInfo, AttachmentResponse, AttachmentListResponse, TextExtractionResponse
from ..services.text_extractor import get_text_extractor
from ..services.attachment_service import AttachmentService
from ..utils.file_security import (
    secure_filename,
    find_file_with_unicode_normalization,
    validate_path_safety
)
from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir
from .audit import log_entity_action

router = APIRouter(prefix="/api/tasks", tags=["attachments"])

# Vault 경로
VAULT_DIR = get_vault_dir()
ATTACHMENTS_DIR = VAULT_DIR / "_attachments"

# Service 인스턴스 (싱글톤)
_attachment_service: Optional[AttachmentService] = None


def get_attachment_service() -> AttachmentService:
    """AttachmentService 싱글톤 반환"""
    global _attachment_service
    if _attachment_service is None:
        _attachment_service = AttachmentService(
            attachments_dir=ATTACHMENTS_DIR,
            text_extractor=get_text_extractor()
        )
    return _attachment_service


def get_task_attachments_dir(task_id: str) -> Path:
    """Task별 첨부파일 디렉토리 경로 (text extraction endpoint용)"""
    import re
    safe_task_id = re.sub(r'[^\w\-]', '', task_id)
    return ATTACHMENTS_DIR / safe_task_id


# ============================================
# Endpoints
# ============================================

@router.post("/{task_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(task_id: str, file: UploadFile = File(...)):
    """
    Task에 첨부파일 업로드 + 텍스트 즉시 추출 (Feature 1)

    - 허용 확장자: PDF, HWP, Office 문서, 이미지, 텍스트, 압축 파일
    - 파일당 최대 100MB
    - Task당 최대 500MB
    - 중복 파일명 자동 리네임
    - PDF 등 지원 형식은 텍스트 즉시 추출
    """
    cache = get_cache()
    service = get_attachment_service()

    # 1. Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # 2. 파일명 검증
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    # 3. 파일 내용 읽기
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    finally:
        await file.close()

    # 4. Service로 저장 (텍스트 즉시 추출 포함)
    try:
        result = service.save_file(task_id, file.filename, content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 5. Content-Type 추론
    content_type, _ = mimetypes.guess_type(result.filename)
    if not content_type:
        content_type = "application/octet-stream"

    # 6. 응답 생성
    uploaded_at = datetime.now().isoformat()
    attachment_info = AttachmentInfo(
        filename=result.filename,
        size=result.size,
        content_type=content_type,
        uploaded_at=uploaded_at,
        url=f"/api/tasks/{task_id}/attachments/{result.filename}"
    )

    # 7. 감사 로그
    log_entity_action(
        action="attachment_upload",
        entity_type="Task",
        entity_id=task_id,
        entity_name=result.filename,
        details={
            "original_filename": file.filename,
            "saved_filename": result.filename,
            "size": result.size,
            "content_type": content_type,
            "text_extracted": result.is_text_available
        }
    )

    return AttachmentResponse(
        success=True,
        task_id=task_id,
        message=f"File uploaded successfully: {result.filename}",
        attachment=attachment_info
    )


@router.get("/{task_id}/attachments", response_model=AttachmentListResponse)
def list_attachments(task_id: str):
    """
    Task 첨부파일 목록 조회 (캐시 .txt 포함)

    Returns:
        - attachments: 파일 목록 (filename, size, content_type, uploaded_at, url)
        - total_count: 총 파일 수
        - total_size: 총 파일 크기 (bytes)
    """
    cache = get_cache()
    service = get_attachment_service()

    # Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # Service로 목록 조회
    file_list = service.list_files(task_id)

    if not file_list:
        return AttachmentListResponse(
            success=True,
            task_id=task_id,
            attachments=[],
            total_count=0,
            total_size=0
        )

    attachments = []
    total_size = 0

    for file_info in file_list:
        content_type, _ = mimetypes.guess_type(file_info.filename)
        if not content_type:
            content_type = "application/octet-stream"

        # CRITICAL: Get file path to read mtime
        file_path = service.get_file_path(task_id, file_info.filename)
        uploaded_at = datetime.now().isoformat()  # Default
        if file_path:
            uploaded_at = datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()

        attachments.append(AttachmentInfo(
            filename=file_info.filename,
            size=file_info.size,
            content_type=content_type,
            uploaded_at=uploaded_at,
            url=f"/api/tasks/{task_id}/attachments/{file_info.filename}"
        ))
        total_size += file_info.size

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
    첨부파일 다운로드/서빙 + 인라인 표시 (Feature 3)

    - Content-Type 자동 설정
    - Content-Disposition: inline or attachment
    - 텍스트/이미지/PDF는 브라우저 인라인 표시
    """
    cache = get_cache()
    service = get_attachment_service()

    # Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # Service로 파일 경로 조회
    try:
        file_path = service.get_file_path(task_id, filename)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not file_path:
        raise HTTPException(status_code=404, detail=f"Attachment not found: {filename}")

    # Content-Type 추론
    content_type, _ = mimetypes.guess_type(file_path.name)
    if not content_type:
        content_type = "application/octet-stream"

    # 인라인 표시 여부 판단 (Feature 3)
    disposition = "inline" if service.should_display_inline(content_type) else "attachment"
    safe_name = secure_filename(filename)

    # 텍스트 파일: 직접 읽어서 Response로 반환 (한글 깨짐 방지)
    # FileResponse는 charset을 제대로 전달하지 않는 경우가 있음
    if content_type and content_type.startswith("text/"):
        try:
            text_content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            # Fallback: 손실 허용 읽기
            text_content = file_path.read_text(encoding='utf-8', errors='replace')

        return Response(
            content=text_content.encode('utf-8'),
            media_type="text/plain; charset=utf-8",
            headers={
                "Content-Disposition": f'{disposition}; filename*=utf-8\'\'{quote(safe_name)}'
            }
        )

    # 바이너리 파일: FileResponse로 스트리밍
    return FileResponse(
        path=file_path,
        media_type=content_type,
        filename=safe_name,
        content_disposition_type=disposition
    )


@router.delete("/{task_id}/attachments/{filename}", response_model=AttachmentResponse)
def delete_attachment(task_id: str, filename: str):
    """
    첨부파일 삭제 + 캐시 .txt 삭제 (Feature 2)
    """
    cache = get_cache()
    service = get_attachment_service()

    # Task 존재 검증
    task_path = cache.get_task_path(task_id)
    if not task_path:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    # Service로 삭제 (캐시 .txt도 삭제)
    try:
        deleted = service.delete_file(task_id, filename)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not deleted:
        raise HTTPException(status_code=404, detail=f"Attachment not found: {filename}")

    # 감사 로그
    log_entity_action(
        action="attachment_delete",
        entity_type="Task",
        entity_id=task_id,
        entity_name=secure_filename(filename),
        details={
            "filename": filename
        }
    )

    return AttachmentResponse(
        success=True,
        task_id=task_id,
        message=f"Attachment deleted: {filename}"
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

    # 3. 파일 경로 확인 (Unicode 정규화 고려)
    task_dir = get_task_attachments_dir(task_id)

    # Unicode 정규화를 고려한 파일 찾기 (macOS NFD 대응)
    file_path = find_file_with_unicode_normalization(task_dir, safe_filename)

    if not file_path:
        raise HTTPException(status_code=404, detail=f"Attachment not found: {filename}")

    # 4. Path safety 검증
    if not validate_path_safety(ATTACHMENTS_DIR, file_path):
        raise HTTPException(status_code=400, detail="Invalid file path")

    # 5. 지원 형식 확인
    if not extractor.is_supported(file_path.name):
        ext = os.path.splitext(file_path.name)[1].lower()
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported format for text extraction: {ext}. "
                   f"Supported: {', '.join(sorted(extractor.SUPPORTED_FORMATS))}"
        )

    # 6. 텍스트 추출
    result = extractor.extract(file_path, force=force)

    if result.error:
        # Codex 피드백: 타임아웃은 504로 반환
        if result.is_timeout:
            raise HTTPException(status_code=504, detail=f"Text extraction timeout: {result.error}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {result.error}")

    # 7. max_chars 적용
    text = result.text
    truncated = False
    if max_chars and len(text) > max_chars:
        text = text[:max_chars]
        truncated = True

    # 8. 상대 경로 계산 (cache_path)
    # Codex 피드백: VAULT_DIR 외부 경로는 노출하지 않음
    cache_path_relative = None
    if result.cache_path:
        try:
            cache_path_relative = str(result.cache_path.relative_to(VAULT_DIR))
        except ValueError:
            # VAULT_DIR 외부 경로는 노출하지 않음 (보안)
            cache_path_relative = None

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
