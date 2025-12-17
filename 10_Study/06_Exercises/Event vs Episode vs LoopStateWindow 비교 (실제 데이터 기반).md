# Event vs Episode vs LoopStateWindow 비교 (실제 데이터 기반)

> **목적:** 같은 상황을 Event, Episode, LoopStateWindow로 각각 어떻게 표현하는지 명확히 구분
> **데이터 출처:** SoSi (꼭꼭 앱), CoachOS (꼭꼭Fit 웹)
> **작성일:** 2025-12-17

#ontology/entity #status/done

---

## 📋 핵심 정의 (요약)

| 엔티티 | 정의 | 시간 단위 | 실제 예시 |
|--------|------|-----------|----------|
| **Event** | 원자적 사실 (atomic fact) | 한 시점 | "12:30에 점심 먹음", "18:00에 불안 느낌" |
| **Episode** | 한 번의 루프 단위 컨테이너 | 2-4시간, 하루 | "저녁 야식 위험 구간", "오늘의 섭식 패턴" |
| **LoopStateWindow** | 30-60분 상태 벡터 스냅샷 | 30-60분 | "18:00-19:00 사이 감정/배고픔/스트레스 상태" |

**핵심 차이:**
- Event는 "**무슨 일이 일어났는가**" (관찰)
- Episode는 "**이 일들을 어떻게 묶을 것인가**" (컨테이너)
- LoopStateWindow는 "**그 시점의 내 상태는 어땠는가**" (상태 스냅샷)

---

## 📝 예시 1: 저녁 야식 루프

### 상황
> 퇴근 후 집에 도착 (18:30) → 스트레스 느낌 (18:45) → 편의점 간식 먹음 (19:15) → 후회 감정 (19:30)

### Event로 기록

```json
// Event 1: 퇴근 도착
{
  "eventId": "evt_001",
  "eventType": "context_change",
  "timestamp": "2025-12-17T18:30:00+09:00",
  "payload": {
    "location": "home",
    "previousLocation": "office"
  },
  "episodeId": "ep_evening_001"  // 연결됨
}

// Event 2: 감정 태그
{
  "eventId": "evt_002",
  "eventType": "emotion_tag",
  "timestamp": "2025-12-17T18:45:00+09:00",
  "payload": {
    "emotions": ["stressed", "exhausted"],
    "intensity": 7
  },
  "episodeId": "ep_evening_001"
}

// Event 3: 간식 섭취
{
  "eventId": "evt_003",
  "eventType": "meal",
  "timestamp": "2025-12-17T19:15:00+09:00",
  "payload": {
    "mealType": "간식/음료",
    "items": ["초코칩쿠키", "탄산음료"],
    "totalBites": 12,
    "totalMealDuration": 300  // 5분
  },
  "episodeId": "ep_evening_001"
}

// Event 4: 후회 감정
{
  "eventId": "evt_004",
  "eventType": "emotion_tag",
  "timestamp": "2025-12-17T19:30:00+09:00",
  "payload": {
    "emotions": ["regret", "guilt"],
    "intensity": 6
  },
  "episodeId": "ep_evening_001"
}
```

**특징:**
- 각 Event는 **한 시점의 원자적 사실**
- episodeId로 연결되지만, Event 자체는 독립적
- 인과 관계를 **암시하지만 증명하지 않음** (상관관계만)

---

### Episode로 기록

```json
{
  "episodeId": "ep_evening_001",
  "episodeType": "risk_window",
  "startTime": "2025-12-17T18:30:00+09:00",
  "endTime": "2025-12-17T19:30:00+09:00",
  "status": "closed",
  "dominantLoopTypes": ["emotional", "eating", "habit"],
  "summary": "퇴근 후 스트레스 → 편의점 간식 섭취 → 후회",
  "contextClusterId": "cluster_evening_snack_pattern",

  // Episode는 컨테이너: Event들을 묶음
  "containedEvents": [
    "evt_001",  // context_change
    "evt_002",  // emotion_tag (스트레스)
    "evt_003",  // meal
    "evt_004"   // emotion_tag (후회)
  ]
}
```

