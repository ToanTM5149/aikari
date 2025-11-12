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
    class_memberships: list["ClassMember"] = Relationship(back_populates="user")
    test_results: list["TestResult"] = Relationship(back_populates="user")
    study_activities: list["StudyActivity"] = Relationship(back_populates="user")
    progress_summaries: list["ProgressSummary"] = Relationship(back_populates="user")


# User Schemas
class UserBase(SQLModel):
    username: str
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.STUDENT
    phone_numbers: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    preferences: dict[str, Any] | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserRegister(SQLModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: UserRole = UserRole.STUDENT


class UserUpdate(SQLModel):
    username: str | None = None
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    phone_numbers: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    preferences: dict[str, Any] | None = None


class UserUpdateMe(SQLModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone_numbers: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    preferences: dict[str, Any] | None = None


class UserPublic(UserBase):
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Common Schemas
class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8)

