import uuid
from datetime import datetime

from pydantic import BaseModel
from sqlmodel import SQLModel

from app.models.enums import QuestionType, ReattemptStatus


# Test Schemas
class TestBase(SQLModel):
    title: str
    description: str | None = None
    total_questions: int = 10
    show_answers: bool = False
    question_types: list[str] = []
    time_limit: int | None = None  # Time limit in seconds (None = no limit)


class TestCreate(TestBase):
    pass


class TestUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    total_questions: int | None = None
    show_answers: bool | None = None
    question_types: list[str] | None = None
    time_limit: int | None = None


class TestPublic(TestBase):
    test_id: uuid.UUID
    studyset_id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TestWithQuestions(TestPublic):
    questions: list["QuestionPublic"] = []


# Question Schemas
class QuestionBase(SQLModel):
    term_id: uuid.UUID
    question_type: QuestionType
    question_text: str
    correct_answer: str
    options: list[str] | None = None
    explanation: str | None = None
    order: int = 0


class QuestionCreate(QuestionBase):
    pass


class QuestionPublic(QuestionBase):
    question_id: uuid.UUID
    test_id: uuid.UUID
    explanation: str | None = None


class QuestionWithoutAnswer(SQLModel):
    """Question without correct answer (for active attempts)"""
    question_id: uuid.UUID
    test_id: uuid.UUID
    term_id: uuid.UUID
    question_type: QuestionType
    question_text: str
    options: list[str] | None = None
    order: int
    # Note: No explanation here - only shown after test completion


# Answer Schemas
class AnswerSubmit(SQLModel):
    question_id: uuid.UUID
    user_answer: str


class AnswerPublic(SQLModel):
    answer_id: uuid.UUID
    attempt_id: uuid.UUID
    question_id: uuid.UUID
    user_answer: str | None
    is_correct: bool


# Attempt Schemas
class AttemptCreate(SQLModel):
    # test_id is passed as path parameter, not in body
    class_id: uuid.UUID | None = None


class AttemptSubmit(SQLModel):
    answers: list[AnswerSubmit]


class AttemptPublic(SQLModel):
    attempt_id: uuid.UUID
    test_id: uuid.UUID
    user_id: uuid.UUID
    class_id: uuid.UUID | None
    score: float
    total_questions: int
    correct_answers: int
    is_completed: bool
    started_at: datetime
    completed_at: datetime | None


class AttemptWithTestInfo(AttemptPublic):
    """Attempt with test, studyset, and class information"""
    test_title: str | None = None
    test_description: str | None = None
    studyset_id: uuid.UUID | None = None
    studyset_title: str | None = None
    class_id: uuid.UUID | None = None
    class_name: str | None = None
    test_creator_id: uuid.UUID | None = None
    test_creator_username: str | None = None


class AttemptWithAnswers(AttemptPublic):
    answers: list[AnswerPublic] = []
    questions: list[QuestionPublic] = []  # Include questions with correct answers after completion


class AttemptWithQuestionsOnly(AttemptPublic):
    questions: list[QuestionWithoutAnswer] = []  # For active attempts, no answers shown


# Reattempt Request Schemas
class ReattemptRequestCreate(SQLModel):
    attempt_id: uuid.UUID


class ReattemptRequestPublic(SQLModel):
    request_id: uuid.UUID
    attempt_id: uuid.UUID
    user_id: uuid.UUID
    class_id: uuid.UUID
    status: ReattemptStatus
    requested_at: datetime
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    # Additional fields for enriched response
    test_title: str | None = None
    test_id: uuid.UUID | None = None
    studyset_id: uuid.UUID | None = None
    attempt_score: float | None = None
    attempt_correct_answers: int | None = None
    attempt_total_questions: int | None = None
    attempt_completed_at: datetime | None = None


class ReattemptRequestUpdate(SQLModel):
    status: ReattemptStatus


# List Response
class TestsPublic(SQLModel):
    data: list[TestPublic]
    count: int


class AttemptsPublic(SQLModel):
    data: list[AttemptPublic | AttemptWithTestInfo]  # Support both types
    count: int


class ReattemptRequestsPublic(SQLModel):
    data: list[ReattemptRequestPublic]
    count: int

