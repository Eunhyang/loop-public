# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

이 Obsidian vault는 **Inner Loop OS (ILOS)** 온톨로지 학습과 스키마 개발을 위한 지식 관리 공간입니다.

Inner Loop OS는 인간의 정서-섭식-습관-보상-신경계 루프를 하나의 시스템으로 다루는 행동 OS입니다. 이 vault는 ILOS의 데이터 모델, 온톨로지 스펙, 그리고 전략적 방향성을 정의하고 관리합니다.

**중요:** 이것은 Obsidian vault이므로 코드 실행이나 빌드 명령이 없습니다. 모든 작업은 마크다운 문서 작성과 관리에 집중됩니다.

## 핵심 아키텍처

### Inner Loop OS의 5대 루프
1. **Emotional Loop**: 스트레스, 불안, 공허감 등 감정 패턴
2. **Eating Loop**: 폭식, 야식, 보상 먹기 등 섭식 루프
3. **Habit Loop**: 환경/루틴 기반 자동 섭식 행동
4. **Reward/Dopamine Loop**: 갈망, 보상 회로, 쾌감 결핍
5. **Nervous System Loop**: 자율신경계(교감/부교감) 활성 패턴

### 온톨로지 계층 구조 (Ontology-lite v0.1)

현재 구현된 코어 엔티티 (4조건 규칙 기반):

**Core Entities:**
- `Event`: 원자적 사실 (meal, emotion_tag, urge, binge 등)
- `Episode (LoopInstance)`: 한 번의 루프 단위 컨테이너
- `LoopStateWindow`: 30-60분 단위 상태 벡터 윈도우
- `ActionExecution`: 개입 실행 트랜잭션 (코치/시스템/사용자)
- `OutcomeMeasurement`: ActionExecution 이후 윈도우 기반 결과 측정

**필수 공통 필드:**
```
id, userId, createdAt, updatedAt, source, specVersion
```

**4가지 확장 가능성 규칙:**
1. **Rule A - Type System 고정**: 5개 코어 타입 불변
2. **Rule B - ID & Reference 불변**: 모든 엔티티 불변 ID + Reference 구조
3. **Rule C - Action은 트랜잭션**: 실행 트랜잭션 + 전/후 윈도우 강제
4. **Rule D - specVersion 강제**: 데이터 해석 규칙 버전 관리

### Event-Action-Result 인과 구조
- **Event**: 인과 재료 (관찰 데이터)
- **ActionExecution**: 인과 스위치 (개입)
- **OutcomeMeasurement**: 인과 증거 (측정 결과)

## 폴더 구조

```
LOOP/
├── _HOME.md                    # 메인 네비게이션 허브
├── README.md                   # 프로젝트 소개
├── CLAUDE.md                   # 이 파일
│
├── 00_Inbox/                   # 임시 메모, 정리되지 않은 아이디어
│
├── 10_Study/                   # 온톨로지 학습 자료
│   ├── _MOC 온톨로지 학습.md  # 학습 로드맵 MOC
│   ├── 01_Foundations/         # 온톨로지 기초 개념
│   ├── 02_Languages/           # RDF, RDFS, OWL, SPARQL
│   ├── 03_Tools/               # Protégé 등 도구
│   ├── 04_Methodology/         # 온톨로지 설계 방법론
│   ├── 05_Case-Studies/        # 실제 온톨로지 사례 분석
│   └── 06_Exercises/           # 실습 및 연습 문제
│
├── 20_Ontology/                # ILOS 스키마 개발 (핵심)
│   ├── _MOC 온톨로지 개발.md  # 개발 현황 MOC
│   ├── Schema/                 # 버전별 스키마 스펙
│   │   └── v0.1/              # 현재 버전 (Ontology-lite v0.1)
│   ├── Entities/               # 엔티티 정의 (Event, Episode 등)
│   ├── Relations/              # 관계 정의 (contains, triggers 등)
│   └── Rules/                  # 제약조건 및 규칙
│
├── 30_Strategy/                # 전략 문서 (10년/3년/12개월)
│
├── 40_LOOP_OS/                 # Inner Loop OS 시스템 정의
│   ├── Inner Loop OS 정의v1.md
│   └── LOOP OS관련 문서.md
│
├── 50_Experiments/             # 실험 및 검증
│   └── Use-cases/
│
└── 90_Archive/                 # 아카이브된 문서
```

