import uuid
from datetime import datetime

from sqlalchemy import Index
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import ClassRole


class Class(SQLModel, table=True):
    __tablename__ = "Class"
    
    class_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    class_name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=256)
    created_by: str = Field(max_length=255)  # username
    owner_user_id: uuid.UUID = Field(foreign_key="User.user_id")
    is_public: bool = Field(default=False)  # Public classes can be searched and joined
    class_code: str | None = Field(default=None, max_length=20, unique=True, index=True)  # Optional join code
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    members: list["ClassMember"] = Relationship(back_populates="class_obj")


class ClassMember(SQLModel, table=True):
    __tablename__ = "ClassMember"
    
    class_id: uuid.UUID = Field(foreign_key="Class.class_id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="User.user_id", primary_key=True)
    role: ClassRole = Field(default=ClassRole.MEMBER)
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships - use sa_relationship_kwargs to avoid 'class' keyword conflict
    class_obj: "Class" = Relationship(back_populates="members", sa_relationship_kwargs={"foreign_keys": "[ClassMember.class_id]"})
    user: "User" = Relationship(back_populates="class_memberships")
    
    __table_args__ = (
        Index("ix_classmember_user_class", "user_id", "class_id"),
    )

