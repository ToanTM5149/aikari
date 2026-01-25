"""StudentStudySet model - Junction table tracking student enrollment in studysets"""

from datetime import datetime
import uuid

from sqlmodel import Field, Relationship, SQLModel


class StudentStudySet(SQLModel, table=True):
    """Junction table: Many-to-Many relationship between User (Student) and StudySet

    Tracks when students enroll in studysets and when they last studied them.
    This provides explicit enrollment tracking instead of implicit tracking through
    StudyActivity or ProgressSummary.
    """
    __tablename__ = "StudentStudySet"

    student_id: uuid.UUID = Field(
        foreign_key="User.user_id",
        primary_key=True,
        description="Student who enrolled in the studyset"
    )
    studyset_id: uuid.UUID = Field(
        foreign_key="StudySet.studyset_id",
        primary_key=True,
        description="StudySet the student is enrolled in"
    )
    enrolled_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the student enrolled in this studyset"
    )
    last_studied_at: datetime | None = Field(
        default=None,
        description="Last time the student studied this studyset"
    )

    # Relationships
    student: "User" = Relationship(back_populates="enrolled_studysets")
    studyset: "StudySet" = Relationship(back_populates="enrolled_students")
