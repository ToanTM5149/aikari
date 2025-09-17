from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, folders, classes, flashcard_sets, study
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(flashcard_sets.router, prefix="/flashcard-sets", tags=["flashcard-sets"])
api_router.include_router(study.router, prefix="/study", tags=["study"])


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router, prefix="/private", tags=["private"])
