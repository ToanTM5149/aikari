"""
Session-based learning schemas
"""
from datetime import datetime
import uuid
from pydantic import BaseModel

from app.models.learning_session import SessionStatus


class SessionReviewInput(BaseModel):
    """Review input during session"""
    term_id: uuid.UUID
    recall_score: int  # 0-5
    response_time: float = 0.0
    hint_used: bool = False


class StartSessionRequest(BaseModel):
    """Request to start a learning session"""
    studyset_id: uuid.UUID | None = None
    session_type: str = "flashcard"  # flashcard, quick_review, test
    total_cards: int = 0


class StartSessionResponse(BaseModel):
    """Response when starting a session"""
    session_id: uuid.UUID
    studyset_id: uuid.UUID | None
    session_type: str
    started_at: datetime
    total_cards: int
    terms: list = []  # List of NextTermResponse


class SubmitReviewRequest(BaseModel):
    """Submit a review during active session"""
    session_id: uuid.UUID
    term_id: uuid.UUID
    recall_score: int  # 0-5
    response_time: float = 0.0
    hint_used: bool = False


class SubmitReviewResponse(BaseModel):
    """Response after submitting a review"""
    review_id: uuid.UUID
    session_id: uuid.UUID
    completed_cards: int


class EndSessionRequest(BaseModel):
    """Request to end a session"""
    session_id: uuid.UUID
    reviews: list[SessionReviewInput] = []  # Batch reviews from frontend


class EndSessionResponse(BaseModel):
    """Response after ending a session"""
    session_id: uuid.UUID
    total_cards: int
    completed_cards: int
    activities_created: int
    duration_seconds: float
    next_review_dates_calculated: int


class SessionInfo(BaseModel):
    """Session information"""
    session_id: uuid.UUID
    studyset_id: uuid.UUID | None
    session_type: str
    status: SessionStatus
    started_at: datetime
    ended_at: datetime | None
    total_cards: int
    completed_cards: int
