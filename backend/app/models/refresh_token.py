"""
Refresh Token Tracking Model
Track active refresh tokens for revoking and management
"""
import uuid
from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class RefreshToken(SQLModel, table=True):
    """
    Track active refresh tokens
    Best practice: Only allow a limited number of refresh tokens per user
    """
    __tablename__ = "refresh_token"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    jti: str = Field(unique=True, index=True)  # JWT ID
    user_id: uuid.UUID = Field(foreign_key="User.user_id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    last_used_at: datetime | None = None
    revoked: bool = Field(default=False)
    revoked_at: datetime | None = None
    device_info: str | None = None  # User agent, IP, etc.
    
    # Relationship
    # user: "User" = Relationship(back_populates="refresh_tokens")
