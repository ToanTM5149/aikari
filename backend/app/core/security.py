from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


ALGORITHM = "HS256"


def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    """
    Tạo Access Token với JTI (JWT ID) để có thể revoke
    """
    expire = datetime.now(timezone.utc) + expires_delta
    jti = str(uuid.uuid4()) 
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": jti
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str | Any) -> tuple[str, str, datetime]:
    """
    Tạo Refresh Token với JTI để track và có thể revoke
    Returns: (token, jti, expires_at)
    """
    # Refresh token có thời hạn dài hơn, ví dụ 7 ngày
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    jti = str(uuid.uuid4())  # Unique token ID
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti, expire


def verify_token(token: str, token_type: str = "access") -> tuple[str | None, str | None]:
    """
    Verify JWT token and return (user_id, jti) if valid
    token_type: "access" or "refresh"
    Returns: (user_id, jti) or (None, None)
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        token_sub: str = payload.get("sub")
        token_type_in_payload: str = payload.get("type", "access")
        jti: str = payload.get("jti")
        
        if token_sub is None:
            return None, None
        
        # Kiểm tra loại token
        if token_type_in_payload != token_type:
            return None, None
            
        return token_sub, jti
    except InvalidTokenError:
        return None, None


def is_token_blacklisted(session: Session, jti: str) -> bool:
    """
    Kiểm tra xem token có trong blacklist không
    Xử lý connection errors gracefully - nếu không thể kết nối DB, 
    coi như token không bị blacklist (fail open cho availability)
    """
    import logging
    from sqlalchemy.exc import OperationalError, DisconnectionError
    
    logger = logging.getLogger(__name__)
    from app.models.token_blacklist import TokenBlacklist
    
    try:
        statement = select(TokenBlacklist).where(TokenBlacklist.jti == jti)
        result = session.exec(statement).first()
        return result is not None
    except (OperationalError, DisconnectionError) as e:
        # Nếu có lỗi connection, log và coi như token không bị blacklist
        # (fail open để không block user khi DB có vấn đề)
        logger.warning(
            f"Database connection error while checking token blacklist for jti={jti}: {str(e)}. "
            "Treating token as not blacklisted (fail open)."
        )
        return False
    except Exception as e:
        # Các lỗi khác cũng log và fail open
        logger.error(
            f"Unexpected error while checking token blacklist for jti={jti}: {str(e)}. "
            "Treating token as not blacklisted (fail open)."
        )
        return False


def add_token_to_blacklist(
    session: Session,
    jti: str,
    token_type: str,
    user_id: str,
    expires_at: datetime,
    reason: str | None = None
) -> None:
    """
    Thêm token vào blacklist
    """
    from app.models.token_blacklist import TokenBlacklist
    
    blacklist_entry = TokenBlacklist(
        jti=jti,
        token_type=token_type,
        user_id=uuid.UUID(user_id),
        expires_at=expires_at,
        reason=reason
    )
    session.add(blacklist_entry)
    session.commit()


def revoke_refresh_token(session: Session, jti: str) -> bool:
    """
    Revoke một refresh token
    Returns: True nếu thành công, False nếu không tìm thấy
    """
    from app.models.refresh_token import RefreshToken
    
    statement = select(RefreshToken).where(RefreshToken.jti == jti)
    refresh_token = session.exec(statement).first()
    
    if not refresh_token:
        return False
    
    refresh_token.revoked = True
    refresh_token.revoked_at = datetime.now(timezone.utc)
    session.add(refresh_token)
    session.commit()
    return True


def revoke_all_user_refresh_tokens(session: Session, user_id: str) -> int:
    """
    Revoke tất cả refresh tokens của một user
    Returns: Số lượng tokens bị revoke
    """
    from app.models.refresh_token import RefreshToken
    
    statement = select(RefreshToken).where(
        RefreshToken.user_id == uuid.UUID(user_id),
        RefreshToken.revoked == False
    )
    tokens = session.exec(statement).all()
    
    count = 0
    for token in tokens:
        token.revoked = True
        token.revoked_at = datetime.now(timezone.utc)
        session.add(token)
        count += 1
    
    session.commit()
    return count


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
