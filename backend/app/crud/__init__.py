"""CRUD operations for the application."""

# User CRUD
from .user import (
    authenticate,
    authenticate_by_username,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    update_user,
)

# Class CRUD
from .class_crud import (
    create_class,
    delete_class,
    get_class,
    get_classes_by_owner,
    get_user_classes,
    update_class,
)

# ClassMember CRUD
from .class_member import (
    create_class_member,
    delete_class_member,
    get_class_members,
    get_invitations,
    get_pending_requests,
    get_user_class_membership,
    get_user_invitations,
    update_class_member,
)

# StudySet CRUD
from .studyset import (
    create_studyset,
    delete_studyset,
    get_studyset,
    get_studysets_by_owner,
    update_studyset,
)

# Term CRUD
from .term import (
    create_term,
    delete_term,
    get_term,
    get_terms_by_studyset,
    update_term,
)

# StudentStudySet CRUD
from .student_studyset import (
    enroll_student,
    unenroll_student,
    update_last_studied,
    get_student_studysets,
    get_studyset_students,
    is_student_enrolled,
    get_enrollment,
)

# StudySetTerm CRUD (Phase 3.1+)
from .studyset_term import (
    add_term_to_studyset,
    remove_term_from_studyset,
    get_studyset_terms,
    get_term_studysets,
    count_studyset_terms,
    update_term_order,
    is_term_in_studyset,
)

__all__ = [
    # User
    "authenticate",
    "authenticate_by_username",
    "create_user",
    "get_user_by_email",
    "get_user_by_id",
    "get_user_by_username",
    "update_user",
    # Class
    "create_class",
    "delete_class",
    "get_class",
    "get_classes_by_owner",
    "get_user_class_membership",
    "get_user_classes",
    "update_class",
    # ClassMember
    "create_class_member",
    "delete_class_member",
    "get_class_members",
    "get_invitations",
    "get_pending_requests",
    "get_user_invitations",
    "update_class_member",
    # StudySet
    "create_studyset",
    "delete_studyset",
    "get_studyset",
    "get_studysets_by_owner",
    "update_studyset",
    # Term
    "create_term",
    "delete_term",
    "get_term",
    "get_terms_by_studyset",
    "update_term",
    # StudentStudySet
    "enroll_student",
    "unenroll_student",
    "update_last_studied",
    "get_student_studysets",
    "get_studyset_students",
    "is_student_enrolled",
    "get_enrollment",
    # StudySetTerm (Phase 3.1+)
    "add_term_to_studyset",
    "remove_term_from_studyset",
    "get_studyset_terms",
    "get_term_studysets",
    "count_studyset_terms",
    "update_term_order",
    "is_term_in_studyset",
]

