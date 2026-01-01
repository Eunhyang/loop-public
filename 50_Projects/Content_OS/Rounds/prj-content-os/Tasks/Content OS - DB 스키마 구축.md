---
entity_type: Task
entity_id: "tsk-content-os-08"
entity_name: "Content OS - DB 스키마 구축"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-08"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: content-os
repo_path: apps/content-os

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["content-os", "database", "infrastructure"]
priority_flag: high
---

# Content OS - DB 스키마 구축

> Task ID: `tsk-content-os-08` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. 2-DB 구조 설계 및 스키마 정의
2. SQLite DB 파일 생성 및 테이블 구조 구현
3. FastAPI 연동 준비

---

## 상세 내용

### 배경

Content OS MVP의 UI가 완성되었으며, 실제 데이터를 저장하고 조회하기 위한 DB 구축이 필요합니다.
권한 경계를 반영하여 2개의 독립된 DB로 분리합니다.

### 작업 내용

1. **Vault DB 구축** (content-os.db)
2. **Exec KPI DB 구축** (kpi-exec.db)
3. **FastAPI 연동 코드**

---

## 체크리스트

- [ ] Vault DB 스키마 설계
- [ ] Exec KPI DB 스키마 설계
- [ ] SQLite 파일 생성
- [ ] FastAPI 모델 정의
- [ ] API 엔드포인트 연동

---

## Notes

### PRD (Product Requirements Document)

<!-- prompt-enhancer가 생성한 PRD가 여기에 추가됩니다 -->

### Todo
- [ ]

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->

---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[pgm-content-os]] - 소속 Program

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
