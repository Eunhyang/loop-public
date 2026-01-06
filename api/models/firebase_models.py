"""
Pydantic models for Firebase Firestore collections
All models include serialization/deserialization helpers
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from enum import Enum


class AssetType(str, Enum):
    """Asset types for ContentOS"""
    thumbnail = "thumbnail"
    script = "script"
    video = "video"


class PublishStatus(str, Enum):
    """Publish status for ContentOS"""
    draft = "draft"
    scheduled = "scheduled"
    published = "published"
    failed = "failed"


class ReviewStatus(str, Enum):
    """Review status for pending reviews"""
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


# ===== ContentOS Models =====

class ContentOSContent(BaseModel):
    """ContentOS content candidate model"""
    id: Optional[str] = None
    keyword: str
    videoId: str
    title: str
    channelName: str
    marketScore: float = Field(ge=0, le=100)
    fitScore: float = Field(ge=0, le=100)
    saturation: float = Field(ge=0, le=100)
    finalScore: float = Field(ge=0, le=100)
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document data"""
        data = self.model_dump(exclude={'id', 'createdAt', 'updatedAt'})
        if self.createdAt is None:
            data['createdAt'] = SERVER_TIMESTAMP
        if self.updatedAt is None:
            data['updatedAt'] = SERVER_TIMESTAMP
        return data

    @classmethod
    def from_firestore(cls, doc_id: str, data: Dict[str, Any]) -> 'ContentOSContent':
        """Create from Firestore document"""
        # Convert Firestore timestamps to datetime
        if 'createdAt' in data and hasattr(data['createdAt'], 'timestamp'):
            data['createdAt'] = datetime.fromtimestamp(data['createdAt'].timestamp())
        if 'updatedAt' in data and hasattr(data['updatedAt'], 'timestamp'):
            data['updatedAt'] = datetime.fromtimestamp(data['updatedAt'].timestamp())
        return cls(id=doc_id, **data)


class ContentOSPublish(BaseModel):
    """ContentOS publish record model"""
    id: Optional[str] = None
    contentId: str
    youtubeVideoId: str
    publishedAt: Optional[datetime] = None
    views: int = Field(ge=0, default=0)
    ctr: float = Field(ge=0, le=100, default=0.0)
    avgViewDuration: float = Field(ge=0, default=0.0)
    status: PublishStatus = PublishStatus.draft

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document data"""
        data = self.model_dump(exclude={'id', 'publishedAt'})
        data['status'] = self.status.value
        if self.publishedAt is None:
            data['publishedAt'] = SERVER_TIMESTAMP
        return data

    @classmethod
    def from_firestore(cls, doc_id: str, data: Dict[str, Any]) -> 'ContentOSPublish':
        """Create from Firestore document"""
        if 'publishedAt' in data and hasattr(data['publishedAt'], 'timestamp'):
            data['publishedAt'] = datetime.fromtimestamp(data['publishedAt'].timestamp())
        return cls(id=doc_id, **data)


class ContentOSAsset(BaseModel):
    """ContentOS asset model"""
    id: Optional[str] = None
    type: AssetType
    url: str
    contentId: str
    createdAt: Optional[datetime] = None

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document data"""
        data = self.model_dump(exclude={'id', 'createdAt'})
        data['type'] = self.type.value
        if self.createdAt is None:
            data['createdAt'] = SERVER_TIMESTAMP
        return data

    @classmethod
    def from_firestore(cls, doc_id: str, data: Dict[str, Any]) -> 'ContentOSAsset':
        """Create from Firestore document"""
        if 'createdAt' in data and hasattr(data['createdAt'], 'timestamp'):
            data['createdAt'] = datetime.fromtimestamp(data['createdAt'].timestamp())
        return cls(id=doc_id, **data)


# ===== Vault Sync Models =====

