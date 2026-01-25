"""API endpoints for student enrollment in studysets"""

from datetime import datetime, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_session, get_current_user
from app.models.user import User
from app.models.studyset import StudySet
from app.models.student_studyset import StudentStudySet
from app.schemas.student_studyset import (
    StudentStudySetRead,
    EnrolledStudySetDetail,
    EnrollmentStats,
)
from app.crud.student_studyset import (
    enroll_student,
    unenroll_student,
    get_student_studysets,
)

router = APIRouter(prefix="/enrollment", tags=["enrollment"])


@router.post("/studysets/{studyset_id}/enroll", response_model=StudentStudySetRead)
def enroll_in_studyset(
    studyset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Enroll current user in a studyset

    Args:
        studyset_id: UUID of the studyset to enroll in
        current_user: Current authenticated user
        session: Database session

    Returns:
        StudentStudySetRead: The enrollment record

    Raises:
        404: If studyset not found
    """
    # Check if studyset exists
    studyset = session.get(StudySet, studyset_id)
    if not studyset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="StudySet not found"
        )

    # Enroll the user
    enrollment = enroll_student(
        session=session,
        student_id=current_user.user_id,
        studyset_id=studyset_id
    )
    return enrollment


@router.delete(
    "/studysets/{studyset_id}/unenroll",
    status_code=status.HTTP_204_NO_CONTENT
)
def unenroll_from_studyset(
    studyset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Unenroll current user from a studyset

    Args:
        studyset_id: UUID of the studyset to unenroll from
        current_user: Current authenticated user
        session: Database session

    Raises:
        404: If enrollment not found
    """
    success = unenroll_student(
        session=session,
        student_id=current_user.user_id,
        studyset_id=studyset_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )


@router.get("/me/studysets", response_model=list[EnrolledStudySetDetail])
def get_my_enrolled_studysets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get all studysets current user is enrolled in

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        current_user: Current authenticated user
        session: Database session

    Returns:
        list[EnrolledStudySetDetail]: List of enrolled studysets with details
    """
    # Get enrollments
    enrollments = get_student_studysets(
        session=session,
        student_id=current_user.user_id,
        skip=skip,
        limit=limit
    )

    # Join with StudySet to get details
    result = []
    for enrollment in enrollments:
        studyset = session.get(StudySet, enrollment.studyset_id)
        if studyset:
            result.append(
                EnrolledStudySetDetail(
                    studyset_id=studyset.studyset_id,
                    title=studyset.title,
                    description=studyset.description,
                    owner_id=studyset.owner_id,
                    content_type=studyset.content_type.value,
                    category_id=studyset.category_id,
                    enrolled_at=enrollment.enrolled_at,
                    last_studied_at=enrollment.last_studied_at,
                    created_at=studyset.created_at,
                    updated_at=studyset.updated_at
                )
            )

    return result


@router.get("/me/stats", response_model=EnrollmentStats)
def get_my_enrollment_stats(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get enrollment statistics for current user

    Args:
        current_user: Current authenticated user
        session: Database session

    Returns:
        EnrollmentStats: Statistics about the user's enrollments
    """
    # Get all enrollments
    enrollments = session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.student_id == current_user.user_id)
    ).all()

    total_enrolled = len(enrollments)

    # Count recently studied (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recently_studied = sum(
        1 for e in enrollments
        if e.last_studied_at and e.last_studied_at >= seven_days_ago
    )

    # Count never studied
    never_studied = sum(1 for e in enrollments if e.last_studied_at is None)

    return EnrollmentStats(
        total_enrolled=total_enrolled,
        recently_studied=recently_studied,
        never_studied=never_studied
    )


@router.get("/studysets/{studyset_id}/is-enrolled", response_model=bool)
def check_enrollment_status(
    studyset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Check if current user is enrolled in a studyset

    Args:
        studyset_id: UUID of the studyset to check
        current_user: Current authenticated user
        session: Database session

    Returns:
        bool: True if enrolled, False otherwise
    """
    enrollment = session.exec(
        select(StudentStudySet)
        .where(StudentStudySet.student_id == current_user.user_id)
        .where(StudentStudySet.studyset_id == studyset_id)
    ).first()

    return enrollment is not None
