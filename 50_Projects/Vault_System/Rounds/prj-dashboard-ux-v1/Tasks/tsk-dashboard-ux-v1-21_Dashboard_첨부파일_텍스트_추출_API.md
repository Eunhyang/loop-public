---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-21"
entity_name: "Dashboard - 첨부파일 텍스트 추출 API"
created: 2026-01-02
updated: 2026-01-03
status: done
closed: 2026-01-03

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-21"]

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
tags: [dashboard, attachment, text-extraction, llm, b-score, libreoffice, pdf, hwp]
priority_flag: medium
---

# Dashboard - 첨부파일 텍스트 추출 API

> Task ID: `tsk-dashboard-ux-v1-21` | Project: `prj-dashboard-ux-v1` | Status: done

## 목표

첨부파일(PDF, HWP 등)에서 텍스트를 추출하여 `.txt` 파일로 저장하고 LLM이 읽을 수 있도록 API 제공

**완료 조건**:
1. GET /api/tasks/{id}/attachments/{filename}/text - 텍스트 추출 반환
2. 추출 결과를 `{filename}.txt`로 저장 (캐싱 + 검증 용도)
3. PDF 텍스트 추출 (pdfplumber)
4. HWP/HWPX 텍스트 추출 (LibreOffice CLI)
5. n8n 워크플로우에서 호출 가능
6. B Score 계산 시 증거자료로 활용 가능

---

## 상세 내용

### 배경

- B Score (Realized Impact) 계산 시 첨부된 증거자료 분석 필요
- n8n 워크플로우에서 LLM에게 첨부파일 내용을 컨텍스트로 전달
- 파일 바이너리가 아닌 텍스트로 추출해야 LLM이 읽을 수 있음
- **추출 결과를 파일로 저장하면**: 재추출 불필요, 결과 검증/수정 가능, 원본 삭제 시에도 유지

### 작업 내용

1. 텍스트 추출 엔드포인트 추가 (`/text`)
2. **추출 결과 파일 저장**: `{filename}.txt` (같은 폴더에)
3. PDF 추출: pdfplumber 라이브러리 사용
4. HWP/HWPX 추출: LibreOffice CLI (`soffice --headless`)
5. TXT/MD: 직접 읽기
6. 지원하지 않는 형식은 에러 반환
7. `?force=true` 파라미터로 재추출 지원

### 파일 저장 구조

```
첨부파일 폴더 (attachments/{task_id}/)
├── 계약서.pdf          (원본)
├── 계약서.pdf.txt      (추출 텍스트, 자동 생성)
├── 매출보고서.hwp      (원본)
├── 매출보고서.hwp.txt  (추출 텍스트, 자동 생성)
├── 회의록.md           (원본, 추출 불필요)
└── 메모.txt            (원본, 추출 불필요)
```

### 지원 형식

| 형식 | 추출 방법 | 비고 |
|------|-----------|------|
| PDF | pdfplumber | 텍스트 + 테이블 추출 |
| HWP | LibreOffice CLI | 구형/신형 모두 지원 |
| HWPX | LibreOffice CLI | 최신 한글 형식 |
| DOC/DOCX | LibreOffice CLI | MS Word |
| TXT | 직접 읽기 | 추출 불필요 |
| MD | 직접 읽기 | 추출 불필요 |

---

## 체크리스트

- [x] pdfplumber 의존성 추가 (pyproject.toml)
- [x] Dockerfile에 LibreOffice 설치 추가
- [x] GET /text 엔드포인트 구현
- [x] PDF 텍스트 추출 함수 (pdfplumber)
- [x] HWP/HWPX/DOC/DOCX 텍스트 추출 함수 (LibreOffice CLI)
- [x] TXT/MD 직접 읽기 함수
- [x] 추출 결과 `.txt` 파일 저장
- [x] `?force=true` 재추출 파라미터
- [x] 지원 형식 검사 및 에러 처리
- [ ] n8n 연동 테스트 (별도 진행)

