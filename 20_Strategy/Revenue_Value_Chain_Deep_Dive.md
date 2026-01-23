---
entity_type: Strategy
entity_id: strat-revenue-value-chain-deep-dive
entity_name: "매출 가치 사슬 심층 분석 (KRW)"
created: 2026-01-23
updated: 2026-01-23
status: active
parent_id: strat-revenue-roadmap
tags:
  - strategy
  - revenue
  - detail
  - krw
  - bayesian
---

# 매출 가치 사슬 심층 분석 (KRW)

이 문서는 루프의 핵심 가설이 어떻게 실제 매출과 기업 가치로 전환되는지를 노드별 상세 설명과 함께 한화(KRW) 기준으로 도식화한 것입니다.

## 1. 정밀 매출 가치 사슬 도식

```mermaid
graph TD
    subgraph Evidence ["계층적 증거 (Science)"]
        EMA["EMA/자가기록 데이터<br/>(사용자의 정서, 식사, 포만감,<br/>행동 컨텍스트 실시간 수집)"]
        Wear["웨어러블 센서 데이터<br/>(HRV, EDA, 수면 등 생체 신호를<br/>통합하여 데이터 해상도 극대화)"]
        EMA & Wear --> Feature["루프 피처 공간 구축<br/>(개인별 폭식 위험 패턴을 구성하는<br/>다차원적 특성 공간 정의)"]
    end

    subgraph Prediction ["핵심 가설 & 성능 (Logic)"]
        direction LR
        C1["가설 C1 (Prob: 80%)<br/>패턴 기반 예측 모델<br/>AUC 0.8: 고성능 개입 가능"]
        C0["가설 C0 (Prob: 20%)<br/>노이즈 기반 한계 모델<br/>AUC 0.6: 부가 기능 수준"]
    end

    Feature --> C1
    Feature --> C0

    subgraph Impact ["임상적 임팩트 (Intervention)"]
        JITAI_High["고성능 JITAI 개입<br/>(적기 개입을 통한<br/>폭식 빈도 30% 감소 유도)"]
        JITAI_Low["저성능 개입/코칭<br/>(일반적 코칭 수준인<br/>10-15% 빈도 감소)"]
    end

    C1 --> JITAI_High
    C0 --> JITAI_Low

    subgraph Econ ["경제적 가치 창출 (Economics)"]
        SocialCost["BED 1인당 사회적 비용<br/>(연간 약 2,600만 원<br/>직접 의료비 + 생산성 손실)"]
        TargetMarket["미국 BED 유효 시장<br/>(약 40만 명 대상<br/>초기 침투 가능 코호트)"]
        
        SavingHigh["1인당 비용 절감 793만 원<br/>(C1 시나리오: 고성능 개입을 통한<br/>사회적 비용의 30% 절감)"]
        SavingLow["1인당 비용 절감 51만 원<br/>(C0 시나리오: 저성능 개입 시<br/>직접 의료비의 일부 절감)"]
    end

    JITAI_High --> SavingHigh
    JITAI_Low --> SavingLow
    SocialCost -.-> SavingHigh
    SocialCost -.-> SavingLow

    subgraph Revenue ["매출 포착 (Business)"]
        CaptureHigh["연간 구독/라이선스 20.8만 원<br/>(B2B 보험/제약 대상<br/>절감액의 20%를 Capture)"]
        CaptureLow["연간 구독/커미션 7.8만 원<br/>(B2C 코칭 및 앱 기반<br/>SaaS 모델 수익)"]
        
        RevHigh["C1 시나리오 매출<br/>연간 208억 - 624억 원<br/>(점유율 10만-30만 명 가정)"]
        RevLow["C0 시나리오 매출<br/>연간 78억 원<br/>(보수적 SaaS 수익 모델)"]
        
        EV["베이지안 기대 매출 (EV)<br/>연간 약 650억 원 이상<br/>(미국 BED 시장 단일 타겟)"]
    end

    SavingHigh --> CaptureHigh
    SavingLow --> CaptureLow
    
    CaptureHigh --> RevHigh
    CaptureLow --> RevLow
    TargetMarket --> RevHigh
    TargetMarket --> RevLow
    
    RevHigh -.->|Weight 0.8| EV
    RevLow -.->|Weight 0.2| EV

    subgraph Scalability ["확장 옵션 (Scalability)"]
        HumanOS["Human Behavior OS<br/>(GLP-1 Crash, 타 섭식장애,<br/>전반적 정서 루프로의 확장)"]
        Valuation["기업 가치 퀀텀 점프<br/>약 3,250억 - 5,200억 원+<br/>(글로벌 헬스케어 인프라 밸류)"]
    end

    EV --> HumanOS
    HumanOS --> Valuation

    style C1 fill:#e1f5fe,stroke:#01579b
    style C0 fill:#fff3e0,stroke:#e65100
    style EV fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style Valuation fill:#f1f8e9,stroke:#33691e,stroke-width:2px
```

