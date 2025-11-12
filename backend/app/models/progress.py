import uuid
from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class ProgressSummary(SQLModel, table=True):
    __tablename__ = "ProgressSummary"
    
    progress_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id")
    user_id: uuid.UUID = Field(foreign_key="User.user_id")
    mastered_terms: int = Field(default=0)
    reviewing_terms: int = Field(default=0)
    forgotten_terms: int = Field(default=0)
    average_recall_score: float = Field(default=0.0)
    average_response_time: float = Field(default=0.0)
    streak_days: int = Field(default=0)
    completion_rate: float = Field(default=0.0)
    next_due_date: datetime | None = Field(default=None)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    study_set: "StudySet" = Relationship(back_populates="progress_summaries")
    user: "User" = Relationship(back_populates="progress_summaries")

