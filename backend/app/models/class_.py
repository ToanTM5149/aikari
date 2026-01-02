import uuid
from datetime import datetime

from sqlalchemy import Index
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import ClassRole, MembershipStatus


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
    members: list["ClassMember"] = Relationship(
        back_populates="class_obj",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    studysets: list["ClassStudySet"] = Relationship(
        back_populates="class_obj",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class ClassMember(SQLModel, table=True):
    __tablename__ = "ClassMember"
    
    class_id: uuid.UUID = Field(foreign_key="Class.class_id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="User.user_id", primary_key=True)
    role: ClassRole = Field(default=ClassRole.MEMBER)
    status: MembershipStatus = Field(default=MembershipStatus.PENDING)
    invited_by: uuid.UUID | None = Field(default=None, foreign_key="User.user_id")  # Who invited/approved
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: datetime | None = Field(default=None)  # When approved
    
    # Relationships - use sa_relationship_kwargs to avoid 'class' keyword conflict
    class_obj: "Class" = Relationship(back_populates="members", sa_relationship_kwargs={"foreign_keys": "[ClassMember.class_id]"})
    user: "User" = Relationship(
        back_populates="class_memberships",
        sa_relationship_kwargs={"foreign_keys": "[ClassMember.user_id]"}
    )
    
    __table_args__ = (
        Index("ix_classmember_user_class", "user_id", "class_id"),
    )


class ClassStudySet(SQLModel, table=True):
    __tablename__ = "ClassStudySet"
    
    class_id: uuid.UUID = Field(foreign_key="Class.class_id", primary_key=True)
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id", primary_key=True)
    added_by: uuid.UUID = Field(foreign_key="User.user_id")
    added_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    class_obj: "Class" = Relationship(back_populates="studysets")
    studyset: "StudySet" = Relationship(back_populates="classes")
    
    __table_args__ = (
        Index("ix_classstudyset_class_studyset", "class_id", "studyset_id"),
    )


