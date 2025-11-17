import uuid
from datetime import datetime

from sqlmodel import SQLModel

from app.models.enums import ContentType, TestType


class TestBase(SQLModel):
    title: str
    test_types: TestType = TestType.MULTIPLE_CHOICE
    total_questions: int = 0
    content_type: ContentType = ContentType.DEFAULT


class TestCreate(TestBase):
    studyset_id: uuid.UUID


class TestUpdate(SQLModel):
    title: str | None = None
    test_types: TestType | None = None
    total_questions: int | None = None
    content_type: ContentType | None = None


class TestPublic(TestBase):
    test_id: uuid.UUID
    studyset_id: uuid.UUID
    created_at: datetime

