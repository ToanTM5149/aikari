import uuid
from datetime import datetime

from sqlmodel import SQLModel
from typing import Any

from app.models.enums import ContentType


class StudySetBase(SQLModel):
    title: str
    description: str | None = None
    content_type: ContentType = ContentType.DEFAULT
    category: str | None = None


class StudySetCreate(StudySetBase):
    pass


class StudySetUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    content_type: ContentType | None = None
    category: str | None = None


class StudySetPublic(StudySetBase):
    studyset_id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    attributes: list[dict[str, Any]] | None = None
    term_count: int = 0  # Number of terms (cards) in this studyset
    last_activity_at: datetime | None = None  # Last time user studied this set
    progress: float = 0.0  # Completion rate (0-100)

