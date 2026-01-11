import uuid
from typing import Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func

from app import crud
from app.api.deps import CurrentUser, SessionDep, check_studyset_access
from app.models import StudySet, Term, StudyActivity, ProgressSummary, ClassStudySet, ClassMember, MembershipStatus
from app.schemas import (
    Message,
    StudySetCreate,
    StudySetPublic,
    StudySetUpdate,
    TermCreate,
    TermPublic,
    TermUpdate,
)

router = APIRouter()


# StudySet endpoints
@router.get("/")
def read_studysets(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    q: str | None = None,
    category_id: uuid.UUID | None = None,
) -> Any:
    """
    Retrieve study sets owned by current user with additional metadata.
    Supports search by title and description.
    Supports filter by category_id.

    OPTIMIZED: Uses bulk queries to avoid N+1 problem
    """
    from sqlmodel import or_, case

    # Build base query with search filter
    base_query = select(StudySet).where(StudySet.owner_id == current_user.user_id)

    if q:
        search_filter = or_(
            StudySet.title.ilike(f"%{q}%"),
            StudySet.description.ilike(f"%{q}%")
        )
        base_query = base_query.where(search_filter)

    # Filter by category_id if provided
    if category_id:
        base_query = base_query.where(StudySet.category_id == category_id)

    # Count total studysets matching search before pagination
    total_count_statement = select(func.count(StudySet.studyset_id)).where(
        StudySet.owner_id == current_user.user_id
    )
    if q:
        search_filter = or_(
            StudySet.title.ilike(f"%{q}%"),
            StudySet.description.ilike(f"%{q}%")
        )
        total_count_statement = total_count_statement.where(search_filter)

    if category_id:
        # Apply same category filter to count
        total_count_statement = total_count_statement.where(StudySet.category_id == category_id)

    total_count = session.exec(total_count_statement).one() or 0

    # Get paginated sets - order by created_at DESC so newest studysets appear first
    statement = base_query.order_by(StudySet.created_at.desc()).offset(skip).limit(limit)
    sets = list(session.exec(statement).all())

    if not sets:
        return {"data": [], "count": 0}

    # OPTIMIZATION: Bulk fetch all data in 3 queries instead of N queries
    studyset_ids = [s.studyset_id for s in sets]

    # Query 1: Get term counts for all studysets in one query
    term_counts_statement = (
        select(
            Term.studyset_id,
            func.count(Term.term_id).label('term_count')
        )
        .where(Term.studyset_id.in_(studyset_ids))
        .group_by(Term.studyset_id)
    )
    term_counts_result = session.exec(term_counts_statement).all()
    term_counts_map = {row.studyset_id: row.term_count for row in term_counts_result}

    # Query 2: Get last activity for all studysets in one query (using window function)
    last_activity_subquery = (
        select(
            StudyActivity.studyset_id,
            StudyActivity.created_at,
            func.row_number().over(
                partition_by=StudyActivity.studyset_id,
                order_by=StudyActivity.created_at.desc()
            ).label('rn')
        )
        .where(
            StudyActivity.studyset_id.in_(studyset_ids),
            StudyActivity.user_id == current_user.user_id
        )
        .subquery()
    )

    last_activities_statement = (
        select(
            last_activity_subquery.c.studyset_id,
            last_activity_subquery.c.created_at
        )
        .where(last_activity_subquery.c.rn == 1)
    )
    last_activities_result = session.exec(last_activities_statement).all()
    last_activities_map = {row.studyset_id: row.created_at for row in last_activities_result}

    # Query 3: Get progress for all studysets in one query
    progress_statement = (
        select(ProgressSummary)
        .where(
            ProgressSummary.studyset_id.in_(studyset_ids),
            ProgressSummary.user_id == current_user.user_id
        )
    )
    progress_summaries = session.exec(progress_statement).all()
    progress_map = {p.studyset_id: p.completion_rate for p in progress_summaries}

    # Build enriched results using pre-fetched data
    enriched_sets = []
    for studyset in sets:
        enriched_set = StudySetPublic(
            studyset_id=studyset.studyset_id,
            title=studyset.title,
            description=studyset.description,
            content_type=studyset.content_type,
            category_id=studyset.category_id,
            category=studyset.category,  # Relationship will be loaded
            owner_id=studyset.owner_id,
            created_at=studyset.created_at,
            updated_at=studyset.updated_at,
            attributes=None,  # Attribute table has been removed
            term_count=term_counts_map.get(studyset.studyset_id, 0),
            last_activity_at=last_activities_map.get(studyset.studyset_id),
            progress=progress_map.get(studyset.studyset_id, 0.0)
        )
        enriched_sets.append(enriched_set)

    return {"data": enriched_sets, "count": total_count}


