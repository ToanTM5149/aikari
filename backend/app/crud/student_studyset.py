"""CRUD operations for StudentStudySet model"""

from datetime import datetime
import uuid

from sqlmodel import Session, select

from app.models.student_studyset import StudentStudySet


def enroll_student(
    session: Session,
    student_id: uuid.UUID,
    studyset_id: uuid.UUID
) -> StudentStudySet:
    """Enroll a student in a studyset

    Args:
        session: Database session
        student_id: UUID of the student to enroll
        studyset_id: UUID of the studyset to enroll in

    Returns:
        StudentStudySet: The enrollment record (existing or newly created)
    """
    # Check if already enrolled
    existing = session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.student_id == student_id)
        .where(StudentStudySet.studyset_id == studyset_id)
    ).first()

    if existing:
        return existing

    # Create new enrollment
    enrollment = StudentStudySet(
        student_id=student_id,
        studyset_id=studyset_id,
        enrolled_at=datetime.utcnow()
    )
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)
    return enrollment


def unenroll_student(
    session: Session,
    student_id: uuid.UUID,
    studyset_id: uuid.UUID
) -> bool:
    """Unenroll a student from a studyset

    Args:
        session: Database session
        student_id: UUID of the student
        studyset_id: UUID of the studyset

    Returns:
        bool: True if unenrolled successfully, False if enrollment not found
    """
    enrollment = session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.student_id == student_id)
        .where(StudentStudySet.studyset_id == studyset_id)
    ).first()

    if not enrollment:
        return False

    session.delete(enrollment)
    session.commit()
    return True


def update_last_studied(
    session: Session,
    student_id: uuid.UUID,
    studyset_id: uuid.UUID,
    timestamp: datetime | None = None
) -> StudentStudySet:
    """Update the last_studied_at timestamp for a student's studyset enrollment

    If the student is not enrolled, they will be automatically enrolled.

    Args:
        session: Database session
        student_id: UUID of the student
        studyset_id: UUID of the studyset
        timestamp: Timestamp to set (defaults to current time)

    Returns:
        StudentStudySet: The updated enrollment record
    """
    enrollment = session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.student_id == student_id)
        .where(StudentStudySet.studyset_id == studyset_id)
    ).first()

    if not enrollment:
        # Auto-enroll if not already enrolled
        enrollment = enroll_student(session, student_id, studyset_id)

    # Update last_studied_at
    enrollment.last_studied_at = timestamp or datetime.utcnow()
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)
    return enrollment


def get_student_studysets(
    session: Session,
    student_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> list[StudentStudySet]:
    """Get all studysets a student is enrolled in

    Args:
        session: Database session
        student_id: UUID of the student
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        list[StudentStudySet]: List of enrollment records
    """
    return session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.student_id == student_id)
        .offset(skip)
        .limit(limit)
    ).all()


def get_studyset_students(
    session: Session,
    studyset_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> list[StudentStudySet]:
    """Get all students enrolled in a studyset

    Args:
        session: Database session
        studyset_id: UUID of the studyset
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        list[StudentStudySet]: List of enrollment records
    """
    return session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.studyset_id == studyset_id)
        .offset(skip)
        .limit(limit)
    ).all()


def is_student_enrolled(
    session: Session,
    student_id: uuid.UUID,
    studyset_id: uuid.UUID
) -> bool:
    """Check if a student is enrolled in a studyset

    Args:
        session: Database session
        student_id: UUID of the student
        studyset_id: UUID of the studyset

    Returns:
        bool: True if enrolled, False otherwise
    """
    enrollment = session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.student_id == student_id)
        .where(StudentStudySet.studyset_id == studyset_id)
    ).first()
    return enrollment is not None


def get_enrollment(
    session: Session,
    student_id: uuid.UUID,
    studyset_id: uuid.UUID
) -> StudentStudySet | None:
    """Get a specific enrollment record

    Args:
        session: Database session
        student_id: UUID of the student
        studyset_id: UUID of the studyset

    Returns:
        StudentStudySet | None: The enrollment record if it exists, None otherwise
    """
    return session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.student_id == student_id)
        .where(StudentStudySet.studyset_id == studyset_id)
    ).first()
