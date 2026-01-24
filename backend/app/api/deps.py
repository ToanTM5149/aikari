from collections.abc import Generator
from typing import Annotated
import os
import sys
import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import User, UserRole
from app.schemas import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
  tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
  with Session(engine) as session:
    yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]

# Alias for compatibility
get_session = get_db


def get_current_user(session: SessionDep, token: TokenDep) -> User:
  try:
    payload = jwt.decode(
      token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
    )
    token_data = TokenPayload(**payload)
  except (InvalidTokenError, ValidationError):
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Could not validate credentials",
    )
  
  # Access token có thời gian sống ngắn (15-30 phút), không cần kiểm tra blacklist
  # Refresh token được quản lý qua RefreshToken.revoked field
  
  # token_data.sub contains user_id (UUID as string)
  from app.crud import get_user_by_id

  try:
    user_id = uuid.UUID(token_data.sub) if token_data.sub else None
  except (ValueError, TypeError):
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Invalid token format",
    )

  user = get_user_by_id(session=session, user_id=user_id) if user_id else None
  if not user:
    raise HTTPException(status_code=404, detail="User not found")
  return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
  """Check if user is Admin"""
  if current_user.role != UserRole.ADMIN:
    raise HTTPException(
      status_code=403, detail="The user doesn't have enough privileges"
    )
  return current_user


def get_current_active_teacher_or_admin(current_user: CurrentUser) -> User:
  """Check if user is Teacher or Admin"""
  if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
    raise HTTPException(
      status_code=403, detail="The user doesn't have enough privileges"
    )
  return current_user


def check_studyset_access(
    session: Session,
    studyset_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
  """
  Check if user has access to a studyset.
  User has access if:
  1. They own the studyset, OR
  2. The studyset is part of a class they are an active member of
  """
  from app.crud import get_studyset
  from app.models import ClassStudySet, ClassMember, MembershipStatus
  
  studyset = get_studyset(session=session, studyset_id=studyset_id)
  if not studyset:
    return False
  
  # Check ownership
  if studyset.owner_id == user_id:
    return True
  
  # Check if studyset is in any class where user is an active member
  statement = (
    select(ClassStudySet)
    .join(ClassMember, ClassMember.class_id == ClassStudySet.class_id)
    .where(ClassStudySet.studyset_id == studyset_id)
    .where(ClassMember.user_id == user_id)
    .where(ClassMember.status == MembershipStatus.ACTIVE)
  )
  class_studyset = session.exec(statement).first()
  
  return class_studyset is not None
