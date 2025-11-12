import uuid
from datetime import datetime

from sqlalchemy import Column, Text
from sqlmodel import Field, Relationship, SQLModel


class Term(SQLModel, table=True):
    __tablename__ = "Term"
    
    term_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id")
    term_text: str = Field(max_length=255)
    definition: str = Field(sa_column=Column(Text))
    example: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    study_set: "StudySet" = Relationship(back_populates="terms")
    study_activities: list["StudyActivity"] = Relationship(back_populates="term")


# Term Schemas
class TermBase(SQLModel):
    term_text: str
    definition: str
    example: str | None = None


class TermCreate(TermBase):
    studyset_id: uuid.UUID


class TermUpdate(SQLModel):
    term_text: str | None = None
    definition: str | None = None
    example: str | None = None


class TermPublic(TermBase):
    term_id: uuid.UUID
    studyset_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

