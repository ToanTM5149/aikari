import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import GenerateType


class AIGeneratedContents(SQLModel, table=True):
    __tablename__ = "AIGeneratedContents"

    ai_content_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id")
    source_model: str = Field(max_length=100)  # e.g. GPT-4o
    generate_type: GenerateType
    prompt: str = Field(sa_column=Column(Text))
    output: dict[str, Any] = Field(sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    study_set: "StudySet" = Relationship(back_populates="ai_generated_contents")
