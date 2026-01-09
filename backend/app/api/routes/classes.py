import uuid
from typing import Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_, func
from sqlalchemy.orm import selectinload

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import Class, ClassMember, ClassRole, MembershipStatus, User, ClassStudySet, StudySet
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
    ClassAnalyticsOverview,
    StudentProgressList,
    StudySetAnalytics,
    ClassLeaderboard,
    ClassTimeSeriesAnalytics,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/", response_model=ClassesPublic)
def read_classes(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    q: str | None = Query(None, description="Search query for class name or code"),
) -> Any:
    """
    Retrieve classes where user is a member.
    Supports search by class name, code, or created_by.
    """
    from app.models.enums import MembershipStatus
    
    # Build base query
    base_query = (
        select(Class)
        .join(ClassMember)
        .where(ClassMember.user_id == current_user.user_id)
        .where(ClassMember.status == MembershipStatus.ACTIVE)
    )
    
    # Add search filter if provided
    if q:
        search_filter = or_(
            Class.class_name.ilike(f"%{q}%"),
            Class.class_code.ilike(f"%{q}%"),
            Class.created_by.ilike(f"%{q}%")
        )
        base_query = base_query.where(search_filter)
    
    # Count total classes matching search before pagination
    total_count_statement = (
        select(func.count(Class.class_id))
        .join(ClassMember)
        .where(ClassMember.user_id == current_user.user_id)
        .where(ClassMember.status == MembershipStatus.ACTIVE)
    )
    if q:
        search_filter = or_(
            Class.class_name.ilike(f"%{q}%"),
            Class.class_code.ilike(f"%{q}%"),
            Class.created_by.ilike(f"%{q}%")
        )
        total_count_statement = total_count_statement.where(search_filter)
    total_count = session.exec(total_count_statement).one() or 0
    
    # Get paginated classes - order by created_at DESC so newest classes appear first
    statement = base_query.order_by(Class.created_at.desc()).offset(skip).limit(limit)
    classes = list(session.exec(statement).all())
    
    # Enrich classes with member_count and studyset_count
    enriched_classes = []
    for cls in classes:
        # Count active members
        member_count_statement = (
            select(func.count(ClassMember.user_id))
            .where(ClassMember.class_id == cls.class_id)
            .where(ClassMember.status == MembershipStatus.ACTIVE)
        )
        member_count = session.exec(member_count_statement).one() or 0
        
        # Count studysets
        studyset_count_statement = (
            select(func.count(ClassStudySet.studyset_id))
            .where(ClassStudySet.class_id == cls.class_id)
        )
        studyset_count = session.exec(studyset_count_statement).one() or 0
        
        # Create enriched class
        enriched_class = ClassPublic(
            class_id=cls.class_id,
            class_name=cls.class_name,
            description=cls.description,
            is_public=cls.is_public,
            class_code=cls.class_code,
            created_by=cls.created_by,
            owner_user_id=cls.owner_user_id,
            created_at=cls.created_at,
            updated_at=cls.updated_at,
            member_count=member_count,
            studyset_count=studyset_count,
        )
        enriched_classes.append(enriched_class)
    
    return ClassesPublic(data=enriched_classes, count=total_count)


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
    # Count total owned classes before pagination
    from app.models.enums import MembershipStatus
    total_count_statement = (
        select(func.count(Class.class_id))
        .join(ClassMember)
        .where(ClassMember.user_id == current_user.user_id)
        .where(ClassMember.role == "OWNER")
        .where(ClassMember.status == MembershipStatus.ACTIVE)
    )
    total_count = session.exec(total_count_statement).one() or 0
    
    classes = crud.get_classes_by_owner(
        session=session, owner_id=current_user.user_id, skip=skip, limit=limit
    )
    
    # Enrich classes with member_count and studyset_count
    enriched_classes = []
    for cls in classes:
        # Count active members
        member_count_statement = (
            select(func.count(ClassMember.user_id))
            .where(ClassMember.class_id == cls.class_id)
            .where(ClassMember.status == MembershipStatus.ACTIVE)
        )
        member_count = session.exec(member_count_statement).one() or 0
        
        # Count studysets
        studyset_count_statement = (
            select(func.count(ClassStudySet.studyset_id))
            .where(ClassStudySet.class_id == cls.class_id)
        )
        studyset_count = session.exec(studyset_count_statement).one() or 0
        
        # Create enriched class
        enriched_class = ClassPublic(
            class_id=cls.class_id,
            class_name=cls.class_name,
            description=cls.description,
            is_public=cls.is_public,
            class_code=cls.class_code,
            created_by=cls.created_by,
            owner_user_id=cls.owner_user_id,
            created_at=cls.created_at,
            updated_at=cls.updated_at,
            member_count=member_count,
            studyset_count=studyset_count,
        )
        enriched_classes.append(enriched_class)
    
    return ClassesPublic(data=enriched_classes, count=total_count)


