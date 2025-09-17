import uuid
from typing import Any, Optional
from datetime import datetime, timedelta

from sqlmodel import Session, select, and_, or_

from app.core.security import get_password_hash, verify_password
from app.models.models import (
    Item, ItemCreate, User, UserCreate, UserUpdate,
    Folder, FolderCreate, FolderUpdate,
    Class, ClassCreate, ClassUpdate,
    ClassMember, ClassMemberCreate, ClassMemberUpdate,
    ClassInvite, ClassInviteCreate, ClassInviteUpdate,
    FlashcardSet, FlashcardSetCreate, FlashcardSetUpdate,
    FlashcardItem, FlashcardItemCreate, FlashcardItemUpdate,
    GeneratedContent, GeneratedContentCreate,
    UserCardState, UserCardStateCreate, UserCardStateUpdate,
    ReviewEvent, ReviewEventCreate,
    ClassRole, InviteStatus
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


# Folder CRUD
def create_folder(*, session: Session, folder_in: FolderCreate, owner_id: uuid.UUID) -> Folder:
    folder_data = folder_in.model_dump()
    folder_data["owner_user_id"] = owner_id
    db_folder = Folder(**folder_data)
    session.add(db_folder)
    session.commit()
    session.refresh(db_folder)
    return db_folder


def get_folder(*, session: Session, folder_id: uuid.UUID) -> Optional[Folder]:
    return session.get(Folder, folder_id)


def get_folders_by_owner(*, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[Folder]:
    statement = select(Folder).where(Folder.owner_user_id == owner_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_folder(*, session: Session, db_folder: Folder, folder_in: FolderUpdate) -> Folder:
    folder_data = folder_in.model_dump(exclude_unset=True)
    folder_data["updated_at"] = datetime.utcnow()
    db_folder.sqlmodel_update(folder_data)
    session.add(db_folder)
    session.commit()
    session.refresh(db_folder)
    return db_folder


def delete_folder(*, session: Session, folder_id: uuid.UUID) -> bool:
    folder = session.get(Folder, folder_id)
    if folder:
        session.delete(folder)
        session.commit()
        return True
    return False


# Class CRUD
def create_class(*, session: Session, class_in: ClassCreate, owner_id: uuid.UUID) -> Class:
    class_data = class_in.model_dump()
    class_data["owner_user_id"] = owner_id
    db_class = Class(**class_data)
    session.add(db_class)
    session.commit()
    session.refresh(db_class)
    
    # Automatically add owner as owner member
    owner_member = ClassMember(
        class_id=db_class.id,
        user_id=owner_id,
        role=ClassRole.owner,
        accepted_at=datetime.utcnow()
    )
    session.add(owner_member)
    session.commit()
    
    return db_class


def get_class(*, session: Session, class_id: uuid.UUID) -> Optional[Class]:
    return session.get(Class, class_id)


def get_classes_by_owner(*, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[Class]:
    statement = select(Class).where(Class.owner_user_id == owner_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_user_classes(*, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[Class]:
    statement = (
        select(Class)
        .join(ClassMember)
        .where(ClassMember.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_class(*, session: Session, db_class: Class, class_in: ClassUpdate) -> Class:
    class_data = class_in.model_dump(exclude_unset=True)
    class_data["updated_at"] = datetime.utcnow()
    db_class.sqlmodel_update(class_data)
    session.add(db_class)
    session.commit()
    session.refresh(db_class)
    return db_class


def delete_class(*, session: Session, class_id: uuid.UUID) -> bool:
    class_obj = session.get(Class, class_id)
    if class_obj:
        session.delete(class_obj)
        session.commit()
        return True
    return False


# Class Member CRUD
def create_class_member(*, session: Session, member_in: ClassMemberCreate, invited_by: uuid.UUID) -> ClassMember:
    member_data = member_in.model_dump()
    member_data["invited_by"] = invited_by
    member_data["invited_at"] = datetime.utcnow()
    member_data["accepted_at"] = datetime.utcnow()
    db_member = ClassMember(**member_data)
    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member


def get_class_members(*, session: Session, class_id: uuid.UUID) -> list[ClassMember]:
    statement = select(ClassMember).where(ClassMember.class_id == class_id)
    return list(session.exec(statement).all())


def get_user_class_membership(*, session: Session, class_id: uuid.UUID, user_id: uuid.UUID) -> Optional[ClassMember]:
    statement = select(ClassMember).where(
        and_(ClassMember.class_id == class_id, ClassMember.user_id == user_id)
    )
    return session.exec(statement).first()


def update_class_member(*, session: Session, db_member: ClassMember, member_in: ClassMemberUpdate) -> ClassMember:
    member_data = member_in.model_dump(exclude_unset=True)
    db_member.sqlmodel_update(member_data)
    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member


def delete_class_member(*, session: Session, member_id: uuid.UUID) -> bool:
    member = session.get(ClassMember, member_id)
    if member:
        session.delete(member)
        session.commit()
        return True
    return False


# Class Invite CRUD
def create_class_invite(*, session: Session, invite_in: ClassInviteCreate, inviter_id: uuid.UUID, token: str) -> ClassInvite:
    invite_data = invite_in.model_dump()
    invite_data["inviter_id"] = inviter_id
    invite_data["token"] = token
    invite_data["expires_at"] = datetime.utcnow().replace(hour=23, minute=59, second=59) + timedelta(days=7)
    db_invite = ClassInvite(**invite_data)
    session.add(db_invite)
    session.commit()
    session.refresh(db_invite)
    return db_invite


def get_class_invite_by_token(*, session: Session, token: str) -> Optional[ClassInvite]:
    statement = select(ClassInvite).where(ClassInvite.token == token)
    return session.exec(statement).first()


def get_class_invites(*, session: Session, class_id: uuid.UUID) -> list[ClassInvite]:
    statement = select(ClassInvite).where(ClassInvite.class_id == class_id)
    return list(session.exec(statement).all())


def update_class_invite(*, session: Session, db_invite: ClassInvite, invite_in: ClassInviteUpdate) -> ClassInvite:
    invite_data = invite_in.model_dump(exclude_unset=True)
    db_invite.sqlmodel_update(invite_data)
    session.add(db_invite)
    session.commit()
    session.refresh(db_invite)
    return db_invite


# Flashcard Set CRUD
def create_flashcard_set(*, session: Session, set_in: FlashcardSetCreate, author_id: uuid.UUID) -> FlashcardSet:
    set_data = set_in.model_dump()
    set_data["author_user_id"] = author_id
    db_set = FlashcardSet(**set_data)
    session.add(db_set)
    session.commit()
    session.refresh(db_set)
    return db_set


def get_flashcard_set(*, session: Session, set_id: uuid.UUID) -> Optional[FlashcardSet]:
    return session.get(FlashcardSet, set_id)


def get_flashcard_sets_by_author(*, session: Session, author_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[FlashcardSet]:
    statement = select(FlashcardSet).where(FlashcardSet.author_user_id == author_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_public_flashcard_sets(*, session: Session, skip: int = 0, limit: int = 100) -> list[FlashcardSet]:
    statement = select(FlashcardSet).where(FlashcardSet.is_public == True).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_flashcard_set(*, session: Session, db_set: FlashcardSet, set_in: FlashcardSetUpdate) -> FlashcardSet:
    set_data = set_in.model_dump(exclude_unset=True)
    set_data["updated_at"] = datetime.utcnow()
    db_set.sqlmodel_update(set_data)
    session.add(db_set)
    session.commit()
    session.refresh(db_set)
    return db_set


def delete_flashcard_set(*, session: Session, set_id: uuid.UUID) -> bool:
    flashcard_set = session.get(FlashcardSet, set_id)
    if flashcard_set:
        session.delete(flashcard_set)
        session.commit()
        return True
    return False


# Flashcard Item CRUD
def create_flashcard_item(*, session: Session, item_in: FlashcardItemCreate, created_by: uuid.UUID) -> FlashcardItem:
    item_data = item_in.model_dump()
    item_data["created_by_user_id"] = created_by
    db_item = FlashcardItem(**item_data)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def get_flashcard_item(*, session: Session, item_id: uuid.UUID) -> Optional[FlashcardItem]:
    return session.get(FlashcardItem, item_id)


def get_flashcard_items_by_set(*, session: Session, set_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[FlashcardItem]:
    statement = select(FlashcardItem).where(
        and_(FlashcardItem.flashcard_set_id == set_id, FlashcardItem.is_active == True)
    ).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_flashcard_item(*, session: Session, db_item: FlashcardItem, item_in: FlashcardItemUpdate) -> FlashcardItem:
    item_data = item_in.model_dump(exclude_unset=True)
    item_data["updated_at"] = datetime.utcnow()
    db_item.sqlmodel_update(item_data)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def delete_flashcard_item(*, session: Session, item_id: uuid.UUID) -> bool:
    item = session.get(FlashcardItem, item_id)
    if item:
        # Soft delete by setting is_active to False
        item.is_active = False
        item.updated_at = datetime.utcnow()
        session.add(item)
        session.commit()
        return True
    return False


# Generated Content CRUD
def create_generated_content(*, session: Session, content_in: GeneratedContentCreate, user_id: uuid.UUID) -> GeneratedContent:
    content_data = content_in.model_dump()
    content_data["user_id"] = user_id
    db_content = GeneratedContent(**content_data)
    session.add(db_content)
    session.commit()
    session.refresh(db_content)
    return db_content


def get_generated_contents_by_set(*, session: Session, set_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[GeneratedContent]:
    statement = select(GeneratedContent).where(GeneratedContent.flashcard_set_id == set_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


# User Card State CRUD (SRS)
def create_user_card_state(*, session: Session, state_in: UserCardStateCreate, user_id: uuid.UUID) -> UserCardState:
    state_data = state_in.model_dump()
    state_data["user_id"] = user_id
    db_state = UserCardState(**state_data)
    session.add(db_state)
    session.commit()
    session.refresh(db_state)
    return db_state


def get_user_card_state(*, session: Session, user_id: uuid.UUID, item_id: uuid.UUID) -> Optional[UserCardState]:
    statement = select(UserCardState).where(
        and_(UserCardState.user_id == user_id, UserCardState.flashcard_item_id == item_id)
    )
    return session.exec(statement).first()


def get_due_cards(*, session: Session, user_id: uuid.UUID, limit: int = 20) -> list[UserCardState]:
    statement = (
        select(UserCardState)
        .where(
            and_(
                UserCardState.user_id == user_id,
                UserCardState.suspended == False,
                or_(
                    UserCardState.due_at == None,
                    UserCardState.due_at <= datetime.utcnow()
                )
            )
        )
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_user_card_state(*, session: Session, db_state: UserCardState, state_in: UserCardStateUpdate) -> UserCardState:
    state_data = state_in.model_dump(exclude_unset=True)
    db_state.sqlmodel_update(state_data)
    session.add(db_state)
    session.commit()
    session.refresh(db_state)
    return db_state


# Review Event CRUD
def create_review_event(*, session: Session, event_in: ReviewEventCreate, user_id: uuid.UUID) -> ReviewEvent:
    event_data = event_in.model_dump()
    event_data["user_id"] = user_id
    db_event = ReviewEvent(**event_data)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event


def get_review_events_by_user(*, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[ReviewEvent]:
    statement = select(ReviewEvent).where(ReviewEvent.user_id == user_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())
