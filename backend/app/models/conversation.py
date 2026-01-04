import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import ConversationIntent, ConversationState


class ChatConversation(SQLModel, table=True):
    __tablename__ = "ChatConversation"
    
    conversation_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    studyset_id: uuid.UUID = Field(foreign_key="StudySet.studyset_id")
    user_id: uuid.UUID = Field(foreign_key="User.user_id")
    state: ConversationState = Field(default=ConversationState.INITIAL)
    intent: ConversationIntent | None = Field(default=None)
    collected_params: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB)
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    study_set: "StudySet" = Relationship()
    user: "User" = Relationship()
    messages: list["ChatMessage"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class ChatMessage(SQLModel, table=True):
    __tablename__ = "ChatMessage"
    
    message_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True
    )
    conversation_id: uuid.UUID = Field(
        foreign_key="ChatConversation.conversation_id"
    )
    role: str = Field(max_length=20)  # "user", "assistant", "system"
    content: str = Field(sa_column=Column(Text))
    message_metadata: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSONB)
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    conversation: ChatConversation = Relationship(back_populates="messages")