### 폴더별 용도

**00_Inbox**: 빠른 캡처 공간. 정기적으로 정리하여 적절한 폴더로 이동

**10_Study**: 온톨로지 이론 학습. 외부 자료 요약, 개념 정리, 실습

**20_Ontology**: ILOS 온톨로지 **실제 개발**. 가장 중요한 폴더. 버전 관리 엄격

**30_Strategy**: 비즈니스 전략, 로드맵, 시장 분석

**40_LOOP_OS**: ILOS 시스템 스펙 및 아키텍처 문서

**50_Experiments**: 유즈케이스, 데이터 검증, 실험 결과

## 핵심 문서

**네비게이션:**
- `_HOME.md` - 메인 허브
- `10_Study/_MOC 온톨로지 학습.md` - 학습 로드맵
- `20_Ontology/_MOC 온톨로지 개발.md` - 개발 허브

**스키마:**
- `20_Ontology/Schema/v0.1/Ontology-lite v0.1 (ILOS) — 규칙(4조건) + 최소 엔티티 스펙.md` - 현재 스키마 (v0.1)

**LOOP OS 정의:**
- `40_LOOP_OS/Inner Loop OS 정의v1.md` - ILOS 전체 시스템 스펙

**전략:**
- `30_Strategy/10-year direction 정리(헬스케어 섭식 도메인 레이어의 성공선).md`
- `30_Strategy/(LV1 Strategic Hypotheses) 3-year strategy (조건 기반) 정리.md`
- `30_Strategy/12-month 실행 계획(숫자 기반) 정리.md`

## 실제 데이터 소스

LOOP OS의 **실제 구현체 및 데이터**는 다음 프로젝트에서 확인할 수 있습니다:

### 프로젝트 경로

1. **SoSi (Flutter App)**
   - 경로: `/Users/gim-eunhyang/dev/flutter/sosi`
   - 역할: 모바일 앱 (사용자 대면 인터페이스)
   - 데이터:
     - Firestore 다이어리 데이터 구조
     - Event/Episode 실제 기록 로직
     - 사용자 입력 UI/UX
   - **메타정보**: `/Users/gim-eunhyang/dev/flutter/sosi/docs/`

2. **KkokKkokFit Web**
   - 경로: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web`
   - 역할: 웹 기반 코칭 인터페이스
   - 데이터:
     - RDB 코칭 세션 데이터
     - ActionExecution/Outcome 구현
     - 코치 대시보드 로직
   - **메타정보**: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web/docs/`

### 참조 시점

다음 작업 시 **반드시 위 프로젝트 코드를 참조**하세요:

- ✅ 엔티티 필드 설계 검증 (실제 사용 중인 필드 확인)
- ✅ Event/Episode 구조 분석 (실제 저장 방식)
- ✅ ActionExecution 트랜잭션 구현 확인
- ✅ Firestore/RDB 스키마 매핑
- ✅ 데이터 예시 작성 시 실제 데이터 기반
- ✅ API 엔드포인트 구조 파악
- ✅ 온톨로지와 실제 구현 간 갭 분석

### 주의사항

- 온톨로지는 **이상적 설계**, 실제 코드는 **현실 구현**
- 갭이 있을 경우 온톨로지를 조정하거나 마이그레이션 계획 수립
- 실제 데이터 구조를 이해한 후 온톨로지 확장 설계

## 작업 규칙

