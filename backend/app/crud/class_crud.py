import uuid
from datetime import datetime

from sqlmodel import Session, select

from app.models import Class, ClassMember
from app.models.enums import MembershipStatus
from app.schemas import ClassCreate, ClassUpdate
from app.crud.user import get_user_by_id


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
