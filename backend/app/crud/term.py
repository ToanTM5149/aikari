import uuid
from datetime import datetime

from sqlmodel import Session, select

from app.models import Term, StudyActivity, SessionReview, TestQuestion, TestAnswer, StudySetTerm
from app.schemas import TermCreate, TermUpdate


def get_term(*, session: Session, term_id: uuid.UUID) -> Term | None:
    """Get term by ID"""
    return session.get(Term, term_id)


def create_term(
    *, session: Session, term_in: TermCreate, studyset_id: uuid.UUID, added_by: uuid.UUID | None = None
) -> Term:
    """
    Create new term and add to studyset via junction table.

    Writes only to StudySetTerm (single source of truth)

    Args:
        session: Database session
        term_in: Term creation data
        studyset_id: StudySet to add the term to
        added_by: User who created the term (optional)

    Returns:
        Created Term
    """
    # Create term (no studyset_id field anymore)
    db_obj = Term.model_validate(term_in)
    session.add(db_obj)
    session.flush()  # Flush to get term_id without committing

    # Write to StudySetTerm junction table (single source of truth)
    studyset_term = StudySetTerm(
        studyset_id=studyset_id,
        term_id=db_obj.term_id,
        added_by=added_by,
        added_at=db_obj.created_at,
        order=0,  # Default order, can be updated later
    )
    session.add(studyset_term)

    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_term(*, session: Session, db_term: Term, term_in: TermUpdate) -> Term:
    """Update term"""
    term_data = term_in.model_dump(exclude_unset=True)
    db_term.sqlmodel_update(term_data)
    session.add(db_term)
    session.commit()
    session.refresh(db_term)
    return db_term


def delete_term(*, session: Session, term_id: uuid.UUID) -> None:
    """
    Delete term with proper cleanup of dependent records.

    StudySetTerm relationships are automatically deleted via cascade
    (defined in Term.studyset_terms relationship).

    Raises:
        ValueError: If term has dependencies that prevent deletion
    """
    db_term = session.get(Term, term_id)
    if not db_term:
        return

    # Step 1: Delete StudyActivity entries (has NOT NULL FK to Term)
    study_activities = session.exec(
        select(StudyActivity).where(StudyActivity.term_id == term_id)
    ).all()
    for activity in study_activities:
        session.delete(activity)

    # Step 2: Delete SessionReview entries
    session_reviews = session.exec(
        select(SessionReview).where(SessionReview.term_id == term_id)
    ).all()
    for review in session_reviews:
        session.delete(review)

    # Step 3: Delete TestAnswer entries before deleting TestQuestion
    # (to avoid NOT NULL constraint violation on question_id)
    test_questions = session.exec(
        select(TestQuestion).where(TestQuestion.term_id == term_id)
    ).all()
    question_ids = [tq.question_id for tq in test_questions]
    
    if question_ids:
        test_answers = session.exec(
            select(TestAnswer).where(TestAnswer.question_id.in_(question_ids))
        ).all()
        for answer in test_answers:
            session.delete(answer)

    # Step 4: Delete TestQuestion entries
    # (in production might want to prevent deletion if used in completed tests)
    for tq in test_questions:
        session.delete(tq)

    # Step 5: Delete term
    # StudySetTerm relationships are automatically deleted via cascade
    session.delete(db_term)
    session.commit()


def get_terms_by_studyset(
    *,
    session: Session,
    studyset_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 100
) -> list[Term]:
    """
    Get all terms in a study set, optionally filtered by study status.

    Reads from StudySetTerm junction table instead of Term.studyset_id
    """
    #  Read from StudySetTerm junction table (NEW)
    statement = (
        select(Term)
        .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
        .where(StudySetTerm.studyset_id == studyset_id)
        .order_by(StudySetTerm.order, Term.created_at)
    )

    all_terms = list(session.exec(statement).all())
    
    # If no status filter or user_id, return all terms
    if not status or status == "all" or not user_id:
        return all_terms[skip:skip+limit] if limit else all_terms[skip:]
    
    # Get user's study activities for filtering
    activities_statement = (
        select(StudyActivity)
        .where(
            StudyActivity.user_id == user_id,
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
    
    # Filter based on status
    filtered_terms = []
    for term in all_terms:
        activity = term_latest_activity.get(term.term_id)
        
        if status == "mastered":
            # Mastered: ef > 2.5 AND interval > 21
            if activity and activity.ef > 2.5 and activity.interval > 21:
                filtered_terms.append(term)
        elif status == "learning":
            # Reviewing: recall_score >= 3 but not mastered
            if activity and activity.recall_score >= 3 and not (activity.ef > 2.5 and activity.interval > 21):
                filtered_terms.append(term)
        elif status == "weak":
            # Weak/forgotten: recall_score < 3
            if activity and activity.recall_score < 3:
                filtered_terms.append(term)
        elif status == "not-learned":
            # Never studied: no activity
            if not activity:
                filtered_terms.append(term)
    
    return filtered_terms[skip:skip+limit] if limit else filtered_terms[skip:]