**특징:**
- Episode는 **Event들을 담는 컨테이너**
- "저녁 위험 구간"이라는 **의미 있는 단위**로 묶음
- 시작/종료 시간이 명확함
- dominantLoopTypes로 어떤 루프가 활성화되었는지 표시

---

### LoopStateWindow로 기록

```json
// Window 1: 18:30-19:00 (퇴근 직후)
{
  "stateWindowId": "sw_001",
  "episodeId": "ep_evening_001",
  "startTime": "2025-12-17T18:30:00+09:00",
  "endTime": "2025-12-17T19:00:00+09:00",
  "timeScale": "meso",  // 30분 단위

  "stateVector": {
    "emotional_state": {
      "valence": -0.6,  // 부정적
      "anxiety": 0.7,
      "emptiness": 0.5
    },
    "eating_state": {
      "hunger": 0.4,
      "craving": 0.8,  // 갈망 높음
      "mealRegularity": 0.6
    },
    "habit_state": {
      "contextTrigger": 0.9,  // 환경 트리거 강함 (집 도착)
      "automaticity": 0.7
    },
    "reward_state": {
      "cravingLevel": 0.8,
      "highRewardExposure": 0.6
    },
    "nervous_state": {
      "arousal": 0.7,  // 교감신경 활성
      "shutdown": 0.2
    }
  }
}

// Window 2: 19:00-19:30 (섭취 후)
{
  "stateWindowId": "sw_002",
  "episodeId": "ep_evening_001",
  "startTime": "2025-12-17T19:00:00+09:00",
  "endTime": "2025-12-17T19:30:00+09:00",
  "timeScale": "meso",

  "stateVector": {
    "emotional_state": {
      "valence": -0.4,  // 약간 개선되었지만 후회
      "anxiety": 0.3,  // 감소
      "emptiness": 0.4
    },
    "eating_state": {
      "hunger": 0.1,  // 배고픔 해소
      "craving": 0.2,  // 갈망 해소
      "mealRegularity": 0.4
    },
    "reward_state": {
      "cravingLevel": 0.2,
      "dopamineSpike": 0.8  // 순간적 보상
    },
    "nervous_state": {
      "arousal": 0.4,  // 교감신경 진정
      "shutdown": 0.3
    }
  }
}
```

**특징:**
- LoopStateWindow는 **그 시점의 상태 벡터**
- 5대 루프의 활성화 수준을 숫자로 표현
- 30분 단위로 상태 변화 추적
- Event는 "무슨 일이 일어났는가", StateWindow는 "내 상태가 어땠는가"

---

## 📝 예시 2: 주간 코칭 세션

### 상황
> 코치와 30분 통화 → 지난주 패턴 분석 → 다음 주 전략 수립

### Event로 기록 (❌ 부적절)

```json
// 이렇게 쓰면 안 됨!
{
  "eventId": "evt_session_001",
  "eventType": "coaching_session",
  "timestamp": "2025-12-17T14:00:00+09:00",
  "payload": {
    "duration": 1800,  // 30분
    "transcript": "...",  // 전사 텍스트 전체
    "summary": "...",  // 요약
    "nextWeekGoals": [...]
  }
}
```

**왜 부적절한가?**
- 30분간의 **과정**을 한 시점의 Event로 압축함
- Event는 원자적 사실이어야 하는데, 세션은 여러 대화의 집합
- 시작/종료가 명확한 **컨테이너성 데이터**임

---

### Episode로 기록 (⭕ 적절)

```json
{
  "episodeId": "ep_coaching_w5",
  "episodeType": "coaching_session",
  "startTime": "2025-12-17T14:00:00+09:00",
  "endTime": "2025-12-17T14:30:00+09:00",
  "status": "closed",
  "dominantLoopTypes": ["emotional", "eating"],

  "sessionData": {
    "weekNumber": 5,
    "coach": "coach_kim",
    "transcript": "...",
    "keyTopics": ["저녁 야식 패턴", "스트레스 대응"],
    "nextWeekGoals": [
      "편의점 가기 전 5분 대기",
      "감정 일기 작성"
    ]
  },

  "containedEvents": [
    // 세션 내에서 태깅된 이벤트들
    "evt_binge_tag_001",  // "지난주 금요일 폭식"에 대한 라벨링
    "evt_pattern_identification_001"
  ]
}
```

