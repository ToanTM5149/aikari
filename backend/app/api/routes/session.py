"""
Session-based learning API routes
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.deps import get_current_user, get_session
from app.models import User
from app.schemas.session import (
    StartSessionRequest,
    StartSessionResponse,
    SubmitReviewRequest,
    SubmitReviewResponse,
    EndSessionRequest,
    EndSessionResponse,
    SessionInfo
)
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/start", response_model=StartSessionResponse)
def start_learning_session(
    request: StartSessionRequest,
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new learning session
    
    - **studyset_id**: StudySet ID (optional for quick_review)
    - **session_type**: flashcard, quick_review, or test
    - **total_cards**: Expected number of cards
    """
    try:
        # Check for existing active session first
        # For quick_review (studyset_id=None), don't check existing session
        # as each due cards review should be a new session
        existing_session = None
        if request.studyset_id:
            existing_session = SessionService.get_active_session(
                session=db,
                user_id=current_user.user_id,
                studyset_id=request.studyset_id
            )
        
        if existing_session:
            # Return existing session info
            from app.models import StudyActivity
            from sqlmodel import select
            
            # Get terms for existing session
            from app.services.learning_service import LearningService
            terms = LearningService.get_terms_for_session(
                session=db,
                user_id=current_user.user_id,
                studyset_id=request.studyset_id,
                limit=100
            )
            
            # Get activities for is_new flag
            activities_statement = (
                select(StudyActivity)
                .where(
                    StudyActivity.user_id == current_user.user_id,
                    StudyActivity.studyset_id == request.studyset_id
                )
            )
            activities = db.exec(activities_statement).all()
            
            term_activity_map = {}
            for activity in activities:
                if activity.term_id not in term_activity_map:
                    term_activity_map[activity.term_id] = activity
                else:
                    if activity.created_at > term_activity_map[activity.term_id].created_at:
                        term_activity_map[activity.term_id] = activity
            
            terms_response = [
                {
                    "term_id": str(term.term_id),
                    "term_text": term.term_text,
                    "definition": term.definition,
                    "example": term.example,
                    "image_url": term.image_url,
                    "category": None,
                    "is_new": term.term_id not in term_activity_map,
                    "previous_recall_score": term_activity_map[term.term_id].recall_score if term.term_id in term_activity_map else None,
                    "next_review_date": term_activity_map[term.term_id].next_review_date if term.term_id in term_activity_map else None
                }
                for term in terms
            ]
            
            # Update total_cards in database if it's 0 or different from actual terms count
            actual_total_cards = len(terms)
            if existing_session.total_cards != actual_total_cards:
                existing_session.total_cards = actual_total_cards
                db.add(existing_session)
                db.commit()
                db.refresh(existing_session)
            
            response = StartSessionResponse(
                session_id=existing_session.session_id,
                studyset_id=existing_session.studyset_id,
                session_type=existing_session.session_type,
                started_at=existing_session.started_at,
                total_cards=actual_total_cards,
                terms=terms_response
            )
            
            return response
        
        learning_session, terms = SessionService.start_session(
            session=db,
            user_id=current_user.user_id,
            studyset_id=request.studyset_id,
            session_type=request.session_type,
            total_cards=request.total_cards
        )
        
        # Update total_cards based on actual terms count
        if len(terms) > 0:
            learning_session.total_cards = len(terms)
            db.add(learning_session)
            db.commit()
            db.refresh(learning_session)
        
        # Get user activities to include is_new flag and previous scores
        from app.models import StudyActivity
        from sqlmodel import select
        
        # Query activities - handle case when studyset_id is None (for quick_review)
        if request.studyset_id:
            activities_statement = (
                select(StudyActivity)
                .where(
                    StudyActivity.user_id == current_user.user_id,
                    StudyActivity.studyset_id == request.studyset_id
                )
            )
        else:
            # For quick_review (due cards), get all activities for user
            activities_statement = (
                select(StudyActivity)
                .where(StudyActivity.user_id == current_user.user_id)
            )
        activities = db.exec(activities_statement).all()
        
        # Create map of term_id -> latest activity
        term_activity_map = {}
        for activity in activities:
            if activity.term_id not in term_activity_map:
                term_activity_map[activity.term_id] = activity
            else:
                if activity.created_at > term_activity_map[activity.term_id].created_at:
                    term_activity_map[activity.term_id] = activity
        
        # Build terms response with activity info
        terms_response = [
            {
                "term_id": str(term.term_id),
                "term_text": term.term_text,
                "definition": term.definition,
                "example": term.example,
                "image_url": term.image_url,
                "category": None,
                "is_new": term.term_id not in term_activity_map,
                "previous_recall_score": term_activity_map[term.term_id].recall_score if term.term_id in term_activity_map else None,
                "next_review_date": term_activity_map[term.term_id].next_review_date if term.term_id in term_activity_map else None
            }
            for term in terms
        ]
        
        response = StartSessionResponse(
            session_id=learning_session.session_id,
            studyset_id=learning_session.studyset_id,
            session_type=learning_session.session_type,
            started_at=learning_session.started_at,
            total_cards=len(terms),
            terms=terms_response
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/review", response_model=SubmitReviewResponse)
def submit_review(
    request: SubmitReviewRequest,
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a review during active session
    
    Just records term_id and recall_score, no calculations yet
    """
    try:
        review = SessionService.submit_review(
            session=db,
            session_id=request.session_id,
            term_id=request.term_id,
            recall_score=request.recall_score,
            response_time=request.response_time,
            hint_used=request.hint_used
        )
        
        # Get updated session
        learning_session = db.get(type(review.session), request.session_id)
        
        return SubmitReviewResponse(
            review_id=review.review_id,
            session_id=review.session_id,
            completed_cards=learning_session.completed_cards if learning_session else 0
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/end", response_model=EndSessionResponse)
def end_learning_session(
    request: EndSessionRequest,
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    End a learning session
    
    This triggers SM-2 calculations for all reviews in the session
    and creates StudyActivity records with next_review_date
    
    Accepts batch reviews from frontend (reviews not sent during session)
    """
    try:
        # Convert reviews to dict format
        reviews_data = [
            {
                'term_id': review.term_id,
                'recall_score': review.recall_score,
                'response_time': review.response_time,
                'hint_used': review.hint_used
            }
            for review in request.reviews
        ] if request.reviews else None
        
        result = SessionService.end_session(
            session=db,
            session_id=request.session_id,
            reviews_data=reviews_data
        )
        
        return EndSessionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active", response_model=SessionInfo | None)
def get_active_session(
    studyset_id: str | None = None,
    *,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get active session for current user
    """
    import uuid
    
    studyset_uuid = uuid.UUID(studyset_id) if studyset_id else None
    
    learning_session = SessionService.get_active_session(
        session=db,
        user_id=current_user.user_id,
        studyset_id=studyset_uuid
    )
    
    if not learning_session:
        return None
    
    return SessionInfo(
        session_id=learning_session.session_id,
        studyset_id=learning_session.studyset_id,
        session_type=learning_session.session_type,
        status=learning_session.status,
        started_at=learning_session.started_at,
        ended_at=learning_session.ended_at,
        total_cards=learning_session.total_cards,
        completed_cards=learning_session.completed_cards
    )
