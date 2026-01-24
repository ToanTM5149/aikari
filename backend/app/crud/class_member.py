import uuid
from datetime import datetime

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.models import ClassMember
from app.models.enums import MembershipStatus
from app.schemas import ClassMemberCreate, ClassMemberUpdate


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
        statement = statement.where(ClassMember.status == MembershipStatus(status))
    return list(session.exec(statement).all())


def get_pending_requests(*, session: Session, class_id: uuid.UUID) -> list[ClassMember]:
    """Get pending join requests for a class"""
    statement = select(ClassMember).where(
        ClassMember.class_id == class_id,
        ClassMember.status == MembershipStatus.PENDING
    ).options(
        selectinload(ClassMember.user)  # Eager load user relationship
    )
    return list(session.exec(statement).all())


def get_invitations(*, session: Session, class_id: uuid.UUID) -> list[ClassMember]:
    """Get pending invitations for a class"""
    statement = select(ClassMember).where(
        ClassMember.class_id == class_id,
        ClassMember.status == MembershipStatus.INVITED
    ).options(
        selectinload(ClassMember.user)  # Eager load user relationship
    )
    return list(session.exec(statement).all())


def get_user_invitations(*, session: Session, user_id: uuid.UUID) -> list[ClassMember]:
    """Get all class invitations for a user"""
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