---

### LoopStateWindow로 기록 (❌ 부적절)

```json
// 이렇게 쓰면 안 됨!
{
  "stateWindowId": "sw_session_001",
  "startTime": "2025-12-17T14:00:00+09:00",
  "endTime": "2025-12-17T14:30:00+09:00",
  "stateVector": {
    // 세션 내용을 stateVector에 억지로 넣음 (부적절)
  }
}
```

**왜 부적절한가?**
- 코칭 세션은 **상태**가 아니라 **활동/프로세스**
- LoopStateWindow는 "그 시점의 내 루프 상태"를 담는 것
- 세션은 Episode로 기록해야 함

---

## 📝 예시 3: 식사 중 포만감 기록 (SoSi 실제 데이터)

### 상황
> 12:00 점심 시작 → 12:05 (포만감 3) → 12:10 (포만감 7) → 12:15 (포만감 9) → 종료

### Event로 기록

```json
// Event: 식사 일기 (meal_diary)
{
  "eventId": "evt_meal_001",
  "eventType": "meal",
  "timestamp": "2025-12-17T12:00:00+09:00",
  "payload": {
    "uuid": "d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6",
    "mealType": "점심",
    "totalMealDuration": 900,  // 15분
    "totalBites": 45,
    "averageBiteDuration": 20,

    // fullnessRecords는 Event 내부의 시계열 데이터
    "fullnessRecords": [
      {"time": "2025-12-17T12:00:00+09:00", "level": 3, "elapsedTime": 0},
      {"time": "2025-12-17T12:05:00+09:00", "level": 5, "elapsedTime": 300},
      {"time": "2025-12-17T12:10:00+09:00", "level": 7, "elapsedTime": 600},
      {"time": "2025-12-17T12:15:00+09:00", "level": 9, "elapsedTime": 900}
    ]
  },
  "episodeId": "ep_lunch_001"
}
```

**특징:**
- 식사 일기는 **Event** (한 끼 식사라는 원자적 사실)
- fullnessRecords는 Event의 **내부 시계열 데이터** (micro scale)
- SoSi 앱에서 실제로 이렇게 저장함 (firestore_schema.json 확인)

---

### Episode로 기록

```json
{
  "episodeId": "ep_lunch_001",
  "episodeType": "meal_episode",
  "startTime": "2025-12-17T12:00:00+09:00",
  "endTime": "2025-12-17T12:15:00+09:00",
  "status": "closed",
  "dominantLoopTypes": ["eating"],

  "containedEvents": [
    "evt_meal_001",  // 식사 일기
    "evt_satiety_check_001",  // 포만감 체크들
    "evt_satiety_check_002",
    "evt_satiety_check_003"
  ]
}
```

**언제 Episode로 묶는가?**
- 식사 전후 감정 태그 + 식사 + 식후 감정을 하나로 묶을 때
- "점심 시간 전체"를 분석 단위로 삼을 때

---

### LoopStateWindow로 기록

```json
// Window: 12:00-12:15 (식사 중)
{
  "stateWindowId": "sw_lunch_001",
  "episodeId": "ep_lunch_001",
  "startTime": "2025-12-17T12:00:00+09:00",
  "endTime": "2025-12-17T12:15:00+09:00",
  "timeScale": "micro",  // 15분 (한 끼 내)

  "stateVector": {
    "eating_state": {
      "hunger": 0.8 → 0.1,  // 시작 → 종료
      "fullness": 0.3 → 0.9,
      "eatingSpeed": 0.6,  // 평균 속도 (20초/bite)
      "mindfulnessLevel": 0.7  // 포만감 체크 했으므로
    },
    "emotional_state": {
      "valence": 0.5,
      "anxiety": 0.2
    }
  },

  // 파생 데이터
  "derivedFeatures": {
    "fullnessCurveSlope": 0.4,  // 포만감 상승 속도
    "stoppedAtFullness": 9  // 어디서 멈췄는가
  }
}
```

