from datetime import timedelta
from typing import Annotated, Any
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app.crud.crud import (
  authenticate,
  get_user_by_email,
  update_user,
)
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash, verify_token
from app.schemas import Message, NewPassword, RefreshTokenRequest, Token, TokenResponse, UserPublic
from app.services import (
  generate_password_reset_token,
  generate_reset_password_email,
  send_email,
  verify_password_reset_token,
)
from app.models.refresh_token import RefreshToken

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
def login_access_token(
  session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> TokenResponse:
  """
  OAuth2 compatible token login, get access token and refresh token for future requests
  """
  user = authenticate(
    session=session, email=form_data.username, password=form_data.password
  )
  if not user:
    raise HTTPException(status_code=400, detail="Incorrect email or password")
  
  # Tạo access token
  access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = security.create_access_token(
    user.user_id, expires_delta=access_token_expires
  )
  
  # Tạo refresh token và lưu vào database
  refresh_token, refresh_jti, refresh_expires = security.create_refresh_token(user.user_id)
  
  # Lưu refresh token vào database để track
  refresh_token_record = RefreshToken(
    jti=refresh_jti,
    user_id=user.user_id,
    expires_at=refresh_expires,
    device_info=None  # Có thể thêm user agent, IP từ request headers
  )
  session.add(refresh_token_record)
  session.commit()
  
  # Convert user to UserPublic using model_validate with from_attributes
  user_public = UserPublic.model_validate(user, from_attributes=True)
  
  return TokenResponse(
    access_token=access_token,
    refresh_token=refresh_token,
    user=user_public
  )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
  """
  Test access token
  """
  return current_user


@router.post("/login/refresh-token")
def refresh_token(session: SessionDep, body: RefreshTokenRequest) -> Token:
  """
  Refresh access token using refresh token
  """
  # Verify refresh token
  user_id, jti = verify_token(body.refresh_token, token_type="refresh")
  
  if not user_id or not jti:
    raise HTTPException(status_code=401, detail="Invalid refresh token")
  
  # Kiểm tra xem refresh token có bị revoke không
  if security.is_token_blacklisted(session, jti):
    raise HTTPException(status_code=401, detail="Token has been revoked")
  
  # Kiểm tra refresh token trong database
  from sqlmodel import select
  statement = select(RefreshToken).where(RefreshToken.jti == jti)
  refresh_token_record = session.exec(statement).first()
  
  if not refresh_token_record or refresh_token_record.revoked:
    raise HTTPException(status_code=401, detail="Invalid or revoked refresh token")
  
  # Update last_used_at
  from datetime import datetime, timezone
  refresh_token_record.last_used_at = datetime.now(timezone.utc)
  session.add(refresh_token_record)
  session.commit()
  
  # Tạo access token mới
  access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = security.create_access_token(
    user_id, expires_delta=access_token_expires
  )
  
  return Token(access_token=access_token)


@router.post("/logout")
def logout(
  session: SessionDep,
  current_user: CurrentUser,
  body: RefreshTokenRequest
) -> Message:
  """
  Logout - Revoke refresh token và thêm vào blacklist
  
  Best practice:
  1. Client gửi refresh token khi logout
  2. Server revoke refresh token đó
  3. Client xóa cả access token và refresh token ở local storage
  4. Access token vẫn valid cho đến khi hết hạn (thời gian ngắn)
  """
  # Verify refresh token
  user_id, refresh_jti = verify_token(body.refresh_token, token_type="refresh")
  
  if not user_id or not refresh_jti:
    raise HTTPException(status_code=401, detail="Invalid refresh token")
  
  # Verify token thuộc về current user
  if str(current_user.user_id) != user_id:
    raise HTTPException(status_code=403, detail="Token does not belong to current user")
  
  # Revoke refresh token trong database
  success = security.revoke_refresh_token(session, refresh_jti)
  
  if not success:
    raise HTTPException(status_code=404, detail="Refresh token not found")
  
  # Thêm refresh token vào blacklist
  from sqlmodel import select
  statement = select(RefreshToken).where(RefreshToken.jti == refresh_jti)
  refresh_token_record = session.exec(statement).first()
  
  if refresh_token_record:
    security.add_token_to_blacklist(
      session=session,
      jti=refresh_jti,
      token_type="refresh",
      user_id=user_id,
      expires_at=refresh_token_record.expires_at,
      reason="logout"
    )
  
  return Message(message="Logged out successfully")


@router.post("/logout-all")
def logout_all_devices(
  session: SessionDep,
  current_user: CurrentUser
) -> Message:
  """
  Logout from all devices - Revoke tất cả refresh tokens của user
  
  Use case: 
  - User đổi password
  - User nghi ngờ tài khoản bị xâm nhập
  - User muốn đăng xuất khỏi tất cả thiết bị
  """
  # Revoke tất cả refresh tokens
  count = security.revoke_all_user_refresh_tokens(
    session, 
    str(current_user.user_id)
  )
  
  # Thêm tất cả vào blacklist
  from sqlmodel import select
  from datetime import datetime, timezone
  
  statement = select(RefreshToken).where(
    RefreshToken.user_id == current_user.user_id,
    RefreshToken.revoked == True
  )
  revoked_tokens = session.exec(statement).all()
  
  for token in revoked_tokens:
    # Chỉ thêm vào blacklist nếu chưa có
    if not security.is_token_blacklisted(session, token.jti):
      security.add_token_to_blacklist(
        session=session,
        jti=token.jti,
        token_type="refresh",
        user_id=str(current_user.user_id),
        expires_at=token.expires_at,
        reason="logout_all"
      )
  
  return Message(message=f"Logged out from {count} device(s)")


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
  """
  Password Recovery
  """
  user = get_user_by_email(session=session, email=email)

  if not user:
    raise HTTPException(
      status_code=404,
      detail="The user with this email does not exist in the system.",
    )
  password_reset_token = generate_password_reset_token(email=email)
  email_data = generate_reset_password_email(
    email_to=user.email, email=email, token=password_reset_token
  )
  send_email(
    email_to=user.email,
    subject=email_data.subject,
    html_content=email_data.html_content,
  )
  return Message(message="Password recovery email sent")


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
  """
  Reset password
  """
  email = verify_password_reset_token(token=body.token)
  if not email:
    raise HTTPException(status_code=400, detail="Invalid token")
  user = get_user_by_email(session=session, email=email)
  if not user:
    raise HTTPException(
      status_code=404,
      detail="The user with this email does not exist in the system.",
    )
  hashed_password = get_password_hash(password=body.new_password)
  user.password = hashed_password
  session.add(user)
  session.commit()
  return Message(message="Password updated successfully")


@router.post(
  "/password-recovery-html-content/{email}",
  dependencies=[Depends(get_current_active_superuser)],
  response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> Any:
  """
  HTML Content for Password Recovery
  """
  user = get_user_by_email(session=session, email=email)

  if not user:
    raise HTTPException(
      status_code=404,
      detail="The user with this username does not exist in the system.",
    )
  password_reset_token = generate_password_reset_token(email=email)
  email_data = generate_reset_password_email(
    email_to=user.email, email=email, token=password_reset_token
  )

  return HTMLResponse(
    content=email_data.html_content, headers={"subject:": email_data.subject}
  )
