import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel, Column, DateTime, Text, JSON


# Enums
class ClassRole(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class InviteStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    expired = "expired"


class ClassInviteRole(str, Enum):
    admin = "admin"
    member = "member"


class SetStatus(str, Enum):
    draft = "draft"
    published = "published"


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    display_name: str | None = Field(default=None, max_length=255)
    timezone: str | None = Field(default=None, max_length=50)
    is_active: bool = True
    is_superuser: bool = False


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    display_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    display_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    timezone: str | None = Field(default=None, max_length=50)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    deleted_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    owned_folders: list["Folder"] = Relationship(back_populates="owner", cascade_delete=True)
    owned_classes: list["Class"] = Relationship(back_populates="owner", cascade_delete=True)
    authored_flashcard_sets: list["FlashcardSet"] = Relationship(back_populates="author", cascade_delete=True)
    class_memberships: list["ClassMember"] = Relationship(back_populates="user", cascade_delete=True)
    class_invites: list["ClassInvite"] = Relationship(back_populates="invitee_user", cascade_delete=True)
    sent_invites: list["ClassInvite"] = Relationship(back_populates="inviter", cascade_delete=True)
    flashcard_items_created: list["FlashcardItem"] = Relationship(back_populates="created_by_user", cascade_delete=True)
    generated_contents: list["GeneratedContent"] = Relationship(back_populates="user", cascade_delete=True)
    card_states: list["UserCardState"] = Relationship(back_populates="user", cascade_delete=True)
    review_events: list["ReviewEvent"] = Relationship(back_populates="user", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Folder Models
class FolderBase(SQLModel):
    name: str = Field(max_length=255)
    is_public: bool = Field(default=False)


class FolderCreate(FolderBase):
    parent_folder_id: Optional[uuid.UUID] = None


class FolderUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    is_public: Optional[bool] = None
    parent_folder_id: Optional[uuid.UUID] = None


class Folder(FolderBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    parent_folder_id: Optional[uuid.UUID] = Field(default=None, foreign_key="folder.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    owner: User = Relationship(back_populates="owned_folders")
    parent_folder: Optional["Folder"] = Relationship(back_populates="child_folders", sa_relationship_kwargs={"remote_side": "Folder.id"})
    child_folders: list["Folder"] = Relationship(back_populates="parent_folder")
    classes: list["Class"] = Relationship(back_populates="folder")
    flashcard_sets: list["FlashcardSet"] = Relationship(back_populates="folder")


class FolderPublic(FolderBase):
    id: uuid.UUID
    owner_user_id: uuid.UUID
    parent_folder_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime


class FoldersPublic(SQLModel):
    data: list[FolderPublic]
    count: int


# Class Models
class ClassBase(SQLModel):
    title: str = Field(max_length=255)
    description: Optional[str] = None
    is_public: bool = Field(default=False)


class ClassCreate(ClassBase):
    folder_id: Optional[uuid.UUID] = None


class ClassUpdate(SQLModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    is_public: Optional[bool] = None
    folder_id: Optional[uuid.UUID] = None


class Class(ClassBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    folder_id: Optional[uuid.UUID] = Field(default=None, foreign_key="folder.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    owner: User = Relationship(back_populates="owned_classes")
    folder: Optional[Folder] = Relationship(back_populates="classes")
    members: list["ClassMember"] = Relationship(back_populates="class_", cascade_delete=True)
    invites: list["ClassInvite"] = Relationship(back_populates="class_", cascade_delete=True)
    # Many-to-many relationship will be handled through ClassFlashcardSet table


class ClassPublic(ClassBase):
    id: uuid.UUID
    owner_user_id: uuid.UUID
    folder_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime


class ClassesPublic(SQLModel):
    data: list[ClassPublic]
    count: int


# Class Member Models
class ClassMemberBase(SQLModel):
    role: ClassRole


class ClassMemberCreate(ClassMemberBase):
    user_id: uuid.UUID
    class_id: uuid.UUID


class ClassMemberUpdate(SQLModel):
    role: Optional[ClassRole] = None


class ClassMember(ClassMemberBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    class_id: uuid.UUID = Field(foreign_key="class.id", nullable=False, ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    invited_by: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    invited_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    accepted_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    class_: Class = Relationship(back_populates="members")
    user: User = Relationship(back_populates="class_memberships")


class ClassMemberPublic(ClassMemberBase):
    id: uuid.UUID
    class_id: uuid.UUID
    user_id: uuid.UUID
    invited_by: Optional[uuid.UUID]
    invited_at: Optional[datetime]
    accepted_at: Optional[datetime]


# Class Invite Models
class ClassInviteBase(SQLModel):
    role: ClassInviteRole


class ClassInviteCreate(ClassInviteBase):
    class_id: uuid.UUID
    invitee_email: Optional[str] = None
    invitee_user_id: Optional[uuid.UUID] = None


class ClassInviteUpdate(SQLModel):
    status: Optional[InviteStatus] = None


class ClassInvite(ClassInviteBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    class_id: uuid.UUID = Field(foreign_key="class.id", nullable=False, ondelete="CASCADE")
    invitee_email: Optional[str] = None
    invitee_user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    inviter_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    token: str = Field(unique=True)
    status: InviteStatus = Field(default=InviteStatus.pending)
    expires_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    class_: Class = Relationship(back_populates="invites")
    invitee_user: Optional[User] = Relationship(back_populates="class_invites")
    inviter: User = Relationship(back_populates="sent_invites")


class ClassInvitePublic(ClassInviteBase):
    id: uuid.UUID
    class_id: uuid.UUID
    invitee_email: Optional[str]
    invitee_user_id: Optional[uuid.UUID]
    inviter_id: uuid.UUID
    token: str
    status: InviteStatus
    expires_at: Optional[datetime]
    created_at: datetime


# Flashcard Set Models
class FlashcardSetBase(SQLModel):
    title: str = Field(max_length=255)
    description: Optional[str] = None
    language: Optional[str] = Field(default=None, max_length=10)
    status: SetStatus = Field(default=SetStatus.draft)
    is_public: bool = Field(default=False)


class FlashcardSetCreate(FlashcardSetBase):
    folder_id: Optional[uuid.UUID] = None


class FlashcardSetUpdate(SQLModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    language: Optional[str] = Field(default=None, max_length=10)
    status: Optional[SetStatus] = None
    is_public: Optional[bool] = None
    folder_id: Optional[uuid.UUID] = None


class FlashcardSet(FlashcardSetBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    author_user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    folder_id: Optional[uuid.UUID] = Field(default=None, foreign_key="folder.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    author: User = Relationship(back_populates="authored_flashcard_sets")
    folder: Optional[Folder] = Relationship(back_populates="flashcard_sets")
    flashcard_items: list["FlashcardItem"] = Relationship(back_populates="flashcard_set", cascade_delete=True)
    # Many-to-many relationship will be handled through ClassFlashcardSet table
    generated_contents: list["GeneratedContent"] = Relationship(back_populates="flashcard_set", cascade_delete=True)
    user_card_states: list["UserCardState"] = Relationship(back_populates="flashcard_set", cascade_delete=True)


class FlashcardSetPublic(FlashcardSetBase):
    id: uuid.UUID
    author_user_id: uuid.UUID
    folder_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime


class FlashcardSetsPublic(SQLModel):
    data: list[FlashcardSetPublic]
    count: int


# Class Flashcard Set Association Table
class ClassFlashcardSet(SQLModel, table=True):
    __tablename__ = "class_flashcard_sets"
    
    class_id: uuid.UUID = Field(foreign_key="class.id", primary_key=True, ondelete="CASCADE")
    flashcard_set_id: uuid.UUID = Field(foreign_key="flashcardset.id", primary_key=True, ondelete="CASCADE")
    attached_by: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))


# Flashcard Item Models
class FlashcardItemBase(SQLModel):
    front_text: str = Field(sa_column=Column(Text))
    back_text: str = Field(sa_column=Column(Text))
    extra: Optional[str] = Field(default=None, sa_column=Column(Text))
    is_active: bool = Field(default=True)


class FlashcardItemCreate(FlashcardItemBase):
    flashcard_set_id: uuid.UUID


class FlashcardItemUpdate(SQLModel):
    front_text: Optional[str] = Field(default=None, sa_column=Column(Text))
    back_text: Optional[str] = Field(default=None, sa_column=Column(Text))
    extra: Optional[str] = Field(default=None, sa_column=Column(Text))
    is_active: Optional[bool] = None


class FlashcardItem(FlashcardItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    flashcard_set_id: uuid.UUID = Field(foreign_key="flashcardset.id", nullable=False, ondelete="CASCADE")
    created_by_user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    flashcard_set: FlashcardSet = Relationship(back_populates="flashcard_items")
    created_by_user: User = Relationship(back_populates="flashcard_items_created")
    generated_contents: list["GeneratedContent"] = Relationship(back_populates="flashcard_item", cascade_delete=True)
    user_card_states: list["UserCardState"] = Relationship(back_populates="flashcard_item", cascade_delete=True)
    review_events: list["ReviewEvent"] = Relationship(back_populates="flashcard_item", cascade_delete=True)


class FlashcardItemPublic(FlashcardItemBase):
    id: uuid.UUID
    flashcard_set_id: uuid.UUID
    created_by_user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class FlashcardItemsPublic(SQLModel):
    data: list[FlashcardItemPublic]
    count: int


# Generated Content Models
class GeneratedContentBase(SQLModel):
    model_name: str = Field(max_length=100)
    prompt: Optional[str] = Field(default=None, sa_column=Column(Text))
    content: str = Field(sa_column=Column(Text))


class GeneratedContentCreate(GeneratedContentBase):
    flashcard_set_id: uuid.UUID
    flashcard_item_id: Optional[uuid.UUID] = None


class GeneratedContent(GeneratedContentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    flashcard_set_id: uuid.UUID = Field(foreign_key="flashcardset.id", nullable=False, ondelete="CASCADE")
    flashcard_item_id: Optional[uuid.UUID] = Field(default=None, foreign_key="flashcarditem.id")
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    model_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    flashcard_set: FlashcardSet = Relationship(back_populates="generated_contents")
    flashcard_item: Optional[FlashcardItem] = Relationship(back_populates="generated_contents")
    user: User = Relationship(back_populates="generated_contents")


class GeneratedContentPublic(GeneratedContentBase):
    id: uuid.UUID
    flashcard_set_id: uuid.UUID
    flashcard_item_id: Optional[uuid.UUID]
    user_id: uuid.UUID
    model_metadata: Optional[dict]
    created_at: datetime


# User Card State Models (SRS)
class UserCardStateBase(SQLModel):
    ease_factor: float = Field(default=2.5)
    interval_days: int = Field(default=0)
    streak: int = Field(default=0)
    lapses: int = Field(default=0)
    suspended: bool = Field(default=False)


class UserCardStateCreate(UserCardStateBase):
    flashcard_set_id: uuid.UUID
    flashcard_item_id: uuid.UUID


class UserCardStateUpdate(SQLModel):
    ease_factor: Optional[float] = None
    interval_days: Optional[int] = None
    streak: Optional[int] = None
    lapses: Optional[int] = None
    due_at: Optional[datetime] = None
    last_reviewed_at: Optional[datetime] = None
    suspended: Optional[bool] = None


class UserCardState(UserCardStateBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    flashcard_set_id: uuid.UUID = Field(foreign_key="flashcardset.id", nullable=False, ondelete="CASCADE")
    flashcard_item_id: uuid.UUID = Field(foreign_key="flashcarditem.id", nullable=False, ondelete="CASCADE")
    due_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    last_reviewed_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    user: User = Relationship(back_populates="card_states")
    flashcard_set: FlashcardSet = Relationship(back_populates="user_card_states")
    flashcard_item: FlashcardItem = Relationship(back_populates="user_card_states")


class UserCardStatePublic(UserCardStateBase):
    id: uuid.UUID
    user_id: uuid.UUID
    flashcard_set_id: uuid.UUID
    flashcard_item_id: uuid.UUID
    due_at: Optional[datetime]
    last_reviewed_at: Optional[datetime]


# Review Event Models
class ReviewEventBase(SQLModel):
    rating: int = Field(ge=1, le=4)  # 1..4 (Again/Hard/Good/Easy)
    time_taken_ms: Optional[int] = None
    prev_interval: Optional[int] = None
    next_interval: Optional[int] = None
    algorithm_version: Optional[int] = None
    session_id: Optional[uuid.UUID] = None


class ReviewEventCreate(ReviewEventBase):
    flashcard_item_id: uuid.UUID


class ReviewEvent(ReviewEventBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    flashcard_item_id: uuid.UUID = Field(foreign_key="flashcarditem.id", nullable=False, ondelete="CASCADE")
    reviewed_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
    
    # Relationships
    user: User = Relationship(back_populates="review_events")
    flashcard_item: FlashcardItem = Relationship(back_populates="review_events")


class ReviewEventPublic(ReviewEventBase):
    id: uuid.UUID
    user_id: uuid.UUID
    flashcard_item_id: uuid.UUID
    reviewed_at: datetime


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
