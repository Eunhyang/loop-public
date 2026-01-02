---
entity_type: Task
entity_id: "tsk-content-os-09"
entity_name: "Content OS - YouTube API Integration"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-09"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: null
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["content-os", "youtube-api", "api-integration", "video-explorer"]
priority_flag: high
---

# Content OS - YouTube API Integration

> Task ID: `tsk-content-os-09` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. YouTube Data API v3 연동으로 실시간 영상 검색 가능
2. 검색 결과가 기존 Video Explorer UI에 정상 표시
3. API 에러 핸들링 및 Rate Limiting 처리

---

## 상세 내용

### 배경

`tsk-content-os-07`에서 Video Explorer Live Search UI를 구현했으나, 현재 더미 데이터로만 동작한다. 실제 YouTube Data API를 연동하여 키워드 검색 시 실시간 영상 데이터를 가져오는 기능이 필요하다.

### 작업 내용

1. **YouTube Data API v3 설정**
   - API Key 또는 OAuth 설정
   - 환경변수로 API Key 관리

2. **검색 API 연동**
   - `/search` endpoint로 키워드 검색
   - 필터링 옵션 (업로드 날짜, 정렬 등)

3. **영상 상세 정보 가져오기**
   - `/videos` endpoint로 조회수, 좋아요 등 통계
   - duration (영상 길이) 정보

4. **채널 정보 가져오기**
   - `/channels` endpoint로 구독자 수

5. **API 응답 → Video 타입 매핑**
   - 기존 ProcessedVideo 타입에 맞게 변환
   - 점수 계산 (기여도, 성과도, 노출확률)

6. **Rate Limiting / 에러 핸들링**
   - API 할당량 관리
   - 에러 시 사용자 피드백

---

## 체크리스트

- [ ] YouTube Data API 키 설정
- [ ] 검색 API 연동 (/search)
- [ ] 영상 통계 API 연동 (/videos)
- [ ] 채널 구독자 API 연동 (/channels)
- [ ] API 응답 → Video 타입 매핑
- [ ] Rate Limiting 처리
- [ ] 에러 핸들링 및 UI 피드백

---

## Notes

### Todo
- [ ]
- [ ]
- [ ]

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-07]] - 선행 Task (Video Explorer Live Search)

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
