from enum import Enum


class UserRole(str, Enum):
    STUDENT = "Student"
    TEACHER = "Teacher"
    ADMIN = "Admin"


class ClassRole(str, Enum):
    OWNER = "Owner"
    MEMBER = "Member"
    CO_TEACHER = "Co-teacher"


class ContentType(str, Enum):
    DEFAULT = "default"
    AI_GENERATED = "ai_generated"


class GenerateType(str, Enum):
    QUIZZ = "quizz"
    TEST = "test"
    PARAGRAPH = "paragraph"


class TestType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    WRITTEN = "written"
    MIXED = "mixed"

