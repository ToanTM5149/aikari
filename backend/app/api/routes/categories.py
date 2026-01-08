import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.crud import category as category_crud
from app.schemas import Message
from app.schemas.category import (
    CategoriesPublic,
    CategoryCreate,
    CategoryPublic,
    CategoryUpdate,
    CategoryWithCount,
)

router = APIRouter()


@router.get("/", response_model=CategoriesPublic)
def read_categories(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve categories owned by current user.
    """
    categories = category_crud.get_categories(
        session=session, owner_id=current_user.user_id, skip=skip, limit=limit
    )

    return CategoriesPublic(
        data=[CategoryPublic.model_validate(cat) for cat in categories],
        count=len(categories),
    )


@router.get("/with-count/")
def read_categories_with_count(
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Retrieve categories with studyset count.
    """
    categories = category_crud.get_categories_with_count(
        session=session, owner_id=current_user.user_id
    )

    return {
        "data": [CategoryWithCount.model_validate(cat) for cat in categories],
        "count": len(categories),
    }


@router.get("/{category_id}/", response_model=CategoryPublic)
def read_category(
    category_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Get category by ID.
    """
    category = category_crud.get_category(session=session, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check ownership
    if category.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this category")

    return category


@router.post("/", response_model=CategoryPublic)
def create_category(
    current_user: CurrentUser,
    session: SessionDep,
    category_in: CategoryCreate,
) -> Any:
    """
    Create new category.
    """
    # Check if category with same name already exists for this user
    existing_category = category_crud.get_category_by_name(
        session=session, name=category_in.name, owner_id=current_user.user_id
    )
    if existing_category:
        raise HTTPException(
            status_code=400,
            detail=f"Category with name '{category_in.name}' already exists",
        )

    category = category_crud.create_category(
        session=session, category_in=category_in, owner_id=current_user.user_id
    )
    return category


@router.put("/{category_id}/", response_model=CategoryPublic)
def update_category(
    category_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
    category_in: CategoryUpdate,
) -> Any:
    """
    Update a category.
    """
    category = category_crud.get_category(session=session, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check ownership
    if category.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this category")

    # If updating name, check for duplicates
    if category_in.name and category_in.name != category.name:
        existing_category = category_crud.get_category_by_name(
            session=session, name=category_in.name, owner_id=current_user.user_id
        )
        if existing_category:
            raise HTTPException(
                status_code=400,
                detail=f"Category with name '{category_in.name}' already exists",
            )

    category = category_crud.update_category(
        session=session, db_category=category, category_in=category_in
    )
    return category


@router.delete("/{category_id}/", response_model=Message)
def delete_category(
    category_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Any:
    """
    Delete a category. This will unlink all studysets from this category.
    """
    category = category_crud.get_category(session=session, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check ownership
    if category.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this category")

    category_crud.delete_category(session=session, category_id=category_id)
    return Message(message="Category deleted successfully")
