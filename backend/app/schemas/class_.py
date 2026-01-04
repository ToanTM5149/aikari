import uuid
from datetime import datetime
from typing import Any

from sqlmodel import SQLModel

from app.models.enums import ClassRole, MembershipStatus


# Base schemas
class ClassBase(SQLModel):
    class_name: str
    description: str | None = None
    is_public: bool = False
    class_code: str | None = None


class ClassMemberBase(SQLModel):
    role: ClassRole = ClassRole.MEMBER
    status: MembershipStatus = MembershipStatus.PENDING


# Create schemas
class ClassCreate(ClassBase):
    pass


class ClassMemberCreate(ClassMemberBase):
    user_id: uuid.UUID


# Update schemas
class ClassUpdate(SQLModel):
    class_name: str | None = None
    description: str | None = None
    is_public: bool | None = None
    class_code: str | None = None


class ClassMemberUpdate(SQLModel):
    role: ClassRole | None = None
    status: MembershipStatus | None = None


# Public schemas (response models)
class ClassPublic(ClassBase):
    class_id: uuid.UUID
    created_by: str
    owner_user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class ClassMemberPublic(ClassMemberBase):
    class_id: uuid.UUID
    user_id: uuid.UUID
    joined_at: datetime
    invited_by: uuid.UUID | None = None
    approved_at: datetime | None = None
    user: "UserPublic | None" = None  # Nested user info
    
    model_config = {"from_attributes": True}


# List schemas
class ClassesPublic(SQLModel):
    data: list[ClassPublic]
    count: int


class ClassMembersPublic(SQLModel):
    data: list[ClassMemberPublic]
    count: int


# User info for nested relationship
class UserPublic(SQLModel):
    user_id: uuid.UUID
    username: str
    email: str
    
    model_config = {"from_attributes": True}


# Analytics Schemas

class StudentProgressDetail(SQLModel):
    """Individual student progress in a class"""
    user_id: uuid.UUID
    username: str
    email: str
    total_studysets: int
    completed_studysets: int
    total_terms_studied: int
    average_accuracy: float  # 0-100
    total_study_time: int  # in seconds
    last_activity: datetime | None = None
    mastery_percentage: float  # 0-100
    weak_terms_count: int


class ClassAnalyticsOverview(SQLModel):
    """Overview analytics for a class"""
    class_id: uuid.UUID
    class_name: str
    total_members: int
    active_members: int  # Members who studied in last 7 days
    total_studysets: int
    total_terms: int
    average_completion_rate: float  # 0-100
    average_accuracy: float  # 0-100
    total_study_sessions: int
    total_study_time: int  # in seconds
    most_active_student: StudentProgressDetail | None = None
    least_active_student: StudentProgressDetail | None = None


class StudySetAnalytics(SQLModel):
    """Analytics for a specific studyset in a class"""
    studyset_id: uuid.UUID
    studyset_name: str
    total_terms: int
    students_started: int
    students_completed: int
    average_progress: float  # 0-100
    average_accuracy: float  # 0-100
    average_completion_time: int | None = None  # in seconds
    most_difficult_terms: list[dict[str, Any]]  # [{term_id, term_text, error_rate}]


class LeaderboardEntry(SQLModel):
    """Single entry in class leaderboard"""
    rank: int
    user_id: uuid.UUID
    username: str
    email: str
    total_terms_mastered: int
    accuracy: float  # 0-100
    study_streak_days: int
    total_study_time: int  # in seconds
    last_study_date: datetime | None = None


class ClassLeaderboard(SQLModel):
    """Leaderboard for a class"""
    class_id: uuid.UUID
    entries: list[LeaderboardEntry]
    count: int


class StudentProgressList(SQLModel):
    """List of student progress details"""
    data: list[StudentProgressDetail]
    count: int