## 2. 연도별 성장 전략 및 매출 로드맵 (2025-2035)

가치 사슬의 구성 요소들이 시간에 따라 어떻게 확장되며 매출 폭발(Hockey-stick)을 만들어내는지에 대한 단계별 로드맵입니다.

### 2-1. 단계별 성장 도식

```mermaid
graph LR
    P1["Phase 1 (2025-26)<br/>Data Foundation"] --> P2["Phase 2 (2027)<br/>Clinical Link"]
    P2 --> P3["Phase 3 (2028)<br/>DTx & Early Pilot"]
    P3 --> P4["Phase 4 (2029)<br/>B2B/API Pivot"]
    P4 --> P5["Phase 5 (2030-32)<br/>Global Scaling"]
    P5 --> P6["Phase 6 (2033-35)<br/>Human OS"]

    subgraph Early ["B2C & 근거 축적"]
        P1
        P2
        P3
    end

    subgraph Expansion ["B2B 레버리지 & 폭발"]
        P4
        P5
        P6
    end

    classDef hockey fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    class P4,P5,P6 hockey
```

### 2-2. 단계별 핵심 전략 및 기대 매출 (KRW)

| 단계 | 기간 | 핵심 전략 (Strategic Focus) | 기대 매출 범위 (Base) |
| :--- | :--- | :--- | :--- |
| **1단계** | 2025-26 | **Behavioral Data Layer**: 한국 시장 Inner Loop 데이터셋 구축 및 모델 설계. | **연 4억 ~ 8억 원** |
| **2단계** | 2027 | **Healthcare Integration**: 비만/정신건강 클리닉 제휴 및 GLP-1 대응 프로토콜 v1. | **연 8억 ~ 12억 원** |
| **3단계** | 2028 | **DTx Authorization**: 섭식장애 DTx 허가 획득 및 해외 Behavioral Pilot 시작. | **연 10억 ~ 20억 원** |
| **4단계** | 2029 | **B2B/API Pivot**: GLP-1 Behavioral OS 출시 및 **제약/보험사 대상 API 유료화 시작**. | **연 30억 ~ 60억 원** (1차 폭발) |
| **5단계** | 2030-32 | **Global Scaling**: Multi-country 모델 확장 및 글로벌 헬스케어 인프라 진입. | **연 500억 ~ 600억 원** (본격 폭발) |
| **6단계** | 2033-35 | **Human OS 완성**: 정서·습관·신경계 통합 OS 엔진 라이선스 및 M&A/IPO 가치 극대화. | **연 2조 ~ 6.5조 원** (야망) |

---

## 3. 주요 환산 기준 (FX: 1,300 KRW/USD)

- **사회적 비용/절감**: 1인당 연간 발생 비용 및 솔루션 도입 시 기대 절감액.
- **매출 (Capture)**: 솔루션이 창출한 경제적 이익 중 LOOP가 가져오는 몫 (가치 기반 과금).
- **기업 가치**: 연간 기대 매출에 헬스케어 SaaS/DTx 멀티플(5-8x)을 적용한 추정치.

## 3. 전략적 시사점

1. **데이터 해상도의 중요성**: Evidence 계층에서 피처 공간이 정교할수록 C1 가설의 예측력(AUC)이 유지되며, 이는 곧 High-Impact 개입으로 연결됩니다.
2. **가치 기반 과금 (Value-based Pricing)**: 단순 앱 구독료가 아닌, 사회적 비용 절감액의 일정 비율(20.8만 원/년)을 획득하는 B2B 전략이 매출 폭발의 핵심입니다.
3. **베이지안 베이팅**: C1(80%)에 높은 가중치를 두는 근거는 이미 쌓인 EMA/센서 기반 선행 연구들의 긍정적 결과에 기반합니다.