### 파일 생성 위치 (반드시 준수)
| 내용 유형 | 생성 위치 | 예시 |
|----------|----------|------|
| 온톨로지 학습 노트 | `10_Study/{01-06}/` | RDF 개념 정리 → `10_Study/02_Languages/` |
| 엔티티 정의 | `20_Ontology/Entities/` | `Event 정의.md` |
| 관계 정의 | `20_Ontology/Relations/` | `contains 관계.md` |
| 규칙/제약조건 | `20_Ontology/Rules/` | `Event-Episode 참조 규칙.md` |
| 스키마 버전 스펙 | `20_Ontology/Schema/v{X.Y}/` | `v0.2/` |
| LOOP OS 시스템 스펙 | `40_LOOP_OS/` | 루프 정의, 아키텍처 |
| 전략/로드맵 | `30_Strategy/` | 시장 분석, 실행 계획 |
| 임시 아이디어 | `00_Inbox/` | → 정리 후 적절한 위치로 이동 |

### Obsidian 링크 규칙
- **필수**: 위키링크 사용 `[[파일명]]` (절대 상대 경로 사용 금지)
- 파일명만 사용 (경로 불필요): `[[Event 정의]]` ✅, `[[20_Ontology/Entities/Event 정의.md]]` ❌
- 새 문서 생성 시:
  1. 해당 MOC 파일에 링크 추가 (`_MOC 온톨로지 학습.md` 또는 `_MOC 온톨로지 개발.md`)
  2. `_HOME.md`에 필요시 추가
- 섹션 링크: `[[파일명#섹션명]]`
- 별칭: `[[파일명|표시명]]`

### 버전 관리 원칙 (엄격)

**절대 변경 금지 (v0.1 고정 사항):**
- 5개 코어 타입: Event, Episode, LoopStateWindow, ActionExecution, OutcomeMeasurement
- ID 필드명: eventId, episodeId, stateWindowId, actionExecutionId, outcomeId
- Reference 구조: episodeId 참조, actionExecutionId 참조
- 공통 필드: id, userId, createdAt, updatedAt, source, specVersion

**허용되는 변경:**
- 새 필드 추가 (기존 필드 의미 유지)
- 선택적 필드 추가
- payload 내부 구조 확장

**스키마 변경 시 필수 작업:**
1. `specVersion` 업데이트 (예: 0.1 → 0.2)
2. `20_Ontology/Schema/v{새버전}/` 폴더 생성
3. 변경 사항 문서화 (What changed, Why, Migration path)
4. 기존 버전과의 호환성 명시

**v0.2+ 승격 후보:**
- ActionType registry (actionName string → 구조화된 프로토콜)
- Metric registry (metricName string → 계산식 정의)
- LinkType (Reference → 1급 관계 엔티티)

### 태그 컨벤션
```yaml
# 온톨로지 관련
#ontology/entity          # 엔티티 정의 문서
#ontology/relation        # 관계 정의 문서
#ontology/rule            # 규칙/제약조건 문서
#ontology/pattern         # 설계 패턴

# 루프 타입별
#loop/emotional           # Emotional Loop
#loop/eating              # Eating Loop
#loop/habit               # Habit Loop
#loop/reward              # Reward/Dopamine Loop
#loop/nervous             # Nervous System Loop

# 문서 상태
#status/draft             # 초안
#status/review            # 검토 필요
#status/active            # 현재 활성
#status/done              # 완료
#status/archived          # 아카이브됨

# 버전
#version/v0-1            # v0.1 관련
#version/v0-2            # v0.2 관련 (미래)
```

## 온톨로지 용어

### 기본 개념
- **Entity**: 핵심 개념/클래스 (예: Event, Episode, ActionExecution)
- **Relation**: 엔티티 간 관계/Property (예: contains, triggers, evaluatedBy)
- **Rule**: 제약조건, 추론 규칙
- **Triple**: Subject-Predicate-Object 구조

### ILOS 특화 용어
- **Loop Instance**: 한 번의 루프 단위 (에피소드)
- **State Vector**: 5대 루프 상태를 담는 벡터 구조
- **Time Scale**: micro(초-분), meso(30-60분), macro(일-주)
- **Window**: 측정 윈도우 (next_2h, next_meal, today, next_7d)
- **Causality Layer**: Event-Action-Result 인과 구조

## 스키마 개발 원칙

1. **최소주의**: 필요한 것만 정의, 과도한 추상화 금지
2. **확장 가능성**: v0.2+ 승격 경로 고려 (Reference → LinkType)
3. **실용성**: LOOP OS 유즈케이스 기반 설계
4. **버전 안정성**: 하위 호환성 유지, 기존 의미 변경 금지

