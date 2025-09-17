import uuid
from typing import Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.api.deps import CurrentUser, get_session
from app.models.models import (
    UserCardState,
    UserCardStateCreate,
    UserCardStatePublic,
    UserCardStateUpdate,
    ReviewEvent,
    ReviewEventCreate,
    ReviewEventPublic,
    Message,
)

router = APIRouter()


@router.get("/due", response_model=list[UserCardStatePublic])
def get_due_cards(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    limit: int = 20,
) -> Any:
    """
    Get cards due for review.
    """
    due_cards = crud.get_due_cards(
        session=session, user_id=current_user.id, limit=limit
    )
    return due_cards


@router.get("/sets/{set_id}/cards", response_model=list[UserCardStatePublic])
def get_set_card_states(
    set_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Get user's card states for a specific set.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    # Only allow access to own sets for SRS data
    if flashcard_set.author_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get all items in the set and their states
    items = crud.get_flashcard_items_by_set(session=session, set_id=set_id)
    card_states = []
    
    for item in items:
        state = crud.get_user_card_state(
            session=session, user_id=current_user.id, item_id=item.id
        )
        if not state:
            # Create initial state if doesn't exist
            state_create = UserCardStateCreate(
                flashcard_set_id=set_id,
                flashcard_item_id=item.id
            )
            state = crud.create_user_card_state(
                session=session, state_in=state_create, user_id=current_user.id
            )
        card_states.append(state)
    
    return card_states


@router.post("/review", response_model=ReviewEventPublic)
def submit_review(
    *,
    current_user: CurrentUser,
    review_in: ReviewEventCreate,
    session: Session = Depends(get_session),
) -> Any:
    """
    Submit a review for a flashcard item.
    """
    # Get the flashcard item
    item = crud.get_flashcard_item(session=session, item_id=review_in.flashcard_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Flashcard item not found")
    
    # Get the flashcard set
    flashcard_set = crud.get_flashcard_set(session=session, set_id=item.flashcard_set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    # Only allow reviews on own sets
    if flashcard_set.author_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get or create user card state
    card_state = crud.get_user_card_state(
        session=session, user_id=current_user.id, item_id=item.id
    )
    if not card_state:
        state_create = UserCardStateCreate(
            flashcard_set_id=item.flashcard_set_id,
            flashcard_item_id=item.id
        )
        card_state = crud.create_user_card_state(
            session=session, state_in=state_create, user_id=current_user.id
        )
    
    # Calculate new SRS values based on rating
    rating = review_in.rating
    ease_factor = card_state.ease_factor
    interval_days = card_state.interval_days
    streak = card_state.streak
    lapses = card_state.lapses
    
    # Simple SRS algorithm (similar to SM-2)
    if rating >= 3:  # Good or Easy
        if streak == 0:
            new_interval = 1
        elif streak == 1:
            new_interval = 6
        else:
            new_interval = int(interval_days * ease_factor)
        
        new_streak = streak + 1
        new_lapses = lapses
        
        if rating == 4:  # Easy
            ease_factor += 0.15
            new_interval = int(new_interval * 1.3)
        elif rating == 3:  # Good
            ease_factor += 0.1
    else:  # Again or Hard
        new_interval = 1
        new_streak = 0
        new_lapses = lapses + 1
        ease_factor -= 0.2
        
        if rating == 2:  # Hard
            ease_factor -= 0.15
    
    # Ensure ease factor doesn't go below 1.3
    ease_factor = max(1.3, ease_factor)
    
    # Calculate due date
    due_at = datetime.utcnow() + timedelta(days=new_interval)
    
    # Update card state
    state_update = UserCardStateUpdate(
        ease_factor=ease_factor,
        interval_days=new_interval,
        streak=new_streak,
        lapses=new_lapses,
        due_at=due_at,
        last_reviewed_at=datetime.utcnow()
    )
    
    crud.update_user_card_state(
        session=session, db_state=card_state, state_in=state_update
    )
    
    # Create review event
    review_event = crud.create_review_event(
        session=session, event_in=review_in, user_id=current_user.id
    )
    
    return review_event


@router.get("/stats", response_model=dict)
def get_study_stats(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Get study statistics for the user.
    """
    # Get recent review events
    recent_reviews = crud.get_review_events_by_user(
        session=session, user_id=current_user.id, limit=100
    )
    
    # Get due cards count
    due_cards = crud.get_due_cards(
        session=session, user_id=current_user.id, limit=1000
    )
    
    # Calculate stats
    today = datetime.utcnow().date()
    reviews_today = len([r for r in recent_reviews if r.reviewed_at.date() == today])
    
    return {
        "due_cards_count": len(due_cards),
        "reviews_today": reviews_today,
        "total_reviews": len(recent_reviews),
        "average_rating": (
            sum(r.rating for r in recent_reviews) / len(recent_reviews)
            if recent_reviews else 0
        )
    }


@router.post("/sets/{set_id}/reset", response_model=Message)
def reset_set_progress(
    set_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Reset progress for all cards in a set.
    """
    flashcard_set = crud.get_flashcard_set(session=session, set_id=set_id)
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    # Only allow reset on own sets
    if flashcard_set.author_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get all items in the set
    items = crud.get_flashcard_items_by_set(session=session, set_id=set_id)
    
    # Reset all card states
    for item in items:
        card_state = crud.get_user_card_state(
            session=session, user_id=current_user.id, item_id=item.id
        )
        if card_state:
            state_update = UserCardStateUpdate(
                ease_factor=2.5,
                interval_days=0,
                streak=0,
                lapses=0,
                due_at=None,
                last_reviewed_at=None
            )
            crud.update_user_card_state(
                session=session, db_state=card_state, state_in=state_update
            )
    
    return Message(message="Set progress reset successfully")
