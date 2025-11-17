from enum import Enum


class UserRole(str, Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"


class ClassRole(str, Enum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"
    CO_TEACHER = "CO_TEACHER"


class ContentType(str, Enum):
    DEFAULT = "DEFAULT"
    AI_GENERATED = "AI_GENERATED"


class GenerateType(str, Enum):
    QUIZZ = "QUIZZ"
    TEST = "TEST"
    PARAGRAPH = "PARAGRAPH"


class TestType(str, Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    WRITTEN = "WRITTEN"
    MIXED = "MIXED"