---

## Notes

### PRD (Product Requirements Document)

#### 프로젝트 컨텍스트
| 항목 | 값 |
|------|-----|
| Framework | FastAPI |
| Python | 3.11+ |
| 용도 | n8n → LLM B Score 계산 시 증거자료 |
| 의존성 | tsk-18 (첨부파일 API) |
| 추가 설치 | LibreOffice (Docker) |

#### API 엔드포인트
```
GET /api/tasks/{task_id}/attachments/{filename}/text
```

**Query Parameters**:
- `force: bool` - true면 기존 .txt 무시하고 재추출 (기본값: false)
- `max_chars: int` - 최대 문자 수 (LLM 토큰 절약, 선택)

#### 동작 흐름
```
1. {filename}.txt 존재 확인
   ├─ 있고 force=false → .txt 내용 반환
   └─ 없거나 force=true → 추출 실행
2. 파일 형식에 따라 추출
   ├─ PDF → pdfplumber
   ├─ HWP/HWPX/DOC/DOCX → LibreOffice CLI
   └─ TXT/MD → 직접 읽기
3. 추출 결과를 {filename}.txt로 저장
4. 텍스트 반환
```

#### 지원 형식
| 형식 | 추출 방법 | 비고 |
|------|-----------|------|
| PDF | pdfplumber | 텍스트 + 테이블 |
| HWP | LibreOffice CLI | 구형 한글 |
| HWPX | LibreOffice CLI | 신형 한글 |
| DOC/DOCX | LibreOffice CLI | MS Word |
| TXT | 직접 읽기 | UTF-8 |
| MD | 직접 읽기 | UTF-8 |

#### Response 모델
```python
class TextExtractionResponse(BaseModel):
    success: bool
    task_id: str
    filename: str
    format: str           # pdf|hwp|hwpx|doc|docx|txt|md
    text: str
    chars: int
    cached: bool          # .txt 파일에서 읽었는지
    cache_path: str       # 저장된 .txt 경로
    truncated: bool       # max_chars로 잘렸는지
    error: Optional[str]
```

---

### Tech Spec

#### 파일 구조
```
public/api/
├── routers/tasks.py           # 엔드포인트 추가
├── services/
│   └── text_extractor.py      # 신규 서비스
├── models/entities.py         # Response 모델 추가
└── pyproject.toml             # 의존성 추가

docker/
└── Dockerfile                 # LibreOffice 설치 추가
```

#### TextExtractor 클래스
```python
class TextExtractor:
    SUPPORTED_FORMATS = {'.pdf', '.hwp', '.hwpx', '.doc', '.docx', '.txt', '.md'}
    LIBREOFFICE_FORMATS = {'.hwp', '.hwpx', '.doc', '.docx'}

    def extract(self, file_path: Path, force: bool = False) -> TextExtractionResult:
        """
        1. .txt 캐시 확인 (force=False일 때)
        2. 형식별 추출 실행
        3. .txt로 저장
        4. 결과 반환
        """

    def _get_cache_path(self, file_path: Path) -> Path:
        return file_path.with_suffix(file_path.suffix + '.txt')

    def _extract_pdf(self, path: Path) -> str:
        # pdfplumber 사용
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            return '\n'.join(page.extract_text() or '' for page in pdf.pages)

    def _extract_with_libreoffice(self, path: Path) -> str:
        # soffice --headless --convert-to txt
        import subprocess
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            subprocess.run([
                'soffice', '--headless', '--convert-to', 'txt:Text',
                '--outdir', tmpdir, str(path)
            ], check=True)
            txt_path = Path(tmpdir) / (path.stem + '.txt')
            return txt_path.read_text(encoding='utf-8')

    def _extract_text_file(self, path: Path) -> str:
        return path.read_text(encoding='utf-8')
```