## 문서 작성 가이드

### 엔티티 정의 템플릿 (`20_Ontology/Entities/`)

```markdown
---
tags: [ontology/entity, version/v0-1, status/active]
---

# {EntityName}

## 정의
{간결한 1-2문장 정의. 이 엔티티가 무엇을 표현하는지}

## 온톨로지 위치
- **상위 개념**: {부모 엔티티 또는 Category}
- **하위 개념**: {자식 엔티티들, 있다면}
- **관련 엔티티**: {관련된 다른 엔티티들}

## 필드 정의

### 공통 필드 (상속)
- `id` (string, 불변): 고유 식별자
- `userId` (string): 사용자 ID
- `createdAt` (timestamp): 생성 시각
- `updatedAt` (timestamp): 수정 시각
- `source` (enum: app|coach|system|import): 데이터 소스
- `specVersion` (string): 스펙 버전 (예: "0.1")

### 엔티티 고유 필드
- `{field_name}` ({type}, {필수/선택}): {설명}
- `{field_name}` ({type}, {필수/선택}): {설명}

### 권장 필드 (선택)
- `{optional_field}` ({type}): {설명}

## 관계 (Relations)
- `{RelationName}` → `{TargetEntity}`: {관계 설명}
- 예: `contains` → `Event`: Episode는 여러 Event를 포함

## 제약조건 (Constraints)
- {제약조건 설명}
- 예: episodeId는 0개 또는 1개만 허용

## 예시

### JSON 예시
\`\`\`json
{
  "id": "event_abc123",
  "userId": "user_xyz",
  "eventType": "meal",
  "timestamp": "2024-01-15T12:30:00Z",
  "payload": { ... },
  "episodeId": "episode_def456",
  "source": "app",
  "specVersion": "0.1",
  "createdAt": "2024-01-15T12:30:00Z",
  "updatedAt": "2024-01-15T12:30:00Z"
}
\`\`\`

### 실제 사용 사례
{구체적인 사용 예시 시나리오}

## 버전 히스토리
- v0.1 (2024-XX-XX): 초기 정의

## 참고
- [[Ontology-lite v0.1 (ILOS) — 규칙(4조건) + 최소 엔티티 스펙]]
- [[Inner Loop OS 정의v1]]
```

### 관계 정의 템플릿 (`20_Ontology/Relations/`)

```markdown
---
tags: [ontology/relation, version/v0-1, status/active]
---

# {RelationName}

## 정의
{관계의 의미를 명확히 설명}

## 관계 구조
- **Source (주체)**: `{SourceEntity}`
- **Target (객체)**: `{TargetEntity}`
- **Cardinality (다중도)**: {1:1 | 1:N | N:M | 0..1:N 등}
- **방향성**: {단방향 | 양방향}

## v0.1 구현 방식
현재는 Reference 필드로 구현:
- 필드명: `{referenceFieldName}` (예: `episodeId`)
- 위치: `{SourceEntity}` 엔티티 내부
- 타입: `string | null`

## 의미론적 정의
{이 관계가 도메인에서 의미하는 것}

예: "Episode는 Event를 시간적/의미적으로 묶는 컨테이너 역할"

## 제약조건
- {제약조건 1}
- {제약조건 2}

## 예시
\`\`\`
Episode(id: ep1, startTime: T1, endTime: T2)
  --contains-->
Event(id: ev1, episodeId: ep1, timestamp: T1.5)
Event(id: ev2, episodeId: ep1, timestamp: T1.8)
\`\`\`

## v0.2+ 승격 계획
{LinkType으로 전환 계획이 있다면}

예: Reference → `Link` 엔티티로 승격, 관계 메타데이터 추가

## 참고
- [[{SourceEntity}]]
- [[{TargetEntity}]]
```

### 규칙 정의 템플릿 (`20_Ontology/Rules/`)

