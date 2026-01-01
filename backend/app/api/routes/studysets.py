import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import StudySet, Term
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
) -> Any:
    """
    Retrieve study sets owned by current user.
    """
    sets = crud.get_studysets_by_owner(
        session=session, owner_id=current_user.user_id, skip=skip, limit=limit
    )
    return {"data": sets, "count": len(sets)}


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
    
    # Check if user owns the set
    if studyset.owner_id != current_user.user_id:
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
    
    # Check if user owns the set
    if studyset.owner_id != current_user.user_id:
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
    
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    term = crud.get_term(session=session, term_id=term_id)
    if not term or term.studyset_id != studyset_id:
        raise HTTPException(status_code=404, detail="Term not found")
    
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

