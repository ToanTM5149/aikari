# Common Schemas
from app.schemas.common import (
    Message,
    NewPassword,
    RefreshTokenRequest,
    Token,
    TokenPayload,
    UpdatePassword,
)

# Admin Schemas
from app.schemas.admin import (
    AdminDashboardStats,
    AIGenerationStats,
    AIUsageTrendStats,
    ClassOverviewStats,
    ClassStatistics,
    ContentStatistics,
    DailyActivityPoint,
    DailyAIUsagePoint,
    LearningOverviewStats,
    LearningTrendStats,
    PopularStudySetMetrics,
    SystemOverviewStats,
    TopClassMetrics,
    UserActivityMetrics,
    UserRoleDistribution,
    UserStatistics,
)

# User Schemas
from app.schemas.user import (
    TokenResponse,
    UserBase,
    UserCreate,
    UserPublic,
    UserRegister,
    UserUpdate,
    UserUpdateMe,
    UsersPublic,
)

# StudySet Schemas
from app.schemas.studyset import (
    StudySetBase,
    StudySetCreate,
    StudySetPublic,
    StudySetUpdate,
)

# Term Schemas
from app.schemas.term import (
    TermBase,
    TermCreate,
    TermPublic,
    TermUpdate,
)

# Test Schemas
from app.schemas.test import (
    TestBase,
    TestCreate,
    TestPublic,
    TestUpdate,
    TestWithQuestions,
    TestsPublic,
    QuestionPublic,
    QuestionWithoutAnswer,
    AnswerPublic,
    AnswerSubmit,
    AttemptCreate,
    AttemptSubmit,
    AttemptPublic,
    AttemptWithAnswers,
    AttemptWithQuestionsOnly,
    AttemptsPublic,
    ReattemptRequestCreate,
    ReattemptRequestPublic,
    ReattemptRequestUpdate,
    ReattemptRequestsPublic,
)

# Class Schemas
from app.schemas.class_ import (
    ClassBase,
    ClassCreate,
    ClassMemberBase,
    ClassMemberCreate,
    ClassMemberPublic,
    ClassMembersPublic,
    ClassMemberUpdate,
    ClassPublic,
    ClassesPublic,
    ClassUpdate,
    # Analytics Schemas
    StudentProgressDetail,
    ClassAnalyticsOverview,
    StudySetAnalytics,
    LeaderboardEntry,
    ClassLeaderboard,
    StudentProgressList,
    ClassTimeSeriesAnalytics,
    DailyStudyTime,
    WeeklyRetention,
    TestPerformancePoint,
    ProgressOverTime,
    StudyCategoryDistribution,
)

# Learning Schemas
from app.schemas.learning import (
    LearningSessionStart,
    LearningSessionStartResponse,
    NextTermResponse,
    ReviewSubmission,
    ReviewResponse,
    SessionSummary,
    ProgressSummaryPublic,
    StudyActivityPublic,
    UserProgressOverview,
    ProgressHistory,
    WeakTerm,
    StudyStats,
)

# Chatbot Schemas
from app.schemas.chatbot import (
    ChatRequest,
    ChatResponse,
    QuickReplyButton,
    ChatOption,
    GeneratedContent,
)

__all__ = [
    # Common Schemas
    "Message",
    "Token",
    "TokenResponse",
    "TokenPayload",
    "RefreshTokenRequest",
    "UpdatePassword",
    "NewPassword",
    # User Schemas
    "UserBase",
    "UserCreate",
    "UserRegister",
    "UserUpdate",
    "UserUpdateMe",
    "UserPublic",
    "UsersPublic",
    # StudySet Schemas
    "StudySetBase",
    "StudySetCreate",
    "StudySetUpdate",
    "StudySetPublic",
    # Term Schemas
    "TermBase",
    "TermCreate",
    "TermUpdate",
    "TermPublic",
    # Test Schemas
    "TestBase",
    "TestCreate",
    "TestUpdate",
    "TestPublic",
    "TestWithQuestions",
    "TestsPublic",
    "QuestionPublic",
    "QuestionWithoutAnswer",
    "AnswerPublic",
    "AnswerSubmit",
    "AttemptCreate",
    "AttemptSubmit",
    "AttemptPublic",
    "AttemptWithAnswers",
    "AttemptWithQuestionsOnly",
    "AttemptsPublic",
    "ReattemptRequestCreate",
    "ReattemptRequestPublic",
    "ReattemptRequestUpdate",
    "ReattemptRequestsPublic",
    # Class Schemas
    "ClassBase",
    "ClassCreate",
    "ClassUpdate",
    "ClassPublic",
    "ClassesPublic",
    "ClassMemberBase",
    "ClassMemberCreate",
    "ClassMemberUpdate",
    "ClassMemberPublic",
    "ClassMembersPublic",
    # Analytics Schemas
    "StudentProgressDetail",
    "ClassAnalyticsOverview",
    "StudySetAnalytics",
    "LeaderboardEntry",
    "ClassLeaderboard",
    "StudentProgressList",
    "ClassTimeSeriesAnalytics",
    "DailyStudyTime",
    "WeeklyRetention",
    "TestPerformancePoint",
    "ProgressOverTime",
    "StudyCategoryDistribution",
    # Learning Schemas
    "LearningSessionStart",
    "LearningSessionStartResponse",
    "NextTermResponse",
    "ReviewSubmission",
    "ReviewResponse",
    "SessionSummary",
    "ProgressSummaryPublic",
    "StudyActivityPublic",
    "UserProgressOverview",
    "ProgressHistory",
    "WeakTerm",
    "StudyStats",
    # Chatbot Schemas
    "ChatRequest",
    "ChatResponse",
    "QuickReplyButton",
    "ChatOption",
    "GeneratedContent",
]

