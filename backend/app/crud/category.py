import uuid
from datetime import datetime

from sqlalchemy import func
from sqlmodel import Session, select

from app.models.category import Category
from app.models.studyset import StudySet
from app.schemas.category import CategoryCreate, CategoryUpdate


def create_category(
    *, session: Session, category_in: CategoryCreate, owner_id: uuid.UUID
) -> Category:
    """Create new category"""
    db_obj = Category.model_validate(
        category_in, update={"owner_id": owner_id, "updated_at": datetime.utcnow()}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_category(*, session: Session, category_id: uuid.UUID) -> Category | None:
    """Get category by ID"""
    return session.get(Category, category_id)


def get_category_by_name(
    *, session: Session, name: str, owner_id: uuid.UUID
) -> Category | None:
    """Get category by name for a specific user"""
    statement = select(Category).where(
        Category.name == name, Category.owner_id == owner_id
    )
    return session.exec(statement).first()


def get_categories(
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Category]:
    """Get all categories for a user"""
    statement = (
        select(Category)
        .where(Category.owner_id == owner_id)
        .order_by(Category.name)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_categories_with_count(
    *, session: Session, owner_id: uuid.UUID
) -> list[dict]:
    """Get all categories with studyset count"""
    statement = (
        select(
            Category,
            func.count(StudySet.studyset_id).label("studyset_count")
        )
        .outerjoin(StudySet, Category.category_id == StudySet.category_id)
        .where(Category.owner_id == owner_id)
        .group_by(Category.category_id)
        .order_by(Category.name)
    )

    results = session.exec(statement).all()

    # Convert to list of dicts with category and count
    categories_with_count = []
    for category, count in results:
        category_dict = category.model_dump()
        category_dict["studyset_count"] = count or 0
        categories_with_count.append(category_dict)

    return categories_with_count


def update_category(
    *, session: Session, db_category: Category, category_in: CategoryUpdate
) -> Category:
    """Update category"""
    category_data = category_in.model_dump(exclude_unset=True)
    category_data["updated_at"] = datetime.utcnow()
    db_category.sqlmodel_update(category_data)
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


def delete_category(*, session: Session, category_id: uuid.UUID) -> bool:
    """
    Delete category and unlink from studysets.
    Returns True if deleted, False if not found.
    """
    db_category = session.get(Category, category_id)
    if not db_category:
        return False

    # Unlink all studysets from this category
    statement = select(StudySet).where(StudySet.category_id == category_id)
    studysets = session.exec(statement).all()
    for studyset in studysets:
        studyset.category_id = None
        session.add(studyset)

    session.delete(db_category)
    session.commit()
    return True
