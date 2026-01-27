"""API endpoints for student enrollment in studysets"""

from datetime import datetime, timedelta
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func, or_

from app.api.deps import get_session, get_current_user
from app.models.user import User
from app.models.studyset import StudySet
from app.models.student_studyset import StudentStudySet
from app.models.studyset_term import StudySetTerm
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


@router.get("/me/studysets")
def get_my_enrolled_studysets(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    q: str | None = Query(None, description="Search query for studyset title or description"),
    category_id: uuid.UUID | None = Query(None, description="Filter by category ID"),
    sort_by: str = Query("last_studied_at", description="Sort field: last_studied_at, enrolled_at, created_at, title"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Any:
    """Get all studysets current user is enrolled in with search, filtering, and sorting

    Supports:
    - Search by title/description (q parameter)
    - Filter by category (category_id parameter)
    - Sorting by last_studied_at, enrolled_at, created_at, or title
    - Pagination (skip, limit)

    OPTIMIZED: Uses JOIN to avoid N+1 queries

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        q: Search query for studyset title or description
        category_id: Filter by category ID
        sort_by: Field to sort by (last_studied_at, enrolled_at, created_at, title)
        sort_order: Sort order (asc or desc)
        current_user: Current authenticated user
        session: Database session

    Returns:
        dict: {"data": list[EnrolledStudySetDetail], "count": int}
    """
    from app.models import Term

    # Build base query with JOIN to StudySet
    base_query = (
        select(StudentStudySet, StudySet)
        .join(StudySet, StudentStudySet.studyset_id == StudySet.studyset_id)
        .where(StudentStudySet.student_id == current_user.user_id)
    )

    # Add search filter if provided
    if q:
        search_filter = or_(
            StudySet.title.ilike(f"%{q}%"),
            StudySet.description.ilike(f"%{q}%")
        )
        base_query = base_query.where(search_filter)

    # Filter by category_id if provided
    if category_id:
        base_query = base_query.where(StudySet.category_id == category_id)

    # Count total enrollments matching filters before pagination
    count_query = (
        select(func.count(StudentStudySet.studyset_id))
        .join(StudySet, StudentStudySet.studyset_id == StudySet.studyset_id)
        .where(StudentStudySet.student_id == current_user.user_id)
    )
    if q:
        search_filter = or_(
            StudySet.title.ilike(f"%{q}%"),
            StudySet.description.ilike(f"%{q}%")
        )
        count_query = count_query.where(search_filter)
    if category_id:
        count_query = count_query.where(StudySet.category_id == category_id)
    
    total_count = session.exec(count_query).one() or 0

    # Apply sorting
    sort_field_map = {
        "last_studied_at": StudentStudySet.last_studied_at,
        "enrolled_at": StudentStudySet.enrolled_at,
        "created_at": StudySet.created_at,
        "title": StudySet.title,
    }
    sort_field = sort_field_map.get(sort_by, StudentStudySet.last_studied_at)
    
    if sort_order.lower() == "asc":
        base_query = base_query.order_by(sort_field.asc().nulls_last())
    else:
        base_query = base_query.order_by(sort_field.desc().nulls_last())

    # Apply pagination
    base_query = base_query.offset(skip).limit(limit)

    # Execute query
    results = session.exec(base_query).all()

    if not results:
        return {"data": [], "count": total_count}

    # Extract enrollments and studysets
    enrollments = [r[0] for r in results]
    studysets = [r[1] for r in results]
    studyset_ids = [s.studyset_id for s in studysets]

    # Bulk query term counts for all studysets
    # Read from StudySetTerm junction table
    term_counts_statement = (
        select(
            StudySetTerm.studyset_id,
            func.count(StudySetTerm.term_id).label('term_count')
        )
        .where(StudySetTerm.studyset_id.in_(studyset_ids))
        .group_by(StudySetTerm.studyset_id)
    )
    term_counts_result = session.exec(term_counts_statement).all()
    term_counts_map = {row.studyset_id: row.term_count for row in term_counts_result}

    # Build result list
    result = []
    for enrollment, studyset in zip(enrollments, studysets):
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
                updated_at=studyset.updated_at,
                term_count=term_counts_map.get(studyset.studyset_id, 0)
            )
        )

    return {"data": result, "count": total_count}


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
