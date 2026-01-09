"""
Schemas for learning and progress tracking
"""
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# Learning Session Schemas

class LearningSessionStart(BaseModel):
    """Request to start a learning session"""
    studyset_id: uuid.UUID
    session_size: int = Field(default=20, ge=1, le=50, description="Number of cards per session")


class LearningSessionStartResponse(BaseModel):
    """Response when starting a learning session"""
    session_id: str
    studyset_id: uuid.UUID
    total_terms: int
    terms_in_session: int
    terms: list['NextTermResponse']  # List of terms for this session
    started_at: datetime


class NextTermResponse(BaseModel):
    """Response for next term to study"""
    term_id: uuid.UUID
    term_text: str
    definition: str
    example: str | None = None
    image_url: str | None = None
    category: str | None = None
    is_new: bool  # True if never studied before
    previous_recall_score: int | None = None
    next_review_date: datetime | None = None


class ReviewSubmission(BaseModel):
    """Submission of a review for a term"""
    term_id: uuid.UUID
    recall_score: int = Field(ge=0, le=5, description="Quality of recall (0-5)")
    hint_used: bool = False
    response_time: float = Field(default=0.0, ge=0, description="Response time in seconds")


class ReviewResponse(BaseModel):
    """Response after submitting a review"""
    activity_id: uuid.UUID
    term_id: uuid.UUID
    recall_score: int
    ef: float
    interval: int
    next_review_date: datetime
    message: str


class SessionSummary(BaseModel):
    """Summary of a learning session"""
    studyset_id: uuid.UUID
    session_duration: float  # in minutes
    total_reviewed: int
    average_recall_score: float
    difficulty_distribution: dict[str, int]  # {\"again\": 0, \"hard\": 1, \"good\": 2, \"easy\": 5}\n    cards_due_next: int
    next_review_date: datetime | None = None


# Progress Schemas

class ProgressSummaryPublic(BaseModel):
    """Public progress summary"""
    progress_id: uuid.UUID
    studyset_id: uuid.UUID
    user_id: uuid.UUID
    mastered_terms: int
    reviewing_terms: int
    forgotten_terms: int
    average_recall_score: float
    average_response_time: float
    streak_days: int
    completion_rate: float
    next_due_date: datetime | None
    updated_at: datetime


class StudyActivityPublic(BaseModel):
    """Public study activity"""
    activity_id: uuid.UUID
    user_id: uuid.UUID
    studyset_id: uuid.UUID
    term_id: uuid.UUID
    start_time: datetime
    end_time: datetime | None
    hint_used: bool
    retry_count: int
    recall_score: int
    ef: float
    interval: int
    repetitions: int
    next_review_date: datetime | None
    response_time: float
    created_at: datetime


class UserProgressOverview(BaseModel):
    """Overview of user's overall progress"""
    total_studysets: int
    total_cards_studied: int
    total_study_time: float  # in hours
    current_streak: int
    longest_streak: int
    average_accuracy: float
    total_sessions: int


class ProgressHistory(BaseModel):
    """Progress history for charts"""
    date: datetime
    cards_studied: int
    accuracy: float
    avg_recall_score: float


class WeakTerm(BaseModel):
    """Terms that need more review"""
    term_id: uuid.UUID
    term_text: str
    definition: str
    recall_score: int
    times_reviewed: int
    last_reviewed: datetime
    next_review: datetime | None


class StudyStats(BaseModel):
    """Detailed study statistics"""
    studyset_id: uuid.UUID
    total_terms: int
    studied_terms: int
    mastered_terms: int
    reviewing_terms: int
    forgotten_terms: int
    never_studied: int
    accuracy: float
    average_recall_score: float
    total_study_time: float
    weak_terms: list[WeakTerm]
