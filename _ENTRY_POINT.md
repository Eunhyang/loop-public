---
entity_type: EntryPoint
entity_id: meta:entry
entity_name: LOOP Vault LLM Entry Point
created: 2025-12-18
updated: 2025-12-19
version: "4.0"
purpose: LLM boot protocol for optimal vault navigation
tags: ["meta", "entry", "llm", "boot-protocol"]
---

# LOOP Vault LLM Entry Point

> LLM이 이 볼트를 탐색할 때 **가장 먼저** 읽어야 하는 파일
> 목표: 모든 전략적 질문을 **2-3 파일 읽기**로 해결

---

## 1. Vault Goal

**Inner Loop OS 스타트업의 전략-실행 추적 시스템**

- **Vision**: Human Inner Loop OS를 글로벌 표준으로
- **핵심 철학**: "가설을 빨리 죽여서 살아남는 것을 찾는 조직"
- **도메인**: 인간의 정서-섭식-습관-보상-신경계 루프를 다루는 행동 OS

---

## 2. Schema Routing (2-도메인 분기)

| Schema | 경로 | 엔티티 |
|--------|------|--------|
| **Product Ontology (ILOS)** | `30_Ontology/Schema/v0.1/` | Event, Episode, ActionExecution, OutcomeMeasurement |
| **Vault Document Schema** | `00_Meta/schema_registry.md` | Project, Task, Hypothesis, Experiment |

### 질문별 라우팅
- **Event/Episode/ActionExecution/specVersion** → `30_Ontology/`
- **Project/Task/frontmatter/relations** → `00_Meta/`
- **"온톨로지가 전략과 어떻게 연결?"** → `30_Ontology/_Strategy_Link.md`

---

## 3. Vault Entity Types & Locations

| Type | ID Pattern | Canonical Path | Count |
|------|------------|----------------|-------|
| NorthStar | `ns-001` | `01_North_Star/` | 1 |
| MetaHypothesis | `mh-1-4` | `01_North_Star/` | 1 |
| Condition | `cond-a-e` | `20_Strategy/3Y_Conditions_{period}/` | 1 |
| Track | `trk-1-6` | `20_Strategy/12M_Tracks/{year}/` | 6 |
| Project | `prj-001-999` | `50_Projects/{year}/P{N}_*/` | 14 |
| Task | `tsk-NNN-NN` | `50_Projects/{year}/P*/Tasks/` | 48+ |
| Hypothesis | `hyp-001-999` | `60_Hypotheses/` | - |
| Experiment | `exp-001-999` | `70_Experiments/` | - |

**총 엔티티**: 72개 (2025-12-19 기준)

---

## 4. Mandatory Link Rules

모든 실행 엔티티는 반드시 상위 전략과 연결되어야 함:

| Entity | Required Links |
|--------|----------------|
| Task | `parent_id` → Project |
| Project | `parent_id` → Track, `conditions_3y` → Condition(s) |
| Track | `parent_id` → Condition, `conditions_3y` → Condition(s) |

### `conditions_3y` 필드 (핵심)
- **형식**: `["cond-a", "cond-b"]` (최소 1개 필수, Project/Track만)
- **목적**: LLM이 "Condition X 관련 작업" 쿼리를 O(1)로 해결
- **예시**: Project가 `conditions_3y: ["cond-b"]`이면 Loop Dataset 관련 프로젝트

---

## 5. Global Map

전체 엔티티 관계 맵:

→ **[[_Graph_Index.md]]** - 자동 생성 그래프 인덱스

포함 정보:
- 타입별/상태별 엔티티 통계
- 모든 엔티티 목록 (ID, Name, Status, Path)
- Parent-Child 관계
- Critical 플래그 엔티티

---

## 6. Schema & Relations

스키마 정의 및 관계 타입:

| 문서 | 경로 | 설명 |
|------|------|------|
| Schema Registry | [[00_Meta/schema_registry.md]] | 엔티티 타입별 필수/선택 필드 |
| Relation Types | [[00_Meta/relation_types.md]] | 관계 타입 정의 |
| Build Config | [[00_Meta/build_config.md]] | 자동화 설정 |
| Members | [[00_Meta/members.yaml]] | 팀 멤버 목록 |

---

## 6. Query Recipes

자주 묻는 질문에 대한 최적 파일 읽기 순서:

