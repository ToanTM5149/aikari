import uuid
from datetime import datetime

from sqlmodel import SQLModel


class TermBase(SQLModel):
    term_text: str
    definition: str
    example: str | None = None


class TermCreate(TermBase):
    studyset_id: uuid.UUID


class TermUpdate(SQLModel):
    term_text: str | None = None
    definition: str | None = None
    example: str | None = None


class TermPublic(TermBase):
    term_id: uuid.UUID
    studyset_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

