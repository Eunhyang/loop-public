- 스키마 작업 한 클로드 > n8n 작업내용 보면서 주기적으로 실행해야할 파이프라인 제안  
- MMDP-lite적용
- N8n LLM서버에서 호출 + agent토론 도입
- 유튜브 콘텐츠등 데이터 관련 통합 n8n으로 자동화
- 아래 내용 반영
- (1) Evidence의 “신뢰 구조”가 자동으로 남아야 함

B(Realized)가 아무리 계산돼도, 근거가 매번 다르면 결국 “그럴듯한 숫자”가 돼.
그래서 Evidence에 “어디서/어떻게 생긴 증거인지”가 항상 구조적으로 남아야 해.

provenance: 자동/수기/혼합

sample_size (또는 sample_ids)

measurement_quality (low/med/high 정도)

counterfactual(대조군/전후비교 유무)

confounders(외부 변수 여부)

query/version(어떤 규칙/버전으로 계산했는지)

이걸 Vault+n8n으로도 lite하게 충분히 만들 수 있어.
(팔란티어가 강한 건 이걸 “플랫폼 레벨”로 해준다는 점이지만, 지금은 너희가 직접 최소 버전만 만들어도 됨)

(2) 승인 기반 트랜잭션(ActionExecution) 로그

LoopOS ontology-lite 문서가 말하듯, “인과 스위치는 ActionExecution”이고 그건 트랜잭션이어야 해.
회사 운영에서도 동일하게:

누가 무엇을 승인했는지

언제 어떤 판단으로 바꿨는지
이게 1줄 로그로라도 남아야, 나중에 팔란티어 없이도 “감사/재현”이 가능해져.
