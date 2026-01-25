"""Tests for StudentStudySet CRUD operations"""

from datetime import datetime, timedelta
import uuid

import pytest
from sqlmodel import Session, select

from app.crud.student_studyset import (
    enroll_student,
    unenroll_student,
    update_last_studied,
    get_student_studysets,
    get_studyset_students,
    is_student_enrolled,
    get_enrollment,
)
from app.models import User, StudySet, StudentStudySet, Category
from app.models.enums import UserRole, ContentType


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test student user"""
    user = User(
        username=f"test_student_{uuid.uuid4().hex[:8]}",
        email=f"student_{uuid.uuid4().hex[:8]}@test.com",
        password="hashed_password",
        full_name="Test Student",
        role=UserRole.STUDENT
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_teacher(db: Session) -> User:
    """Create a test teacher user"""
    user = User(
        username=f"test_teacher_{uuid.uuid4().hex[:8]}",
        email=f"teacher_{uuid.uuid4().hex[:8]}@test.com",
        password="hashed_password",
        full_name="Test Teacher",
        role=UserRole.TEACHER
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_category(db: Session, test_teacher: User) -> Category:
    """Create a test category"""
    category = Category(
        name=f"Test Category {uuid.uuid4().hex[:8]}",
        description="Test category for studysets",
        owner_id=test_teacher.user_id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_studyset(db: Session, test_teacher: User, test_category: Category) -> StudySet:
    """Create a test studyset"""
    studyset = StudySet(
        title=f"Test StudySet {uuid.uuid4().hex[:8]}",
        description="Test studyset for enrollment",
        owner_id=test_teacher.user_id,
        content_type=ContentType.DEFAULT,
        category_id=test_category.category_id
    )
    db.add(studyset)
    db.commit()
    db.refresh(studyset)
    return studyset


@pytest.fixture
def test_studyset2(db: Session, test_teacher: User, test_category: Category) -> StudySet:
    """Create a second test studyset"""
    studyset = StudySet(
        title=f"Test StudySet 2 {uuid.uuid4().hex[:8]}",
        description="Second test studyset",
        owner_id=test_teacher.user_id,
        content_type=ContentType.DEFAULT,
        category_id=test_category.category_id
    )
    db.add(studyset)
    db.commit()
    db.refresh(studyset)
    return studyset


class TestEnrollStudent:
    """Tests for enroll_student function"""

    def test_enroll_new_student(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test enrolling a student in a studyset for the first time"""
        enrollment = enroll_student(
            session=db,
            student_id=test_user.user_id,
            studyset_id=test_studyset.studyset_id
        )

        assert enrollment is not None
        assert enrollment.student_id == test_user.user_id
        assert enrollment.studyset_id == test_studyset.studyset_id
        assert enrollment.enrolled_at is not None
        assert enrollment.last_studied_at is None

    def test_enroll_already_enrolled_student(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test enrolling when already enrolled returns existing enrollment"""
        # First enrollment
        enrollment1 = enroll_student(db, test_user.user_id, test_studyset.studyset_id)

        # Try to enroll again
        enrollment2 = enroll_student(db, test_user.user_id, test_studyset.studyset_id)

        # Should return same enrollment
        assert enrollment1.student_id == enrollment2.student_id
        assert enrollment1.studyset_id == enrollment2.studyset_id
        assert enrollment1.enrolled_at == enrollment2.enrolled_at

    def test_enroll_multiple_studysets(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet,
        test_studyset2: StudySet
    ):
        """Test a student can enroll in multiple studysets"""
        enrollment1 = enroll_student(db, test_user.user_id, test_studyset.studyset_id)
        enrollment2 = enroll_student(db, test_user.user_id, test_studyset2.studyset_id)

        assert enrollment1.studyset_id != enrollment2.studyset_id
        enrollments = get_student_studysets(db, test_user.user_id)
        assert len(enrollments) == 2


class TestUnenrollStudent:
    """Tests for unenroll_student function"""

    def test_unenroll_enrolled_student(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test unenrolling an enrolled student"""
        # First enroll
        enroll_student(db, test_user.user_id, test_studyset.studyset_id)

        # Then unenroll
        success = unenroll_student(db, test_user.user_id, test_studyset.studyset_id)

        assert success is True

        # Verify enrollment deleted
        enrollments = get_student_studysets(db, test_user.user_id)
        assert len(enrollments) == 0

    def test_unenroll_not_enrolled_student(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test unenrolling when not enrolled returns False"""
        success = unenroll_student(db, test_user.user_id, test_studyset.studyset_id)

        assert success is False


class TestUpdateLastStudied:
    """Tests for update_last_studied function"""

    def test_update_last_studied_enrolled_student(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test updating last_studied_at for enrolled student"""
        # Enroll first
        enrollment = enroll_student(db, test_user.user_id, test_studyset.studyset_id)
        assert enrollment.last_studied_at is None

        # Update last_studied_at
        now = datetime.utcnow()
        updated = update_last_studied(
            db,
            test_user.user_id,
            test_studyset.studyset_id,
            timestamp=now
        )

        assert updated.last_studied_at is not None
        # Compare within 1 second tolerance
        assert abs((updated.last_studied_at - now).total_seconds()) < 1

    def test_update_last_studied_auto_enroll(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test auto-enrollment when updating last_studied_at for non-enrolled user"""
        # Verify not enrolled
        enrollments = get_student_studysets(db, test_user.user_id)
        assert len(enrollments) == 0

        # Update last_studied_at should auto-enroll
        now = datetime.utcnow()
        updated = update_last_studied(db, test_user.user_id, test_studyset.studyset_id, now)

        assert updated is not None
        assert updated.enrolled_at is not None
        assert updated.last_studied_at is not None

        # Verify enrollment created
        enrollments = get_student_studysets(db, test_user.user_id)
        assert len(enrollments) == 1

    def test_update_last_studied_default_timestamp(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test update_last_studied uses current time when timestamp not provided"""
        before_update = datetime.utcnow()

        updated = update_last_studied(db, test_user.user_id, test_studyset.studyset_id)

        after_update = datetime.utcnow()

        assert updated.last_studied_at is not None
        assert before_update <= updated.last_studied_at <= after_update


class TestGetStudentStudysets:
    """Tests for get_student_studysets function"""

    def test_get_student_studysets_empty(self, db: Session, test_user: User):
        """Test getting studysets when student has no enrollments"""
        enrollments = get_student_studysets(db, test_user.user_id)

        assert len(enrollments) == 0

    def test_get_student_studysets_multiple(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet,
        test_studyset2: StudySet
    ):
        """Test getting all studysets for a student"""
        # Enroll in multiple studysets
        enroll_student(db, test_user.user_id, test_studyset.studyset_id)
        enroll_student(db, test_user.user_id, test_studyset2.studyset_id)

        enrollments = get_student_studysets(db, test_user.user_id)

        assert len(enrollments) == 2
        studyset_ids = {e.studyset_id for e in enrollments}
        assert test_studyset.studyset_id in studyset_ids
        assert test_studyset2.studyset_id in studyset_ids

    def test_get_student_studysets_pagination(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet,
        test_studyset2: StudySet
    ):
        """Test pagination of get_student_studysets"""
        enroll_student(db, test_user.user_id, test_studyset.studyset_id)
        enroll_student(db, test_user.user_id, test_studyset2.studyset_id)

        # Get first page (limit=1)
        page1 = get_student_studysets(db, test_user.user_id, skip=0, limit=1)
        assert len(page1) == 1

        # Get second page
        page2 = get_student_studysets(db, test_user.user_id, skip=1, limit=1)
        assert len(page2) == 1

        # Should be different enrollments
        assert page1[0].studyset_id != page2[0].studyset_id


class TestGetStudysetStudents:
    """Tests for get_studyset_students function"""

    def test_get_studyset_students_empty(self, db: Session, test_studyset: StudySet):
        """Test getting students when studyset has no enrollments"""
        students = get_studyset_students(db, test_studyset.studyset_id)

        assert len(students) == 0

    def test_get_studyset_students_multiple(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test getting all students enrolled in a studyset"""
        # Create another student
        student2 = User(
            username=f"student2_{uuid.uuid4().hex[:8]}",
            email=f"student2_{uuid.uuid4().hex[:8]}@test.com",
            password="hashed",
            full_name="Student 2",
            role=UserRole.STUDENT
        )
        db.add(student2)
        db.commit()
        db.refresh(student2)

        # Enroll both students
        enroll_student(db, test_user.user_id, test_studyset.studyset_id)
        enroll_student(db, student2.user_id, test_studyset.studyset_id)

        students = get_studyset_students(db, test_studyset.studyset_id)

        assert len(students) == 2
        student_ids = {s.student_id for s in students}
        assert test_user.user_id in student_ids
        assert student2.user_id in student_ids


class TestIsStudentEnrolled:
    """Tests for is_student_enrolled function"""

    def test_is_enrolled_when_enrolled(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test is_student_enrolled returns True when enrolled"""
        enroll_student(db, test_user.user_id, test_studyset.studyset_id)

        is_enrolled = is_student_enrolled(db, test_user.user_id, test_studyset.studyset_id)

        assert is_enrolled is True

    def test_is_enrolled_when_not_enrolled(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test is_student_enrolled returns False when not enrolled"""
        is_enrolled = is_student_enrolled(db, test_user.user_id, test_studyset.studyset_id)

        assert is_enrolled is False


class TestGetEnrollment:
    """Tests for get_enrollment function"""

    def test_get_enrollment_exists(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test get_enrollment returns enrollment when it exists"""
        enroll_student(db, test_user.user_id, test_studyset.studyset_id)

        enrollment = get_enrollment(db, test_user.user_id, test_studyset.studyset_id)

        assert enrollment is not None
        assert enrollment.student_id == test_user.user_id
        assert enrollment.studyset_id == test_studyset.studyset_id

    def test_get_enrollment_not_exists(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test get_enrollment returns None when enrollment doesn't exist"""
        enrollment = get_enrollment(db, test_user.user_id, test_studyset.studyset_id)

        assert enrollment is None


class TestEnrollmentIntegration:
    """Integration tests for enrollment workflow"""

    def test_enrollment_lifecycle(
        self,
        db: Session,
        test_user: User,
        test_studyset: StudySet
    ):
        """Test complete enrollment lifecycle"""
        # 1. Not enrolled initially
        assert is_student_enrolled(db, test_user.user_id, test_studyset.studyset_id) is False

        # 2. Enroll
        enrollment = enroll_student(db, test_user.user_id, test_studyset.studyset_id)
        assert enrollment.last_studied_at is None

        # 3. Study (update last_studied_at)
        study_time = datetime.utcnow()
        update_last_studied(db, test_user.user_id, test_studyset.studyset_id, study_time)

        # 4. Verify updated
        updated_enrollment = get_enrollment(db, test_user.user_id, test_studyset.studyset_id)
        assert updated_enrollment.last_studied_at is not None

        # 5. Unenroll
        success = unenroll_student(db, test_user.user_id, test_studyset.studyset_id)
        assert success is True

        # 6. Verify not enrolled
        assert is_student_enrolled(db, test_user.user_id, test_studyset.studyset_id) is False
