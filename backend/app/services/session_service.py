"""
Session-based learning service
"""
import logging
import uuid
from datetime import datetime
from sqlmodel import Session, select
from typing import Any

from app.models import (
    LearningSession, 
    SessionReview, 
    SessionStatus,
    StudyActivity,
    StudySet,
    Term
)
from app.services.learning_service import SpacedRepetitionSM2

logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing learning sessions"""
    
    @staticmethod
    def start_session(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID | None = None,
        session_type: str = "flashcard",
        total_cards: int = 0
    ) -> tuple[LearningSession, list[Term]]:
        """
        Start a new learning session
        
        Args:
            user_id: User ID
            studyset_id: StudySet ID (optional for quick_review)
            session_type: Type of session (flashcard, quick_review, test)
            total_cards: Expected number of cards
        
        Returns:
            Tuple of (LearningSession, list of Terms)
        """
        # Get terms first to determine actual total_cards
        # Simply get ALL terms from studyset, no filtering or sorting
        terms = []
        if studyset_id:
            from app.models import Term
            from sqlmodel import select
            
            terms_statement = select(Term).where(Term.studyset_id == studyset_id)
            terms = list(session.exec(terms_statement).all())
            
            # Use actual terms count if provided total_cards is 0 or less
            if total_cards <= 0:
                total_cards = len(terms)
        
        learning_session = LearningSession(
            user_id=user_id,
            studyset_id=studyset_id,
            session_type=session_type,
            status=SessionStatus.ACTIVE,
            total_cards=total_cards,
            completed_cards=0
        )
        
        session.add(learning_session)
        session.commit()
        session.refresh(learning_session)
        
        return learning_session, terms
    
    @staticmethod
    def submit_review(
        session: Session,
        session_id: uuid.UUID,
        term_id: uuid.UUID,
        recall_score: int,
        response_time: float = 0.0,
        hint_used: bool = False
    ) -> SessionReview:
        """
        Submit a review during active session
        Just records the review, no calculation yet
        
        Args:
            session_id: Learning session ID
            term_id: Term ID
            recall_score: 0-5 rating
            response_time: Response time in seconds
            hint_used: Whether hint was used
        
        Returns:
            SessionReview object
        """
        # Get session
        learning_session = session.get(LearningSession, session_id)
        if not learning_session:
            raise ValueError(f"Session {session_id} not found")
        
        if learning_session.status != SessionStatus.ACTIVE:
            raise ValueError(f"Session {session_id} is not active")
        
        # Create review record
        review = SessionReview(
            session_id=session_id,
            term_id=term_id,
            recall_score=recall_score,
            response_time=response_time,
            hint_used=hint_used
        )
        
        session.add(review)
        
        # Update session progress
        learning_session.completed_cards += 1
        learning_session.updated_at = datetime.utcnow()
        
        session.commit()
        session.refresh(review)
        session.refresh(learning_session)
        
        return review
    
    @staticmethod
    def end_session(
        session: Session,
        session_id: uuid.UUID,
        reviews_data: list[dict] = None
    ) -> dict[str, Any]:
        """
        End a learning session and process all reviews
        This is where SM-2 calculations happen
        
        Args:
            session_id: Learning session ID
            reviews_data: Optional list of reviews from frontend (batch submission)
        
        Returns:
            Dictionary with session summary
        """
        # Get session
        learning_session = session.get(LearningSession, session_id)
        if not learning_session:
            logger.error(f"Session {session_id} not found")
            raise ValueError(f"Session {session_id} not found")
        
        # If reviews_data provided (batch submission from frontend)
        if reviews_data:
            # Create SessionReview records from batch data
            for review_data in reviews_data:
                review = SessionReview(
                    session_id=session_id,
                    term_id=review_data.get('term_id'),
                    recall_score=review_data.get('recall_score', 0),
                    response_time=review_data.get('response_time', 0.0),
                    hint_used=review_data.get('hint_used', False)
                )
                session.add(review)
            
            # Update completed cards count
            learning_session.completed_cards = len(reviews_data)
            session.commit()
        
        # Get all reviews for this session
        reviews_statement = (
            select(SessionReview)
            .where(SessionReview.session_id == session_id)
        )
        reviews = session.exec(reviews_statement).all()
        
        activities_created = 0
        next_review_dates_calculated = 0
        
        # Process each review
        for review in reviews:
            # Get studyset_id from session or from term
            studyset_id = learning_session.studyset_id
            if not studyset_id:
                # Get from term (for quick review with multiple studysets)
                term = session.get(Term, review.term_id)
                if term:
                    studyset_id = term.studyset_id
            
            if not studyset_id:
                continue
            
            # Get previous activity for this term
            prev_activity_statement = (
                select(StudyActivity)
                .where(
                    StudyActivity.user_id == learning_session.user_id,
                    StudyActivity.term_id == review.term_id
                )
                .order_by(StudyActivity.created_at.desc())
            )
            prev_activity = session.exec(prev_activity_statement).first()
            
            # Get current values or defaults
            if prev_activity:
                # Using previous activity data for SM-2 calculation
                current_ef = prev_activity.ef
                current_interval = prev_activity.interval
                # Get repetitions from previous activity if it was correct
                # SM-2: repetitions only continue if previous was correct (recall_score >= 3)
                if prev_activity.recall_score >= 3:
                    repetitions = prev_activity.repetitions
                else:
                    # Previous was wrong, reset repetitions to 0
                    repetitions = 0
                
                logger.info(f"SM-2: Using previous data for term {review.term_id}: "
                           f"prev_ef={current_ef:.2f}, prev_interval={current_interval}, "
                           f"prev_repetitions={repetitions}, prev_recall_score={prev_activity.recall_score}")
            else:
                # First time studying this term - use initial values
                current_ef = SpacedRepetitionSM2.INITIAL_EF
                current_interval = 0
                repetitions = 0
                logger.info(f"SM-2: First time studying term {review.term_id}, using initial values")
            
            # Calculate next review using SM-2 with previous data
            new_ef, new_interval, new_repetitions, next_review_date = (
                SpacedRepetitionSM2.calculate_next_review(
                    recall_score=review.recall_score,
                    current_ef=current_ef,
                    current_interval=current_interval,
                    repetitions=repetitions
                )
            )
            
            logger.info(f"SM-2: Calculated for term {review.term_id} (recall_score={review.recall_score}): "
                       f"new_ef={new_ef:.2f}, new_interval={new_interval}, "
                       f"new_repetitions={new_repetitions}, next_review={next_review_date.date()}")
            
            # Create StudyActivity with calculated values
            activity = StudyActivity(
                user_id=learning_session.user_id,
                studyset_id=studyset_id,
                term_id=review.term_id,
                start_time=learning_session.started_at,
                end_time=datetime.utcnow(),
                hint_used=review.hint_used,
                retry_count=0,
                recall_score=review.recall_score,
                ef=new_ef,
                interval=new_interval,
                repetitions=new_repetitions,
                next_review_date=next_review_date,
                response_time=review.response_time
            )
            
            session.add(activity)
            activities_created += 1
            next_review_dates_calculated += 1
        
        # Update session status
        learning_session.status = SessionStatus.COMPLETED
        learning_session.ended_at = datetime.utcnow()
        learning_session.updated_at = datetime.utcnow()

        # Update StudentStudySet last_studied_at (auto-enrollment if not enrolled)
        if learning_session.studyset_id:
            from app.crud.student_studyset import update_last_studied
            update_last_studied(
                session=session,
                student_id=learning_session.user_id,
                studyset_id=learning_session.studyset_id,
                timestamp=learning_session.ended_at
            )

        session.commit()
        session.refresh(learning_session)
        
        # Calculate duration
        duration_seconds = (
            learning_session.ended_at - learning_session.started_at
        ).total_seconds()
        
        return {
            "session_id": learning_session.session_id,
            "total_cards": learning_session.total_cards,
            "completed_cards": learning_session.completed_cards,
            "activities_created": activities_created,
            "duration_seconds": duration_seconds,
            "next_review_dates_calculated": next_review_dates_calculated
        }
    
    @staticmethod
    def get_active_session(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID | None = None
    ) -> LearningSession | None:
        """
        Get active session for user
        
        Args:
            user_id: User ID
            studyset_id: Optional studyset ID filter
        
        Returns:
            Active LearningSession or None
        """
        statement = (
            select(LearningSession)
            .where(
                LearningSession.user_id == user_id,
                LearningSession.status == SessionStatus.ACTIVE
            )
        )
        
        if studyset_id:
            statement = statement.where(LearningSession.studyset_id == studyset_id)
        
        return session.exec(statement).first()
