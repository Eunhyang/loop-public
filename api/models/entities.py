"""
Pydantic Models for LOOP Entities

Task/Project 생성 및 수정을 위한 데이터 모델
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class Link(BaseModel):
    """외부 링크 (Google Drive, Figma 등)"""
    label: str = Field(..., description="표시 이름")
    url: str = Field(..., description="전체 URL (https:// 또는 http://)")


class TaskCreate(BaseModel):
    """Task 생성 요청"""
    entity_name: str = Field(..., description="Task 이름")
    project_id: str = Field(..., description="프로젝트 ID (예: prj-001)")
    assignee: str = Field(..., description="담당자 ID (예: eunhyang)")
    priority: str = Field(default="medium", description="schema_constants.yaml 참조")
    start_date: Optional[str] = Field(default=None, description="시작일 (YYYY-MM-DD)")
    due: Optional[str] = Field(default=None, description="마감일 (YYYY-MM-DD)")
    status: str = Field(default="todo", description="schema_constants.yaml 참조")
    notes: Optional[str] = Field(default=None, description="노트 (마크다운 지원)")
    tags: List[str] = Field(default_factory=list, description="태그")
    # Auto-validation 옵션
    auto_validate: bool = Field(default=False, description="생성 후 AI 스키마 검증 자동 실행")


class TaskUpdate(BaseModel):
    """Task 수정 요청"""
    entity_name: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[str] = None
    due: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = Field(default=None, json_schema_extra={"items": {"type": "string"}})
    # Agent Builder 파이프라인용 추가 필드
    conditions_3y: Optional[List[str]] = Field(default=None, description="3년 전략 연결 (cond-a ~ cond-e)", json_schema_extra={"items": {"type": "string"}})
    closed: Optional[str] = Field(default=None, description="완료일 (YYYY-MM-DD)")
    closed_inferred: Optional[str] = Field(default=None, description="closed 추론 출처: updated | git_commit_date | today")
    project_id: Optional[str] = Field(default=None, description="프로젝트 ID")
    # 외부 링크
    links: Optional[List[Link]] = Field(default=None, description="외부 링크 목록")


class ExpectedImpactInput(BaseModel):
    """Expected Impact 입력 (수동 설정용)"""
    tier: str = Field(default="operational", description="strategic | enabling | operational | none")
    impact_magnitude: str = Field(default="mid", description="high | mid | low")
    confidence: float = Field(default=0.7, ge=0.0, le=1.0, description="신뢰도")
    contributes: List[dict] = Field(default_factory=list, description="[{cond_id, weight}]")


class ProjectCreate(BaseModel):
    """Project 생성 요청"""
    entity_name: str = Field(..., description="프로젝트 이름")
    owner: str = Field(..., description="책임자 ID")
    parent_id: Optional[str] = Field(default=None, description="부모 Track/Hypothesis ID")
    priority: str = Field(default="medium", description="우선순위")
    conditions_3y: List[str] = Field(default_factory=list, description="3년 조건 연결 (cond-a ~ cond-e)")
    # Autofill 옵션
    autofill_expected_impact: bool = Field(default=False, description="True면 LLM으로 Expected Impact 자동 채움")
    expected_impact: Optional[ExpectedImpactInput] = Field(default=None, description="수동 Expected Impact 설정")
    llm_provider: str = Field(default="openai", description="openai | anthropic")
    # Auto-validation 옵션
    auto_validate: bool = Field(default=False, description="생성 후 AI 스키마 검증 자동 실행")


class ProjectUpdate(BaseModel):
    """Project 수정 요청"""
    entity_name: Optional[str] = None
    owner: Optional[str] = None
    parent_id: Optional[str] = None
    status: Optional[str] = None
    priority_flag: Optional[str] = None
    deadline: Optional[str] = None
    hypothesis_text: Optional[str] = None
    tags: Optional[List[str]] = Field(default=None, json_schema_extra={"items": {"type": "string"}})
    # 외부 링크
    links: Optional[List[Link]] = Field(default=None, description="외부 링크 목록")


class ValidationResult(BaseModel):
    """Auto-validation 결과"""
    validated: bool = Field(default=False, description="검증 수행 여부")
    issues_found: int = Field(default=0, description="발견된 이슈 수")
    pending_created: bool = Field(default=False, description="pending review 생성 여부")
    pending_id: Optional[str] = Field(default=None, description="생성된 pending review ID")
    run_id: Optional[str] = Field(default=None, description="검증 run_id")


class TaskResponse(BaseModel):
    """Task 응답"""
    success: bool
    task_id: str
    file_path: Optional[str] = None
    message: str
    validation: Optional[ValidationResult] = Field(default=None, description="auto_validate=True 시 검증 결과")


class ProjectResponse(BaseModel):
    """Project 응답"""
    success: bool
    project_id: str
    directory: Optional[str] = None
    message: str
    # Autofill 결과 (옵션)
    expected_impact: Optional[dict] = Field(default=None, description="자동/수동 설정된 Expected Impact")
    expected_score: Optional[float] = Field(default=None, description="계산된 A Score")
    # Auto-validation 결과
    validation: Optional[ValidationResult] = Field(default=None, description="auto_validate=True 시 검증 결과")


# ============================================
# Hypothesis Models
# ============================================

class HypothesisCreate(BaseModel):
    """Hypothesis 생성 요청"""
    entity_name: str = Field(..., description="가설 이름")
    parent_id: str = Field(..., description="Track ID (필수, 예: trk-1)")
    hypothesis_question: str = Field(..., description="질문 형태 ('?'로 끝나야 함)")
    success_criteria: str = Field(..., description="성공 판정 기준")
    failure_criteria: str = Field(..., description="실패 판정 기준")
    measurement: str = Field(..., description="측정 방법 (어디서/무엇을/어떻게)")
    horizon: str = Field(default="2026", description="검증 목표 연도 (4자리)")
    loop_layer: List[str] = Field(default_factory=list, description="emotional | eating | habit | reward | autonomic")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="신뢰도 (0.0~1.0)")
    evidence_status: str = Field(default="assumed", description="schema_constants.yaml 참조")
    deadline: Optional[str] = Field(default=None, description="판정 마감일 (YYYY-MM-DD)")
    tags: List[str] = Field(default_factory=list, description="태그")
    # Project 연결 (선택)
    project_ids: List[str] = Field(default_factory=list, description="연결할 프로젝트 IDs (prj-XXX.validates에 추가)")
    # Auto-validation 옵션
    auto_validate: bool = Field(default=False, description="생성 후 AI 스키마 검증 자동 실행")
    llm_provider: str = Field(default="openai", description="openai | anthropic")


class HypothesisUpdate(BaseModel):
    """Hypothesis 수정 요청"""
    entity_name: Optional[str] = None
    hypothesis_question: Optional[str] = None
    success_criteria: Optional[str] = None
    failure_criteria: Optional[str] = None
    measurement: Optional[str] = None
    horizon: Optional[str] = None
    loop_layer: Optional[List[str]] = Field(default=None, json_schema_extra={"items": {"type": "string"}})
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    evidence_status: Optional[str] = None
    deadline: Optional[str] = None
    tags: Optional[List[str]] = Field(default=None, json_schema_extra={"items": {"type": "string"}})


class HypothesisResponse(BaseModel):
    """Hypothesis 응답"""
    success: bool
    hypothesis_id: str
    file_path: Optional[str] = None
    message: str
    # Auto-validation 결과
    validation: Optional[ValidationResult] = Field(default=None, description="auto_validate=True 시 검증 결과")
    # Project 연결 결과
    linked_projects: List[str] = Field(default_factory=list, description="validates에 연결된 프로젝트 IDs")


# ============================================
# Program-Round Join Models (tsk-017-09)
# ============================================

class ProgramSummary(BaseModel):
    """Program 요약 - 안전한 필드만 노출 (민감 정보 제외)"""
    entity_id: str = Field(..., description="Program ID (예: pgm-vault-system)")
    entity_name: str = Field(..., description="Program 이름")
    entity_type: str = Field(default="Program", description="엔티티 타입")
    status: Optional[str] = Field(default=None, description="상태")
    program_type: Optional[str] = Field(default=None, description="Program 유형")
    parent_id: Optional[str] = Field(default=None, description="부모 Track ID")
    tags: List[str] = Field(default_factory=list, description="태그")
    created: Optional[str] = Field(default=None, description="생성일")
    updated: Optional[str] = Field(default=None, description="수정일")


class RoundSummary(BaseModel):
    """Round(Project) 요약 - 민감 필드 제외

    exec vault에서 조회된 Project 정보 중 안전한 필드만 포함.
    salary, contract_terms, budget_details 등 민감 필드 제외.
    """
    project_id: str = Field(..., description="Project ID")
    entity_name: str = Field(..., description="Project 이름")
    status: str = Field(..., description="상태")
    owner: str = Field(..., description="책임자")
    cycle: Optional[str] = Field(default=None, description="사이클/라운드 (예: W33, 2026Q1)")
    created: Optional[str] = Field(default=None, description="생성일 (YYYY-MM-DD)")
    updated: Optional[str] = Field(default=None, description="수정일 (YYYY-MM-DD)")
    hypothesis_text: Optional[str] = Field(default=None, description="프로젝트 가설")
    parent_id: Optional[str] = Field(default=None, description="부모 Track ID")
    conditions_3y: List[str] = Field(default_factory=list, description="3년 조건 연결")


class ProgramRoundsResponse(BaseModel):
    """Program + Rounds 조인 응답

    GET /api/admin/programs/{pgm_id}/rounds 엔드포인트 응답.
    Program 정보와 연결된 Round(Project) 목록을 함께 반환.

    total_count vs returned_count:
    - total_count: 실제 존재하는 전체 Round 수
    - returned_count: limit 적용 후 반환된 Round 수
    """
    program: ProgramSummary = Field(..., description="Program 요약 정보")
    rounds: List[RoundSummary] = Field(default_factory=list, description="연결된 Round(Project) 목록")
    total_count: int = Field(..., description="실제 존재하는 전체 Round 수 (페이지네이션용)")
    returned_count: int = Field(..., description="이번 응답에서 반환된 Round 수 (limit 적용)")
    limit_applied: int = Field(..., description="적용된 limit 값")
