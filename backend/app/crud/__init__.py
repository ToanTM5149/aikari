"""CRUD operations for the application."""

from .crud import (
    # User CRUD
    authenticate,
    authenticate_by_username,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    update_user,
    # Class CRUD
    create_class,
    delete_class,
    get_class,
    get_classes_by_owner,
    get_user_class_membership,
    get_user_classes,
    update_class,
    # ClassMember CRUD
    create_class_member,
    delete_class_member,
    get_class_members,
    get_invitations,
    get_pending_requests,
    get_user_invitations,
    update_class_member,
    # StudySet CRUD
    create_studyset,
    delete_studyset,
    get_studyset,
    get_studysets_by_owner,
    update_studyset,
    # Term CRUD
    create_term,
    delete_term,
    get_term,
    get_terms_by_studyset,
    update_term,
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
]

