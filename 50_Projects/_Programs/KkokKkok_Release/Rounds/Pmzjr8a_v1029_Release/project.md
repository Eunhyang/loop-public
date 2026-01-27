---
entity_type: Project
entity_id: prj-mzjr8a
entity_name: KkokKkok App v1.0.29 - Release
created: '2026-01-09'
updated: '2026-01-28'
status: planning
owner: 김은향
start_date: '2026-01-20'
priority_flag: high
parent_id: trk-1
program_id: pgm-kkokkkok-app-release
aliases:
- prj-mzjr8a
tags: []
conditions_3y:
- cond-a
- cond-b
track_contributes: []
deadline: '2026-01-30'
validates:
- hyp-1-12
primary_hypothesis_id: hyp-1-12
expected_impact:
  tier: strategic
  impact_magnitude: high
  confidence: 0.2
  contributes: []
  rationale: KkokKkok App v1.0.29 프로젝트는 DAU와 재방문율을 개선하기 위한 개입 효과를 검증하는 파일럿으로, 중간 수준의
    영향력을 가지고 있으며, Loop 언어 사용을 촉진하는 데 기여할 것입니다.
condition_contributes:
- to: cond-a
  weight: 0.7
  description: 프로젝트의 목표가 Loop 언어로 문제를 설명하고 선택을 유도하는 것이므로, cond-a는 핵심적인 기여를 한다.
- to: cond-b
  weight: 0.3
  description: 프로젝트 결과가 데이터 패턴의 재현 가능성과 관련이 있으므로, cond-b도 기여하지만 상대적으로 낮은 기여도를 가진다.
---
# 2주 코어 파일럿 — 다음날 회복 + 직전 60초(옵트인)

## 목표

콘텐츠(UI MVP) 실험에서 신호가 약/혼재했으므로, **DAU 100\~200 코어 유저 풀에서 제품 파일럿**으로 더 정확하게 판정한다.

2주 안에 확인할 것:

- **다음날 회복**이 “재방문 기본값”으로 작동하는가?

- **직전 60초 리셋(옵트인**)이 “체감(효과) + 반복”을 만드는가?

- 결과로 **Go / Iterate / Stop** 결론을 낸다.

## 연결 가설

- Track_3: hyp-3-02(다음날 회복 콘텐츠 신호), hyp-3-03(직전 리셋 콘텐츠 신호), hyp-3-04(획득 상위)

- Track_1: hyp-1-12(페인킬러 유입 코호트 질 → Activation/Retention/DAU 누적)

## 실험 대상(코어 코호트)

- 최근 14일 내 앱 오픈 3회 이상(따뜻한 코호트)

- 배포 원칙: 기본값 OFF(옵트인) + 슬롯 2개 + 주 5회 상한 + 원탭 끄기 + 타이머 플로우 비침범

## 안전장치(필수)

- 옵트인 기본 OFF: 사용자가 직접 켜야만 동작

- 알림 슬롯 2개 제한 + 주 5회 상한(푸시 피로 방지)

- 원탭 끄기 + 이번주만 끄기(탈출구 제공)

- 타이머 메인 경험 침범 금지(기존 코어 기능 보호)

## 판정(2주) — “제품에서”만 본다

### 다음날 회복(재방문 기본값)

- 노출 → 시작 → 완료 퍼널이 성립하는가

- 2주 내 “2회 이상 실행자”가 의미 있게 나오는가(재방문 신호)

### 직전 60초(옵트인, Gate1\~2)

- Gate1(체감): 완료 후 helpful_yes 비율(또는 갈망 before/after 감소)

- Gate2(반복): 알림 후 5분 내 실행률 + 2주 내 주2회 이상 반복자 비율

### 최종 산출물

- 1페이지 리포트: Go / Iterate / Stop + 다음 2주 액션 3개

## 왜 데이터 스키마가 필수인가(LOOP OS 관점)

이번 파일럿은 기능 출시가 아니라 **개입의 효과(Event–Action–Outcome)를 증명하는 실험**이다.\
따라서 데이터는 “나중에 분석 불가능한 앱 이벤트”로 쌓으면 손해가 크고,\
최소한 아래 구조로 저장해야 LOOPOS(온톨로지/루프 분석)에 붙는다.

- Event: 위험/충동/폭식/회복 등 “상황 발생”

- ActionExecution: 직전 60초/다음날 회복 “개입 실행”

- OutcomeMeasurement: 개입 이후(2시간/다음 끼니/다음날) “결과 변화”

(즉, 파일럿에서 나온 데이터를 그대로 LoopOS 학습/패턴 재현/코칭 결합 분석으로 승격시키기 위한 최소 구조 동결이 필요)

## 일정(권장)

- D0\~D2: 스펙+계측+스키마 최소 동결

- D3\~D7: 구현/QA/옵트인 배포

- D8: Week1 중간 점검(치명 이슈 1개만 수정)

- D14: Week2 최종 판정 리포트(Go/Iterate/Stop)

## 실행 태스크(최소 6개)

1. \[Product\] 파일럿 스펙 1페이지 동결(회복 카드 + 직전 60초 옵트인 + 안전장치)

2. \[Data\] Ontology-lite v0.1 기반 최소 스키마 동결(Event/ActionExecution/OutcomeMeasurement + window 규칙)

3. \[Dev\] 다음날 회복 카드 구현 + 이벤트 발화

4. \[Dev\] 직전 60초(옵트인) 구현(슬롯2/주5/끄기) + 이벤트 발화

5. \[Ops\] 코어 유저 공지/피드백 채널 1개 오픈(끄는 방법 포함)

6. \[Analysis\] Week1/Week2 리포트 1페이지(지표 요약 + 결론 + 다음 액션 3개)

## 참고

- 이 프로젝트는 “기능 확장”이 아니라 **페인킬러 개입의 제품 성립 여부를 2주 안에 판정**하기 위한 파일럿이다.

- 콘텐츠 실험 결과는 보조 근거로만 사용하고, 판정은 제품 데이터로 한다.