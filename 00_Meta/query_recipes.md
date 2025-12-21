---
entity_type: QueryRecipes
entity_id: meta:recipes
entity_name: LLM Query Recipes
created: 2025-12-19
updated: 2025-12-19
purpose: LLM이 특정 질문에 답할 때 읽어야 할 파일 순서
tags: ["meta", "llm", "query", "recipes"]
---

# Query Recipes

> LLM이 특정 질문에 답할 때 읽어야 할 파일 순서
> 목표: 모든 전략적 질문을 2-3 파일 읽기로 해결

---

## 전략 관련 쿼리

### Q1: "3년 전략 전부 요약"

**Reading Order**:
1. `_ENTRY_POINT.md` - 전체 구조 파악
2. `20_Strategy/3Y_Conditions_2026-2028/_INDEX.md` - 모든 Condition 목록
3. 각 `Condition_*.md` 파일 (현재 cond:b만 존재)
4. `_Graph_Index.md` - conditions_3y로 연결된 Project/Task 확인

**Expected Reads**: 3-5

---

### Q2: "Condition B 관련 모든 작업"

**Reading Order**:
1. `20_Strategy/3Y_Conditions_2026-2028/Condition_B_Loop_Dataset.md` - 조건 정의
2. `_Graph_Index.md` - Parent-Child 관계에서 `cond:b → trk:2/4 → prj:* → tsk:*`
3. (Optional) 개별 Task 파일

**Expected Reads**: 2-3

---

### Q3: "MH3가 깨지면 어떻게 되나?"

**Reading Order**:
1. `01_North_Star/MH3_데이터_모델링_가능.md` - `if_broken` 필드 확인

**Expected Reads**: 1

**Answer Location**: frontmatter의 `if_broken` 필드

---

### Q4: "Track 2의 진행 상황"

**Reading Order**:
1. `20_Strategy/12M_Tracks/2026/Track_2_Data.md` - Track 정의 및 metrics
2. `_Graph_Index.md` - `trk:2`의 하위 Project/Task 상태

**Expected Reads**: 2

---

## 실행 관련 쿼리

### Q5: "현재 진행중인 프로젝트"

**Reading Order**:
1. `_Graph_Index.md` - Project 테이블에서 `status: active` 필터

**Expected Reads**: 1

---

### Q6: "담당자별 작업 현황"

**Reading Order**:
1. `_Graph_Index.md` - Task 테이블 전체 스캔
2. (Optional) `00_Meta/members.yaml` - 멤버 정보

**Expected Reads**: 1-2

---

### Q7: "prj:002의 모든 Task"

**Reading Order**:
1. `_Graph_Index.md` - Task 테이블에서 `parent_id: prj:002` 필터
2. (Optional) `50_Projects/2025/P002_*/Project_정의.md` - 프로젝트 상세

**Expected Reads**: 1-2

---

### Q8: "이번 주 마감 작업"

**Reading Order**:
1. `_Graph_Index.md` - Task 테이블에서 `due` 필드 필터

**Expected Reads**: 1

**Note**: 현재 대부분의 Task에 due 필드가 null임

---

## 온톨로지 관련 쿼리

### Q9: "Ontology v0.1 스펙"

**Reading Order**:
1. `30_Ontology/Schema/v0.1/Ontology-lite v0.1.md` - 5 Core Entities + 4 Rules

**Expected Reads**: 1

---

### Q10: "온톨로지와 전략의 관계"

**Reading Order**:
1. `30_Ontology/_Strategy_Link.md` - 온톨로지가 검증/활성화하는 전략 요소
2. `01_North_Star/MH3_데이터_모델링_가능.md` - MH3 검증

**Expected Reads**: 2

---

## 메타 쿼리

### Q11: "이 볼트의 구조"

**Reading Order**:
1. `_ENTRY_POINT.md` - LLM 부트 프로토콜
2. `CLAUDE.md` - 상세 작업 지침 (선택)

**Expected Reads**: 1-2

---

### Q12: "엔티티 생성 방법"

**Reading Order**:
1. `00_Meta/_TEMPLATES/` - 해당 엔티티 타입 템플릿
2. `00_Meta/schema_registry.md` - 필수/선택 필드 정의

**Expected Reads**: 2

---

## 쿼리 효율성 요약

| Query Type | Avg Reads | Key File |
|------------|-----------|----------|
| 전략 전체 | 3-5 | `_INDEX.md` files |
| 특정 Condition | 2-3 | `Condition_*.md` + `_Graph_Index.md` |
| 특정 엔티티 | 1 | `_Graph_Index.md` |
| 관계 추적 | 2 | `_Graph_Index.md` → 개별 파일 |
| 상태 필터 | 1 | `_Graph_Index.md` |

---

## 최적화 팁

1. **항상 `_Graph_Index.md`부터**: 대부분의 쿼리는 여기서 해결됨
2. **`conditions_3y` 활용**: Condition 관련 쿼리는 이 필드로 필터링
3. **`if_broken` 확인**: 전략적 의사결정은 이 필드에 답이 있음
4. **`_INDEX.md` 파일**: 특정 영역의 전체 목록이 필요할 때

---

**Last Updated**: 2025-12-19
**Purpose**: LLM query optimization guide