**특징:**
- LoopStateWindow는 "식사 중 내 상태"를 담음
- Event (meal)와 StateWindow는 **같이 기록됨**
- StateWindow는 Event를 기반으로 **파생 계산**

---

## 📝 예시 4: 폭식 이벤트 (CoachOS 실제 데이터)

### 상황
> 금요일 저녁 8시, 회식 후 혼자 편의점 → 과자 3봉지 연달아 섭취 → 배부른데도 멈추지 못함

### Event로 기록 (⭕ 적절)

```json
{
  "eventId": "evt_binge_001",
  "eventType": "binge",  // 폭식 이벤트
  "timestamp": "2025-12-13T20:30:00+09:00",
  "payload": {
    "triggerContext": "회식 후 혼자 귀가",
    "location": "편의점",
    "items": ["새우깡", "포카칩", "초코파이"],
    "estimatedCalories": 1500,
    "stoppedReason": "physical_discomfort",  // 배가 아파서 멈춤
    "emotionalState": ["empty", "lonely", "anxious"]
  },
  "episodeId": "ep_friday_night_binge",

  // Inner Loop OS v3.0 구조 (CoachOS)
  "linkedStateId": "sw_binge_001",  // 연결된 상태 윈도우
  "labels": {
    "bingeType": "emotional_eating",
    "severity": "moderate",
    "coachVerified": true
  }
}
```

**특징:**
- 폭식은 **Event** (한 번의 원자적 사건)
- 하지만 일반 meal Event와 구분되는 특별한 eventType
- CoachOS에서 코치가 라벨링함 (coach/events 컬렉션)

---

### Episode로 기록 (⭕ 더 나은 분석 단위)

```json
{
  "episodeId": "ep_friday_night_binge",
  "episodeType": "binge_episode",
  "startTime": "2025-12-13T18:00:00+09:00",  // 회식 시작
  "endTime": "2025-12-13T21:00:00+09:00",  // 귀가 후 진정
  "status": "closed",
  "dominantLoopTypes": ["emotional", "eating", "dopamine"],

  "summary": "회식 → 혼자 귀가 → 편의점 폭식 → 후회",

  "containedEvents": [
    "evt_dinner_001",  // 회식 식사
    "evt_emotion_tag_001",  // 혼자 귀가 시 감정
    "evt_binge_001",  // 폭식
    "evt_emotion_tag_002"  // 후회/죄책감
  ],

  // Episode 레벨 분석
  "analysis": {
    "triggerPattern": "social_eating_followed_by_isolation",
    "loopSequence": ["Emotional → Dopamine → Eating"],
    "interventionPoint": "회식 후 바로 귀가 대신 산책"
  }
}
```

**언제 Episode로 묶는가?**
- 폭식 이벤트만 보면 "왜 일어났는지" 맥락 부족
- 회식 → 귀가 → 폭식의 전체 흐름을 보려면 Episode 필요
- **인과 분석**을 위해서는 Episode 단위가 필수

---

### LoopStateWindow로 기록

```json
// Window 1: 18:00-19:00 (회식 중)
{
  "stateWindowId": "sw_dinner",
  "episodeId": "ep_friday_night_binge",
  "startTime": "2025-12-13T18:00:00+09:00",
  "endTime": "2025-12-13T19:00:00+09:00",
  "timeScale": "meso",

  "stateVector": {
    "emotional_state": {
      "valence": 0.3,  // 약간 긍정적
      "anxiety": 0.6,  // 사회적 불안
      "social_pressure": 0.7
    },
    "eating_state": {
      "hunger": 0.2,
      "fullness": 0.7,
      "forced_eating": 0.5  // 분위기상 먹음
    },
    "nervous_state": {
      "arousal": 0.7  // 교감신경 활성 (긴장)
    }
  }
}

// Window 2: 20:00-21:00 (폭식 중)
{
  "stateWindowId": "sw_binge_001",
  "episodeId": "ep_friday_night_binge",
  "startTime": "2025-12-13T20:00:00+09:00",
  "endTime": "2025-12-13T21:00:00+09:00",
  "timeScale": "meso",

  "stateVector": {
    "emotional_state": {
      "valence": -0.7,  // 부정적
      "emptiness": 0.9,  // 공허감 극대
      "loneliness": 0.8
    },
    "eating_state": {
      "hunger": 0.1,  // 배고프지 않음
      "fullness": 0.9,  // 배부름
      "compulsive_eating": 0.9  // 강박적 섭취
    },
    "reward_state": {
      "cravingLevel": 0.9,
      "dopamineChasing": 0.9  // 도파민 추구 강함
    },
    "nervous_state": {
      "arousal": 0.8,  // 여전히 높음
      "shutdown": 0.3  // 감정 차단
    }
  }
}
```

