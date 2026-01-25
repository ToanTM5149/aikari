import uuid
from typing import Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from app import crud
from app.crud import studyset_term as crud_studyset_term
from app.api.deps import CurrentUser, SessionDep, check_studyset_access
from app.models import StudySet, Term, StudyActivity, ProgressSummary, ClassStudySet, ClassMember, MembershipStatus, StudySetTerm
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
    # PHASE 3.2: Read from StudySetTerm junction table instead of Term.studyset_id
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
    status: str | None = None,
) -> Any:
    """
    Retrieve terms in a study set, optionally filtered by status.
    
    Status options:
    - all: All terms (default)
    - mastered: Terms with ef > 2.5 and interval > 21
    - learning: Terms with recall_score >= 3 but not mastered
    - weak: Terms with recall_score < 3 (forgotten)
    - not-learned: Terms never studied
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check if user has access (owner or class member)
    if not check_studyset_access(session, studyset_id, current_user.user_id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    terms = crud.get_terms_by_studyset(
        session=session, 
        studyset_id=studyset_id, 
        user_id=current_user.user_id,
        status=status,
        skip=skip, 
        limit=limit
    )
    
    # Add studyset_id to each term for response compatibility
    terms_with_studyset_id = []
    for term in terms:
        term_dict = term.model_dump()
        term_dict['studyset_id'] = studyset_id
        terms_with_studyset_id.append(TermPublic(**term_dict))
    
    return {"data": terms_with_studyset_id, "count": len(terms_with_studyset_id)}


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
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")

    # Check if term belongs to studyset via junction table
    if not crud_studyset_term.is_term_in_studyset(session=session, studyset_id=studyset_id, term_id=term_id):
        raise HTTPException(status_code=404, detail="Term not found in this studyset")
    
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
    
    # Add studyset_id to response for compatibility
    term_dict = term.model_dump()
    term_dict['studyset_id'] = studyset_id
    return TermPublic(**term_dict)


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
        session=session, term_in=term_in, studyset_id=studyset_id, added_by=current_user.user_id
    )
    
    # Add studyset_id to response for compatibility
    term_dict = term.model_dump()
    term_dict['studyset_id'] = studyset_id
    return TermPublic(**term_dict)


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
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")

    # Check if term belongs to studyset via junction table
    if not crud_studyset_term.is_term_in_studyset(session=session, studyset_id=studyset_id, term_id=term_id):
        raise HTTPException(status_code=404, detail="Term not found in this studyset")
    
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    term = crud.update_term(session=session, db_term=term, term_in=term_in)
    
    # Add studyset_id to response for compatibility
    term_dict = term.model_dump()
    term_dict['studyset_id'] = studyset_id
    return TermPublic(**term_dict)


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
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")

    # Check if term belongs to studyset via junction table
    if not crud_studyset_term.is_term_in_studyset(session=session, studyset_id=studyset_id, term_id=term_id):
        raise HTTPException(status_code=404, detail="Term not found in this studyset")
    
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_term(session=session, term_id=term_id)
    return Message(message="Term deleted successfully")


# Terms management endpoint - Get all terms from user's studysets
@router.get("/terms/all/")
def get_all_terms(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(5, ge=1, le=100, description="Maximum number of records to return"),
    studyset_id: uuid.UUID | None = Query(None, description="Filter by study set ID"),
    q: str | None = Query(None, description="Search query for term text or definition"),
) -> Any:
    """
    Get all terms from studysets that the user owns or has access to.
    
    Supports:
    - Filter by studyset_id (optional)
    - Search by term_text or definition (q parameter)
    - Pagination
    
    Returns terms with their studyset_ids (a term can belong to multiple studysets).
    """
    from sqlmodel import or_, distinct
    
    # Get all studyset_ids that user has access to
    # 1. Studysets owned by user
    owned_studysets = session.exec(
        select(StudySet.studyset_id).where(StudySet.owner_id == current_user.user_id)
    ).all()
    
    # 2. Studysets in classes where user is active member
    class_studysets = session.exec(
        select(distinct(ClassStudySet.studyset_id))
        .join(ClassMember, ClassMember.class_id == ClassStudySet.class_id)
        .where(ClassMember.user_id == current_user.user_id)
        .where(ClassMember.status == MembershipStatus.ACTIVE)
    ).all()
    
    # Combine all accessible studyset_ids
    accessible_studyset_ids = list(set(owned_studysets) | set(class_studysets))
    
    if not accessible_studyset_ids:
        return {"data": [], "count": 0}
    
    # Filter by studyset_id if provided
    if studyset_id:
        if studyset_id not in accessible_studyset_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        accessible_studyset_ids = [studyset_id]
    
    # Build query to get distinct terms from accessible studysets
    # Join StudySetTerm to get terms that belong to accessible studysets
    base_statement = (
        select(Term)
        .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
        .where(StudySetTerm.studyset_id.in_(accessible_studyset_ids))
        .distinct()
    )
    
    # Add search filter if provided
    if q:
        from sqlmodel import or_
        search_filter = or_(
            Term.term_text.ilike(f"%{q}%"),
            Term.definition.ilike(f"%{q}%")
        )
        base_statement = base_statement.where(search_filter)
    
    # Count total (distinct terms) - count distinct term_ids matching filters
    # We need to count distinct term_ids, not all rows
    count_base = (
        select(distinct(StudySetTerm.term_id))
        .join(Term, Term.term_id == StudySetTerm.term_id)
        .where(StudySetTerm.studyset_id.in_(accessible_studyset_ids))
    )
    
    if q:
        from sqlmodel import or_
        search_filter = or_(
            Term.term_text.ilike(f"%{q}%"),
            Term.definition.ilike(f"%{q}%")
        )
        count_base = count_base.where(search_filter)
    
    # Count distinct term_ids
    count_statement = select(func.count()).select_from(
        count_base.subquery()
    )
    total_count = session.exec(count_statement).one() or 0
    
    # Get paginated terms - order by created_at DESC so newest terms appear first
    statement = base_statement.order_by(Term.created_at.desc()).offset(skip).limit(limit)
    terms = list(session.exec(statement).all())
    
    if not terms:
        return {"data": [], "count": 0}
    
    # For each term, get all studyset_ids it belongs to (from accessible studysets)
    term_ids = [term.term_id for term in terms]
    studyset_terms = session.exec(
        select(StudySetTerm)
        .where(StudySetTerm.term_id.in_(term_ids))
        .where(StudySetTerm.studyset_id.in_(accessible_studyset_ids))
    ).all()
    
    # Group studyset_ids by term_id
    term_studysets_map: dict[uuid.UUID, list[uuid.UUID]] = {}
    for st in studyset_terms:
        if st.term_id not in term_studysets_map:
            term_studysets_map[st.term_id] = []
        term_studysets_map[st.term_id].append(st.studyset_id)
    
    # Build response with studyset_id (use first one for compatibility)
    terms_with_studyset_id = []
    for term in terms:
        term_dict = term.model_dump()
        studyset_ids = term_studysets_map.get(term.term_id, [])
        # Use first studyset_id for response compatibility
        term_dict['studyset_id'] = studyset_ids[0] if studyset_ids else None
        terms_with_studyset_id.append(TermPublic(**term_dict))
    
    return {"data": terms_with_studyset_id, "count": total_count}


# Get term by termId only (for terms management page)
@router.get("/terms/{term_id}/", response_model=TermPublic)
def get_term_by_id(
    term_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get term by ID (without requiring studyset_id).
    Used for terms management page where we only have term_id.
    """
    term = crud.get_term(session=session, term_id=term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    # Get all studysets that contain this term
    term_studyset_ids = session.exec(
        select(StudySetTerm.studyset_id)
        .where(StudySetTerm.term_id == term_id)
    ).all()
    
    if not term_studyset_ids:
        raise HTTPException(status_code=404, detail="Term not found in any studyset")
    
    # Check if user has access to any of these studysets
    accessible_studyset_id = None
    for studyset_id in term_studyset_ids:
        # Check if user is owner
        studyset = session.get(StudySet, studyset_id)
        if studyset and studyset.owner_id == current_user.user_id:
            accessible_studyset_id = studyset_id
            break
        
        # Check if user is member of class that has this studyset
        class_access = session.exec(
            select(ClassMember)
            .join(ClassStudySet, ClassStudySet.class_id == ClassMember.class_id)
            .where(
                ClassMember.user_id == current_user.user_id,
                ClassStudySet.studyset_id == studyset_id,
                ClassMember.status == MembershipStatus.ACTIVE
            )
        ).first()
        
        if class_access:
            accessible_studyset_id = studyset_id
            break
    
    if not accessible_studyset_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Use first accessible studyset_id for response compatibility
    term_dict = term.model_dump()
    term_dict['studyset_id'] = accessible_studyset_id
    return TermPublic(**term_dict)


# Add term to studyset endpoint
@router.post("/{studyset_id}/terms/{term_id}/add/", response_model=Message)
def add_term_to_studyset(
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Add an existing term to a studyset (N:M relationship).
    
    This allows reusing terms across multiple studysets (term library feature).
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check permissions
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if term exists
    term = crud.get_term(session=session, term_id=term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    # Add term to studyset (idempotent)
    crud_studyset_term.add_term_to_studyset(
        session=session,
        studyset_id=studyset_id,
        term_id=term_id,
        added_by=current_user.user_id,
    )
    
    return Message(message="Term added to study set successfully")


# Remove term from studyset endpoint
@router.delete("/{studyset_id}/terms/{term_id}/remove/", response_model=Message)
def remove_term_from_studyset(
    studyset_id: uuid.UUID,
    term_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Remove a term from a studyset (delete N:M relationship).
    
    Note: This does NOT delete the term itself - just removes it from this studyset.
    The term can still be used in other studysets.
    """
    studyset = crud.get_studyset(session=session, studyset_id=studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check permissions
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Remove term from studyset
    removed = crud_studyset_term.remove_term_from_studyset(
        session=session,
        studyset_id=studyset_id,
        term_id=term_id,
    )
    
    if not removed:
        raise HTTPException(status_code=404, detail="Term not found in this study set")
    
    return Message(message="Term removed from study set successfully")