@router.get("/public/", response_model=ClassesPublic)
def read_public_classes(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    q: str | None = Query(None, description="Search query for class name or code"),
) -> Any:
    """
    Retrieve all public classes that user can browse and join.
    Supports search by class name or code.
    """
    # Build base query
    base_query = select(Class).where(Class.is_public == True)
    
    # Add search filter if provided
    if q:
        search_filter = or_(
            Class.class_name.ilike(f"%{q}%"),
            Class.class_code.ilike(f"%{q}%")
        )
        base_query = base_query.where(search_filter)
    
    # Count total public classes matching search before pagination
    total_count_statement = (
        select(func.count(Class.class_id))
        .where(Class.is_public == True)
    )
    if q:
        search_filter = or_(
            Class.class_name.ilike(f"%{q}%"),
            Class.class_code.ilike(f"%{q}%")
        )
        total_count_statement = total_count_statement.where(search_filter)
    total_count = session.exec(total_count_statement).one() or 0
    
    # Get paginated classes - order by created_at DESC so newest classes appear first
    statement = base_query.order_by(Class.created_at.desc()).offset(skip).limit(limit)
    classes = list(session.exec(statement).all())
    
    # Enrich classes with member_count and studyset_count
    enriched_classes = []
    for cls in classes:
        # Count active members
        member_count_statement = (
            select(func.count(ClassMember.user_id))
            .where(ClassMember.class_id == cls.class_id)
            .where(ClassMember.status == MembershipStatus.ACTIVE)
        )
        member_count = session.exec(member_count_statement).one() or 0
        
        # Count studysets
        studyset_count_statement = (
            select(func.count(ClassStudySet.studyset_id))
            .where(ClassStudySet.class_id == cls.class_id)
        )
        studyset_count = session.exec(studyset_count_statement).one() or 0
        
        # Create enriched class
        enriched_class = ClassPublic(
            class_id=cls.class_id,
            class_name=cls.class_name,
            description=cls.description,
            is_public=cls.is_public,
            class_code=cls.class_code,
            created_by=cls.created_by,
            owner_user_id=cls.owner_user_id,
            created_at=cls.created_at,
            updated_at=cls.updated_at,
            member_count=member_count,
            studyset_count=studyset_count,
        )
        enriched_classes.append(enriched_class)
    
    return ClassesPublic(data=enriched_classes, count=total_count)


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
    
    classes = list(session.exec(statement).all())
    
    # Enrich classes with member_count and studyset_count
    enriched_classes = []
    for cls in classes:
        # Count active members
        member_count_statement = (
            select(func.count(ClassMember.user_id))
            .where(ClassMember.class_id == cls.class_id)
            .where(ClassMember.status == MembershipStatus.ACTIVE)
        )
        member_count = session.exec(member_count_statement).one() or 0
        
        # Count studysets
        studyset_count_statement = (
            select(func.count(ClassStudySet.studyset_id))
            .where(ClassStudySet.class_id == cls.class_id)
        )
        studyset_count = session.exec(studyset_count_statement).one() or 0
        
        # Create enriched class
        enriched_class = ClassPublic(
            class_id=cls.class_id,
            class_name=cls.class_name,
            description=cls.description,
            is_public=cls.is_public,
            class_code=cls.class_code,
            created_by=cls.created_by,
            owner_user_id=cls.owner_user_id,
            created_at=cls.created_at,
            updated_at=cls.updated_at,
            member_count=member_count,
            studyset_count=studyset_count,
        )
        enriched_classes.append(enriched_class)
    
    return ClassesPublic(data=enriched_classes, count=len(enriched_classes))


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
    
    # Enrich class with member_count and studyset_count
    from app.models.enums import MembershipStatus
    # Count active members
    member_count_statement = (
        select(func.count(ClassMember.user_id))
        .where(ClassMember.class_id == class_obj.class_id)
        .where(ClassMember.status == MembershipStatus.ACTIVE)
    )
    member_count = session.exec(member_count_statement).one() or 0
    
    # Count studysets
    studyset_count_statement = (
        select(func.count(ClassStudySet.studyset_id))
        .where(ClassStudySet.class_id == class_obj.class_id)
    )
    studyset_count = session.exec(studyset_count_statement).one() or 0
    
    # Create enriched class
    enriched_class = ClassPublic(
        class_id=class_obj.class_id,
        class_name=class_obj.class_name,
        description=class_obj.description,
        is_public=class_obj.is_public,
        class_code=class_obj.class_code,
        created_by=class_obj.created_by,
        owner_user_id=class_obj.owner_user_id,
        created_at=class_obj.created_at,
        updated_at=class_obj.updated_at,
        member_count=member_count,
        studyset_count=studyset_count,
    )
    
    return enriched_class


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