#### Dockerfile 수정
```dockerfile
# 기존 이미지
FROM python:3.11-slim

# LibreOffice 설치 추가
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-calc \
    && rm -rf /var/lib/apt/lists/*
```

#### 의존성 추가 (pyproject.toml)
```toml
[project.optional-dependencies]
api = [
    # 기존...
    "pdfplumber>=0.10.0",
]
```

#### n8n 연동 흐름
```
1. GET /api/tasks/{id} → 첨부파일 목록
2. GET /api/tasks/{id}/attachments/{file}/text → 텍스트 (자동 캐싱)
3. LLM에 텍스트 전달 → B Score 분석
4. 다음 호출 시 .txt 캐시에서 즉시 반환
```

---

### Todo
- [ ] `pdfplumber` 의존성 추가 (pyproject.toml)
- [ ] Dockerfile에 LibreOffice 설치 추가
- [ ] `TextExtractionResponse` 모델 추가 (entities.py)
- [ ] `services/text_extractor.py` 생성
- [ ] `_extract_pdf()` 구현 (pdfplumber)
- [ ] `_extract_with_libreoffice()` 구현 (subprocess)
- [ ] `_extract_text_file()` 구현
- [ ] `.txt` 캐시 저장/읽기 로직
- [ ] `tasks.py`에 `/text` 엔드포인트 추가
- [ ] `force` 파라미터 처리
- [ ] `max_chars` 파라미터 처리
- [ ] 에러 핸들링 (404, 415, 500)
- [ ] Docker 이미지 리빌드 테스트
- [ ] n8n 워크플로우 테스트

### 작업 로그

#### 2026-01-03 구현 완료
**개요**: 첨부파일 텍스트 추출 API 완전 구현 및 배포

**구현 내용**:
1. **의존성 추가**
   - `pyproject.toml`: pdfplumber >= 0.10.0 추가
   - `Dockerfile`: LibreOffice (libreoffice-writer, libreoffice-calc) 설치

2. **Response 모델 생성** (`api/models/entities.py:257-269`)
   - `TextExtractionResponse`: success, task_id, filename, format, text, chars, cached, cache_path, truncated, error 필드

3. **TextExtractor 서비스 생성** (`api/services/text_extractor.py`)
   - `TextExtractor` 클래스: PDF/HWP/HWPX/DOC/DOCX/TXT/MD 지원
   - `_extract_pdf()`: pdfplumber 사용
   - `_extract_with_libreoffice()`: soffice --headless CLI
   - `_extract_text_file()`: 직접 읽기 (UTF-8 fallback)
   - `.txt` 캐시 저장/읽기 로직

4. **API 엔드포인트 추가** (`api/routers/attachments.py`)
   - `GET /api/tasks/{task_id}/attachments/{filename}/text`
   - `force` 파라미터: 캐시 무시 재추출
   - `max_chars` 파라미터: LLM 토큰 절약

**Codex 코드 리뷰 피드백 반영** (5개 이슈):
1. **Race condition 방지**: 원자적 캐시 쓰기 (`tempfile.mkstemp` + `os.replace`)
2. **Stale 캐시 방지**: mtime 검증 (`_is_cache_valid()`)
3. **인코딩 fallback**: UTF-8 → CP949 → errors="replace"
4. **타임아웃 처리**: LibreOffice 60초 타임아웃, `TimeoutError` 예외, 504 반환
5. **보안**: 서버 절대 경로 노출 방지 (VAULT_DIR 상대 경로만 반환)

**배포**:
- Docker 이미지 리빌드 (~689MB LibreOffice 추가)
- NAS 서버 재시작 완료
- Health check 통과
- OpenAPI 스키마에 엔드포인트 등록 확인

**최종 상태**: done


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-18]] - 첨부파일 API (의존)
- [pdfplumber](https://github.com/jsvine/pdfplumber)
- [olefile](https://olefile.readthedocs.io/)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
