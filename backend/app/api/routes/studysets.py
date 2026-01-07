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
@router.get("/categories/")
def get_categories(
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get all unique categories from user's studysets.
    """
    # Get distinct categories from studysets
    category_statement = (
        select(StudySet.category)
        .where(
            StudySet.owner_id == current_user.user_id,
            StudySet.category.isnot(None),
            StudySet.category != ""
        )
        .distinct()
        .order_by(StudySet.category)
    )
    categories = list(session.exec(category_statement).all())
    
    return {"data": categories, "count": len(categories)}


@router.get("/")
def read_studysets(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    q: str | None = None,
    category: str | None = None,
) -> Any:
    """
    Retrieve study sets owned by current user with additional metadata.
    Supports search by title and description.
    Supports filter by category.
    """
    from sqlmodel import or_
    
    # Build base query with search filter
    base_query = select(StudySet).where(StudySet.owner_id == current_user.user_id)
    
    if q:
        search_filter = or_(
            StudySet.title.ilike(f"%{q}%"),
            StudySet.description.ilike(f"%{q}%")
        )
        base_query = base_query.where(search_filter)
    
    # Filter by category if provided
    if category:
        base_query = base_query.where(StudySet.category == category)
    
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
    
    if category:
        # Apply same category filter to count
        total_count_statement = total_count_statement.where(StudySet.category == category)
    
    total_count = session.exec(total_count_statement).one() or 0
    
    # Get paginated sets - order by created_at DESC so newest studysets appear first
    statement = base_query.order_by(StudySet.created_at.desc()).offset(skip).limit(limit)
    sets = list(session.exec(statement).all())
    
    # Enrich each studyset with term_count, last_activity_at, and progress
    enriched_sets = []
    for studyset in sets:
        # Count terms
        term_count_statement = select(func.count(Term.term_id)).where(
            Term.studyset_id == studyset.studyset_id
        )
        term_count = session.exec(term_count_statement).one() or 0
        
        # Get last activity time
        last_activity_statement = (
            select(StudyActivity.created_at)
            .where(StudyActivity.studyset_id == studyset.studyset_id)
            .where(StudyActivity.user_id == current_user.user_id)
            .order_by(StudyActivity.created_at.desc())
            .limit(1)
        )
        last_activity = session.exec(last_activity_statement).first()
        
        # Get progress (completion_rate)
        progress_statement = (
            select(ProgressSummary)
            .where(ProgressSummary.studyset_id == studyset.studyset_id)
            .where(ProgressSummary.user_id == current_user.user_id)
        )
        progress_summary = session.exec(progress_statement).first()
        progress = progress_summary.completion_rate if progress_summary else 0.0
        
        # Create enriched studyset
        enriched_set = StudySetPublic(
            studyset_id=studyset.studyset_id,
            title=studyset.title,
            description=studyset.description,
            content_type=studyset.content_type,
            category=studyset.category,
            owner_id=studyset.owner_id,
            created_at=studyset.created_at,
            updated_at=studyset.updated_at,
            attributes=studyset.attributes,
            term_count=term_count,
            last_activity_at=last_activity,
            progress=progress
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