**특징:**
- LoopStateWindow는 **그 순간의 루프 상태**를 담음
- Event (binge)가 **왜 일어났는지**는 StateWindow로 설명
- Event = "무슨 일", StateWindow = "내 상태"

---

## 📝 예시 5: 일주일간의 야식 패턴 (잘못된 사용 vs 올바른 사용)

### 상황
> 일주일 동안 매일 저녁 9시 이후 야식 먹음. 패턴 분석 필요.

### ❌ 잘못된 방식: Event 하나로 통합

```json
// 이렇게 쓰면 안 됨!
{
  "eventId": "evt_week_pattern",
  "eventType": "weekly_night_snack_pattern",
  "timestamp": "2025-12-15T00:00:00+09:00",
  "payload": {
    "weekStart": "2025-12-09",
    "weekEnd": "2025-12-15",
    "totalSnacks": 7,
    "avgTime": "21:30",
    "pattern": "매일 야식"
  }
}
```

**왜 잘못되었는가?**
- Event는 **원자적 사실**이어야 함
- "일주일간의 패턴"은 여러 Event의 **집합/분석 결과**
- 시작/종료가 있는 기간 → Episode로 써야 함

---

### ⭕ 올바른 방식 1: 각 야식을 Event로

```json
// Event 1 (월요일)
{
  "eventId": "evt_snack_mon",
  "eventType": "meal",
  "timestamp": "2025-12-09T21:30:00+09:00",
  "payload": {
    "mealType": "야식",
    "items": ["라면"],
    "emotionalState": ["stressed"]
  },
  "episodeId": "ep_week_pattern"
}

// Event 2 (화요일)
{
  "eventId": "evt_snack_tue",
  "eventType": "meal",
  "timestamp": "2025-12-10T21:45:00+09:00",
  "payload": {
    "mealType": "야식",
    "items": ["치킨"],
    "emotionalState": ["bored"]
  },
  "episodeId": "ep_week_pattern"
}

// ... (수~일 계속)
```

---

### ⭕ 올바른 방식 2: Episode로 주간 패턴 컨테이너

```json
{
  "episodeId": "ep_week_pattern",
  "episodeType": "weekly_pattern",
  "startTime": "2025-12-09T00:00:00+09:00",
  "endTime": "2025-12-15T23:59:59+09:00",
  "status": "closed",
  "dominantLoopTypes": ["habit", "emotional", "eating"],

  "summary": "일주일간 매일 21:00-22:00 사이 야식 패턴",

  "containedEvents": [
    "evt_snack_mon",
    "evt_snack_tue",
    "evt_snack_wed",
    "evt_snack_thu",
    "evt_snack_fri",
    "evt_snack_sat",
    "evt_snack_sun"
  ],

  "patternAnalysis": {
    "frequency": "daily",
    "avgTime": "21:30",
    "triggerPattern": "저녁 일정 종료 → 집 도착 → 야식",
    "dominantEmotion": "stress"
  }
}
```

---

### ⭕ 올바른 방식 3: LoopStateWindow로 일일 상태 추적