```markdown
---
tags: [ontology/rule, version/v0-1, status/active]
---

# {RuleName}

## 규칙 설명
{이 규칙이 강제하는 제약 또는 추론}

## 규칙 유형
- [ ] 제약조건 (Constraint)
- [ ] 추론 규칙 (Inference Rule)
- [ ] 검증 규칙 (Validation Rule)
- [ ] 비즈니스 규칙 (Business Rule)

## 적용 대상
- 엔티티: `{EntityName}`
- 관계: `{RelationName}`
- 속성: `{fieldName}`

## 규칙 정의

### 자연어
{평문으로 규칙 설명}

### 형식 표현 (선택)
\`\`\`
IF {조건}
THEN {결과}
\`\`\`

또는

\`\`\`
FORALL x: Entity
  WHERE condition(x)
  ASSERT constraint(x)
\`\`\`

## 예외 사항
{규칙이 적용되지 않는 경우}

## 위반 시 처리
- 데이터 검증 실패
- 경고 발생
- 자동 수정

## 예시

### 올바른 경우
\`\`\`
{규칙을 만족하는 예시}
\`\`\`

### 잘못된 경우
\`\`\`
{규칙을 위반하는 예시}
\`\`\`

## 참고
- [[관련 엔티티]]
- [[관련 규칙]]
```

## 일반적인 작업 워크플로우

### 새 엔티티 추가하기
1. `20_Ontology/Entities/`에 `{EntityName}.md` 생성 (템플릿 사용)
2. 엔티티 정의 작성:
   - 정의, 필드, 관계, 제약조건, 예시
   - 실제 구현체(SoSi/KkokKkokFit) 참조하여 현실성 검증
3. 관련 관계가 있다면 `20_Ontology/Relations/`에 관계 문서 생성
4. 필요시 제약조건을 `20_Ontology/Rules/`에 문서화
5. `_MOC 온톨로지 개발.md`의 Entities 섹션에 링크 추가
6. 스키마 버전 문서 업데이트 (현재: `Ontology-lite v0.1`)

### 온톨로지 학습 노트 작성하기
1. 학습 주제 결정 (RDF, OWL, 설계 패턴 등)
2. `10_Study/{적절한 폴더}/`에 노트 생성
   - 예: RDF 학습 → `10_Study/02_Languages/RDF 개념 정리.md`
3. 노트 작성 (개념 정리, 코드 예시, 참고 링크)
4. `_MOC 온톨로지 학습.md` 해당 섹션에 링크 추가
5. 관련 태그 추가 (예: `#ontology/pattern`, `#status/done`)

### 스키마 버전 업그레이드 (v0.1 → v0.2)
1. **계획 단계**:
   - 변경 사항 목록 작성
   - 하위 호환성 영향 분석
   - 마이그레이션 경로 설계
2. **실행 단계**:
   - `20_Ontology/Schema/v0.2/` 폴더 생성
   - 새 버전 스펙 문서 작성
   - 변경된 엔티티/관계/규칙 문서 업데이트 (버전 히스토리 추가)
   - `specVersion` 필드 업데이트
3. **검증 단계**:
   - 실제 구현체(SoSi/KkokKkokFit)와 대조
   - 마이그레이션 스크립트 필요성 검토
4. **문서화**:
   - `_MOC 온톨로지 개발.md` 버전 히스토리 업데이트
   - 변경 사항을 `CHANGELOG.md` 또는 스키마 문서에 기록

### 실제 데이터 구조 검증
1. 온톨로지 스펙 작성 완료
2. SoSi 또는 KkokKkokFit 프로젝트 참조:
   - SoSi: `/Users/gim-eunhyang/dev/flutter/sosi`
   - KkokKkokFit Web: `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web`
3. 실제 Firestore/RDB 스키마 확인
4. 갭 분석:
   - 온톨로지에는 있지만 구현에는 없는 필드 → 구현 계획 또는 온톨로지 조정
   - 구현에는 있지만 온톨로지에는 없는 필드 → 온톨로지 확장
5. 검증 결과를 `50_Experiments/Use-cases/`에 문서화

