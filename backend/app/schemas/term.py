import uuid
from datetime import datetime

from sqlmodel import SQLModel
from typing import Any


class TermBase(SQLModel):
    term_text: str
    definition: str
    example: str | None = None
    image_url: str | None = None
    attributes: dict[str, Any] | None = None


class TermCreate(SQLModel):
    # Không cần studyset_id vì đã có trong path parameter
    term_text: str
    definition: str
    example: str | None = None
    image_url: str | None = None
    attributes: dict[str, Any] | None = None


class TermUpdate(SQLModel):
    term_text: str | None = None
    definition: str | None = None
    example: str | None = None
    image_url: str | None = None


class TermPublic(TermBase):
    term_id: uuid.UUID
    studyset_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

