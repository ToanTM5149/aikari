import uuid
from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import ContentType, TestType


class Test(SQLModel, table=True):
    __tablename__ = "Test"
    
    test_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id")
    title: str = Field(max_length=255)
    test_types: TestType = Field(default=TestType.MULTIPLE_CHOICE)
    total_questions: int = Field(default=0)
    content_type: ContentType = Field(default=ContentType.DEFAULT)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    study_set: "StudySet" = Relationship(back_populates="tests")
    test_results: list["TestResult"] = Relationship(back_populates="test")


class TestResult(SQLModel, table=True):
    __tablename__ = "TestResult"
    
    test_result_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="User.user_id")
    test_id: uuid.UUID = Field(foreign_key="Test.test_id")
    score: float = Field(default=0.0)
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: "User" = Relationship(back_populates="test_results")
    test: "Test" = Relationship(back_populates="test_results")


