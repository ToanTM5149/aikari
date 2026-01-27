"""Tests for deletion bugfixes

Tests verify that SessionReview entries are properly deleted before Terms,
preventing Foreign Key Constraint Violations.
"""

import uuid

import pytest
from sqlmodel import Session, select

from app.crud.studyset import delete_studyset
from app.crud.term import delete_term
from app.models import (
    User,
    StudySet,
    Term,
    LearningSession,
    SessionReview,
    Category,
    SessionStatus,
)
from app.models.enums import UserRole, ContentType


@pytest.fixture
def test_teacher(db: Session) -> User:
    """Create a test teacher user"""
    user = User(
        username=f"teacher_bugfix_{uuid.uuid4().hex[:8]}",
        email=f"teacher_bugfix_{uuid.uuid4().hex[:8]}@test.com",
        password="hashed_password",
        full_name="Test Teacher",
        role=UserRole.TEACHER
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_student(db: Session) -> User:
    """Create a test student user"""
    user = User(
        username=f"student_bugfix_{uuid.uuid4().hex[:8]}",
        email=f"student_bugfix_{uuid.uuid4().hex[:8]}@test.com",
        password="hashed_password",
        full_name="Test Student",
        role=UserRole.STUDENT
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_category(db: Session, test_teacher: User) -> Category:
    """Create a test category"""
    category = Category(
        name=f"Category Bugfix {uuid.uuid4().hex[:8]}",
        description="Category for bugfix tests",
        owner_id=test_teacher.user_id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_studyset_with_terms(
    db: Session,
    test_teacher: User,
    test_category: Category
) -> tuple[StudySet, list[Term]]:
    """Create a studyset with terms"""
    studyset = StudySet(
        title=f"Bugfix StudySet {uuid.uuid4().hex[:8]}",
        description="StudySet for deletion bugfix tests",
        owner_id=test_teacher.user_id,
        content_type=ContentType.DEFAULT,
        category_id=test_category.category_id
    )
    db.add(studyset)
    db.commit()
    db.refresh(studyset)

    # Create terms
    terms = []
    for i in range(3):
        term = Term(
            studyset_id=studyset.studyset_id,
            term_text=f"Term {i + 1}",
            definition=f"Definition {i + 1}",
            example=f"Example {i + 1}"
        )
        db.add(term)
        terms.append(term)

    db.commit()
    for term in terms:
        db.refresh(term)

    return studyset, terms


class TestSessionReviewDeletionBug:
    """Test that SessionReview entries are properly deleted"""

    def test_delete_term_with_session_reviews(
        self,
        db: Session,
        test_student: User,
        test_studyset_with_terms: tuple[StudySet, list[Term]]
    ):
        """Test that delete_term() properly deletes SessionReview entries

        This was a bug where SessionReview entries were not deleted before Term,
        causing FK constraint violations.
        """
        studyset, terms = test_studyset_with_terms
        term_to_delete = terms[0]

        # Create a learning session
        learning_session = LearningSession(
            user_id=test_student.user_id,
            studyset_id=studyset.studyset_id,
            session_type="flashcard",
            status=SessionStatus.ACTIVE,
            total_cards=3,
            completed_cards=0
        )
        db.add(learning_session)
        db.commit()
        db.refresh(learning_session)

        # Create a session review for the term
        session_review = SessionReview(
            session_id=learning_session.session_id,
            term_id=term_to_delete.term_id,
            recall_score=4,
            response_time=2.5,
            hint_used=False
        )
        db.add(session_review)
        db.commit()
        db.refresh(session_review)

        # Verify session review exists
        reviews = db.exec(
            select(SessionReview).where(SessionReview.term_id == term_to_delete.term_id)
        ).all()
        assert len(reviews) == 1

        # Delete the term - should not fail with FK constraint violation
        delete_term(session=db, term_id=term_to_delete.term_id)

        # Verify term deleted
        deleted_term = db.get(Term, term_to_delete.term_id)
        assert deleted_term is None

        # Verify session reviews deleted
        reviews_after = db.exec(
            select(SessionReview).where(SessionReview.term_id == term_to_delete.term_id)
        ).all()
        assert len(reviews_after) == 0

    def test_delete_studyset_with_session_reviews(
        self,
        db: Session,
        test_student: User,
        test_studyset_with_terms: tuple[StudySet, list[Term]]
    ):
        """Test that delete_studyset() properly deletes SessionReview entries

        This was a bug where SessionReview entries were not deleted before Terms,
        causing FK constraint violations when deleting studysets.
        """
        studyset, terms = test_studyset_with_terms

        # Create a learning session
        learning_session = LearningSession(
            user_id=test_student.user_id,
            studyset_id=studyset.studyset_id,
            session_type="flashcard",
            status=SessionStatus.COMPLETED,
            total_cards=len(terms),
            completed_cards=len(terms)
        )
        db.add(learning_session)
        db.commit()
        db.refresh(learning_session)

        # Create session reviews for all terms
        for term in terms:
            session_review = SessionReview(
                session_id=learning_session.session_id,
                term_id=term.term_id,
                recall_score=5,
                response_time=1.5,
                hint_used=False
            )
            db.add(session_review)

        db.commit()

        # Verify session reviews exist
        term_ids = [t.term_id for t in terms]
        reviews_before = db.exec(
            select(SessionReview).where(SessionReview.term_id.in_(term_ids))
        ).all()
        assert len(reviews_before) == len(terms)

        # Delete the studyset - should not fail with FK constraint violation
        delete_studyset(session=db, studyset_id=studyset.studyset_id)

        # Verify studyset deleted
        deleted_studyset = db.get(StudySet, studyset.studyset_id)
        assert deleted_studyset is None

        # Verify all terms deleted
        remaining_terms = db.exec(
            select(Term).where(Term.term_id.in_(term_ids))
        ).all()
        assert len(remaining_terms) == 0

        # Verify all session reviews deleted
        reviews_after = db.exec(
            select(SessionReview).where(SessionReview.term_id.in_(term_ids))
        ).all()
        assert len(reviews_after) == 0

    def test_delete_studyset_with_multiple_sessions(
        self,
        db: Session,
        test_student: User,
        test_studyset_with_terms: tuple[StudySet, list[Term]]
    ):
        """Test deleting studyset with reviews from multiple learning sessions"""
        studyset, terms = test_studyset_with_terms

        # Create multiple learning sessions
        for i in range(3):
            learning_session = LearningSession(
                user_id=test_student.user_id,
                studyset_id=studyset.studyset_id,
                session_type="flashcard",
                status=SessionStatus.COMPLETED,
                total_cards=len(terms),
                completed_cards=len(terms)
            )
            db.add(learning_session)
            db.flush()

            # Create reviews for each session
            for term in terms:
                session_review = SessionReview(
                    session_id=learning_session.session_id,
                    term_id=term.term_id,
                    recall_score=4 + i,
                    response_time=2.0 - (i * 0.2),
                    hint_used=False
                )
                db.add(session_review)

        db.commit()

        # Count total reviews
        term_ids = [t.term_id for t in terms]
        total_reviews = db.exec(
            select(SessionReview).where(SessionReview.term_id.in_(term_ids))
        ).all()
        assert len(total_reviews) == len(terms) * 3

        # Delete studyset - should handle all reviews
        delete_studyset(session=db, studyset_id=studyset.studyset_id)

        # Verify all cleaned up
        deleted_studyset = db.get(StudySet, studyset.studyset_id)
        assert deleted_studyset is None

        reviews_after = db.exec(
            select(SessionReview).where(SessionReview.term_id.in_(term_ids))
        ).all()
        assert len(reviews_after) == 0

    def test_delete_term_preserves_other_session_reviews(
        self,
        db: Session,
        test_student: User,
        test_studyset_with_terms: tuple[StudySet, list[Term]]
    ):
        """Test that deleting a term only deletes its own session reviews"""
        studyset, terms = test_studyset_with_terms
        term_to_delete = terms[0]
        term_to_keep = terms[1]

        # Create a learning session
        learning_session = LearningSession(
            user_id=test_student.user_id,
            studyset_id=studyset.studyset_id,
            session_type="flashcard",
            status=SessionStatus.ACTIVE,
            total_cards=2,
            completed_cards=0
        )
        db.add(learning_session)
        db.commit()
        db.refresh(learning_session)

        # Create session reviews for both terms
        review_to_delete = SessionReview(
            session_id=learning_session.session_id,
            term_id=term_to_delete.term_id,
            recall_score=3,
            response_time=3.0,
            hint_used=True
        )
        review_to_keep = SessionReview(
            session_id=learning_session.session_id,
            term_id=term_to_keep.term_id,
            recall_score=5,
            response_time=1.0,
            hint_used=False
        )
        db.add_all([review_to_delete, review_to_keep])
        db.commit()

        # Delete one term
        delete_term(session=db, term_id=term_to_delete.term_id)

        # Verify deleted term's review is gone
        deleted_reviews = db.exec(
            select(SessionReview).where(SessionReview.term_id == term_to_delete.term_id)
        ).all()
        assert len(deleted_reviews) == 0

        # Verify other term's review is preserved
        kept_reviews = db.exec(
            select(SessionReview).where(SessionReview.term_id == term_to_keep.term_id)
        ).all()
        assert len(kept_reviews) == 1
        assert kept_reviews[0].recall_score == 5
