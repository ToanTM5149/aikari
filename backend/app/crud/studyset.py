import uuid

from sqlmodel import Session, select

from app.models import (
    StudySet,
    Term,
    ProgressSummary,
    StudyActivity,
    Test,
    TestQuestion,
    TestAttempt,
    TestAnswer,
    ReattemptRequest,
    ClassStudySet,
    AIGeneratedContents,
    ChatConversation,
    SessionReview,
    StudentStudySet,
)
from app.schemas import StudySetCreate, StudySetUpdate


def get_studyset(*, session: Session, studyset_id: uuid.UUID) -> StudySet | None:
    """Get study set by ID"""
    return session.get(StudySet, studyset_id)


def create_studyset(
    *, session: Session, studyset_in: StudySetCreate, owner_id: uuid.UUID
) -> StudySet:
    """Create new study set"""
    db_obj = StudySet.model_validate(studyset_in, update={"owner_id": owner_id})
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_studyset(
    *, session: Session, db_studyset: StudySet, studyset_in: StudySetUpdate
) -> StudySet:
    """Update study set"""
    studyset_data = studyset_in.model_dump(exclude_unset=True)
    db_studyset.sqlmodel_update(studyset_data)
    session.add(db_studyset)
    session.commit()
    session.refresh(db_studyset)
    return db_studyset


def delete_studyset(*, session: Session, studyset_id: uuid.UUID) -> None:
    """Delete study set and all related records"""
    db_studyset = session.get(StudySet, studyset_id)
    if not db_studyset:
        return
    
    # Delete related records in correct order to avoid foreign key violations
    
    # 1. Delete ChatConversation entries first (has NOT NULL FK to StudySet, cascade deletes ChatMessage)
    conversations = session.exec(
        select(ChatConversation).where(ChatConversation.studyset_id == studyset_id)
    ).all()
    for conversation in conversations:
        session.delete(conversation)
    
    # 2. Delete ProgressSummary entries (has NOT NULL FK to StudySet)
    progress_summaries = session.exec(
        select(ProgressSummary).where(ProgressSummary.studyset_id == studyset_id)
    ).all()
    for progress in progress_summaries:
        session.delete(progress)
    
    # 3. Delete StudentStudySet entries (junction table - Phase 1 addition)
    student_studysets = session.exec(
        select(StudentStudySet).where(StudentStudySet.studyset_id == studyset_id)
    ).all()
    for enrollment in student_studysets:
        session.delete(enrollment)

    # 4. Delete StudyActivity entries (has FK to StudySet)
    activities = session.exec(
        select(StudyActivity).where(StudyActivity.studyset_id == studyset_id)
    ).all()
    for activity in activities:
        session.delete(activity)
    
    # 4. Delete TestAttempt entries (has FK to Test, which has FK to StudySet)
    # First get all tests for this studyset
    tests = session.exec(
        select(Test).where(Test.studyset_id == studyset_id)
    ).all()
    for test in tests:
        # Delete TestAttempt entries for this test
        attempts = session.exec(
            select(TestAttempt).where(TestAttempt.test_id == test.test_id)
        ).all()
        for attempt in attempts:
            # Delete ReattemptRequest entries for this attempt (has FK to TestAttempt)
            reattempts = session.exec(
                select(ReattemptRequest).where(ReattemptRequest.attempt_id == attempt.attempt_id)
            ).all()
            for reattempt in reattempts:
                session.delete(reattempt)
            
            # Delete TestAnswer entries for this attempt
            answers = session.exec(
                select(TestAnswer).where(TestAnswer.attempt_id == attempt.attempt_id)
            ).all()
            for answer in answers:
                session.delete(answer)
            session.delete(attempt)
        
        # Delete TestQuestion entries for this test
        questions = session.exec(
            select(TestQuestion).where(TestQuestion.test_id == test.test_id)
        ).all()
        for question in questions:
            session.delete(question)
        
        # Delete the test
        session.delete(test)
    
    # 5. Delete ClassStudySet entries (junction table)
    class_studysets = session.exec(
        select(ClassStudySet).where(ClassStudySet.studyset_id == studyset_id)
    ).all()
    for css in class_studysets:
        session.delete(css)

    # 6. FIX BUG: Delete SessionReview entries BEFORE deleting Terms
    # Get all terms in this studyset via StudySetTerm junction table
    terms = session.exec(
        select(Term)
        .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
        .where(StudySetTerm.studyset_id == studyset_id)
    ).all()
    term_ids = [term.term_id for term in terms]

    # Delete SessionReview for these terms
    if term_ids:
        session_reviews = session.exec(
            select(SessionReview).where(SessionReview.term_id.in_(term_ids))
        ).all()
        for review in session_reviews:
            session.delete(review)

    # 7. Delete Term entries (now safe after SessionReview deleted)
    for term in terms:
        session.delete(term)
    
    # 8. Delete AIGeneratedContents entries (has FK to StudySet)
    ai_contents = session.exec(
        select(AIGeneratedContents).where(AIGeneratedContents.studyset_id == studyset_id)
    ).all()
    for content in ai_contents:
        session.delete(content)

    # 9. Finally, delete the studyset
    session.delete(db_studyset)
    session.commit()


def get_studysets_by_owner(
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[StudySet]:
    """Get all study sets owned by user"""
    statement = (
        select(StudySet)
        .where(StudySet.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())
