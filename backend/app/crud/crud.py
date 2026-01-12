import uuid
from typing import Any

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    User, 
    Class, 
    ClassMember, 
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
)
from app.schemas import (
    UserCreate,
    UserUpdate,
    ClassCreate,
    ClassUpdate,
    ClassMemberCreate,
    ClassMemberUpdate,
    StudySetCreate,
    StudySetUpdate,
    TermCreate,
    TermUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
  """Create new user with hashed password"""
  db_obj = User.model_validate(
    user_create, update={"password": get_password_hash(user_create.password)}
  )
  session.add(db_obj)
  session.commit()
  session.refresh(db_obj)
  return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
  """Update user information"""
  user_data = user_in.model_dump(exclude_unset=True)
  extra_data = {}
  if "password" in user_data:
    password = user_data.pop("password")
    extra_data["password"] = get_password_hash(password)
  db_user.sqlmodel_update(user_data, update=extra_data)
  session.add(db_user)
  session.commit()
  session.refresh(db_user)
  return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
  """Get user by email"""
  statement = select(User).where(User.email == email)
  session_user = session.exec(statement).first()
  return session_user


def get_user_by_username(*, session: Session, username: str) -> User | None:
  """Get user by username"""
  statement = select(User).where(User.username == username)
  session_user = session.exec(statement).first()
  return session_user


def get_user_by_id(*, session: Session, user_id: uuid.UUID) -> User | None:
  """Get user by user_id"""
  statement = select(User).where(User.user_id == user_id)
  session_user = session.exec(statement).first()
  return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
  """Authenticate user by email and password"""
  db_user = get_user_by_email(session=session, email=email)
  if not db_user:
    return None
  if not verify_password(password, db_user.password):
    return None
  return db_user


def authenticate_by_username(*, session: Session, username: str, password: str) -> User | None:
  """Authenticate user by username and password"""
  db_user = get_user_by_username(session=session, username=username)
  if not db_user:
    return None
  if not verify_password(password, db_user.password):
    return None
  return db_user


# ==================== CLASS CRUD ====================

def get_class(*, session: Session, class_id: uuid.UUID) -> Class | None:
  """Get class by ID"""
  return session.get(Class, class_id)


def create_class(*, session: Session, class_in: ClassCreate, owner_id: uuid.UUID) -> Class:
  """Create new class"""
  # Get user to set created_by field
  user = get_user_by_id(session=session, user_id=owner_id)
  if not user:
    raise ValueError("User not found")
  
  db_obj = Class.model_validate(
    class_in, update={"created_by": user.username, "owner_user_id": owner_id}
  )
  session.add(db_obj)
  session.commit()
  session.refresh(db_obj)
  
  # Auto-add owner as member with OWNER role and ACTIVE status
  from app.models.enums import MembershipStatus
  member = ClassMember(
    class_id=db_obj.class_id,
    user_id=owner_id,
    role="OWNER",
    status=MembershipStatus.ACTIVE,
    invited_by=owner_id  # Owner invited themselves
  )
  session.add(member)
  session.commit()
  
  return db_obj


def update_class(*, session: Session, db_class: Class, class_in: ClassUpdate) -> Class:
  """Update class"""
  from datetime import datetime
  class_data = class_in.model_dump(exclude_unset=True)
  class_data["updated_at"] = datetime.utcnow()
  db_class.sqlmodel_update(class_data)
  session.add(db_class)
  session.commit()
  session.refresh(db_class)
  return db_class


def delete_class(*, session: Session, class_id: uuid.UUID) -> None:
  """Delete class and all its members"""
  db_class = session.get(Class, class_id)
  if db_class:
    # Delete all members first (explicit for clarity, even with cascade)
    statement = select(ClassMember).where(ClassMember.class_id == class_id)
    members = session.exec(statement).all()
    for member in members:
      session.delete(member)
    
    # Then delete the class
    session.delete(db_class)
    session.commit()


def get_user_classes(
    *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Class]:
  """Get all classes where user is an ACTIVE member"""
  from app.models.enums import MembershipStatus
  statement = (
    select(Class)
    .join(ClassMember)
    .where(ClassMember.user_id == user_id)
    .where(ClassMember.status == MembershipStatus.ACTIVE)  # Only ACTIVE members
    .offset(skip)
    .limit(limit)
  )
  return list(session.exec(statement).all())


def get_classes_by_owner(
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Class]:
  """Get all classes owned by user (owner is always ACTIVE)"""
  from app.models.enums import MembershipStatus
  statement = (
    select(Class)
    .join(ClassMember)
    .where(ClassMember.user_id == owner_id)
    .where(ClassMember.role == "OWNER")
    .where(ClassMember.status == MembershipStatus.ACTIVE)  # Redundant but explicit
    .order_by(Class.created_at.desc())  # Newest classes first
    .offset(skip)
    .limit(limit)
  )
  return list(session.exec(statement).all())


# ==================== CLASS MEMBER CRUD ====================

def get_user_class_membership(
    *, session: Session, class_id: uuid.UUID, user_id: uuid.UUID
) -> ClassMember | None:
  """Get user's membership in a class"""
  statement = select(ClassMember).where(
    ClassMember.class_id == class_id,
    ClassMember.user_id == user_id
  )
  return session.exec(statement).first()


def get_class_members(*, session: Session, class_id: uuid.UUID, status: str | None = None) -> list[ClassMember]:
  """Get all members of a class, optionally filtered by status"""
  statement = select(ClassMember).where(ClassMember.class_id == class_id).options(
    selectinload(ClassMember.user)  # Eager load user relationship
  )
  if status:
    from app.models.enums import MembershipStatus
    statement = statement.where(ClassMember.status == MembershipStatus(status))
  return list(session.exec(statement).all())


def get_pending_requests(*, session: Session, class_id: uuid.UUID) -> list[ClassMember]:
  """Get pending join requests for a class"""
  from app.models.enums import MembershipStatus
  statement = select(ClassMember).where(
    ClassMember.class_id == class_id,
    ClassMember.status == MembershipStatus.PENDING
  ).options(
    selectinload(ClassMember.user)  # Eager load user relationship
  )
  return list(session.exec(statement).all())


def get_invitations(*, session: Session, class_id: uuid.UUID) -> list[ClassMember]:
  """Get pending invitations for a class"""
  from app.models.enums import MembershipStatus
  statement = select(ClassMember).where(
    ClassMember.class_id == class_id,
    ClassMember.status == MembershipStatus.INVITED
  ).options(
    selectinload(ClassMember.user)  # Eager load user relationship
  )
  return list(session.exec(statement).all())


def get_user_invitations(*, session: Session, user_id: uuid.UUID) -> list[ClassMember]:
  """Get all class invitations for a user"""
  from app.models.enums import MembershipStatus
  statement = select(ClassMember).where(
    ClassMember.user_id == user_id,
    ClassMember.status == MembershipStatus.INVITED
  ).options(
    selectinload(ClassMember.class_obj)  # Eager load class relationship
  )
  return list(session.exec(statement).all())


def create_class_member(
    *, session: Session, member_in: ClassMemberCreate, class_id: uuid.UUID, invited_by: uuid.UUID, status: str = "PENDING"
) -> ClassMember:
  """Add member to class with status"""
  from app.models.enums import MembershipStatus
  db_obj = ClassMember.model_validate(member_in, update={"class_id": class_id})
  db_obj.invited_by = invited_by
  db_obj.status = MembershipStatus(status)
  session.add(db_obj)
  session.commit()
  session.refresh(db_obj)
  return db_obj


def update_class_member(
    *, session: Session, db_member: ClassMember, member_in: ClassMemberUpdate
) -> ClassMember:
  """Update class member"""
  from datetime import datetime
  member_data = member_in.model_dump(exclude_unset=True)
  
  # If status is being changed to ACTIVE, set approved_at
  if "status" in member_data and member_data["status"] == "ACTIVE":
    db_member.approved_at = datetime.utcnow()
  
  db_member.sqlmodel_update(member_data)
  session.add(db_member)
  session.commit()
  session.refresh(db_member)
  return db_member


def delete_class_member(*, session: Session, member_id: uuid.UUID) -> None:
  """Remove member from class"""
  db_member = session.get(ClassMember, member_id)
  if db_member:
    session.delete(db_member)
    session.commit()


# ==================== STUDYSET CRUD ====================

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
  
  # 3. Delete StudyActivity entries (has FK to StudySet)
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
  
  # 6. Delete Term entries (has FK to StudySet)
  terms = session.exec(
    select(Term).where(Term.studyset_id == studyset_id)
  ).all()
  for term in terms:
    session.delete(term)
  
  # 7. Delete AIGeneratedContents entries (has FK to StudySet)
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


# ==================== TERM CRUD ====================

def get_term(*, session: Session, term_id: uuid.UUID) -> Term | None:
  """Get term by ID"""
  return session.get(Term, term_id)


def create_term(
  *, session: Session, term_in: TermCreate, studyset_id: uuid.UUID
) -> Term:
  """Create new term"""
  db_obj = Term.model_validate(term_in, update={"studyset_id": studyset_id})
  session.add(db_obj)
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
  """Delete term"""
  db_term = session.get(Term, term_id)
  if db_term:
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
  """Get all terms in a study set, optionally filtered by study status"""
  statement = (
    select(Term)
    .where(Term.studyset_id == studyset_id)
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
