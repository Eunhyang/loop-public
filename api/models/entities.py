"""
Pydantic Models for LOOP Entities

Task/Project 생성 및 수정을 위한 데이터 모델
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    """Task 생성 요청"""
    entity_name: str = Field(..., description="Task 이름")
    project_id: str = Field(..., description="프로젝트 ID (예: prj-001)")
    assignee: str = Field(..., description="담당자 ID (예: eunhyang)")
    priority: str = Field(default="medium", description="우선순위: low/medium/high")
    start_date: Optional[str] = Field(default=None, description="시작일 (YYYY-MM-DD)")
    due: Optional[str] = Field(default=None, description="마감일 (YYYY-MM-DD)")
    status: str = Field(default="todo", description="상태: todo/doing/done/blocked")
    notes: Optional[str] = Field(default=None, description="노트 (마크다운 지원)")
    tags: List[str] = Field(default_factory=list, description="태그")


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


class ProjectCreate(BaseModel):
    """Project 생성 요청"""
    entity_name: str = Field(..., description="프로젝트 이름")
    owner: str = Field(..., description="책임자 ID")
    parent_id: Optional[str] = Field(default=None, description="부모 Track/Hypothesis ID")
    priority: str = Field(default="medium", description="우선순위")


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


class TaskResponse(BaseModel):
    """Task 응답"""
    success: bool
    task_id: str
    file_path: Optional[str] = None
    message: str


class ProjectResponse(BaseModel):
    """Project 응답"""
    success: bool
    project_id: str
    directory: Optional[str] = None
    message: str


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
    evidence_status: str = Field(default="planning", description="planning | validating | validated | falsified | learning")
    deadline: Optional[str] = Field(default=None, description="판정 마감일 (YYYY-MM-DD)")
    tags: List[str] = Field(default_factory=list, description="태그")


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
