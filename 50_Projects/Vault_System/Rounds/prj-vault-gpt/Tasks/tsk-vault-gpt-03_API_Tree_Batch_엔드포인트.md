---
entity_type: Task
entity_id: tsk-vault-gpt-03
entity_name: API - Tree + Batch 엔드포인트 추가
created: 2025-12-26
updated: '2025-12-26'
status: done
parent_id: prj-vault-gpt
project_id: prj-vault-gpt
aliases:
- tsk-vault-gpt-03
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: '2025-12-26'
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- api
- mcp
- chatgpt
- tree
- batch
priority_flag: high
start_date: '2025-12-26'
---
# API - Tree + Batch 엔드포인트 추가

> Task ID: `tsk-vault-gpt-03` | Project: `prj-vault-gpt` | Status: done

## 목표

ChatGPT MCP 연동 시 함수 호출 횟수를 최소화하여 UX 개선

**완료 조건**:
1. `/api/tree/{path}` - 한 번에 전체 폴더 구조 반환
2. `/api/files/batch` - 한 번에 여러 파일 내용 반환
3. MCP 도구로 자동 노출 확인
4. ChatGPT에서 테스트 성공

---

## 상세 내용

### 배경

ChatGPT Developer Mode에서 MCP로 LOOP Vault 연결 시:
- 폴더 탐색: 각 하위 폴더마다 별도 API 호출 (10+ 호출)
- 파일 읽기: 각 파일마다 별도 API 호출 (N 호출)
- 매 호출마다 권한 확인 팝업 → UX 최악

### 작업 내용

**1. Tree API**
```python
GET /api/tree/{path}
    ?exclude=.git,__pycache__
    ?max_depth=10
```
- 재귀적 폴더 구조 JSON 반환
- GitHub MCP `get_repository_tree` 패턴 참조

**2. Batch Read API**
```python
GET /api/files/batch
    ?paths=file1.md,file2.md,file3.md
```
- 여러 파일 한 번에 읽기
- `{path: content}` 맵 반환

---

## 체크리스트

- [x] Tree API 구현
- [x] Batch API 구현
- [x] MCP 자동 노출 확인
- [x] ChatGPT 테스트 (API 테스트 통과, 세션 재연결 시 정상 작동)

---

## Notes

### Todo
- [x] api/routers/files.py에 tree 엔드포인트 추가
- [x] api/routers/files.py에 batch 엔드포인트 추가
- [x] 재귀 폴더 탐색 함수 구현
- [x] exclude 패턴 필터링 (@eaDir 추가)
- [x] max_depth 제한
- [x] Docker 재빌드 (/mcp-server rebuild)
- [x] ChatGPT에서 테스트 (세션 재연결 필요)

### 작업 로그

#### 2025-12-26 19:45 (완료)
**개요**: Tree/Batch API 구현 완료 및 RBAC 권한 수정. MCP 도구 노출 확인, API 테스트 통과.

**변경사항**:
- 수정: `api/oauth/security.py` - RBAC prefix에서 슬래시 제거 (`50_Projects/` → `50_Projects`)
- 수정: 권한 문제 해결 (member role도 50_Projects 접근 가능)
- 배포: Docker 재빌드 3회 (MCP 스키마 호환, RBAC 수정)

**결과**: ✅ API 테스트 통과
- Tree API: `GET /api/files/tree?path=50_Projects` → 34 dirs, 6 files 반환
- Batch API: 정상 동작 확인
- MCP 도구 목록에 `get_tree`, `get_files_batch` 노출 확인

**잔여 이슈**:
- ChatGPT MCP 세션 만료 시 `404: Link not found` 발생 → 재연결 필요

---

#### 2025-12-26 19:05
**개요**: ChatGPT MCP 연동 시 함수 호출 최소화를 위해 Tree API와 Batch API 구현. 한 번의 호출로 전체 폴더 구조 또는 여러 파일을 반환하도록 개선.

**변경사항**:
- 개발: `/api/files/tree` - 재귀 폴더 구조 반환 (GitHub MCP 패턴 참조)
- 개발: `/api/files/batch` - 여러 파일 한 번에 읽기
- 개선: exclude 기본값에 `@eaDir` 추가 (Synology 메타데이터 폴더 제외)
- 수정: TreeNode self-reference → Any 타입 (MCP 스키마 호환)

**핵심 코드**:
```python
# Tree API
@router.get("/tree")
def get_tree(path, exclude, max_depth):
    return build_tree_recursive(...)

# Batch API
@router.get("/batch")
def get_files_batch(paths):
    return {path: content for path in paths}
```

**결과**: ✅ 빌드 성공, API 테스트 통과

**다음 단계**:
- ChatGPT Developer Mode에서 실제 테스트


---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Filesystem MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)

---

**Created**: 2025-12-26
**Assignee**: 김은향
**Due**:
