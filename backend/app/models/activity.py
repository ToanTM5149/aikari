import uuid
from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class StudyActivity(SQLModel, table=True):
    __tablename__ = "StudyActivity"
    
    activity_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="User.user_id")
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id")
    term_id: uuid.UUID = Field(foreign_key="Term.term_id")
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: datetime | None = Field(default=None)
    is_correct: bool = Field(default=False)
    hint_used: bool = Field(default=False)
    retry_count: int = Field(default=0)
    recall_score: int = Field(default=0)  
    ef: float = Field(default=2.5)  
    interval: int = Field(default=0)  
    next_review_date: datetime | None = Field(default=None)
    response_time: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: "User" = Relationship(back_populates="study_activities")
    study_set: "StudySet" = Relationship(back_populates="study_activities")
    term: "Term" = Relationship(back_populates="study_activities")

