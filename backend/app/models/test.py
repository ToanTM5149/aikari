import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import JSON

from app.models.enums import QuestionType, ReattemptStatus


class Test(SQLModel, table=True):
    __tablename__ = "Test"
    
    test_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id")
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=500)
    total_questions: int = Field(default=10)
    show_answers: bool = Field(default=False)  # Show correct answers after submission
    question_types: list[str] = Field(default_factory=list, sa_column=Column(JSON))  # List of question types to include
    time_limit: int | None = Field(default=None)  # Time limit in seconds (None = no limit)
    created_by: uuid.UUID = Field(foreign_key="User.user_id")
    is_ai_generated: bool = Field(default=False)  # Đánh dấu test được tạo bởi AI
    ai_generated_by: uuid.UUID | None = Field(default=None, foreign_key="User.user_id")  # User yêu cầu AI tạo
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    study_set: "StudySet" = Relationship(back_populates="tests")
    creator: "User" = Relationship(
        back_populates="created_tests",
        sa_relationship_kwargs={"foreign_keys": "[Test.created_by]"}
    )
    questions: list["TestQuestion"] = Relationship(back_populates="test", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    attempts: list["TestAttempt"] = Relationship(back_populates="test", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class TestQuestion(SQLModel, table=True):
    __tablename__ = "TestQuestion"
    
    question_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    test_id: uuid.UUID = Field(foreign_key="Test.test_id")
    term_id: uuid.UUID = Field(foreign_key="Term.term_id")
    question_type: QuestionType = Field(default=QuestionType.MULTIPLE_CHOICE)
    question_text: str = Field(max_length=500)
    correct_answer: str = Field(max_length=500)
    options: list[str] | None = Field(default=None, sa_column=Column(JSON))  # For multiple choice
    explanation: str | None = Field(default=None, max_length=1000)  # Explanation for the correct answer
    order: int = Field(default=0)
    
    # Relationships
    test: "Test" = Relationship(back_populates="questions")
    term: "Term" = Relationship()
    answers: list["TestAnswer"] = Relationship(back_populates="question")


class TestAttempt(SQLModel, table=True):
    __tablename__ = "TestAttempt"
    
    attempt_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    test_id: uuid.UUID = Field(foreign_key="Test.test_id")
    user_id: uuid.UUID = Field(foreign_key="User.user_id")
    class_id: uuid.UUID | None = Field(default=None, foreign_key="Class.class_id")  # Only if through class
    score: float = Field(default=0.0)
    total_questions: int = Field(default=0)
    correct_answers: int = Field(default=0)
    is_completed: bool = Field(default=False)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = Field(default=None)
    
    # Relationships
    test: "Test" = Relationship(back_populates="attempts")
    user: "User" = Relationship(back_populates="test_attempts")
    answers: list["TestAnswer"] = Relationship(back_populates="attempt", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    reattempt_request: Optional["ReattemptRequest"] = Relationship(back_populates="attempt", sa_relationship_kwargs={"uselist": False})


class TestAnswer(SQLModel, table=True):
    __tablename__ = "TestAnswer"
    
    answer_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    attempt_id: uuid.UUID = Field(foreign_key="TestAttempt.attempt_id")
    question_id: uuid.UUID = Field(foreign_key="TestQuestion.question_id")
    user_answer: str | None = Field(default=None, max_length=500)
    is_correct: bool = Field(default=False)
    
    # Relationships
    attempt: "TestAttempt" = Relationship(back_populates="answers")
    question: "TestQuestion" = Relationship(back_populates="answers")


class ReattemptRequest(SQLModel, table=True):
    __tablename__ = "ReattemptRequest"
    
    request_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    attempt_id: uuid.UUID = Field(foreign_key="TestAttempt.attempt_id", unique=True)
    user_id: uuid.UUID = Field(foreign_key="User.user_id")
    class_id: uuid.UUID = Field(foreign_key="Class.class_id")
    status: ReattemptStatus = Field(default=ReattemptStatus.PENDING)
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_by: uuid.UUID | None = Field(default=None, foreign_key="User.user_id")
    reviewed_at: datetime | None = Field(default=None)
    
    # Relationships
    attempt: "TestAttempt" = Relationship(back_populates="reattempt_request")
    user: "User" = Relationship(
        back_populates="reattempt_requests",
        sa_relationship_kwargs={"foreign_keys": "[ReattemptRequest.user_id]"}
    )
    reviewer: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[ReattemptRequest.reviewed_by]"}
    )


