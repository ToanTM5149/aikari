"""
CRUD operations for StudySetTerm junction table

Supports N:M relationship between StudySet and Term
"""

import uuid
from datetime import datetime

from sqlmodel import Session, select

from app.models import StudySetTerm, Term


def add_term_to_studyset(
    *,
    session: Session,
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
    added_by: uuid.UUID | None = None,
    order: int = 0,
) -> StudySetTerm:
    """
    Add a term to a studyset (N:M relationship).

    This is idempotent - if the relationship already exists, returns the existing record.

    Args:
        session: Database session
        studyset_id: StudySet ID
        term_id: Term ID
        added_by: User who added the term (optional)
        order: Order of the term in the studyset (default: 0)

    Returns:
        StudySetTerm junction record
    """
    # Check if relationship already exists
    existing = session.exec(
        select(StudySetTerm)
        .where(StudySetTerm.studyset_id == studyset_id)
        .where(StudySetTerm.term_id == term_id)
    ).first()

    if existing:
        return existing

    # Create new relationship
    studyset_term = StudySetTerm(
        studyset_id=studyset_id,
        term_id=term_id,
        added_by=added_by,
        order=order,
        added_at=datetime.utcnow(),
    )
    session.add(studyset_term)
    session.commit()
    session.refresh(studyset_term)
    return studyset_term


def remove_term_from_studyset(
    *,
    session: Session,
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
) -> bool:
    """
    Remove a term from a studyset (delete N:M relationship).

    Note: This does NOT delete the Term itself - just the relationship.
    The term will become an orphan and can be reused in other studysets.

    Args:
        session: Database session
        studyset_id: StudySet ID
        term_id: Term ID

    Returns:
        True if relationship was deleted, False if it didn't exist
    """
    studyset_term = session.exec(
        select(StudySetTerm)
        .where(StudySetTerm.studyset_id == studyset_id)
        .where(StudySetTerm.term_id == term_id)
    ).first()

    if not studyset_term:
        return False

    session.delete(studyset_term)
    session.commit()
    return True


def get_studyset_terms(
    *,
    session: Session,
    studyset_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> list[Term]:
    """
    Get all terms in a studyset, ordered by the 'order' field.

    Args:
        session: Database session
        studyset_id: StudySet ID
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        List of Terms in the studyset
    """
    statement = (
        select(Term)
        .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
        .where(StudySetTerm.studyset_id == studyset_id)
        .order_by(StudySetTerm.order, Term.created_at)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_term_studysets(
    *,
    session: Session,
    term_id: uuid.UUID,
) -> list[uuid.UUID]:
    """
    Get all studysets that contain a specific term.

    This is useful for the term library feature - to see where a term is used.

    Args:
        session: Database session
        term_id: Term ID

    Returns:
        List of StudySet IDs
    """
    statement = (
        select(StudySetTerm.studyset_id)
        .where(StudySetTerm.term_id == term_id)
    )
    return list(session.exec(statement).all())


def count_studyset_terms(
    *,
    session: Session,
    studyset_id: uuid.UUID,
) -> int:
    """
    Count the number of terms in a studyset.

    Args:
        session: Database session
        studyset_id: StudySet ID

    Returns:
        Number of terms in the studyset
    """
    statement = (
        select(StudySetTerm)
        .where(StudySetTerm.studyset_id == studyset_id)
    )
    return len(list(session.exec(statement).all()))


def update_term_order(
    *,
    session: Session,
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
    new_order: int,
) -> StudySetTerm | None:
    """
    Update the order of a term within a studyset.

    Args:
        session: Database session
        studyset_id: StudySet ID
        term_id: Term ID
        new_order: New order value

    Returns:
        Updated StudySetTerm record, or None if not found
    """
    studyset_term = session.exec(
        select(StudySetTerm)
        .where(StudySetTerm.studyset_id == studyset_id)
        .where(StudySetTerm.term_id == term_id)
    ).first()

    if not studyset_term:
        return None

    studyset_term.order = new_order
    session.add(studyset_term)
    session.commit()
    session.refresh(studyset_term)
    return studyset_term


def is_term_in_studyset(
    *,
    session: Session,
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
) -> bool:
    """
    Check if a term is in a studyset.

    Args:
        session: Database session
        studyset_id: StudySet ID
        term_id: Term ID

    Returns:
        True if the term is in the studyset, False otherwise
    """
    studyset_term = session.exec(
        select(StudySetTerm)
        .where(StudySetTerm.studyset_id == studyset_id)
        .where(StudySetTerm.term_id == term_id)
    ).first()
    return studyset_term is not None
