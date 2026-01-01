import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import Class, ClassMember, ClassRole, User
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
    """
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
    """
    class_obj = crud.get_class(session=session, class_id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    if class_obj.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_class(session=session, class_id=class_id)
    return Message(message="Class deleted successfully")


@router.get("/{class_id}/members/")
def read_class_members(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get class members.
    """
    # Check if user is member
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    members = crud.get_class_members(session=session, class_id=class_id)
    return {"data": members, "count": len(members)}


@router.post("/{class_id}/members/", response_model=ClassMemberPublic)
def add_class_member(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    class_id: uuid.UUID,
    member_in: ClassMemberCreate,
) -> Any:
    """
    Add member to class.
    """
    # Check if user is owner or admin
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.owner, ClassRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    member_in.class_id = class_id
    member = crud.create_class_member(
        session=session, member_in=member_in, invited_by=current_user.user_id
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
    Update class member.
    """
    # Check if user is owner or admin
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.owner, ClassRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    member = session.get(ClassMember, member_id)
    if not member or member.class_id != class_id:
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
    """
    # Check if user is owner or admin
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if not membership or membership.role not in [ClassRole.owner, ClassRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    member = session.get(ClassMember, member_id)
    if not member or member.class_id != class_id:
        raise HTTPException(status_code=404, detail="Member not found")
    
    crud.delete_class_member(session=session, member_id=member_id)
    return Message(message="Member removed successfully")


@router.post("/{class_id}/join/", response_model=ClassMemberPublic)
def join_class(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Student joins a public class.
    Class must be public or user must have the class code.
    """
    # Get class
    class_obj = crud.get_class(session=session, class_id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if class is public
    if not class_obj.is_public:
        raise HTTPException(
            status_code=403, 
            detail="This class is not public. You need an invitation from the teacher."
        )
    
    # Check if user is already a member
    existing_membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.user_id
    )
    if existing_membership:
        raise HTTPException(status_code=400, detail="You are already a member of this class")
    
    # Create membership with MEMBER role
    member_in = ClassMemberCreate(
        user_id=current_user.user_id,
        role=ClassRole.MEMBER
    )
    member_in.class_id = class_id
    
    member = crud.create_class_member(
        session=session, 
        member_in=member_in, 
        invited_by=class_obj.owner_user_id
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