### Inbox 정리하기
1. 주기적으로 (주 1회 권장) `00_Inbox/` 검토
2. 각 메모의 성격 파악:
   - 학습 자료 → `10_Study/`
   - 엔티티/관계/규칙 아이디어 → `20_Ontology/`
   - 전략/아이디어 → `30_Strategy/`
   - LOOP OS 스펙 → `40_LOOP_OS/`
   - 실험 결과 → `50_Experiments/`
3. 적절한 위치로 이동하고 MOC 업데이트
4. 더 이상 유효하지 않은 메모는 `90_Archive/`로 이동

## 주의사항

### 절대 하지 말 것
- ❌ v0.1 코어 타입/필드 삭제 또는 의미 변경
- ❌ 공통 필드 제거 (id, userId, createdAt, updatedAt, source, specVersion)
- ❌ 기존 Reference 구조 파괴 (episodeId, actionExecutionId 등)
- ❌ 상대 경로나 절대 경로 링크 사용 (`[[파일명]]`만 사용)
- ❌ 온톨로지 스펙 변경 없이 실제 구현 변경 제안

### 권장 사항
- ✅ 새 문서 생성 시 항상 MOC 업데이트
- ✅ 엔티티 설계 전 실제 구현체(SoSi/KkokKkokFit) 참조
- ✅ 태그 일관성 유지
- ✅ 예시 포함 (JSON, 시나리오)
- ✅ 버전 히스토리 기록
- ✅ 정기적인 Inbox 정리

### Obsidian 특화 기능 활용
- 그래프 뷰로 엔티티 간 관계 시각화
- 백링크로 엔티티가 어디서 참조되는지 추적
- 태그 검색으로 특정 버전/상태 문서 필터링
- 임베드 기능으로 관련 정의 참조: `![[Event 정의#정의]]`

## 자주 묻는 질문 (FAQ)

**Q: 새 엔티티를 추가할 때 v0.1 규칙을 위반하는 건 아닌가요?**
A: 아닙니다. 새 엔티티 추가는 허용됩니다. 금지되는 것은 기존 5개 코어 엔티티(Event, Episode, LoopStateWindow, ActionExecution, OutcomeMeasurement)의 **삭제 또는 의미 변경**입니다.

**Q: 실제 구현(SoSi/KkokKkokFit)과 온톨로지가 다르면 어떻게 하나요?**
A: 갭 분석 후 두 가지 옵션:
1. 온톨로지가 더 나은 설계라면 → 구현 변경 제안 (마이그레이션 계획 포함)
2. 구현이 현실적이라면 → 온톨로지 조정 (단, v0.1 규칙 위반 금지)

**Q: ActionType이나 Metric registry는 언제 만드나요?**
A: v0.2+ 승격 후보입니다. v0.1에서는 actionName과 metricName을 문자열로 유지합니다.

**Q: MOC 파일은 무엇인가요?**
A: Map of Content. Obsidian에서 관련 노트들을 체계적으로 연결하는 허브 문서입니다. 이 vault에는 `_MOC 온톨로지 학습.md`와 `_MOC 온톨로지 개발.md`가 있습니다.

## 관련 파일 위치 요약

| 목적 | 파일 경로 |
|------|----------|
| 메인 허브 | `_HOME.md` |
| 현재 스키마 | `20_Ontology/Schema/v0.1/Ontology-lite v0.1 (ILOS) — 규칙(4조건) + 최소 엔티티 스펙.md` |
| LOOP OS 정의 | `40_LOOP_OS/Inner Loop OS 정의v1.md` |
| 학습 로드맵 | `10_Study/_MOC 온톨로지 학습.md` |
| 개발 현황 | `20_Ontology/_MOC 온톨로지 개발.md` |
| 10년 전략 | `30_Strategy/10-year direction 정리(헬스케어 섭식 도메인 레이어의 성공선).md` |
| 3년 전략 | `30_Strategy/(LV1 Strategic Hypotheses) 3-year strategy (조건 기반) 정리.md` |
| 12개월 계획 | `30_Strategy/12-month 실행 계획(숫자 기반) 정리.md` |

---

**마지막 업데이트**: 2025-12-17
**문서 버전**: 2.0
**작성자**: Claude Code 초기 분석 + 개선
