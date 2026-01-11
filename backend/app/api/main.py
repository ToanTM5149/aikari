from fastapi import APIRouter

from app.api.routes import login, private, users, utils, classes, studysets, categories, learning, tests, chatbot, admin, session
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(admin.router)
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(studysets.router, prefix="/studysets", tags=["studysets"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
api_router.include_router(session.router, prefix="/session", tags=["session"])
api_router.include_router(tests.router, prefix="/tests", tags=["tests"])
api_router.include_router(chatbot.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router, prefix="/private", tags=["private"])
