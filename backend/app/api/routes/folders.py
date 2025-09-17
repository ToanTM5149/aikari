import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.api.deps import CurrentUser, get_session
from app.models.models import (
    Folder,
    FolderCreate,
    FolderPublic,
    FoldersPublic,
    FolderUpdate,
    Message,
)

router = APIRouter()


@router.get("/", response_model=FoldersPublic)
def read_folders(
    current_user: CurrentUser,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve folders owned by current user.
    """
    folders = crud.get_folders_by_owner(
        session=session, owner_id=current_user.id, skip=skip, limit=limit
    )
    return FoldersPublic(data=folders, count=len(folders))


@router.get("/{folder_id}", response_model=FolderPublic)
def read_folder(
    folder_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Get folder by ID.
    """
    folder = crud.get_folder(session=session, folder_id=folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return folder


@router.post("/", response_model=FolderPublic)
def create_folder(
    *,
    current_user: CurrentUser,
    folder_in: FolderCreate,
    session: Session = Depends(get_session),
) -> Any:
    """
    Create new folder.
    """
    folder = crud.create_folder(
        session=session, folder_in=folder_in, owner_id=current_user.id
    )
    return folder


@router.put("/{folder_id}", response_model=FolderPublic)
def update_folder(
    *,
    current_user: CurrentUser,
    folder_id: uuid.UUID,
    folder_in: FolderUpdate,
    session: Session = Depends(get_session),
) -> Any:
    """
    Update a folder.
    """
    folder = crud.get_folder(session=session, folder_id=folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    folder = crud.update_folder(session=session, db_folder=folder, folder_in=folder_in)
    return folder


@router.delete("/{folder_id}", response_model=Message)
def delete_folder(
    folder_id: uuid.UUID,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> Any:
    """
    Delete a folder.
    """
    folder = crud.get_folder(session=session, folder_id=folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_folder(session=session, folder_id=folder_id)
    return Message(message="Folder deleted successfully")
