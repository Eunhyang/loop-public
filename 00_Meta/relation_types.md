---
entity_type: RelationTypeRegistry
entity_id: meta:relations
entity_name: LOOP Vault Relation Types v3.2
created: 2025-12-18
updated: 2025-12-18
version: "3.2"
tags: ["meta", "relations", "ontology"]
---

# LOOP Vault Relation Types v3.2

> 엔티티 간 관계 타입 정의 (GraphRAG 최적화)

---

## 1. 관계 배열 구조

### outgoing_relations (수동 관리)
```yaml
outgoing_relations:
  - type: string              # 관계 타입 (아래 정의)
    target_id: string         # 대상 엔티티 ID
    description: string       # 선택: 관계 설명
```

### incoming_relations (자동 파생)
- **수동 관리 금지**
- 빌드 스크립트가 모든 파일의 outgoing_relations를 스캔하여 자동 생성
- `_Graph_Index.md`에 반영

---

## 2. 계층 관계 (Hierarchy)

### parent_of / child_of
- **방향**: 상위 → 하위
- **의미**: 계층 구조상 포함 관계
- **용도**: Track → Project, Project → Task

```yaml
# Project 파일에서
parent_id: "trk-2"            # parent_of는 parent_id로 표현
```

| From | To | Cardinality |
|------|-----|-------------|
| NorthStar | MetaHypothesis | 1:N |
| MetaHypothesis | Condition | 1:N |
| Condition | Track | 1:N |
| Track | Project | 1:N |
| Project | Task | 1:N |

---

## 3. 전략 관계 (Strategy)

### validates
- **방향**: 검증자 → 가설
- **의미**: 이 엔티티가 특정 가설을 검증함
- **용도**: Project → Hypothesis, Experiment → Hypothesis

```yaml
validates: ["hyp-001", "hyp-002"]
```

### validated_by (역방향)
- **방향**: 가설 → 검증자
- **의미**: 이 가설이 특정 엔티티에 의해 검증됨
- **참고**: `validates`의 역방향, 대칭 형식 사용

```yaml
validated_by: ["prj-001", "exp-003"]
```

### enables
- **방향**: 선행 조건 → 후속 조건
- **의미**: 성공 시 대상을 unlock

```yaml
outgoing_relations:
  - type: enables
    target_id: "cond-b"
    description: "스키마 안정화 → 재현 패턴 가능"
```

### blocks
- **방향**: 차단자 → 피차단자
- **의미**: 완료 전까지 대상 진행 불가

```yaml
outgoing_relations:
  - type: blocks
    target_id: "prj-002"
    description: "온톨로지 완료 전 CoachOS 시작 불가"
```

### depends_on
- **방향**: 의존자 → 의존 대상
- **의미**: 대상에 의존 (blocks의 역방향)

```yaml
outgoing_relations:
  - type: depends_on
    target_id: "trk-4"
    description: "코칭 데이터 필요"
```

### supports
- **방향**: 지원자 → 수혜자
- **의미**: 대상을 지원 (비차단, 정보성)

```yaml
outgoing_relations:
  - type: supports
    target_id: "trk-5"
    description: "의료 파트너십 근거 제공"
```

### triggers_shutdown
- **방향**: 조건 → 대응 액션
- **의미**: 실패 시 특정 액션 트리거

```yaml
outgoing_relations:
  - type: triggers_shutdown
    target_id: "action:data_strategy_shutdown"
    description: "Condition B 실패 시 데이터 전략 폐기"
```

---

## 4. 온톨로지 관계 (Ontology Domain)

### contains
- **방향**: 컨테이너 → 내용물
- **의미**: 구성 요소 포함

```yaml
outgoing_relations:
  - type: contains
    target_id: "entity:event"
```

### precedes
- **방향**: 선행 → 후행
- **의미**: 시간적 선후 관계

### triggers
- **방향**: 원인 → 결과
- **의미**: 인과 관계

### evaluates
- **방향**: 평가자 → 평가 대상
- **의미**: 결과 측정 관계

---

## 5. 관계 타입 요약표

| Type | Direction | Meaning | Use Case |
|------|-----------|---------|----------|
| `validates` | 검증자→가설 | 가설 검증 | Project→Hypothesis |
| `validated_by` | 가설→검증자 | 검증받음 | Hypothesis→Project |
| `enables` | 선행→후행 | 성공 시 unlock | Condition→Condition |
| `blocks` | 차단자→피차단자 | 완료 전 진행 불가 | Project→Project |
| `depends_on` | 의존자→대상 | 의존 관계 | Track→Track |
| `supports` | 지원자→수혜자 | 비차단 지원 | Track→Track |
| `triggers_shutdown` | 조건→액션 | 실패 시 트리거 | Condition→Action |
| `contains` | 컨테이너→내용물 | 포함 | Entity→Entity |
| `precedes` | 선행→후행 | 시간 순서 | Event→Event |
| `triggers` | 원인→결과 | 인과 | Event→Action |

---

## 6. GraphRAG 호환성 규칙

### YAML 형식 규칙
1. **순수 문자열만**: 이모지, 특수문자 금지
2. **배열은 문자열 배열**: `["hyp-001"]` (객체 배열 금지)
3. **ID 형식 일관성**: 모든 ID는 `{type}:{number}` 형식

### 관계 파싱 규칙
1. `outgoing_relations`만 파싱 (incoming은 자동 파생)
2. `validates`, `validated_by`는 별도 필드로 파싱
3. `parent_id`에서 계층 관계 파생

---

## 7. 관계 자동 파생 규칙

빌드 스크립트가 수행:

```python
# 1. 모든 parent_id에서 children_ids 파생
for file in all_files:
    parent = file.parent_id
    if parent:
        parent_file.children_ids.append(file.entity_id)

# 2. 모든 outgoing_relations에서 incoming_relations 파생
for file in all_files:
    for rel in file.outgoing_relations:
        target_file = find_file(rel.target_id)
        target_file.incoming_relations.append({
            "type": rel.type,
            "source_id": file.entity_id
        })

# 3. validates/validated_by 대칭 검증
for file in all_files:
    for hyp_id in file.validates:
        hyp_file = find_file(hyp_id)
        if file.entity_id not in hyp_file.validated_by:
            warn(f"Asymmetric link: {file.entity_id} validates {hyp_id}")
```

---

## 참고 문서

- [[schema_registry]] - 스키마 정의
- [[build_config]] - 자동화 설정
- [[_Graph_Index]] - 그래프 인덱스

---

**Version**: 3.2
**Last Updated**: 2025-12-18
