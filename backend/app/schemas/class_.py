import uuid
from datetime import datetime

from sqlmodel import SQLModel

from app.models.enums import ClassRole, MembershipStatus


# Base schemas
class ClassBase(SQLModel):
    class_name: str
    description: str | None = None
    is_public: bool = False
    class_code: str | None = None


class ClassMemberBase(SQLModel):
    role: ClassRole = ClassRole.MEMBER
    status: MembershipStatus = MembershipStatus.PENDING


# Create schemas
class ClassCreate(ClassBase):
    pass


class ClassMemberCreate(ClassMemberBase):
    user_id: uuid.UUID


# Update schemas
class ClassUpdate(SQLModel):
    class_name: str | None = None
    description: str | None = None
    is_public: bool | None = None
    class_code: str | None = None


class ClassMemberUpdate(SQLModel):
    role: ClassRole | None = None
    status: MembershipStatus | None = None


# Public schemas (response models)
class ClassPublic(ClassBase):
    class_id: uuid.UUID
    created_by: str
    owner_user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class ClassMemberPublic(ClassMemberBase):
    class_id: uuid.UUID
    user_id: uuid.UUID
    joined_at: datetime
    invited_by: uuid.UUID | None = None
    approved_at: datetime | None = None
    user: "UserPublic | None" = None  # Nested user info
    
    model_config = {"from_attributes": True}


# List schemas
class ClassesPublic(SQLModel):
    data: list[ClassPublic]
    count: int


class ClassMembersPublic(SQLModel):
    data: list[ClassMemberPublic]
    count: int


# User info for nested relationship
class UserPublic(SQLModel):
    user_id: uuid.UUID
    username: str
    email: str
    
    model_config = {"from_attributes": True}