@router.get("/{class_id}/members/", response_model=ClassMembersPublic)
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
    return ClassMembersPublic(data=members, count=len(members))


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



# ==================== CLASS STUDYSET ENDPOINTS ====================

@router.get("/{class_id}/studysets/")
def get_class_studysets(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """Get all study sets in a class."""
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.status != MembershipStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Not a member of this class")
    
    statement = (
        select(ClassStudySet)
        .where(ClassStudySet.class_id == class_id)
        .options(selectinload(ClassStudySet.studyset))
    )
    class_studysets = session.exec(statement).all()
    
    # Enrich each studyset with term_count, last_activity_at, and progress (same as studysets endpoint)
    from app.models import Term, StudyActivity, ProgressSummary
    from app.schemas import StudySetPublic
    
    enriched_sets = []
    for cs in class_studysets:
        studyset = cs.studyset
        
        # Count terms
        term_count_statement = select(func.count(Term.term_id)).where(
            Term.studyset_id == studyset.studyset_id
        )
        term_count = session.exec(term_count_statement).one() or 0
        
        # Get last activity time
        last_activity_statement = (
            select(StudyActivity.created_at)
            .where(StudyActivity.studyset_id == studyset.studyset_id)
            .where(StudyActivity.user_id == current_user.user_id)
            .order_by(StudyActivity.created_at.desc())
            .limit(1)
        )
        last_activity = session.exec(last_activity_statement).first()
        
        # Get progress (completion_rate)
        progress_statement = (
            select(ProgressSummary)
            .where(ProgressSummary.studyset_id == studyset.studyset_id)
            .where(ProgressSummary.user_id == current_user.user_id)
        )
        progress_summary = session.exec(progress_statement).first()
        progress = progress_summary.completion_rate if progress_summary else 0.0
        
        # Create enriched studyset
        enriched_set = StudySetPublic(
            studyset_id=studyset.studyset_id,
            title=studyset.title,
            description=studyset.description,
            content_type=studyset.content_type,
            category_id=studyset.category_id,
            category=studyset.category,
            owner_id=studyset.owner_id,
            created_at=studyset.created_at,
            updated_at=studyset.updated_at,
            attributes=studyset.attributes,
            term_count=term_count,
            last_activity_at=last_activity,
            progress=progress
        )
        enriched_sets.append(enriched_set)
    
    return {"data": enriched_sets, "count": len(enriched_sets)}


@router.post("/{class_id}/studysets/{studyset_id}/")
def add_studyset_to_class(
    class_id: uuid.UUID,
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """Add a study set to a class (teacher only)."""
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Only teachers can add study sets")
    
    studyset = session.get(StudySet, studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    existing = session.exec(
        select(ClassStudySet).where(
            ClassStudySet.class_id == class_id,
            ClassStudySet.studyset_id == studyset_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Study set already in class")
    
    class_studyset = ClassStudySet(
        class_id=class_id,
        studyset_id=studyset_id,
        added_by=current_user.user_id
    )
    session.add(class_studyset)
    session.commit()
    return Message(message="Study set added to class successfully")


@router.delete("/{class_id}/studysets/{studyset_id}/")
def remove_studyset_from_class(
    class_id: uuid.UUID,
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """Remove a study set from a class (teacher only)."""
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(status_code=403, detail="Only teachers can remove study sets")
    
    class_studyset = session.exec(
        select(ClassStudySet).where(
            ClassStudySet.class_id == class_id,
            ClassStudySet.studyset_id == studyset_id
        )
    ).first()
    
    if not class_studyset:
        raise HTTPException(status_code=404, detail="Study set not in this class")
    
    session.delete(class_studyset)
    session.commit()
    return Message(message="Study set removed from class successfully")


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/{class_id}/analytics/overview/", response_model=ClassAnalyticsOverview)
def get_class_analytics_overview(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get overview analytics for a class.
    Accessible by class teachers and members.
    """
    # Verify user is a member of the class
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this class")
    
    # Get analytics
    analytics = AnalyticsService.get_class_overview(session=session, class_id=class_id)
    
    if not analytics:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return analytics


@router.get("/{class_id}/analytics/progress/", response_model=StudentProgressList)
def get_class_student_progress(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get progress details for all students in a class.
    Accessible by class teachers only.
    """
    # Verify user is a teacher
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(
            status_code=403, 
            detail="Only teachers can view detailed student progress"
        )
    
    # Get all approved members
    from app.models.enums import MembershipStatus
    members = session.exec(
        select(ClassMember)
        .where(
            ClassMember.class_id == class_id,
            ClassMember.status == MembershipStatus.ACTIVE
        )
    ).all()
    
    # Get progress for each student
    student_progress = []
    for member in members:
        progress = AnalyticsService.get_student_progress_detail(
            session=session,
            class_id=class_id,
            user_id=member.user_id
        )
        if progress:
            student_progress.append(progress)
    
    return StudentProgressList(
        data=student_progress,
        count=len(student_progress)
    )


@router.get(
    "/{class_id}/analytics/studysets/{studyset_id}/", 
    response_model=StudySetAnalytics
)
def get_studyset_analytics(
    class_id: uuid.UUID,
    studyset_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get analytics for a specific studyset in a class.
    Accessible by class teachers only.
    """
    # Verify user is a teacher
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.OWNER, ClassRole.CO_TEACHER]:
        raise HTTPException(
            status_code=403, 
            detail="Only teachers can view studyset analytics"
        )
    
    # Get analytics
    analytics = AnalyticsService.get_studyset_analytics(
        session=session,
        class_id=class_id,
        studyset_id=studyset_id
    )
    
    if not analytics:
        raise HTTPException(
            status_code=404, 
            detail="Study set not found in this class"
        )
    
    return analytics


@router.get("/{class_id}/analytics/leaderboard/", response_model=ClassLeaderboard)
def get_class_leaderboard(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
    sort_by: str = Query(
        "mastery",
        description="Sort by: mastery, accuracy, streak, or time"
    ),
) -> Any:
    """
    Get leaderboard for a class.
    Accessible by all class members.
    """
    # Verify user is a member
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this class")
    
    # Validate sort_by parameter
    valid_sort_options = ["mastery", "accuracy", "streak", "time"]
    if sort_by not in valid_sort_options:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort_by parameter. Must be one of: {', '.join(valid_sort_options)}"
        )
    
    # Get leaderboard
    entries = AnalyticsService.get_class_leaderboard(
        session=session,
        class_id=class_id,
        sort_by=sort_by
    )
    
    return ClassLeaderboard(
        class_id=class_id,
        entries=entries,
        count=len(entries)
    )


@router.get("/{class_id}/analytics/timeseries/", response_model=ClassTimeSeriesAnalytics)
def get_class_time_series_analytics(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
    days: int = Query(7, ge=1, le=30, description="Number of days for daily study time"),
    weeks: int = Query(4, ge=1, le=12, description="Number of weeks for retention data"),
) -> Any:
    """
    Get time-series analytics for charts and visualizations.
    Returns daily study time, weekly retention, test performance, progress over time, etc.
    Accessible by all class members.
    """
    # Verify user is a member of the class
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this class")
    
    # Get time-series analytics
    analytics = AnalyticsService.get_class_time_series_analytics(
        session=session,
        class_id=class_id,
        days=days,
        weeks=weeks
    )
    
    if not analytics:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return analytics

