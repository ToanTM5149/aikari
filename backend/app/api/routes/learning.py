"""
Learning API Routes
Endpoints for flashcard learning, review, and progress tracking
"""
import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep, check_studyset_access
from app.models import StudySet, Term, StudyActivity, ProgressSummary
from app.schemas import (
    LearningSessionStart,
    LearningSessionStartResponse,
    NextTermResponse,
    ReviewSubmission,
    ReviewResponse,
    SessionSummary,
    ProgressSummaryPublic,
    StudyActivityPublic,
    UserProgressOverview,
    StudyStats,
    WeakTerm,
    DueCardsResponse,
    QuickReviewSessionRequest,
    QuickReviewSessionResponse,
)
from app.services.learning_service import LearningService

router = APIRouter()


@router.post("/session/start/", response_model=LearningSessionStartResponse)
def start_learning_session(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    session_data: LearningSessionStart,
) -> Any:
    """
    Start a new learning session
    Returns session info and prepares terms for review
    """
    # Verify studyset exists and user has access
    studyset = session.get(StudySet, session_data.studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check if user has access (owner or class member)
    if not check_studyset_access(session, session_data.studyset_id, current_user.user_id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get terms for session
    terms = LearningService.get_terms_for_session(
        session=session,
        user_id=current_user.user_id,
        studyset_id=session_data.studyset_id,
        limit=session_data.session_size
    )
    
    # Count total terms in studyset
    total_terms_statement = select(Term).where(Term.studyset_id == session_data.studyset_id)
    total_terms = len(list(session.exec(total_terms_statement).all()))
    
    # Get activities to determine if terms are new
    activities_statement = (
        select(StudyActivity)
        .where(
            StudyActivity.user_id == current_user.user_id,
            StudyActivity.studyset_id == session_data.studyset_id
        )
    )
    activities = session.exec(activities_statement).all()
    
    # Create map of term_id -> latest activity
    term_activity_map: dict[uuid.UUID, StudyActivity] = {}
    for activity in activities:
        if activity.term_id not in term_activity_map:
            term_activity_map[activity.term_id] = activity
        else:
            if activity.created_at > term_activity_map[activity.term_id].created_at:
                term_activity_map[activity.term_id] = activity
    
    # Build terms response
    terms_response = [
        NextTermResponse(
            term_id=term.term_id,
            term_text=term.term_text,
            definition=term.definition,
            example=term.example,
            image_url=term.image_url,
            category=None,
            is_new=term.term_id not in term_activity_map,
            previous_recall_score=term_activity_map[term.term_id].recall_score if term.term_id in term_activity_map else None,
            next_review_date=term_activity_map[term.term_id].next_review_date if term.term_id in term_activity_map else None
        )
        for term in terms
    ]
    
    return LearningSessionStartResponse(
        session_id=str(uuid.uuid4()),  # Generate session ID
        studyset_id=session_data.studyset_id,
        total_terms=total_terms,
        terms_in_session=len(terms),
        terms=terms_response,
        started_at=datetime.utcnow()
    )


@router.get("/studysets/{studyset_id}/next/", response_model=NextTermResponse)
def get_next_term(
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get the next term to review based on spaced repetition algorithm
    """
    # Verify studyset exists
    studyset = session.get(StudySet, studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check if user has access (owner or class member)
    if not check_studyset_access(session, studyset_id, current_user.user_id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get next term
    term = LearningService.get_next_term_to_review(
        session=session,
        user_id=current_user.user_id,
        studyset_id=studyset_id
    )
    
    if not term:
        raise HTTPException(status_code=404, detail="No terms available for review")
    
    # Get previous activity for this term
    prev_activity_statement = (
        select(StudyActivity)
        .where(
            StudyActivity.user_id == current_user.user_id,
            StudyActivity.term_id == term.term_id
        )
        .order_by(StudyActivity.created_at.desc())
    )
    prev_activity = session.exec(prev_activity_statement).first()
    
    return NextTermResponse(
        term_id=term.term_id,
        term_text=term.term_text,
        definition=term.definition,
        example=term.example,
        image_url=term.image_url,
        category=None,
        is_new=prev_activity is None,
        previous_recall_score=prev_activity.recall_score if prev_activity else None,
        next_review_date=prev_activity.next_review_date if prev_activity else None
    )


@router.post("/studysets/{studyset_id}/review/", response_model=ReviewResponse)
def submit_review(
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
    review: ReviewSubmission,
) -> Any:
    """
    Submit a review for a term
    Updates study activity and progress using SM-2 algorithm
    """
    # Verify studyset exists
    studyset = session.get(StudySet, studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Check if user has access (owner or class member)
    if not check_studyset_access(session, studyset_id, current_user.user_id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify term belongs to studyset
    term = session.get(Term, review.term_id)
    if not term or term.studyset_id != studyset_id:
        raise HTTPException(status_code=404, detail="Term not found in this study set")
    
    # Record the review
    activity = LearningService.record_review(
        session=session,
        user_id=current_user.user_id,
        studyset_id=studyset_id,
        term_id=review.term_id,
        recall_score=review.recall_score,
        hint_used=review.hint_used,
        response_time=review.response_time
    )
    
    # Generate response message
    if review.recall_score >= 4:
        message = "Excellent! Keep it up!"
    elif review.recall_score >= 3:
        message = "Good job! Keep practicing."
    else:
        message = "Don't worry, you'll get it next time!"
    
    return ReviewResponse(
        activity_id=activity.activity_id,
        term_id=activity.term_id,
        recall_score=activity.recall_score,
        ef=activity.ef,
        interval=activity.interval,
        next_review_date=activity.next_review_date,
        message=message
    )


@router.post("/session/end/", response_model=SessionSummary)
def end_learning_session(
    current_user: CurrentUser,
    session: SessionDep,
    studyset_id: uuid.UUID,
    session_start: datetime,
) -> Any:
    """
    End a learning session and return summary
    """
    # Calculate session duration
    # Normalize session_start to UTC naive datetime if it's timezone-aware
    if session_start.tzinfo is not None:
        session_start = session_start.replace(tzinfo=None)
    
    session_end = datetime.utcnow()
    duration_minutes = (session_end - session_start).total_seconds() / 60
    
    # Get session summary
    summary = LearningService.get_session_summary(
        session=session,
        user_id=current_user.user_id,
        studyset_id=studyset_id,
        since=session_start
    )
    
    # Count cards due next
    activities_statement = (
        select(StudyActivity)
        .where(
            StudyActivity.user_id == current_user.user_id,
            StudyActivity.studyset_id == studyset_id,
            StudyActivity.next_review_date <= datetime.utcnow() + timedelta(days=1)
        )
    )
    cards_due_next = len(list(session.exec(activities_statement).all()))
    
    # Get next review date
    next_activity_statement = (
        select(StudyActivity)
        .where(
            StudyActivity.user_id == current_user.user_id,
            StudyActivity.studyset_id == studyset_id,
            StudyActivity.next_review_date > datetime.utcnow()
        )
        .order_by(StudyActivity.next_review_date)
    )
    next_activity = session.exec(next_activity_statement).first()
    
    return SessionSummary(
        studyset_id=studyset_id,
        session_duration=duration_minutes,
        total_reviewed=summary["total_reviewed"],
        average_recall_score=summary["average_recall_score"],
        difficulty_distribution=summary["difficulty_distribution"],
        cards_due_next=cards_due_next,
        next_review_date=next_activity.next_review_date if next_activity else None
    )


@router.get("/progress/studysets/{studyset_id}/", response_model=ProgressSummaryPublic)
def get_studyset_progress(
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get progress summary for a specific studyset
    """
    # Verify studyset exists
    studyset = session.get(StudySet, studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Get or create progress
    progress_statement = (
        select(ProgressSummary)
        .where(
            ProgressSummary.user_id == current_user.user_id,
            ProgressSummary.studyset_id == studyset_id
        )
    )
    progress = session.exec(progress_statement).first()
    
    if not progress:
        # Create initial progress
        progress = LearningService.update_progress_summary(
            session=session,
            user_id=current_user.user_id,
            studyset_id=studyset_id
        )
    
    return progress


@router.get("/progress/studysets/{studyset_id}/stats/", response_model=StudyStats)
def get_studyset_stats(
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get detailed statistics for a studyset
    """
    # Verify studyset exists
    studyset = session.get(StudySet, studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Get all terms
    terms_statement = select(Term).where(Term.studyset_id == studyset_id)
    all_terms = list(session.exec(terms_statement).all())
    total_terms = len(all_terms)
    
    # Get all activities
    activities_statement = (
        select(StudyActivity)
        .where(
            StudyActivity.user_id == current_user.user_id,
            StudyActivity.studyset_id == studyset_id
        )
    )
    activities = list(session.exec(activities_statement).all())
    
    # Get latest activity per term
    term_latest_activity: dict[uuid.UUID, StudyActivity] = {}
    for activity in activities:
        if activity.term_id not in term_latest_activity:
            term_latest_activity[activity.term_id] = activity
        else:
            if activity.created_at > term_latest_activity[activity.term_id].created_at:
                term_latest_activity[activity.term_id] = activity
    
    studied_terms = len(term_latest_activity)
    never_studied = total_terms - studied_terms
    
    # Categorize
    mastered = sum(1 for a in term_latest_activity.values() if a.ef > 2.5 and a.interval > 21)
    reviewing = sum(1 for a in term_latest_activity.values() if a.recall_score >= 3 and not (a.ef > 2.5 and a.interval > 21))
    forgotten = sum(1 for a in term_latest_activity.values() if a.recall_score < 3)
    
    # Average recall score across all reviews
    avg_recall = sum(a.recall_score for a in activities) / len(activities) if activities else 0.0
    
    # Find weak terms (recall_score < 3)
    weak_terms_data = [
        (term, term_latest_activity[term.term_id])
        for term in all_terms
        if term.term_id in term_latest_activity and term_latest_activity[term.term_id].recall_score < 3
    ]
    
    weak_terms_list = [
        WeakTerm(
            term_id=term.term_id,
            term_text=term.term_text,
            definition=term.definition,
            recall_score=activity.recall_score,
            times_reviewed=sum(1 for a in activities if a.term_id == term.term_id),
            last_reviewed=activity.created_at,
            next_review=activity.next_review_date
        )
        for term, activity in weak_terms_data
    ]
    
    return StudyStats(
        studyset_id=studyset_id,
        total_terms=total_terms,
        studied_terms=studied_terms,
        mastered_terms=mastered,
        reviewing_terms=reviewing,
        forgotten_terms=forgotten,
        never_studied=never_studied,
        accuracy=avg_recall,  # Now using average recall score instead of accuracy
        average_recall_score=avg_recall,
        total_study_time=0.0,  # TODO: Track study time
        weak_terms=weak_terms_list
    )


# DUE CARDS AND QUICK REVIEW ENDPOINTS

@router.get("/due-cards/", response_model=DueCardsResponse)
def get_all_due_cards(
    current_user: CurrentUser,
    session: SessionDep,
    include_future: bool = False,
) -> Any:
    """
    Get all due cards across all studysets for current user
    
    Query params:
    - include_future: If True, include cards due in next 7 days (default: False)
    """
    due_data = LearningService.get_all_due_cards(
        session=session,
        user_id=current_user.user_id,
        include_future=include_future
    )
    
    return DueCardsResponse(**due_data)


@router.post("/quick-review/start/", response_model=QuickReviewSessionResponse)
def start_quick_review_session(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    request_data: QuickReviewSessionRequest,
) -> Any:
    """
    Start a quick review session with due cards
    
    This allows users to review all cards that are due for review
    across multiple studysets in one session.
    
    Body:
    - studyset_ids: Optional list of studyset IDs to filter (None = all)
    - max_cards: Maximum cards in session (default: 20, max: 100)
    """
    # Verify studysets exist and user has access if studyset_ids provided
    if request_data.studyset_ids:
        for studyset_id in request_data.studyset_ids:
            studyset = session.get(StudySet, studyset_id)
            if not studyset:
                raise HTTPException(
                    status_code=404,
                    detail=f"Study set {studyset_id} not found"
                )
            
            if not check_studyset_access(session, studyset_id, current_user.user_id):
                raise HTTPException(
                    status_code=403,
                    detail=f"Not enough permissions for study set {studyset_id}"
                )
    
    # Create quick review session
    session_data = LearningService.create_quick_review_session(
        session=session,
        user_id=current_user.user_id,
        studyset_ids=request_data.studyset_ids,
        max_cards=request_data.max_cards
    )
    
    return QuickReviewSessionResponse(**session_data)
