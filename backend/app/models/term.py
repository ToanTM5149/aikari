import uuid
from datetime import datetime

from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel


class Term(SQLModel, table=True):
    __tablename__ = "Term"
    
    term_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id")
    term_text: str = Field(max_length=255)
    definition: str = Field(sa_column=Column(Text))
    example: str | None = Field(default=None, sa_column=Column(Text))
    category: str | None = Field(default=None, max_length=100)
    subcategory: str | None = Field(default=None, max_length=100)
    image_url: str | None = Field(default=None, max_length=1024)
    attributes: dict | None = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    study_set: "StudySet" = Relationship(back_populates="terms")
    study_activities: list["StudyActivity"] = Relationship(back_populates="term")


