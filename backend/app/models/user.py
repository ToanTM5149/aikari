import uuid
from datetime import datetime
from typing import Any

from pydantic import EmailStr
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import UserRole


class User(SQLModel, table=True):
    __tablename__ = "User"
    
    user_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(max_length=255, unique=True, index=True)
    password: str  # Will be hashed
    full_name: str = Field(max_length=255)
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    role: UserRole = Field(default=UserRole.STUDENT)
    phone_numbers: str | None = Field(default=None, max_length=10)
    address: str | None = Field(default=None, max_length=256)
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    preferences: dict[str, Any] | None = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    study_sets: list["StudySet"] = Relationship(back_populates="owner")
    class_memberships: list["ClassMember"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"foreign_keys": "[ClassMember.user_id]"}
    )
    test_results: list["TestResult"] = Relationship(back_populates="user")
    study_activities: list["StudyActivity"] = Relationship(back_populates="user")
    progress_summaries: list["ProgressSummary"] = Relationship(back_populates="user")