```json
// 월요일 저녁 상태 (21:00-22:00)
{
  "stateWindowId": "sw_mon_evening",
  "episodeId": "ep_week_pattern",
  "startTime": "2025-12-09T21:00:00+09:00",
  "endTime": "2025-12-09T22:00:00+09:00",
  "timeScale": "meso",

  "stateVector": {
    "emotional_state": {"valence": -0.5, "stress": 0.8},
    "eating_state": {"hunger": 0.3, "craving": 0.7},
    "habit_state": {"contextTrigger": 0.9, "automaticity": 0.8}
  }
}

// 화요일 저녁 상태 (21:00-22:00)
{
  "stateWindowId": "sw_tue_evening",
  "episodeId": "ep_week_pattern",
  "startTime": "2025-12-10T21:00:00+09:00",
  "endTime": "2025-12-10T22:00:00+09:00",
  "timeScale": "meso",

  "stateVector": {
    "emotional_state": {"valence": -0.3, "boredom": 0.7},
    "eating_state": {"hunger": 0.2, "craving": 0.6},
    "habit_state": {"contextTrigger": 0.9, "automaticity": 0.9}  // 자동성 증가
  }
}

// ... (수~일 계속)
```

**정리:**
- **Event:** 각 야식을 개별 기록
- **Episode:** 일주일을 하나의 분석 단위로 묶음
- **LoopStateWindow:** 매일 저녁 상태를 추적하여 패턴 변화 관찰

---

## 🚫 "이건 Event로 쓰면 안 된다" 리스트

### 1. ❌ 기간/프로세스를 Event로 기록

**잘못된 예:**
```json
{
  "eventType": "3_month_coaching_program",
  "timestamp": "2025-12-01T00:00:00+09:00",
  "payload": {
    "duration": "3_months",
    "sessions": 12
  }
}
```

**올바른 방식:** Episode 또는 Macro Episode로 기록

---

### 2. ❌ 여러 사건을 한 Event에 압축

**잘못된 예:**
```json
{
  "eventType": "daily_routine",
  "timestamp": "2025-12-17T00:00:00+09:00",
  "payload": {
    "breakfast": {...},
    "lunch": {...},
    "dinner": {...},
    "snack": {...}
  }
}
```

**올바른 방식:** 각각 별도 Event로 기록하고 Episode로 묶음

---

### 3. ❌ 분석/요약 결과를 Event로 기록

**잘못된 예:**
```json
{
  "eventType": "weekly_summary",
  "timestamp": "2025-12-15T00:00:00+09:00",
  "payload": {
    "totalMeals": 21,
    "avgMealDuration": 15,
    "pattern": "저녁 야식 증가"
  }
}
```

**올바른 방식:** Summary는 별도 파생 데이터 (Episode 또는 별도 컬렉션)

---

### 4. ❌ 상태/느낌을 시점 없이 Event로 기록

**잘못된 예:**
```json
{
  "eventType": "feeling_stressed",
  "timestamp": "2025-12-17T18:00:00+09:00",
  "payload": {
    "stress": "high",
    "anxiety": "moderate"
  }
}
```

**문제:**
- "18:00에 스트레스를 느꼈다"는 Event ⭕
- 하지만 "18:00-19:00 동안의 스트레스 상태"는 LoopStateWindow가 더 적절

**더 나은 방식:**
- 순간 감정 태그 → Event (emotion_tag)
- 지속적인 상태 → LoopStateWindow

---

### 5. ❌ ActionExecution을 Event로 기록

**잘못된 예:**
```json
{
  "eventType": "breathing_exercise_recommendation",
  "timestamp": "2025-12-17T19:00:00+09:00",
  "payload": {
    "action": "호흡 운동 5분",
    "performed": true
  }
}
```

**올바른 방식:** ActionExecution 엔티티 사용 (v0.1 스펙)

```json
{
  "actionExecutionId": "act_001",
  "episodeId": "ep_evening_001",
  "actionName": "breathing_exercise",
  "actor": "coach",
  "parameters": {"duration": 300},
  "startTime": "2025-12-17T19:00:00+09:00",
  "endTime": "2025-12-17T19:05:00+09:00",
  "adherence": "performed"
}
```

**이유:**
- Event는 **관찰** (무슨 일이 일어났는가)
- ActionExecution은 **개입** (인과 스위치)
- 둘을 섞으면 인과 추론 불가능