@router.get("/{studyset_id}/")
def read_studyset(
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get study set by ID.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check if user has access (owner or class member)
    if not check_studyset_access(session, studyset_id, current_user.user_id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return studyset


@router.post("/", response_model=StudySetPublic)
def create_studyset(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    set_in: StudySetCreate,
) -> Any:
    """
    Create new study set.
    """
    studyset = crud.create_studyset(
        session=session, studyset_in=set_in, owner_id=current_user.user_id
    )
    return studyset


@router.put("/{studyset_id}", response_model=StudySetPublic)
def update_studyset(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    studyset_id: uuid.UUID,
    set_in: StudySetUpdate,
) -> Any:
    """
    Update a study set.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    studyset = crud.update_studyset(
        session=session, db_studyset=studyset, studyset_in=set_in
    )
    return studyset


@router.delete("/{studyset_id}/", response_model=Message)
def delete_studyset(
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Delete a study set.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_studyset(session=session, studyset_id=studyset_id)
    return Message(message="Study set deleted successfully")


# Term endpoints (flashcard items)
@router.get("/{studyset_id}/terms/")
def read_terms(
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve terms in a study set.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check if user has access (owner or class member)
    if not check_studyset_access(session, studyset_id, current_user.user_id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    terms = crud.get_terms_by_studyset(
        session=session, studyset_id=studyset_id, skip=skip, limit=limit
    )
    
    return {"data": terms, "count": len(terms)}


@router.get("/{studyset_id}/terms/{term_id}/", response_model=TermPublic)
def read_term(
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get term by ID.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check if user has access (owner or class member)
    if not check_studyset_access(session, studyset_id, current_user.user_id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    term = crud.get_term(session=session, term_id=term_id)
    if not term or term.studyset_id != studyset_id:
        raise HTTPException(status_code=404, detail="Term not found")
    
    # Migrate dữ liệu cũ từ attributes.paragraph sang paragraphs nếu cần
    if (term.paragraphs is None or len(term.paragraphs) == 0) and term.attributes and term.attributes.get("paragraph"):
        # Có dữ liệu cũ trong attributes.paragraph, migrate sang paragraphs
        old_paragraph = {
            "paragraph": term.attributes["paragraph"],
            "metadata": term.attributes.get("paragraph_metadata", {})
        }
        term.paragraphs = [old_paragraph]
        
        # Xóa dữ liệu cũ trong attributes
        if "paragraph" in term.attributes:
            del term.attributes["paragraph"]
        if "paragraph_metadata" in term.attributes:
            del term.attributes["paragraph_metadata"]
        if not term.attributes:
            term.attributes = None
        
        # Lưu migration
        session.add(term)
        session.commit()
        session.refresh(term)
    
    return term


@router.post("/{studyset_id}/terms/", response_model=TermPublic)
def create_term(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    studyset_id: uuid.UUID,
    term_in: TermCreate,
) -> Any:
    """
    Create new term in a study set.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    term = crud.create_term(
        session=session, term_in=term_in, studyset_id=studyset_id
    )
    return term


@router.put("/{studyset_id}/terms/{term_id}/", response_model=TermPublic)
def update_term(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
    term_in: TermUpdate,
) -> Any:
    """
    Update a term.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    term = crud.get_term(session=session, term_id=term_id)
    if not term or term.studyset_id != studyset_id:
        raise HTTPException(status_code=404, detail="Term not found")
    
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    term = crud.update_term(session=session, db_term=term, term_in=term_in)
    return term


@router.delete("/{studyset_id}/terms/{term_id}/", response_model=Message)
def delete_term(
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Delete a term.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    term = crud.get_term(session=session, term_id=term_id)
    if not term or term.studyset_id != studyset_id:
        raise HTTPException(status_code=404, detail="Term not found")
    
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_term(session=session, term_id=term_id)
    return Message(message="Term deleted successfully")

