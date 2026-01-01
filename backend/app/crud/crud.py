import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import User, Class, ClassMember, StudySet, Term
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
  
  # Auto-add owner as member with OWNER role
  member = ClassMember(
    class_id=db_obj.class_id,
    user_id=owner_id,
    role="OWNER"
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
  """Get all classes where user is a member"""
  statement = (
    select(Class)
    .join(ClassMember)
    .where(ClassMember.user_id == user_id)
    .offset(skip)
    .limit(limit)
  )
  return list(session.exec(statement).all())


def get_classes_by_owner(
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Class]:
  """Get all classes owned by user"""
  statement = (
    select(Class)
    .join(ClassMember)
    .where(ClassMember.user_id == owner_id)
    .where(ClassMember.role == "OWNER")
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


def get_class_members(*, session: Session, class_id: uuid.UUID) -> list[ClassMember]:
  """Get all members of a class"""
  statement = select(ClassMember).where(ClassMember.class_id == class_id)
  return list(session.exec(statement).all())


def create_class_member(
    *, session: Session, member_in: ClassMemberCreate, invited_by: uuid.UUID
) -> ClassMember:
  """Add member to class"""
  db_obj = ClassMember.model_validate(member_in)
  session.add(db_obj)
  session.commit()
  session.refresh(db_obj)
  return db_obj


def update_class_member(
    *, session: Session, db_member: ClassMember, member_in: ClassMemberUpdate
) -> ClassMember:
  """Update class member"""
  member_data = member_in.model_dump(exclude_unset=True)
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
  """Delete study set"""
  db_studyset = session.get(StudySet, studyset_id)
  if db_studyset:
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
    *, session: Session, studyset_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Term]:
  """Get all terms in a study set"""
  statement = (
    select(Term)
    .where(Term.studyset_id == studyset_id)
    .offset(skip)
    .limit(limit)
  )
  return list(session.exec(statement).all())
