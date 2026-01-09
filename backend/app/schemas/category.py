import uuid
from datetime import datetime

from sqlmodel import SQLModel


# Shared properties
class CategoryBase(SQLModel):
    name: str
    description: str | None = None


# Properties to receive on category creation
class CategoryCreate(CategoryBase):
    pass


# Properties to receive on category update
class CategoryUpdate(SQLModel):
    name: str | None = None
    description: str | None = None


# Database model, with ID and owner_id
class CategoryInDBBase(CategoryBase):
    category_id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# Properties to return to client
class CategoryPublic(CategoryInDBBase):
    pass


# Properties for category with studyset count
class CategoryWithCount(CategoryPublic):
    studyset_count: int = 0


# Response for list of categories
class CategoriesPublic(SQLModel):
    data: list[CategoryPublic]
    count: int
