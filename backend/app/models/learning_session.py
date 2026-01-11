import uuid
from datetime import datetime
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel


class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class LearningSession(SQLModel, table=True):
    __tablename__ = "LearningSession"
    
    session_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="User.user_id")
    studyset_id: uuid.UUID | None = Field(default=None, foreign_key="StudySet.studyset_id")
    session_type: str = Field(default="flashcard")  # flashcard, quick_review, test
    status: SessionStatus = Field(default=SessionStatus.ACTIVE)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: datetime | None = Field(default=None)
    total_cards: int = Field(default=0)
    completed_cards: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: "User" = Relationship(back_populates="learning_sessions")
    reviews: list["SessionReview"] = Relationship(back_populates="session")


class SessionReview(SQLModel, table=True):
    __tablename__ = "SessionReview"
    
    review_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="LearningSession.session_id")
    term_id: uuid.UUID = Field(foreign_key="Term.term_id")
    recall_score: int = Field(default=0)  # 0-5
    response_time: float = Field(default=0.0)  # seconds
    hint_used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    session: LearningSession = Relationship(back_populates="reviews")
    term: "Term" = Relationship()
