import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.api.deps import CurrentUser, get_session
from app.models.models import (
    Class,
    ClassCreate,
    ClassPublic,
    ClassesPublic,
    ClassUpdate,
    ClassMember,
    ClassMemberCreate,
    ClassMemberPublic,
    ClassMemberUpdate,
    Message,
    ClassRole,
)

router = APIRouter()


@router.get("/", response_model=ClassesPublic)
def read_classes(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve classes where user is a member.
    """
    classes = crud.get_user_classes(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )
    return ClassesPublic(data=classes, count=len(classes))


@router.get("/owned", response_model=ClassesPublic)
def read_owned_classes(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve classes owned by current user.
    """
    classes = crud.get_classes_by_owner(
        session=session, owner_id=current_user.id, skip=skip, limit=limit
    )
    return ClassesPublic(data=classes, count=len(classes))


@router.get("/{class_id}", response_model=ClassPublic)
def read_class(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Get class by ID.
    """
    class_obj = crud.get_class(session=session, class_id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if user is member or class is public
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.id
    )
    if not membership and not class_obj.is_public:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return class_obj


@router.post("/", response_model=ClassPublic)
def create_class(
    *,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    class_in: ClassCreate,
) -> Any:
    """
    Create new class.
    """
    class_obj = crud.create_class(
        session=session, class_in=class_in, owner_id=current_user.id
    )
    return class_obj


@router.put("/{class_id}", response_model=ClassPublic)
def update_class(
    *,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
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
        session=session, class_id=class_id, user_id=current_user.id
    )
    if not membership or membership.role not in [ClassRole.owner, ClassRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    class_obj = crud.update_class(session=session, db_class=class_obj, class_in=class_in)
    return class_obj


@router.delete("/{class_id}", response_model=Message)
def delete_class(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Delete a class.
    """
    class_obj = crud.get_class(session=session, class_id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    if class_obj.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_class(session=session, class_id=class_id)
    return Message(message="Class deleted successfully")


@router.get("/{class_id}/members")
def read_class_members(
    class_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Get class members.
    """
    # Check if user is member
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.id
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    members = crud.get_class_members(session=session, class_id=class_id)
    return {"data": members, "count": len(members)}


@router.post("/{class_id}/members", response_model=ClassMemberPublic)
def add_class_member(
    *,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    class_id: uuid.UUID,
    member_in: ClassMemberCreate,
) -> Any:
    """
    Add member to class.
    """
    # Check if user is owner or admin
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.id
    )
    if not membership or membership.role not in [ClassRole.owner, ClassRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    member_in.class_id = class_id
    member = crud.create_class_member(
        session=session, member_in=member_in, invited_by=current_user.id
    )
    return member


@router.put("/{class_id}/members/{member_id}", response_model=ClassMemberPublic)
def update_class_member(
    *,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    class_id: uuid.UUID,
    member_id: uuid.UUID,
    member_in: ClassMemberUpdate,
) -> Any:
    """
    Update class member.
    """
    # Check if user is owner or admin
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.id
    )
    if not membership or membership.role not in [ClassRole.owner, ClassRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    member = session.get(ClassMember, member_id)
    if not member or member.class_id != class_id:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member = crud.update_class_member(session=session, db_member=member, member_in=member_in)
    return member


@router.delete("/{class_id}/members/{member_id}", response_model=Message)
def remove_class_member(
    class_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Remove member from class.
    """
    # Check if user is owner or admin
    membership = crud.get_user_class_membership(
        session=session, class_id=class_id, user_id=current_user.id
    )
    if not membership or membership.role not in [ClassRole.owner, ClassRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    member = session.get(ClassMember, member_id)
    if not member or member.class_id != class_id:
        raise HTTPException(status_code=404, detail="Member not found")
    
    crud.delete_class_member(session=session, member_id=member_id)
    return Message(message="Member removed successfully")
