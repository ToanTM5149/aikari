import uuid
from datetime import datetime
from typing import Any

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.models.enums import UserRole


class UserBase(SQLModel):
    username: str
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.STUDENT
    phone_numbers: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    preferences: dict[str, Any] | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserRegister(SQLModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: UserRole = UserRole.STUDENT


class UserUpdate(SQLModel):
    username: str | None = None
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    phone_numbers: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    preferences: dict[str, Any] | None = None


class UserUpdateMe(SQLModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone_numbers: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    preferences: dict[str, Any] | None = None


class UserPublic(UserBase):
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int