→ **[[00_Meta/query_recipes.md]]** - 전체 쿼리 레시피

### Quick Reference

| Query | Files to Read | Expected Reads |
|-------|---------------|----------------|
| "3년 전략 전부" | `_ENTRY_POINT.md` → API `/api/mcp/folder-contents?path=20_Strategy/3Y_Conditions_2026-2028` | 2-3 |
| "Condition B 관련 작업" | `Condition_B_*.md` → `_Graph_Index.md` | 2-3 |
| "현재 진행중인 프로젝트" | `_Graph_Index.md` (status: active 필터) | 1 |
| "MH3 깨지면?" | `MH3_데이터_모델링_가능.md` (if_broken 필드) | 1 |
| "Track 2 진행 상황" | `Track_2_Data.md` → `_Graph_Index.md` | 2 |

---

## 7. Strategy Hierarchy

```
10년 Vision (North Star) ─ 불변
 └─ Meta Hypotheses (MH1-4) ─ 하나라도 깨지면 → 회사 재검토
     └─ 3년 Conditions (A-E) ─ 충족 시 언락 / 깨지면 → 명시적 pivot/shutdown
         └─ 12월 Tracks (1-6) ─ 투자 방향 가설
             └─ Projects ─ 실험 단위
                 └─ Tasks ─ 실행 단위
```

**핵심 원칙**:
- Vision은 고정, 전략은 조건부
- Metrics ≠ 목표, Metrics = 중단 신호
- 나쁜 결과 ≠ 실패, 나쁜 결과 = 가설 생성 기회

---

## 8. Key Documents

### Strategic (전략)
| 문서 | ID | 설명 |
|------|-----|------|
| [[01_North_Star/10년 비전.md]] | `ns-001` | 불변 좌표 |
| [[01_North_Star/MH3_데이터_모델링_가능.md]] | `mh-3` | Ontology가 검증 |
| [[20_Strategy/3Y_Conditions_2026-2028/Condition_B_Loop_Dataset.md]] | `cond-b` | 재현 패턴 10개 조건 |

### Index API (인덱스)
| API 엔드포인트 | 설명 |
|------|------|
| `/api/mcp/folder-contents?path=20_Strategy/3Y_Conditions_2026-2028` | 모든 Conditions 목록 |
| `/api/mcp/folder-contents?path=50_Projects` | 모든 Projects 목록 |

### Meta (메타)
| 문서 | 설명 |
|------|------|
| [[CLAUDE.md]] | Claude Code 작업 지침 |
| [[_HOME.md]] | 인간용 네비게이션 허브 |

---

## 9. LLM Navigation Tips

### 특정 엔티티 찾기
```
1. entity_id로 검색: "prj-001"
2. entity_name으로 검색: "Ontology"
3. 폴더 경로로 탐색: 50_Projects/2024/
```

### 관계 추적하기
```
1. validates: 이 엔티티가 검증하는 가설
2. validated_by: 이 엔티티를 검증하는 엔티티
3. conditions_3y: 연결된 3년 Conditions
4. parent_id: 상위 엔티티
```

### 상태 필터링
```
status: planning | active | blocked | done | failed | learning
```

---

## 10. Rules & Warnings

1. **수동 관리 금지**: `children_ids`, `incoming_relations`는 빌드 시 자동 파생
2. **ID 형식 준수**: 모든 ID는 `{type}:{number}` 형식
3. **이모지 금지**: YAML frontmatter에 이모지 사용 금지
4. **대칭 링크**: `validates`와 `validated_by`는 대칭 유지
5. **conditions_3y 필수**: Project/Track은 최소 1개 Condition 연결 필수

---

## 변경 이력

| Version | Date | Changes |
|---------|------|---------|
| 4.0 | 2025-12-19 | LLM 부트 프로토콜로 업그레이드, 6개 필수 섹션 추가, Query Recipes 연결 |
| 3.2 | 2025-12-18 | Codex 검증 완료, 관계 분리, 대칭 형식 |
| 3.1 | 2025-12-18 | 12개 이슈 수정 |
| 3.0 | 2025-12-18 | 초기 LLM 최적화 구조 |

---

**Last Updated**: 2025-12-19
**Schema Version**: 4.0
**Purpose**: LLM-first navigation boot protocol
