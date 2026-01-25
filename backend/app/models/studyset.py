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
    category_id: uuid.UUID | None = Field(default=None, foreign_key="Category.category_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    owner: "User" = Relationship(back_populates="study_sets")
    category: "Category" = Relationship(back_populates="study_sets")
    terms: list["Term"] = Relationship(back_populates="study_set")
    tests: list["Test"] = Relationship(back_populates="study_set")
    ai_generated_contents: list["AIGeneratedContents"] = Relationship(back_populates="study_set")
    study_activities: list["StudyActivity"] = Relationship(back_populates="study_set")
    progress_summaries: list["ProgressSummary"] = Relationship(back_populates="study_set")
    classes: list["ClassStudySet"] = Relationship(back_populates="studyset")
    enrolled_students: list["StudentStudySet"] = Relationship(
        back_populates="studyset",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )



