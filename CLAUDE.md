# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

이 Obsidian vault는 **Inner Loop OS (ILOS)** 를 위한 온톨로지 학습과 스키마 개발 공간입니다. Inner Loop OS는 인간의 정서-섭식-습관-보상-신경계 루프를 하나의 시스템으로 다루는 행동 OS입니다.

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
├── 00_Inbox/          # 임시 메모, 아이디어 수집
├── 10_Study/          # 온톨로지 학습
│   ├── 01_Foundations/    # 기초 개념
│   ├── 02_Languages/      # RDF, OWL, SPARQL
│   ├── 03_Tools/          # Protégé 등
│   ├── 04_Methodology/    # 설계 방법론
│   ├── 05_Case-Studies/   # 사례 분석
│   └── 06_Exercises/      # 실습
├── 20_Ontology/       # 스키마 개발
│   ├── Schema/            # 버전별 스키마
│   ├── Entities/          # 엔티티 정의
│   ├── Relations/         # 관계 정의
│   └── Rules/             # 규칙/제약조건
├── 30_Strategy/       # 전략 문서
├── 40_LOOP_OS/        # LOOP OS 정의
├── 50_Experiments/    # 실험/검증
└── 90_Archive/        # 아카이브
```

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

## 작업 규칙

### 파일 생성 위치
- 학습 노트: `10_Study/` 하위 적절한 폴더에 생성
- 엔티티/관계/규칙 정의: `20_Ontology/Entities|Relations|Rules/`
- 스키마 버전: `20_Ontology/Schema/v{X.Y}/`
- LOOP OS 스펙/문서: `40_LOOP_OS/`
- 임시 메모: `00_Inbox/` → 나중에 적절한 위치로 이동

### 링크 규칙
- **필수**: Obsidian 위키링크 사용 `[[파일명]]`
- 새 문서 생성 시 관련 MOC 파일에 링크 추가
- 전체 파일명 사용 불필요 (Obsidian이 자동 해결)

### 버전 관리 원칙
- v0.1에서 정의한 코어 타입/ID/Reference는 **절대 변경 금지**
- 새 필드 추가는 가능, 기존 의미 변경은 금지
- 모든 스키마 변경 시 `specVersion` 업데이트
- v0.2+에서 승격 가능: ActionType registry, Metric registry, LinkType

### 태그 컨벤션
```
#ontology/entity     # 엔티티 관련
#ontology/relation   # 관계 관련
#ontology/rule       # 규칙 관련
#loop/emotional      # Emotional Loop
#loop/eating         # Eating Loop
#loop/habit          # Habit Loop
#loop/reward         # Reward Loop
#loop/nervous        # Nervous System Loop
#status/draft        # 초안
#status/review       # 검토 필요
#status/done         # 완료
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

### 엔티티 정의 시 포함 사항
```markdown
## {EntityName}

### 정의
{1-2줄 정의}

### 필수 필드
- 공통 필드 (id, userId, createdAt, updatedAt, source, specVersion)
- {entity_specific_field_1}
- {entity_specific_field_2}

### 권장 필드
- {optional_field}

### 관계
- {Relation} → {TargetEntity}

### 예시
{JSON or 구체적 예시}
```

### 관계 정의 시 포함 사항
```markdown
## {RelationName}

### 정의
{관계 의미 설명}

### 구조
- Source: {SourceEntity}
- Target: {TargetEntity}
- Cardinality: {1:1, 1:N, N:M}

### v0.1 구현 방식
{현재 Reference 필드명}

### v0.2+ 승격 계획
{LinkType 전환 계획 - 있는 경우}
```
