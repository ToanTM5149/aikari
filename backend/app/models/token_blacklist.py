"""
Token Blacklist Model
Store revoked tokens (logout, password change, etc.)
"""
import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class TokenBlacklist(SQLModel, table=True):
    """
    Blacklist revoked token for logout functionality
    Best practice: Only store the jti (JWT ID) instead of the entire token
    """
    __tablename__ = "token_blacklist"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    jti: str = Field(unique=True, index=True)  # JWT ID
    token_type: str = Field(index=True)  # "access" or "refresh"
    user_id: uuid.UUID = Field(index=True)
    revoked_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime  
    reason: str | None = None  # reason for revoke (logout, password change, etc.)
