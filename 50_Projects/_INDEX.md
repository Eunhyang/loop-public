---
entity_type: ProjectIndex
entity_id: index:projects
entity_name: Project Index
created: 2025-12-18
updated: 2025-12-18
tags: ["index", "projects"]
---

# Project Index

> 모든 프로젝트 목록 및 연도별 분류

---

## 폴더 구조

```
50_Projects/
├── _INDEX.md           # 이 파일
├── 2024/               # 2024년 프로젝트
├── 2025/               # 2025년 프로젝트
├── archive/            # 완료된 프로젝트
└── P3_Ontology_v0.1/   # 기존 프로젝트 (마이그레이션 대기)
```

---

## 프로젝트 목록

### Active Projects

| ID | Name | Track | Status | Year | Path |
|----|------|-------|--------|------|------|
| prj:001 | Ontology v0.1 | Track 2 | active | 2024 | `P3_Ontology_v0.1/` |

### By Track

#### Track 1 (Product)
- (예정)

#### Track 2 (Data)
- [[P3_Ontology_v0.1]] - Ontology v0.1 (active)

#### Track 3 (Content)
- (예정)

#### Track 4 (Coaching)
- (예정)

#### Track 5 (Partnership)
- (예정)

#### Track 6 (Revenue)
- (예정)

---

## 새 프로젝트 생성

1. 템플릿 복사: `00_Meta/_TEMPLATES/template_project.md`
2. 연도 폴더에 배치: `50_Projects/{year}/prj-{number}_{name}/`
3. `_PROJECT.md`로 이름 변경
4. `Tasks/` 폴더 생성

---

## 마이그레이션 상태

| 기존 폴더 | 새 ID | Status |
|----------|-------|--------|
| P3_Ontology_v0.1 | prj:001 | 마이그레이션 대기 |

---

**Last Updated**: 2025-12-18
