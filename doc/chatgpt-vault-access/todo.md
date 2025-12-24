# ChatGPT Vault Access - TODO

## 진행중

- [ ] **API-001** 파일 읽기 엔드포인트 추가
  - 파일: `api/routers/files.py` (신규)
  - 기능: GET /api/files/{path}, GET /api/files/?path=

- [ ] **API-002** 검색 엔드포인트 추가
  - 파일: `api/routers/search.py` (신규)
  - 기능: GET /api/search?q=...&limit=20

- [ ] **API-003** main.py에 router 등록
  - 파일: `api/main.py`
  - 작업: files, search router import 및 등록

---

## 인프라

- [ ] **INFRA-001** Tailscale 설치
  - 명령: `brew install tailscale`
  - 로그인: `tailscale login`

- [ ] **INFRA-002** Tailscale Funnel 활성화
  - 명령: `tailscale funnel 8081`
  - 결과: HTTPS URL 획득

---

## ChatGPT 연동

- [ ] **GPT-001** OpenAPI 스펙 추출
  - 명령: `curl https://xxx.ts.net/openapi.json > openapi.json`

- [ ] **GPT-002** Custom GPT 생성
  - URL: https://chat.openai.com/gpts/editor
  - Name: LOOP Vault Assistant
  - Actions: OpenAPI 스펙 붙여넣기
  - Auth: API Key (x-api-token)

- [ ] **GPT-003** 연동 테스트
  - "LOOP vault의 _Graph_Index.md 읽어줘"
  - "현재 진행 중인 Tasks 목록 보여줘"
  - "ontology 검색해서 관련 파일 찾아줘"

---

## 완료

(없음)

---

**Created**: 2025-12-25
**Last Updated**: 2025-12-25