class VaultProject(BaseModel):
    """LOOP Vault Project sync model"""
    id: Optional[str] = None
    entity_id: str
    entity_name: str
    status: str
    owner: str
    syncedAt: Optional[datetime] = None

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document data"""
        data = self.model_dump(exclude={'id', 'syncedAt'})
        if self.syncedAt is None:
            data['syncedAt'] = SERVER_TIMESTAMP
        return data

    @classmethod
    def from_firestore(cls, doc_id: str, data: Dict[str, Any]) -> 'VaultProject':
        """Create from Firestore document"""
        if 'syncedAt' in data and hasattr(data['syncedAt'], 'timestamp'):
            data['syncedAt'] = datetime.fromtimestamp(data['syncedAt'].timestamp())
        return cls(id=doc_id, **data)


class VaultTask(BaseModel):
    """LOOP Vault Task sync model"""
    id: Optional[str] = None
    entity_id: str
    entity_name: str
    project_id: str
    status: str
    assignee: str
    syncedAt: Optional[datetime] = None

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document data"""
        data = self.model_dump(exclude={'id', 'syncedAt'})
        if self.syncedAt is None:
            data['syncedAt'] = SERVER_TIMESTAMP
        return data

    @classmethod
    def from_firestore(cls, doc_id: str, data: Dict[str, Any]) -> 'VaultTask':
        """Create from Firestore document"""
        if 'syncedAt' in data and hasattr(data['syncedAt'], 'timestamp'):
            data['syncedAt'] = datetime.fromtimestamp(data['syncedAt'].timestamp())
        return cls(id=doc_id, **data)


class VaultPendingReview(BaseModel):
    """LOOP Vault Pending Review sync model"""
    id: Optional[str] = None
    entity_type: str
    entity_id: str
    reason: str
    suggested_changes: Dict[str, Any] = Field(default_factory=dict)
    status: ReviewStatus = ReviewStatus.pending
    createdAt: Optional[datetime] = None

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document data"""
        data = self.model_dump(exclude={'id', 'createdAt'})
        data['status'] = self.status.value
        if self.createdAt is None:
            data['createdAt'] = SERVER_TIMESTAMP
        return data

    @classmethod
    def from_firestore(cls, doc_id: str, data: Dict[str, Any]) -> 'VaultPendingReview':
        """Create from Firestore document"""
        if 'createdAt' in data and hasattr(data['createdAt'], 'timestamp'):
            data['createdAt'] = datetime.fromtimestamp(data['createdAt'].timestamp())
        return cls(id=doc_id, **data)


# ===== KPI Models =====

class KPIDef(BaseModel):
    """KPI definition model"""
    id: Optional[str] = None
    name: str
    metric: str
    target: float
    window: str  # e.g., "daily", "weekly", "monthly"
    createdAt: Optional[datetime] = None

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document data"""
        data = self.model_dump(exclude={'id', 'createdAt'})
        if self.createdAt is None:
            data['createdAt'] = SERVER_TIMESTAMP
        return data

    @classmethod
    def from_firestore(cls, doc_id: str, data: Dict[str, Any]) -> 'KPIDef':
        """Create from Firestore document"""
        if 'createdAt' in data and hasattr(data['createdAt'], 'timestamp'):
            data['createdAt'] = datetime.fromtimestamp(data['createdAt'].timestamp())
        return cls(id=doc_id, **data)


class KPIRollupDay(BaseModel):
    """KPI daily rollup model (nested under kpi_rollups/{scopeId}/days/{yyyyMMdd})"""
    id: Optional[str] = None  # Document ID is yyyyMMdd
    date: str  # YYYY-MM-DD format
    metrics: Dict[str, Any] = Field(default_factory=dict)
    computed: Optional[datetime] = None

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document data"""
        data = self.model_dump(exclude={'id', 'computed'})
        if self.computed is None:
            data['computed'] = SERVER_TIMESTAMP
        return data

    @classmethod
    def from_firestore(cls, doc_id: str, data: Dict[str, Any]) -> 'KPIRollupDay':
        """Create from Firestore document"""
        if 'computed' in data and hasattr(data['computed'], 'timestamp'):
            data['computed'] = datetime.fromtimestamp(data['computed'].timestamp())
        return cls(id=doc_id, **data)


# ===== Response Models =====

class PaginatedResponse(BaseModel):
    """Generic paginated response"""
    items: List[Any]
    total: int
    limit: int
    offset: int
    has_more: bool
