import uuid
from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Category(SQLModel, table=True):
    __tablename__ = "Category"

    category_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=100, index=True)
    description: str | None = Field(default=None, max_length=500)
    color: str | None = Field(default=None, max_length=7)  # Hex color code
    owner_id: uuid.UUID = Field(foreign_key="User.user_id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    owner: "User" = Relationship(back_populates="categories")
    study_sets: list["StudySet"] = Relationship(back_populates="category")
