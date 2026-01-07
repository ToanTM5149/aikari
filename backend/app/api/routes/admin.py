"""
Admin API Routes
Endpoints for admin-level system statistics and management
"""
from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.deps import SessionDep, get_current_active_superuser
from app.schemas import (
    AdminDashboardStats,
    AIGenerationStats,
    AIUsageTrendStats,
    ClassStatistics,
    ContentStatistics,
    LearningOverviewStats,
    LearningTrendStats,
    SystemOverviewStats,
    UserStatistics,
)
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


# ============================================================================
# COMPLETE DASHBOARD
# ============================================================================

@router.get(
    "/dashboard/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=AdminDashboardStats,
)
def get_admin_dashboard(session: SessionDep) -> Any:
    """
    Get complete admin dashboard with all statistics.
    
    **Admin only.**
    
    Returns comprehensive system-wide statistics including:
    - System overview (users, classes, studysets, activities)
    - User statistics and activity metrics
    - Learning statistics and trends
    - Class statistics and top classes
    - AI usage statistics
    - Content statistics and popular studysets
    """
    return AdminService.get_admin_dashboard(session)


# ============================================================================
# SYSTEM OVERVIEW
# ============================================================================

@router.get(
    "/statistics/overview/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=SystemOverviewStats,
)
def get_system_overview(session: SessionDep) -> Any:
    """
    Get system overview statistics.
    
    **Admin only.**
    
    Returns:
    - Total counts (users by role, classes, studysets, terms)
    - Activity counts (study activities, AI generations, chat messages)
    - Active user metrics (7-day and 30-day)
    - New user metrics (7-day and 30-day)
    """
    return AdminService.get_system_overview(session)


# ============================================================================
# USER STATISTICS
# ============================================================================

@router.get(
    "/statistics/users/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserStatistics,
)
def get_user_statistics(
    session: SessionDep,
    top_limit: int = Query(10, description="Number of top active users to return"),
) -> Any:
    """
    Get detailed user statistics.
    
    **Admin only.**
    
    Returns:
    - Total user count
    - Active users (today, week, month)
    - User role distribution
    - Top active users with their metrics
    """
    return AdminService.get_user_statistics(session, limit=top_limit)


# ============================================================================
# LEARNING STATISTICS
# ============================================================================

@router.get(
    "/statistics/learning/overview/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=LearningOverviewStats,
)
def get_learning_overview(session: SessionDep) -> Any:
    """
    Get learning activity overview statistics.
    
    **Admin only.**
    
    Returns:
    - Total study sessions and time
    - Terms studied and mastered
    - Average session duration and accuracy
    - Recent activity metrics (7-day and 30-day)
    """
    return AdminService.get_learning_statistics(session)


@router.get(
    "/statistics/learning/trends/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=LearningTrendStats,
)
def get_learning_trends(
    session: SessionDep,
    days: int = Query(30, ge=1, le=365, description="Number of days for trend data"),
) -> Any:
    """
    Get learning activity trends over time.
    
    **Admin only.**
    
    Returns daily activity data including:
    - Study sessions per day
    - Active users per day
    - Study time per day
    """
    return AdminService.get_learning_trends(session, days=days)


# ============================================================================
# CLASS STATISTICS
# ============================================================================

@router.get(
    "/statistics/classes/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ClassStatistics,
)
def get_class_statistics(
    session: SessionDep,
    top_limit: int = Query(10, description="Number of top classes to return"),
) -> Any:
    """
    Get class statistics.
    
    **Admin only.**
    
    Returns:
    - Class overview (total, public/private, members)
    - Top classes by member count
    - Top classes by activity
    """
    return AdminService.get_class_statistics(session, limit=top_limit)


# ============================================================================
# AI USAGE STATISTICS
# ============================================================================

@router.get(
    "/statistics/ai/overview/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=AIGenerationStats,
)
def get_ai_usage_overview(session: SessionDep) -> Any:
    """
    Get AI usage statistics overview.
    
    **Admin only.**
    
    Returns:
    - Total AI generations (tests, paragraphs)
    - Chat conversation and message counts
    - Recent usage metrics (7-day and 30-day)
    - Average test question counts
    """
    return AdminService.get_ai_usage_statistics(session)


@router.get(
    "/statistics/ai/trends/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=AIUsageTrendStats,
)
def get_ai_usage_trends(
    session: SessionDep,
    days: int = Query(30, ge=1, le=365, description="Number of days for trend data"),
) -> Any:
    """
    Get AI usage trends over time.
    
    **Admin only.**
    
    Returns daily AI usage data including:
    - Generations per day
    - Chat messages per day
    """
    return AdminService.get_ai_usage_trends(session, days=days)


# ============================================================================
# CONTENT STATISTICS
# ============================================================================

@router.get(
    "/statistics/content/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ContentStatistics,
)
def get_content_statistics(
    session: SessionDep,
    top_limit: int = Query(10, description="Number of top studysets to return"),
) -> Any:
    """
    Get content statistics.
    
    **Admin only.**
    
    Returns:
    - Total studysets and terms
    - Average terms per studyset
    - Studysets with AI-generated content
    - Top studysets by learners and activity
    - Category distribution
    """
    return AdminService.get_content_statistics(session, limit=top_limit)
