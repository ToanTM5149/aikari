"""Schemas for StudentStudySet API"""

from datetime import datetime
import uuid

from pydantic import BaseModel


class StudentStudySetBase(BaseModel):
    """Base schema for StudentStudySet"""
    student_id: uuid.UUID
    studyset_id: uuid.UUID


class StudentStudySetCreate(StudentStudySetBase):
    """Schema for creating a StudentStudySet enrollment"""
    pass


class StudentStudySetRead(StudentStudySetBase):
    """Schema for reading a StudentStudySet enrollment"""
    enrolled_at: datetime
    last_studied_at: datetime | None

    class Config:
        from_attributes = True


class EnrolledStudySetDetail(BaseModel):
    """StudySet details with enrollment information"""
    studyset_id: uuid.UUID
    title: str
    description: str | None
    owner_id: uuid.UUID
    content_type: str
    category_id: uuid.UUID | None
    enrolled_at: datetime
    last_studied_at: datetime | None
    created_at: datetime
    updated_at: datetime
    term_count: int = 0  # Number of terms in this studyset

    class Config:
        from_attributes = True


class EnrollmentStats(BaseModel):
    """Statistics about a student's enrollment"""
    total_enrolled: int
    recently_studied: int  # Studied in last 7 days
    never_studied: int  # Enrolled but never studied
