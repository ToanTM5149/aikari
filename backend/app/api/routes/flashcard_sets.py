import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.api.deps import CurrentUser, get_session
from app.models.models import (
    FlashcardSet,
    FlashcardSetCreate,
    FlashcardSetPublic,
    FlashcardSetsPublic,
    FlashcardSetUpdate,
    FlashcardItem,
    FlashcardItemCreate,
    FlashcardItemPublic,
    FlashcardItemsPublic,
    FlashcardItemUpdate,
    Message,
)

router = APIRouter()


@router.get("/", response_model=FlashcardSetsPublic)
def read_flashcard_sets(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve flashcard sets authored by current user.
    """
    sets = crud.get_flashcard_sets_by_author(
        session=session, author_id=current_user.id, skip=skip, limit=limit
    )
    return FlashcardSetsPublic(data=sets, count=len(sets))


@router.get("/public", response_model=FlashcardSetsPublic)
def read_public_flashcard_sets(
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve public flashcard sets.
    """
    sets = crud.get_public_flashcard_sets(session=session, skip=skip, limit=limit)
    return FlashcardSetsPublic(data=sets, count=len(sets))


@router.get("/{set_id}", response_model=FlashcardSetPublic)
def read_flashcard_set(
    set_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Get flashcard set by ID.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    # Check if user owns the set or it's public
    if flashcard_set.author_user_id != current_user.id and not flashcard_set.is_public:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return flashcard_set


@router.post("/", response_model=FlashcardSetPublic)
def create_flashcard_set(
    *,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    set_in: FlashcardSetCreate,
) -> Any:
    """
    Create new flashcard set.
    """
    flashcard_set = crud.create_flashcard_set(
        session=session, set_in=set_in, author_id=current_user.id
    )
    return flashcard_set


@router.put("/{set_id}", response_model=FlashcardSetPublic)
def update_flashcard_set(
    *,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    set_id: uuid.UUID,
    set_in: FlashcardSetUpdate,
) -> Any:
    """
    Update a flashcard set.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    if flashcard_set.author_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    flashcard_set = crud.update_flashcard_set(
        session=session, db_set=flashcard_set, set_in=set_in
    )
    return flashcard_set


@router.delete("/{set_id}", response_model=Message)
def delete_flashcard_set(
    set_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Delete a flashcard set.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    if flashcard_set.author_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_flashcard_set(session=session, set_id=set_id)
    return Message(message="Flashcard set deleted successfully")


# Flashcard Items endpoints
@router.get("/{set_id}/items", response_model=FlashcardItemsPublic)
def read_flashcard_items(
    set_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve flashcard items in a set.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    # Check if user owns the set or it's public
    if flashcard_set.author_user_id != current_user.id and not flashcard_set.is_public:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    items = crud.get_flashcard_items_by_set(
        session=session, set_id=set_id, skip=skip, limit=limit
    )
    return FlashcardItemsPublic(data=items, count=len(items))


@router.get("/{set_id}/items/{item_id}", response_model=FlashcardItemPublic)
def read_flashcard_item(
    set_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Get flashcard item by ID.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    # Check if user owns the set or it's public
    if flashcard_set.author_user_id != current_user.id and not flashcard_set.is_public:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    item = crud.get_flashcard_item(session=session, item_id=item_id)
    if not item or item.flashcard_set_id != set_id:
        raise HTTPException(status_code=404, detail="Flashcard item not found")
    
    return item


@router.post("/{set_id}/items", response_model=FlashcardItemPublic)
def create_flashcard_item(
    *,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    set_id: uuid.UUID,
    item_in: FlashcardItemCreate,
) -> Any:
    """
    Create new flashcard item.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    if flashcard_set.author_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    item_in.flashcard_set_id = set_id
    item = crud.create_flashcard_item(
        session=session, item_in=item_in, created_by=current_user.id
    )
    return item


@router.put("/{set_id}/items/{item_id}", response_model=FlashcardItemPublic)
def update_flashcard_item(
    *,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    set_id: uuid.UUID,
    item_id: uuid.UUID,
    item_in: FlashcardItemUpdate,
) -> Any:
    """
    Update a flashcard item.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    item = crud.get_flashcard_item(session=session, item_id=item_id)
    if not item or item.flashcard_set_id != set_id:
        raise HTTPException(status_code=404, detail="Flashcard item not found")
    
    # Check if user owns the set or created this item
    if (flashcard_set.author_user_id != current_user.id and 
        item.created_by_user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    item = crud.update_flashcard_item(session=session, db_item=item, item_in=item_in)
    return item


@router.delete("/{set_id}/items/{item_id}", response_model=Message)
def delete_flashcard_item(
    set_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Delete a flashcard item.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    item = crud.get_flashcard_item(session=session, item_id=item_id)
    if not item or item.flashcard_set_id != set_id:
        raise HTTPException(status_code=404, detail="Flashcard item not found")
    
    # Check if user owns the set or created this item
    if (flashcard_set.author_user_id != current_user.id and 
        item.created_by_user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_flashcard_item(session=session, item_id=item_id)
    return Message(message="Flashcard item deleted successfully")
