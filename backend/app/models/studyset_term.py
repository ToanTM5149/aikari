"""
StudySetTerm Model

Junction table for N:M relationship between StudySet and Term.
This allows terms to be shared across multiple studysets (term library feature).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models import StudySet, Term, User


class StudySetTerm(SQLModel, table=True):
    """
    Junction table linking StudySets to Terms (N:M relationship).
    """
    __tablename__ = "StudySetTerm"

    # Composite Primary Key
    studyset_id: uuid.UUID = Field(
        foreign_key="StudySet.studyset_id",
        primary_key=True,
        ondelete="CASCADE"
    )
    term_id: uuid.UUID = Field(
        foreign_key="Term.term_id",
        primary_key=True,
        ondelete="CASCADE"
    )

    # Metadata
    added_at: datetime = Field(default_factory=datetime.utcnow)
    added_by: uuid.UUID | None = Field(
        default=None,
        foreign_key="User.user_id",
        nullable=True
    )
    order: int = Field(default=0)  # For ordering terms within a studyset

    # Relationships
    studyset: "StudySet" = Relationship(back_populates="studyset_terms")
    term: "Term" = Relationship(back_populates="studyset_terms")
    adder: Optional["User"] = Relationship()
