---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-18"
entity_name: "Dashboard - Task 첨부파일 업로드 API"
created: 2026-01-02
updated: 2026-01-02
status: done

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-18"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: [dashboard, attachment, api, upload]
priority_flag: medium
---

# Dashboard - Task 첨부파일 업로드 API

> Task ID: `tsk-dashboard-ux-v1-18` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

Task에 첨부파일을 업로드/조회/삭제할 수 있는 백엔드 API 구현

**완료 조건**:
1. POST /api/tasks/{id}/attachments - 파일 업로드 동작
2. GET /api/tasks/{id}/attachments - 첨부파일 목록 반환
3. GET /api/tasks/{id}/attachments/{filename} - 파일 서빙 (다운로드/뷰어용)
4. DELETE /api/tasks/{id}/attachments/{filename} - 파일 삭제
5. 파일은 `_attachments/{task_id}/` 폴더에 저장
6. `.gitignore`에 `_attachments/` 추가 (Git 제외)

---

## 상세 내용

### 배경

- 칸반 대시보드에서 Task에 증거자료(PDF, HWP, MP3 등) 첨부 필요
- 첨부파일은 NAS에만 저장, Git 동기화 제외
- 추후 LLM이 파일 내용을 읽어 B Score 계산에 활용

### 작업 내용

1. `api/routers/attachments.py` 라우터 생성
2. 파일 업로드 핸들러 (multipart/form-data)
3. 파일 목록 조회 (파일명, 크기, 타입, 업로드일시)
4. 파일 서빙 (Content-Type 적절히 설정)
5. 파일 삭제
6. `.gitignore` 업데이트

---

## 체크리스트

- [x] `api/routers/attachments.py` 생성
- [x] POST 업로드 엔드포인트 구현
- [x] GET 목록 엔드포인트 구현
- [x] GET 파일 서빙 엔드포인트 구현
- [x] DELETE 삭제 엔드포인트 구현
- [x] `_attachments/` 폴더 구조 생성 (업로드 시 자동 생성)
- [x] `.gitignore`에 추가
- [x] 보안 테스트 통과

---

## Notes

### PRD (Product Requirements Document)

#### 프로젝트 컨텍스트
| 항목 | 값 |
|------|-----|
| Framework | FastAPI (Python 3.11+) |
| Architecture | Router → Service → Storage (레이어드) |
| 인증 | Bearer Token / OAuth JWT |
| 저장소 | NAS 로컬 (`_attachments/{task_id}/`) |
| Git | `.gitignore`에 `_attachments/` 추가 |

#### API 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| POST | `/{task_id}/attachments` | 파일 업로드 (multipart) |
| GET | `/{task_id}/attachments` | 목록 조회 |
| GET | `/{task_id}/attachments/{filename}` | 파일 서빙 |
| DELETE | `/{task_id}/attachments/{filename}` | 파일 삭제 |

#### 허용 파일 확장자
```python
ALLOWED_EXTENSIONS = {
    ".pdf", ".hwp", ".hwpx", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".mp3", ".wav", ".m4a", ".ogg", ".flac",
    ".mp4", ".mov", ".avi", ".mkv",
    ".txt", ".md", ".csv", ".json",
    ".zip", ".tar", ".gz",
}
```

#### 파일 크기 제한
- 파일당: 100MB
- Task당 총합: 500MB

#### Pydantic 모델
```python
class AttachmentInfo(BaseModel):
    filename: str
    size: int
    content_type: str
    uploaded_at: str
    url: str

class AttachmentResponse(BaseModel):
    success: bool
    task_id: str
    message: str
    attachment: Optional[AttachmentInfo] = None

class AttachmentListResponse(BaseModel):
    success: bool
    task_id: str
    attachments: List[AttachmentInfo]
    total_count: int
    total_size: int
```

---

### Tech Spec

#### 파일 구조
```
public/api/
├── routers/
│   └── attachments.py       # 신규 생성
├── models/
│   └── entities.py          # Attachment 모델 추가
└── main.py                  # 라우터 등록
```

#### 저장소 구조
```
{VAULT_DIR}/_attachments/{task_id}/{filename}
```

#### 보안
- Path traversal 공격 방지 (`../` 제거)
- 파일명 sanitize
- Task 존재 검증 (VaultCache)

---

### Todo
- [x] `api/routers/attachments.py` 생성
- [x] Pydantic 모델 추가 (`models/entities.py`)
- [x] POST 업로드 엔드포인트 구현
- [x] GET 목록 엔드포인트 구현
- [x] GET 파일 서빙 엔드포인트 구현
- [x] DELETE 삭제 엔드포인트 구현
- [x] `main.py`에 라우터 등록
- [x] `.gitignore`에 `_attachments/` 추가
- [x] 감사 로그 (`log_entity_action`)
- [x] 보안 테스트 통과

### 작업 로그

#### 2026-01-02
**개요**: Task 첨부파일 업로드/조회/삭제 API를 FastAPI로 구현했습니다. Codex와의 코드 리뷰를 통해 보안 취약점을 개선했습니다.

**변경사항**:
- 개발:
  - `api/routers/attachments.py` - 4개 엔드포인트 (POST/GET/GET/DELETE)
  - `api/models/entities.py` - AttachmentInfo, AttachmentResponse, AttachmentListResponse 모델
  - `api/main.py` - 라우터 등록
  - `.gitignore` - `_attachments/` 추가
- 보안 (Codex 피드백 반영):
  - `secure_filename()` - path traversal, null byte, URL encoding 방지
  - `validate_path_safety()` - `Path.is_relative_to()` 사용 (startswith 취약점 수정)
  - `UploadFile.close()` - finally 블록에서 리소스 정리
  - 청크 단위 업로드로 메모리 보호 (100MB/파일, 500MB/Task)

**핵심 코드**:
```python
# Path traversal 방지 (Codex 피드백)
def validate_path_safety(base_dir: Path, target_path: Path) -> bool:
    resolved_target = target_path.resolve()
    return resolved_target.is_relative_to(base_dir.resolve())
```

**결과**: 보안 테스트 통과

**다음 단계**:
- 프론트엔드 첨부파일 UI 구현 (별도 Task)
- MCP 서버 재배포로 API 활성화


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
