import uuid
from typing import Any

from pydantic import BaseModel

from app.models.enums import ConversationState


class QuickReplyButton(BaseModel):
    label: str
    value: str
    type: str = "text"  # "text" | "number" | "option"
    icon: str | None = None


class ChatRequest(BaseModel):
    message: str = ""  # Allow empty string for initial message
    conversation_id: uuid.UUID | None = None
    button_clicked: str | None = None


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message: str
    state: ConversationState
    quick_replies: list[QuickReplyButton] | None = None
    metadata: dict[str, Any] | None = None
    show_input: bool = True


class ChatOption(BaseModel):
    label: str
    value: str
    description: str | None = None
    icon: str | None = None


class GeneratedContent(BaseModel):
    type: str  # "test" | "paragraph"
    content: dict[str, Any]
    ai_content_id: uuid.UUID
    message: str

