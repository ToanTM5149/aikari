# Base
from app.models.base import Base
from app.models.user import User

# Enums
from app.models.enums import (
    ClassRole,
    ContentType,
    GenerateType,
    TestType,
    UserRole,
)

# Models

from app.models.activity import StudyActivity
from app.models.class_ import Class, ClassMember
from app.models.progress import ProgressSummary
from app.models.quizz import AIGeneratedContents, Paragraph, Quizz
from app.models.studyset import StudySet
from app.models.term import Term
from app.models.test import Test, TestResult


# Schemas
from app.models.studyset import (
    StudySetBase,
    StudySetCreate,
    StudySetPublic,
    StudySetUpdate,
)
from app.models.term import TermBase, TermCreate, TermPublic, TermUpdate
from app.models.test import TestBase, TestCreate, TestPublic, TestUpdate
from app.models.user import (
    Message,
    NewPassword,
    Token,
    TokenPayload,
    UpdatePassword,
    UserBase,
    UserCreate,
    UserPublic,
    UserRegister,
    UserUpdate,
    UserUpdateMe,
    UsersPublic,
)

__all__ = [
    # Base
    "Base",
    # Enums
    "UserRole",
    "ClassRole",
    "ContentType",
    "GenerateType",
    "TestType",
    # Models
    "User",
    "Class",
    "ClassMember",
    "StudySet",
    "Term",
    "Test",
    "TestResult",
    "Quizz",
    "Paragraph",
    "AIGeneratedContents",
    "StudyActivity",
    "ProgressSummary",
    # Schemas
    "UserBase",
    "UserCreate",
    "UserRegister",
    "UserUpdate",
    "UserUpdateMe",
    "UserPublic",
    "UsersPublic",
    "StudySetBase",
    "StudySetCreate",
    "StudySetUpdate",
    "StudySetPublic",
    "TermBase",
    "TermCreate",
    "TermUpdate",
    "TermPublic",
    "TestBase",
    "TestCreate",
    "TestUpdate",
    "TestPublic",
    "Message",
    "Token",
    "TokenPayload",
    "UpdatePassword",
    "NewPassword",
]
