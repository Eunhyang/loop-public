---
entity_type: EntryPoint
entity_id: meta:entry
entity_name: LOOP Vault LLM Entry Point
created: 2025-12-18
updated: 2025-12-18
version: "3.2"
tags: ["meta", "entry", "llm"]
---

# LOOP Vault LLM Entry Point

> LLM이 이 Vault를 탐색하기 위한 진입점

---

## 이 Vault는 무엇인가?

**Inner Loop OS (ILOS)** 스타트업의 전략, 프로젝트, 가설 검증을 관리하는 Obsidian Vault입니다.

**핵심 도메인**: 인간의 정서-섭식-습관-보상-신경계 루프를 다루는 행동 OS

---

## 계층 구조 (읽는 순서)

```
1. NorthStar (ns:001)           → 01_North_Star/
   └─ 10년 비전: Human Inner Loop OS 글로벌 표준

2. MetaHypothesis (mh:1-4)      → 01_North_Star/
   └─ 깨지면 회사 재검토하는 핵심 가설

3. Condition (cond:a-e)         → 20_Strategy/3Y_Conditions/
   └─ 3년 내 충족해야 하는 조건

4. Track (trk:1-6)              → 20_Strategy/12M_Tracks/
   └─ 12개월 실행 방향

5. Project (prj:001-999)        → 50_Projects/{year}/
   └─ 실험 단위

6. Task (tsk:001-01)            → 50_Projects/{year}/prj-*/Tasks/
   └─ 실행 단위

7. Hypothesis (hyp:001-999)     → 60_Hypotheses/
   └─ 검증할 가설

8. Experiment (exp:001-999)     → 70_Experiments/
   └─ 검증 실험
```

---

## 핵심 문서 바로가기

| 문서 | 경로 | 설명 |
|------|------|------|
| 10년 비전 | `01_North_Star/10년 비전.md` | 절대 불변 좌표 |
| MH3 | `01_North_Star/MH3_데이터_모델링_가능.md` | 온톨로지가 검증하는 핵심 가설 |
| Condition B | `20_Strategy/3Y_Conditions/Condition_B_Loop_Dataset.md` | 재현 패턴 10개 조건 |
| Track 2 | `20_Strategy/12M_Tracks/Track_2_Data.md` | 데이터/온톨로지 트랙 |
| Track 6 | `20_Strategy/12M_Tracks/Track_6_Revenue.md` | 매출/런웨이 트랙 |

---

## 스키마 정보

| 파일 | 경로 | 설명 |
|------|------|------|
| Schema Registry | `00_Meta/schema_registry.md` | 모든 엔티티 스키마 정의 |
| Relation Types | `00_Meta/relation_types.md` | 관계 타입 정의 |
| Build Config | `00_Meta/build_config.md` | 자동화 설정 |
| Graph Index | `_Graph_Index.md` | 전체 그래프 (자동 생성) |

---

## ID 형식

모든 ID는 `{type}:{number}` 형식:

| Type | Pattern | Example |
|------|---------|---------|
| NorthStar | `ns:001` | ns:001 |
| MetaHypothesis | `mh:1` | mh:3 |
| Condition | `cond:a` | cond:b |
| Track | `trk:1` | trk:2 |
| Project | `prj:001` | prj:001 |
| Task | `tsk:001-01` | tsk:001-03 |
| Hypothesis | `hyp:001` | hyp:001 |
| Experiment | `exp:001` | exp:007 |

---

## 자주 묻는 질문 (LLM용)

### "이 회사의 10년 목표는?"
→ `01_North_Star/10년 비전.md` 참조
→ Inner Loop OS 글로벌 표준

### "회사를 접어야 하는 조건은?"
→ `01_North_Star/MH*.md` 참조
→ MH1-4 중 하나라도 거짓이면 회사 재검토

### "Condition B가 깨지면?"
→ `20_Strategy/3Y_Conditions/Condition_B_Loop_Dataset.md` 참조
→ 데이터 전략 폐기

### "온톨로지는 왜 만드나?"
→ `30_Ontology/_Strategy_Link.md` 참조
→ MH3 검증 + Condition B enable

### "현재 진행 중인 프로젝트는?"
→ `50_Projects/{year}/` 폴더 탐색
→ status: active인 프로젝트 필터링

### "Track 2와 Track 4의 관계는?"
→ `20_Strategy/12M_Tracks/Track_2_Data.md` 참조
→ Track 2는 Track 4에 의존 (코칭 데이터 필요)

---

## 탐색 패턴

### 특정 엔티티 찾기
```
1. entity_id로 검색: "prj:001"
2. entity_name으로 검색: "Ontology"
3. 폴더 경로로 탐색: 50_Projects/2024/
```

### 관계 추적하기
```
1. validates: 이 엔티티가 검증하는 가설
2. validated_by: 이 엔티티를 검증하는 엔티티
3. outgoing_relations: 이 엔티티에서 나가는 관계
4. parent_id: 상위 엔티티
```

### 상태 필터링
```
status: planning | active | blocked | done | failed | learning
```

---

## 주의사항

1. **수동 관리 금지**: `children_ids`, `incoming_relations`는 빌드 시 자동 파생
2. **ID 형식 준수**: 모든 ID는 `{type}:{number}` 형식
3. **이모지 금지**: YAML frontmatter에 이모지 사용 금지
4. **대칭 링크**: `validates`와 `validated_by`는 대칭 유지

---

## 변경 이력

| Version | Date | Changes |
|---------|------|---------|
| 3.2 | 2025-12-18 | Codex 검증 완료, 관계 분리, 대칭 형식 |
| 3.1 | 2025-12-18 | 12개 이슈 수정 |
| 3.0 | 2025-12-18 | 초기 LLM 최적화 구조 |

---

**Last Updated**: 2025-12-18
**Schema Version**: 3.2
**Validated by**: Codex (gpt-5-codex, high reasoning)
