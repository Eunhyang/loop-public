"""
Pydantic Models for LOOP Entities

Task/Project 생성 및 수정을 위한 데이터 모델
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    """Task 생성 요청"""
    entity_name: str = Field(..., description="Task 이름")
    project_id: str = Field(..., description="프로젝트 ID (예: prj:001)")
    assignee: str = Field(..., description="담당자 ID (예: eunhyang)")
    priority: str = Field(default="medium", description="우선순위: low/medium/high")
    due: Optional[str] = Field(default=None, description="마감일 (YYYY-MM-DD)")
    status: str = Field(default="todo", description="상태: todo/doing/done/blocked")
    tags: List[str] = Field(default_factory=list, description="태그")


class TaskUpdate(BaseModel):
    """Task 수정 요청"""
    entity_name: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None
    due: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None


class ProjectCreate(BaseModel):
    """Project 생성 요청"""
    entity_name: str = Field(..., description="프로젝트 이름")
    owner: str = Field(..., description="책임자 ID")
    parent_id: Optional[str] = Field(default=None, description="부모 Track/Hypothesis ID")
    priority: str = Field(default="medium", description="우선순위")


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
