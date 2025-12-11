import uuid
from datetime import datetime

from sqlmodel import SQLModel
from typing import Any

from app.models.enums import ContentType


class StudySetBase(SQLModel):
    title: str
    description: str | None = None
    content_type: ContentType = ContentType.DEFAULT


class StudySetCreate(StudySetBase):
    pass


class StudySetUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    content_type: ContentType | None = None


class StudySetPublic(StudySetBase):
    studyset_id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    attributes: list[dict[str, Any]] | None = None

