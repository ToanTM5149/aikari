from enum import Enum


class UserRole(str, Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"


class ClassRole(str, Enum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"
    CO_TEACHER = "CO_TEACHER"


class MembershipStatus(str, Enum):
    """Status of class membership"""
    ACTIVE = "ACTIVE"           # Approved and active member
    PENDING = "PENDING"         # Waiting for approval (join request)
    INVITED = "INVITED"         # Invited but not yet accepted
    REJECTED = "REJECTED"       # Join request was rejected
    LEFT = "LEFT"               # User left the class


class ContentType(str, Enum):
    DEFAULT = "DEFAULT"
    AI_GENERATED = "AI_GENERATED"


class GenerateType(str, Enum):
    TEST = "TEST"
    ATTRIBUTE = "ATTRIBUTE"


class TestType(str, Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TRUE_FALSE = "TRUE_FALSE"
    ESSAY = "ESSAY"
    MIXED = "MIXED"


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TRUE_FALSE = "TRUE_FALSE"
    ESSAY = "ESSAY"


class ReattemptStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

