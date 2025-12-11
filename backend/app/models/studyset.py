import uuid
from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import ContentType


class StudySet(SQLModel, table=True):
    __tablename__ = "StudySet"
    
    studyset_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=256)
    owner_id: uuid.UUID = Field(foreign_key="User.user_id")
    content_type: ContentType = Field(default=ContentType.DEFAULT)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    owner: "User" = Relationship(back_populates="study_sets")
    terms: list["Term"] = Relationship(back_populates="study_set")
    tests: list["Test"] = Relationship(back_populates="study_set")
    attributes: list["Attribute"] = Relationship(back_populates="study_set")
    ai_generated_contents: list["AIGeneratedContents"] = Relationship(back_populates="study_set")
    study_activities: list["StudyActivity"] = Relationship(back_populates="study_set")
    progress_summaries: list["ProgressSummary"] = Relationship(back_populates="study_set")


