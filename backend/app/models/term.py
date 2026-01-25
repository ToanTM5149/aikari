import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models import StudySet, StudyActivity, StudySetTerm


class Term(SQLModel, table=True):
    __tablename__ = "Term"

    term_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    term_text: str = Field(max_length=255)
    definition: str = Field(sa_column=Column(Text))
    example: str | None = Field(default=None, sa_column=Column(Text))
    image_url: str | None = Field(default=None, sa_column=Column(Text))
    attributes: dict | None = Field(default=None, sa_column=Column(JSONB))
    paragraphs: list[dict[str, Any]] | None = Field(
        default_factory=list,  # Default to empty list thay vì None
        sa_column=Column(JSONB),
        description="Array of generated paragraphs, each with 'paragraph' text and 'metadata'"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    # PHASE 3.3: N:M relationship via junction table (single source of truth)
    studyset_terms: list["StudySetTerm"] = Relationship(
        back_populates="term",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    study_activities: list["StudyActivity"] = Relationship(back_populates="term")