---

### 6. ❌ OutcomeMeasurement를 Event로 기록

**잘못된 예:**
```json
{
  "eventType": "intervention_result",
  "timestamp": "2025-12-17T21:00:00+09:00",
  "payload": {
    "intervention": "호흡 운동",
    "result": "야식 먹지 않음"
  }
}
```

**올바른 방식:** OutcomeMeasurement 엔티티 사용

```json
{
  "outcomeId": "out_001",
  "actionExecutionId": "act_001",
  "window": "next_2h",
  "metricName": "night_snack_avoided",
  "value": 1,  // boolean을 숫자로
  "baselineValue": 0
}
```

---

### 7. ❌ LoopStateWindow를 Event로 기록

**잘못된 예:**
```json
{
  "eventType": "loop_state",
  "timestamp": "2025-12-17T19:00:00+09:00",
  "payload": {
    "emotional": 0.7,
    "eating": 0.5
  }
}
```

**올바른 방식:** LoopStateWindow 엔티티 사용 (30-60분 윈도우)

---

## ✅ 올바른 Event 사용 체크리스트

Event로 기록하기 전에 다음을 확인하세요:

- [ ] **원자적인가?** (더 이상 쪼갤 수 없는 단일 사실인가?)
- [ ] **한 시점인가?** (시작/종료가 명확한 기간이 아닌가?)
- [ ] **관찰 가능한가?** (측정/기록 가능한 사실인가?)
- [ ] **개입이 아닌가?** (ActionExecution과 섞이지 않았는가?)
- [ ] **파생 데이터가 아닌가?** (다른 Event들로부터 계산된 것이 아닌가?)

**하나라도 "아니오"라면 Event가 아닐 수 있습니다.**

---

## 📊 요약 테이블: 언제 무엇을 쓰는가?

| 상황 | Event | Episode | LoopStateWindow |
|------|-------|---------|-----------------|
| 식사 한 끼 | ⭕ meal Event | ⭕ 식전후 포함 시 Episode | ⭕ 식사 중 상태 |
| 폭식 한 번 | ⭕ binge Event | ⭕ 트리거~폭식~후회 전체 | ⭕ 폭식 직전/중 상태 |
| 감정 태그 | ⭕ emotion_tag Event | ❌ | ❌ (단, StateWindow에 반영) |
| 30분 통화 코칭 | ❌ | ⭕ coaching_session Episode | ❌ |
| 일주일 패턴 | ❌ (각 야식은 Event) | ⭕ weekly_pattern Episode | ⭕ 매일 저녁 상태 |
| 호흡 운동 실행 | ❌ → ActionExecution | ❌ | ❌ |
| 개입 결과 측정 | ❌ → OutcomeMeasurement | ❌ | ⭕ 결과 윈도우 상태 |
| 주간 리포트 | ❌ → Summary | ⭕ 리포트 생성 프로세스 | ❌ |

---

## 🎯 핵심 원칙 (다시 강조)

1. **Event는 원자적 사실만**
   - "12:30에 점심 먹음" ⭕
   - "오늘 3끼 잘 먹음" ❌

2. **Episode는 의미 있는 묶음**
   - Event들을 담는 컨테이너
   - 시작/종료가 명확한 단위

3. **LoopStateWindow는 상태 스냅샷**
   - "그 시점에 내 루프는 어떤 상태였는가"
   - Event가 "무엇"을 설명한다면, StateWindow는 "왜"를 설명

4. **Action은 Event가 아니다**
   - Event = 관찰 (상관)
   - Action = 개입 (인과)

---

## 📚 참고 자료

- [[Ontology-lite v0.1 (ILOS) — 규칙(4조건) + 최소 엔티티 스펙]]
- [[Inner Loop OS 정의v1]]
- `/Users/gim-eunhyang/dev/flutter/sosi/docs/firestore_schema.json` (SoSi 실제 구조)
- `/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web/docs/prd/COACHOS/techspec.md` (CoachOS 설계)

---

**다음 단계:** [[Event-Episode-LoopStateWindow 경계 실습]]