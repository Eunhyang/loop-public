---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-21"
entity_name: "Dashboard - 첨부파일 텍스트 추출 API"
created: 2026-01-02
updated: 2026-01-02
status: todo

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
tags: [dashboard, attachment, text-extraction, llm, b-score]
priority_flag: medium
---

# Dashboard - 첨부파일 텍스트 추출 API

> Task ID: `tsk-dashboard-ux-v1-21` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

첨부파일(PDF, HWP 등)에서 텍스트를 추출하여 LLM이 읽을 수 있도록 API 제공

**완료 조건**:
1. GET /api/tasks/{id}/attachments/{filename}/text - 텍스트 추출 반환
2. PDF 텍스트 추출 (PyPDF2 또는 pdfplumber)
3. HWP 텍스트 추출 (olefile 또는 hwp5)
4. n8n 워크플로우에서 호출 가능
5. B Score 계산 시 증거자료로 활용 가능

---

## 상세 내용

### 배경

- B Score (Realized Impact) 계산 시 첨부된 증거자료 분석 필요
- n8n 워크플로우에서 LLM에게 첨부파일 내용을 컨텍스트로 전달
- 파일 바이너리가 아닌 텍스트로 추출해야 LLM이 읽을 수 있음

### 작업 내용

1. 텍스트 추출 엔드포인트 추가 (`/text`)
2. PDF 추출: pdfplumber 라이브러리 사용
3. HWP 추출: olefile 또는 hwp5 라이브러리 사용
4. 지원하지 않는 형식은 에러 반환
5. 캐싱 고려 (동일 파일 재추출 방지)

### 지원 형식

| 형식 | 라이브러리 | 비고 |
|------|-----------|------|
| PDF | pdfplumber | 텍스트 + 테이블 추출 |
| HWP | olefile/hwp5 | 한글 문서 |
| TXT | 직접 읽기 | 인코딩 감지 |
| MD | 직접 읽기 | 마크다운 |

---

## 체크리스트

- [ ] pdfplumber 의존성 추가 (pyproject.toml)
- [ ] olefile/hwp5 의존성 추가
- [ ] GET /text 엔드포인트 구현
- [ ] PDF 텍스트 추출 함수
- [ ] HWP 텍스트 추출 함수
- [ ] 지원 형식 검사 및 에러 처리
- [ ] 추출 결과 캐싱 (선택)
- [ ] n8n 연동 테스트

---

## Notes

### PRD (Product Requirements Document)

#### 프로젝트 컨텍스트
| 항목 | 값 |
|------|-----|
| Framework | FastAPI |
| Python | 3.9+ |
| 용도 | n8n → LLM B Score 계산 시 증거자료 |
| 의존성 | tsk-18 (첨부파일 API) |

#### API 엔드포인트
```
GET /api/tasks/{task_id}/attachments/{filename}/text
```

**Query Parameters**:
- `max_chars: int` - 최대 문자 수 (LLM 토큰 절약)
- `page_start: int` - PDF 시작 페이지
- `page_end: int` - PDF 끝 페이지

#### 지원 형식
| 형식 | 라이브러리 | 비고 |
|------|-----------|------|
| PDF | pdfplumber | 텍스트 + 테이블 |
| HWP | olefile | OLE 스트림 파싱 |
| TXT | 직접 읽기 | UTF-8 |
| MD | 직접 읽기 | UTF-8 |

#### Response 모델
```python
class TextExtractionResponse(BaseModel):
    success: bool
    task_id: str
    filename: str
    format: str       # pdf|hwp|txt|md
    text: str
    chars: int
    pages: Optional[int]  # PDF only
    truncated: bool
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
```

#### TextExtractor 클래스
```python
class TextExtractor:
    SUPPORTED_FORMATS = {'.pdf', '.hwp', '.txt', '.md'}

    def extract(self, file_path: Path) -> TextExtractionResult
    def extract_pdf(self, path, page_start, page_end)  # pdfplumber
    def extract_hwp(self, path)                        # olefile
    def extract_text_file(self, path)                  # UTF-8
```

#### 의존성 추가 (pyproject.toml)
```toml
[project.optional-dependencies]
api = [
    # 기존...
    "pdfplumber>=0.10.0",
    "olefile>=0.46",
]
```

#### n8n 연동 흐름
```
1. GET /api/tasks/{id} → 첨부파일 목록
2. GET /api/tasks/{id}/attachments/{file}/text → 텍스트
3. LLM에 텍스트 전달 → B Score 분석
```

---

### Todo
- [ ] `pdfplumber`, `olefile` 의존성 추가
- [ ] `TextExtractionResponse` 모델 추가
- [ ] `services/text_extractor.py` 생성
- [ ] `extract_pdf()` 구현 (pdfplumber)
- [ ] `extract_hwp()` 구현 (olefile)
- [ ] `extract_text_file()` 구현
- [ ] `tasks.py`에 `/text` 엔드포인트 추가
- [ ] `max_chars` 파라미터 처리
- [ ] `page_start`/`page_end` 파라미터 처리
- [ ] 에러 핸들링 (404, 415, 500)
- [ ] n8n 워크플로우 테스트

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


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
