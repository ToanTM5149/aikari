import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import Class, ClassMember, ClassRole, MembershipStatus, User
from app.schemas import (
    ClassCreate,
    ClassMemberCreate,
    ClassMemberPublic,
    ClassMembersPublic,
    ClassMemberUpdate,
    ClassPublic,
    ClassesPublic,
    ClassUpdate,
    Message,
)

router = APIRouter()


@router.get("/", response_model=ClassesPublic)
def read_classes(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve classes where user is a member.
    """
    classes = crud.get_user_classes(
        session=session, user_id=current_user.user_id, skip=skip, limit=limit
    )
    return ClassesPublic(data=classes, count=len(classes))


@router.get("/owned/", response_model=ClassesPublic)
def read_owned_classes(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve classes owned by current user.
    """
    classes = crud.get_classes_by_owner(
        session=session, owner_id=current_user.user_id, skip=skip, limit=limit
    )
    return ClassesPublic(data=classes, count=len(classes))


@router.get("/public/", response_model=ClassesPublic)
def read_public_classes(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all public classes that user can browse and join.
    """
    statement = (
        select(Class)
        .where(Class.is_public == True)
        .offset(skip)
        .limit(limit)
    )
    
    classes = session.exec(statement).all()
    return ClassesPublic(data=list(classes), count=len(classes))


@router.get("/search/", response_model=ClassesPublic)
def search_classes(
    current_user: CurrentUser,
    session: SessionDep,
    q: str = Query("", description="Search query for class name or code"),
    skip: int = 0,
    limit: int = 20,
) -> Any:
    """
    Search public classes by name or class code.
    Students can use this to find classes to join.
    """
    if not q:
        # Return empty if no query
        return ClassesPublic(data=[], count=0)
    
    # Search only public classes
    statement = (
        select(Class)
        .where(
            Class.is_public == True,
            or_(
                Class.class_name.ilike(f"%{q}%"),
                Class.class_code.ilike(f"%{q}%") if q else False
            )
        )
        .offset(skip)
        .limit(limit)
    )
    
    classes = session.exec(statement).all()
    return ClassesPublic(data=list(classes), count=len(classes))


@router.get("/{class_id}/", response_model=ClassPublic)
def read_class(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get class by ID.
    """
    class_obj = crud.get_class(session=session, class_id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if user is member or class is public
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership and not class_obj.is_public:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return class_obj


@router.post("/", response_model=ClassPublic)
def create_class(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    class_in: ClassCreate,
) -> Any:
    """
    Create new class.
    Only TEACHER.
    """
    # Check permission
    from app.models.enums import UserRole
    if current_user.role not in [UserRole.TEACHER]:
        raise HTTPException(
            status_code=403, 
            detail="Only teachers can create classes"
        )
    
    class_obj = crud.create_class(
        session=session, class_in=class_in, owner_id=current_user.user_id
    )
    return class_obj


@router.put("/{class_id}/", response_model=ClassPublic)
def update_class(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    class_id: uuid.UUID,
    class_in: ClassUpdate,
) -> Any:
    """
    Update a class.
    """
    class_obj = crud.get_class(session=session, class_id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if user is owner or admin
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.owner, ClassRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    class_obj = crud.update_class(session=session, db_class=class_obj, class_in=class_in)
    return class_obj


@router.delete("/{class_id}/", response_model=Message)
def delete_class(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Delete a class.
    Only the owner (TEACHER/ADMIN) can delete.
    """
    class_obj = crud.get_class(session=session, class_id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if user is the owner
    if class_obj.owner_user_id != current_user.user_id:
        raise HTTPException(
            status_code=403, 
            detail="Only the class owner can delete this class"
        )
    
    crud.delete_class(session=session, class_id=class_id)
    return Message(message="Class deleted successfully")


@router.get("/{class_id}/members/")
def read_class_members(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
    status: str = Query("ACTIVE", description="Filter by status"),
) -> Any:
    """
    Get class members, default ACTIVE only.
    Owner/Co-Teacher can see all statuses.
    """
    # Check if user is member
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.status != MembershipStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Not a member of this class")
    
    # Only owner/co-teacher can see non-active members
    if status != "ACTIVE" and membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    members = crud.get_class_members(session=session, class_id=class_id, status=status)
    return {"data": members, "count": len(members)}


@router.post("/{class_id}/members/", response_model=ClassMemberPublic)
def invite_member(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    class_id: uuid.UUID,
    member_in: ClassMemberCreate,
) -> Any:
    """
    Owner/Co-Teacher invites a user to class.
    Creates INVITED membership that user must accept.
    """
    # Check if user is owner or co-teacher
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if user already exists
    existing = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=member_in.user_id
    )
    if existing:
        if existing.status == MembershipStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="User already a member")
        elif existing.status == MembershipStatus.INVITED:
            raise HTTPException(status_code=400, detail="User already invited")
        elif existing.status == MembershipStatus.PENDING:
            # If pending request exists, approve it directly
            from datetime import datetime
            existing.status = MembershipStatus.ACTIVE
            existing.approved_at = datetime.utcnow()
            existing.invited_by = current_user.user_id
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
    
    # Create invited membership
    member = crud.create_class_member(
        session=session,
        member_in=member_in,
        class_id=class_id,
        invited_by=current_user.user_id,
        status="INVITED"
    )
    return member


@router.put("/{class_id}/members/{member_id}/", response_model=ClassMemberPublic)
def update_class_member(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    class_id: uuid.UUID,
    member_id: uuid.UUID,
    member_in: ClassMemberUpdate,
) -> Any:
    """
    Update class member role or status.
    Owner/Co-Teacher only.
    """
    # Check if user is owner or co-teacher
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get member by class_id and member_id (user_id)
    member = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=member_id
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member = crud.update_class_member(session=session, db_member=member, member_in=member_in)
    return member


@router.delete("/{class_id}/members/{member_id}/", response_model=Message)
def remove_class_member(
    class_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Remove member from class.
    Owner/Co-Teacher only.
    """
    # Check if user is owner or co-teacher
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get member to remove
    member = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=member_id
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Cannot remove owner
    if member.role == ClassRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot remove class owner")
    
    crud.delete_class_member_by_user_and_class(
        session=session, user_id=member_id, class_id=class_id
    )
    return Message(message="Member removed successfully")


@router.post("/{class_id}/join/", response_model=ClassMemberPublic)
def join_class(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Student requests to join a class.
    Creates PENDING membership for approval, or accepts INVITED if already invited.
    """
    # Get class
    class_obj = crud.get_class(session=session, class_id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if user is already a member
    existing = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    
    if existing:
        if existing.status == MembershipStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Already a member")
        elif existing.status == MembershipStatus.PENDING:
            raise HTTPException(status_code=400, detail="Join request already pending")
        elif existing.status == MembershipStatus.INVITED:
            # If invited, accept invitation directly
            from datetime import datetime
            existing.status = MembershipStatus.ACTIVE
            existing.approved_at = datetime.utcnow()
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
    
    # Check if class is public (private classes need invitation)
    if not class_obj.is_public:
        raise HTTPException(
            status_code=403,
            detail="This class is private. You need an invitation to join."
        )
    
    # Create PENDING membership
    member_in = ClassMemberCreate(
        user_id=current_user.user_id,
        role=ClassRole.MEMBER,
        status=MembershipStatus.PENDING
    )
    
    member = crud.create_class_member(
        session=session,
        member_in=member_in,
        class_id=class_id,
        invited_by=current_user.user_id,  # Self-requested
        status="PENDING"
    )
    
    return member


@router.post("/{class_id}/leave/", response_model=Message)
def leave_class(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Leave a class (for students).
    Owner cannot leave their own class.
    """
    # Get membership
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    
    if not membership:
        raise HTTPException(status_code=404, detail="You are not a member of this class")
    
    # Check if user is owner
    if membership.role == ClassRole.OWNER:
        raise HTTPException(
            status_code=403, 
            detail="Class owner cannot leave. Please delete the class or transfer ownership first."
        )
    
    # Get the ClassMember record to delete
    statement = select(ClassMember).where(
        ClassMember.class_id == class_id,
        ClassMember.user_id == current_user.user_id
    )
    member = session.exec(statement).first()
    
    if member:
        session.delete(member)
        session.commit()
    
    return Message(message="You have left the class successfully")


# ==================== APPROVAL SYSTEM ENDPOINTS ====================

@router.get("/{class_id}/pending/", response_model=ClassMembersPublic)
def read_pending_requests(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get pending join requests for this class.
    Only owner/co-teacher can access.
    """
    # Check permission
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    pending = crud.get_pending_requests(session=session, class_id=class_id)
    return ClassMembersPublic(data=pending, count=len(pending))


@router.get("/{class_id}/invitations/", response_model=ClassMembersPublic)
def read_invitations(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get pending invitations for this class.
    Only owner/co-teacher can access.
    """
    # Check permission
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    invitations = crud.get_invitations(session=session, class_id=class_id)
    return ClassMembersPublic(data=invitations, count=len(invitations))


@router.post("/{class_id}/members/{user_id}/approve/", response_model=ClassMemberPublic)
def approve_member(
    class_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Approve a pending join request or invitation.
    Owner/Co-Teacher only.
    """
    # Check permission
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get pending member
    pending_member = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=user_id
    )
    if not pending_member:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if pending_member.status not in [MembershipStatus.PENDING, MembershipStatus.INVITED]:
        raise HTTPException(status_code=400, detail="Not a pending request or invitation")
    
    # Approve
    from app.schemas import ClassMemberUpdate
    update_data = ClassMemberUpdate(status=MembershipStatus.ACTIVE)
    updated = crud.update_class_member(
        session=session,
        db_member=pending_member,
        member_in=update_data
    )
    
    # Set who approved
    updated.invited_by = current_user.user_id
    session.add(updated)
    session.commit()
    session.refresh(updated)
    
    return updated


@router.post("/{class_id}/members/{user_id}/reject/", response_model=Message)
def reject_member(
    class_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Reject a pending join request or invitation.
    Owner/Co-Teacher only.
    """
    # Check permission
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get pending member
    pending_member = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=user_id
    )
    if not pending_member:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if pending_member.status not in [MembershipStatus.PENDING, MembershipStatus.INVITED]:
        raise HTTPException(status_code=400, detail="Not a pending request or invitation")
    
    # Delete the request/invitation
    crud.delete_class_member_by_user_and_class(
        session=session, user_id=user_id, class_id=class_id
    )
    
    return Message(message="Request rejected successfully")

