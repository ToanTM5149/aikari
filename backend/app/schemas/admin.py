"""
Admin Statistics Schemas
Response models for admin statistics endpoints
"""
from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import BaseModel

class SystemOverviewStats(BaseModel):
    """Overall system statistics"""
    total_users: int
    total_students: int
    total_teachers: int
    total_admins: int
    total_classes: int
    total_studysets: int
    total_terms: int
    total_study_activities: int
    total_ai_generations: int
    total_chat_messages: int
    
    # Time-based metrics
    active_users_last_7_days: int
    active_users_last_30_days: int
    new_users_last_7_days: int
    new_users_last_30_days: int
    
    # Generated timestamp
    generated_at: datetime
    
    class Config:
        from_attributes = True

class UserRoleDistribution(BaseModel):
    """User distribution by role"""
    role: str
    count: int
    percentage: float


class UserActivityMetrics(BaseModel):
    """User activity metrics"""
    user_id: UUID
    username: str
    full_name: str
    email: str
    role: str
    total_studysets: int
    total_study_time_minutes: int
    total_activities: int
    last_active_at: datetime | None
    created_at: datetime


class UserStatistics(BaseModel):
    """Detailed user statistics"""
    total_users: int
    active_users_today: int
    active_users_week: int
    active_users_month: int
    role_distribution: list[UserRoleDistribution]
    top_active_users: list[UserActivityMetrics]
    
    class Config:
        from_attributes = True

class LearningOverviewStats(BaseModel):
    """Overall learning statistics"""
    total_study_sessions: int
    total_study_time_hours: float
    total_terms_studied: int
    total_terms_mastered: int
    average_session_duration_minutes: float
    average_accuracy_percentage: float
    
    # Recent activity
    study_sessions_last_7_days: int
    study_sessions_last_30_days: int
    
    class Config:
        from_attributes = True


class DailyActivityPoint(BaseModel):
    """Daily activity data point for charts"""
    date: str  # YYYY-MM-DD
    study_sessions: int
    active_users: int
    study_time_hours: float


class LearningTrendStats(BaseModel):
    """Learning trends over time"""
    daily_activities: list[DailyActivityPoint]
    period_start: datetime
    period_end: datetime

class ClassOverviewStats(BaseModel):
    """Overall class statistics"""
    total_classes: int
    total_public_classes: int
    total_private_classes: int
    total_class_members: int
    average_members_per_class: float
    
    # Recent data
    classes_created_last_7_days: int
    classes_created_last_30_days: int
    
    class Config:
        from_attributes = True


class TopClassMetrics(BaseModel):
    """Metrics for top classes"""
    class_id: UUID
    class_name: str
    owner_username: str
    member_count: int
    studyset_count: int
    total_study_activities: int
    is_public: bool
    created_at: datetime


class ClassStatistics(BaseModel):
    """Detailed class statistics"""
    overview: ClassOverviewStats
    top_classes_by_members: list[TopClassMetrics]
    top_classes_by_activity: list[TopClassMetrics]

class AIGenerationStats(BaseModel):
    """AI generation usage statistics"""
    total_generations: int
    total_tests_generated: int
    total_paragraphs_generated: int
    total_chat_conversations: int
    total_chat_messages: int
    
    # Recent usage
    generations_last_7_days: int
    generations_last_30_days: int
    chat_messages_last_7_days: int
    chat_messages_last_30_days: int
    
    # Average metrics
    average_test_questions_per_generation: float
    
    class Config:
        from_attributes = True


class DailyAIUsagePoint(BaseModel):
    """Daily AI usage data point"""
    date: str  # YYYY-MM-DD
    generations: int
    chat_messages: int


class AIUsageTrendStats(BaseModel):
    """AI usage trends over time"""
    daily_usage: list[DailyAIUsagePoint]
    period_start: datetime
    period_end: datetime

class PopularStudySetMetrics(BaseModel):
    """Metrics for popular studysets"""
    studyset_id: UUID
    title: str
    owner_username: str
    term_count: int
    total_learners: int  # Unique users who studied
    total_activities: int
    average_completion_rate: float
    created_at: datetime


class ContentStatistics(BaseModel):
    """Content-related statistics"""
    total_studysets: int
    total_terms: int
    average_terms_per_studyset: float
    studysets_with_ai_content: int
    
    top_studysets_by_learners: list[PopularStudySetMetrics]
    top_studysets_by_activities: list[PopularStudySetMetrics]
    
    categories: list[dict[str, Any]]  



class AdminDashboardStats(BaseModel):
    """Complete admin dashboard statistics"""
    system_overview: SystemOverviewStats
    user_stats: UserStatistics
    learning_stats: LearningOverviewStats
    class_stats: ClassStatistics
    ai_usage_stats: AIGenerationStats
    content_stats: ContentStatistics
    
    generated_at: datetime
    
    class Config:
        from_attributes = True

