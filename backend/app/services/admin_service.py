"""
Admin Service - System-wide statistics and analytics
"""
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlmodel import Session, select, func, and_, or_, distinct

from app.models import (
    User,
    Class,
    ClassMember,
    ClassStudySet,
    StudySet,
    Term,
    StudySetTerm,
    StudyActivity,
    ProgressSummary,
    Test,
    ChatConversation,
    ChatMessage,
    AIGeneratedContents,
)
from app.models.enums import UserRole, MembershipStatus
from app.schemas.admin import (
    SystemOverviewStats,
    UserStatistics,
    UserRoleDistribution,
    UserActivityMetrics,
    LearningOverviewStats,
    LearningTrendStats,
    DailyActivityPoint,
    ClassOverviewStats,
    ClassStatistics,
    TopClassMetrics,
    AIGenerationStats,
    AIUsageTrendStats,
    DailyAIUsagePoint,
    ContentStatistics,
    PopularStudySetMetrics,
    AdminDashboardStats,
)


class AdminService:
    """Service for admin-level system statistics and analytics"""
    
    @staticmethod
    def get_system_overview(session: Session) -> SystemOverviewStats:
        """Get overall system statistics"""
        
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        # Count users by role
        total_users = session.exec(select(func.count(User.user_id))).one()
        total_students = session.exec(
            select(func.count(User.user_id)).where(User.role == UserRole.STUDENT)
        ).one()
        total_teachers = session.exec(
            select(func.count(User.user_id)).where(User.role == UserRole.TEACHER)
        ).one()
        total_admins = session.exec(
            select(func.count(User.user_id)).where(User.role == UserRole.ADMIN)
        ).one()
        
        # Count resources
        total_classes = session.exec(select(func.count(Class.class_id))).one()
        total_studysets = session.exec(select(func.count(StudySet.studyset_id))).one()
        total_terms = session.exec(select(func.count(Term.term_id))).one()
        total_study_activities = session.exec(select(func.count(StudyActivity.activity_id))).one()
        
        # Count AI usage
        total_ai_generations = session.exec(
            select(func.count(AIGeneratedContents.ai_content_id))
        ).one()
        total_chat_messages = session.exec(
            select(func.count(ChatMessage.message_id))
        ).one()
        
        # Active users (users with study activities in period)
        active_users_7d = session.exec(
            select(func.count(distinct(StudyActivity.user_id)))
            .where(StudyActivity.created_at >= seven_days_ago)
        ).one()
        
        active_users_30d = session.exec(
            select(func.count(distinct(StudyActivity.user_id)))
            .where(StudyActivity.created_at >= thirty_days_ago)
        ).one()
        
        # New users
        new_users_7d = session.exec(
            select(func.count(User.user_id))
            .where(User.created_at >= seven_days_ago)
        ).one()
        
        new_users_30d = session.exec(
            select(func.count(User.user_id))
            .where(User.created_at >= thirty_days_ago)
        ).one()
        
        return SystemOverviewStats(
            total_users=total_users or 0,
            total_students=total_students or 0,
            total_teachers=total_teachers or 0,
            total_admins=total_admins or 0,
            total_classes=total_classes or 0,
            total_studysets=total_studysets or 0,
            total_terms=total_terms or 0,
            total_study_activities=total_study_activities or 0,
            total_ai_generations=total_ai_generations or 0,
            total_chat_messages=total_chat_messages or 0,
            active_users_last_7_days=active_users_7d or 0,
            active_users_last_30_days=active_users_30d or 0,
            new_users_last_7_days=new_users_7d or 0,
            new_users_last_30_days=new_users_30d or 0,
            generated_at=now,
        )
    
    @staticmethod
    def get_user_statistics(session: Session, limit: int = 10) -> UserStatistics:
        """Get detailed user statistics"""
        
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        total_users = session.exec(select(func.count(User.user_id))).one()
        
        # Active users by period (users with activities)
        active_today = session.exec(
            select(func.count(distinct(StudyActivity.user_id)))
            .where(StudyActivity.created_at >= today_start)
        ).one()
        
        active_week = session.exec(
            select(func.count(distinct(StudyActivity.user_id)))
            .where(StudyActivity.created_at >= week_ago)
        ).one()
        
        active_month = session.exec(
            select(func.count(distinct(StudyActivity.user_id)))
            .where(StudyActivity.created_at >= month_ago)
        ).one()
        
        # Role distribution
        role_counts = session.exec(
            select(User.role, func.count(User.user_id).label('count'))
            .group_by(User.role)
        ).all()
        
        role_distribution = [
            UserRoleDistribution(
                role=role.value,
                count=count,
                percentage=round((count / total_users * 100) if total_users > 0 else 0, 2)
            )
            for role, count in role_counts
        ]
        
        # Top active users
        top_users_query = (
            select(
                User.user_id,
                User.username,
                User.full_name,
                User.email,
                User.role,
                User.created_at,
                func.count(distinct(StudySet.studyset_id)).label('studyset_count'),
                func.coalesce(func.sum(StudyActivity.response_time), 0).label('total_time_seconds'),
                func.count(StudyActivity.activity_id).label('activity_count'),
                func.max(StudyActivity.created_at).label('last_active')
            )
            .outerjoin(StudySet, StudySet.owner_id == User.user_id)
            .outerjoin(StudyActivity, StudyActivity.user_id == User.user_id)
            .group_by(User.user_id)
            .order_by(func.count(StudyActivity.activity_id).desc())
            .limit(limit)
        )
        
        top_users_data = session.exec(top_users_query).all()
        
        top_active_users = [
            UserActivityMetrics(
                user_id=row.user_id,
                username=row.username,
                full_name=row.full_name,
                email=row.email,
                role=row.role.value,
                total_studysets=row.studyset_count,
                total_study_time_minutes=int(row.total_time_seconds / 60) if row.total_time_seconds else 0,
                total_activities=row.activity_count,
                last_active_at=row.last_active,
                created_at=row.created_at,
            )
            for row in top_users_data
        ]
        
        return UserStatistics(
            total_users=total_users or 0,
            active_users_today=active_today or 0,
            active_users_week=active_week or 0,
            active_users_month=active_month or 0,
            role_distribution=role_distribution,
            top_active_users=top_active_users,
        )
    
    @staticmethod
    def get_learning_statistics(session: Session) -> LearningOverviewStats:
        """Get learning activity statistics"""
        
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        # Total study metrics
        total_activities = session.exec(
            select(func.count(StudyActivity.activity_id))
        ).one() or 0
        
        total_time_seconds = session.exec(
            select(func.coalesce(func.sum(StudyActivity.response_time), 0))
        ).one() or 0
        
        # Count unique terms studied
        total_terms_studied = session.exec(
            select(func.count(distinct(StudyActivity.term_id)))
        ).one() or 0
        
        # Mastered terms from progress summaries
        total_mastered = session.exec(
            select(func.coalesce(func.sum(ProgressSummary.mastered_terms), 0))
        ).one() or 0
        
        # Average session duration
        avg_duration = session.exec(
            select(func.avg(StudyActivity.response_time))
        ).one() or 0
        
        # Average accuracy
        # recall_score >= 3 means correct answer in SM2 algorithm
        total_correct = session.exec(
            select(func.count(StudyActivity.activity_id))
            .where(StudyActivity.recall_score >= 3)
        ).one() or 0
        
        accuracy_pct = (total_correct / total_activities * 100) if total_activities > 0 else 0
        
        # Recent activity
        activities_7d = session.exec(
            select(func.count(StudyActivity.activity_id))
            .where(StudyActivity.created_at >= seven_days_ago)
        ).one() or 0
        
        activities_30d = session.exec(
            select(func.count(StudyActivity.activity_id))
            .where(StudyActivity.created_at >= thirty_days_ago)
        ).one() or 0
        
        return LearningOverviewStats(
            total_study_sessions=total_activities,
            total_study_time_hours=round(total_time_seconds / 3600, 2),
            total_terms_studied=total_terms_studied,
            total_terms_mastered=total_mastered,
            average_session_duration_minutes=round(avg_duration / 60, 2) if avg_duration else 0,
            average_accuracy_percentage=round(accuracy_pct, 2),
            study_sessions_last_7_days=activities_7d,
            study_sessions_last_30_days=activities_30d,
        )
    
    @staticmethod
    def get_learning_trends(
        session: Session,
        days: int = 30
    ) -> LearningTrendStats:
        """Get learning trends over time"""
        
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)
        
        # Get daily activity data
        daily_data = session.exec(
            select(
                func.date(StudyActivity.created_at).label('date'),
                func.count(StudyActivity.activity_id).label('activity_count'),
                func.count(distinct(StudyActivity.user_id)).label('user_count'),
                func.coalesce(func.sum(StudyActivity.response_time), 0).label('total_seconds')
            )
            .where(StudyActivity.created_at >= start_date)
            .group_by(func.date(StudyActivity.created_at))
            .order_by(func.date(StudyActivity.created_at))
        ).all()
        
        daily_activities = [
            DailyActivityPoint(
                date=str(row.date),
                study_sessions=row.activity_count,
                active_users=row.user_count,
                study_time_hours=round(row.total_seconds / 3600, 2)
            )
            for row in daily_data
        ]
        
        return LearningTrendStats(
            daily_activities=daily_activities,
            period_start=start_date,
            period_end=now,
        )
    
    @staticmethod
    def get_class_statistics(session: Session, limit: int = 10) -> ClassStatistics:
        """Get class statistics"""
        
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        # Overview
        total_classes = session.exec(select(func.count(Class.class_id))).one() or 0
        
        total_public = session.exec(
            select(func.count(Class.class_id))
            .where(Class.is_public == True)
        ).one() or 0
        
        total_private = total_classes - total_public
        
        total_members = session.exec(
            select(func.count(ClassMember.user_id))
            .where(ClassMember.status == MembershipStatus.ACTIVE)
        ).one() or 0
        
        avg_members = total_members / total_classes if total_classes > 0 else 0
        
        classes_7d = session.exec(
            select(func.count(Class.class_id))
            .where(Class.created_at >= seven_days_ago)
        ).one() or 0
        
        classes_30d = session.exec(
            select(func.count(Class.class_id))
            .where(Class.created_at >= thirty_days_ago)
        ).one() or 0
        
        overview = ClassOverviewStats(
            total_classes=total_classes,
            total_public_classes=total_public,
            total_private_classes=total_private,
            total_class_members=total_members,
            average_members_per_class=round(avg_members, 2),
            classes_created_last_7_days=classes_7d,
            classes_created_last_30_days=classes_30d,
        )
        
        # Top classes by members
        top_by_members_query = (
            select(
                Class.class_id,
                Class.class_name,
                Class.is_public,
                Class.created_at,
                User.username.label('owner_username'),
                func.count(distinct(ClassMember.user_id)).label('member_count'),
                func.count(distinct(ClassStudySet.studyset_id)).label('studyset_count'),
            )
            .join(User, Class.owner_user_id == User.user_id)
            .outerjoin(ClassMember, and_(
                ClassMember.class_id == Class.class_id,
                ClassMember.status == MembershipStatus.ACTIVE
            ))
            .outerjoin(ClassStudySet, ClassStudySet.class_id == Class.class_id)
            .group_by(Class.class_id, User.username)
            .order_by(func.count(distinct(ClassMember.user_id)).desc())
            .limit(limit)
        )
        
        top_members_data = session.exec(top_by_members_query).all()
        
        # Get activity counts for these classes
        top_by_members = []
        for row in top_members_data:
            # Count study activities for this class's studysets
            activity_count = session.exec(
                select(func.count(StudyActivity.activity_id))
                .join(ClassStudySet, ClassStudySet.studyset_id == StudyActivity.studyset_id)
                .where(ClassStudySet.class_id == row.class_id)
            ).one() or 0
            
            top_by_members.append(TopClassMetrics(
                class_id=row.class_id,
                class_name=row.class_name,
                owner_username=row.owner_username,
                member_count=row.member_count,
                studyset_count=row.studyset_count,
                total_study_activities=activity_count,
                is_public=row.is_public,
                created_at=row.created_at,
            ))
        
        # Top classes by activity
        top_by_activity_query = (
            select(
                Class.class_id,
                Class.class_name,
                Class.is_public,
                Class.created_at,
                User.username.label('owner_username'),
                func.count(distinct(ClassMember.user_id)).label('member_count'),
                func.count(distinct(ClassStudySet.studyset_id)).label('studyset_count'),
                func.count(StudyActivity.activity_id).label('activity_count')
            )
            .join(User, Class.owner_user_id == User.user_id)
            .outerjoin(ClassMember, and_(
                ClassMember.class_id == Class.class_id,
                ClassMember.status == MembershipStatus.ACTIVE
            ))
            .outerjoin(ClassStudySet, ClassStudySet.class_id == Class.class_id)
            .outerjoin(StudyActivity, StudyActivity.studyset_id == ClassStudySet.studyset_id)
            .group_by(Class.class_id, User.username)
            .order_by(func.count(StudyActivity.activity_id).desc())
            .limit(limit)
        )
        
        top_activity_data = session.exec(top_by_activity_query).all()
        
        top_by_activity = [
            TopClassMetrics(
                class_id=row.class_id,
                class_name=row.class_name,
                owner_username=row.owner_username,
                member_count=row.member_count,
                studyset_count=row.studyset_count,
                total_study_activities=row.activity_count,
                is_public=row.is_public,
                created_at=row.created_at,
            )
            for row in top_activity_data
        ]
        
        return ClassStatistics(
            overview=overview,
            top_classes_by_members=top_by_members,
            top_classes_by_activity=top_by_activity,
        )
    
    @staticmethod
    def get_ai_usage_statistics(session: Session) -> AIGenerationStats:
        """Get AI usage statistics"""
        
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        # Total generations
        total_generations = session.exec(
            select(func.count(AIGeneratedContents.ai_content_id))
        ).one() or 0
        
        # By type
        from app.models.enums import GenerateType
        total_tests = session.exec(
            select(func.count(AIGeneratedContents.ai_content_id))
            .where(AIGeneratedContents.generate_type == GenerateType.TEST)
        ).one() or 0
        
        # Note: PARAGRAPH type not yet in database enum, defaulting to 0
        total_paragraphs = 0
        
        # Chat statistics
        total_conversations = session.exec(
            select(func.count(ChatConversation.conversation_id))
        ).one() or 0
        
        total_messages = session.exec(
            select(func.count(ChatMessage.message_id))
        ).one() or 0
        
        # Recent usage
        generations_7d = session.exec(
            select(func.count(AIGeneratedContents.ai_content_id))
            .where(AIGeneratedContents.created_at >= seven_days_ago)
        ).one() or 0
        
        generations_30d = session.exec(
            select(func.count(AIGeneratedContents.ai_content_id))
            .where(AIGeneratedContents.created_at >= thirty_days_ago)
        ).one() or 0
        
        messages_7d = session.exec(
            select(func.count(ChatMessage.message_id))
            .where(ChatMessage.created_at >= seven_days_ago)
        ).one() or 0
        
        messages_30d = session.exec(
            select(func.count(ChatMessage.message_id))
            .where(ChatMessage.created_at >= thirty_days_ago)
        ).one() or 0
        
        # Average questions per test (for AI-generated tests)
        avg_questions = session.exec(
            select(func.avg(Test.total_questions))
            .where(Test.is_ai_generated == True)
        ).one() or 0
        
        return AIGenerationStats(
            total_generations=total_generations,
            total_tests_generated=total_tests,
            total_paragraphs_generated=total_paragraphs,
            total_chat_conversations=total_conversations,
            total_chat_messages=total_messages,
            generations_last_7_days=generations_7d,
            generations_last_30_days=generations_30d,
            chat_messages_last_7_days=messages_7d,
            chat_messages_last_30_days=messages_30d,
            average_test_questions_per_generation=round(avg_questions, 2) if avg_questions else 0,
        )
    
    @staticmethod
    def get_ai_usage_trends(
        session: Session,
        days: int = 30
    ) -> AIUsageTrendStats:
        """Get AI usage trends over time"""
        
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)
        
        # Daily generation data
        generation_data = session.exec(
            select(
                func.date(AIGeneratedContents.created_at).label('date'),
                func.count(AIGeneratedContents.ai_content_id).label('gen_count')
            )
            .where(AIGeneratedContents.created_at >= start_date)
            .group_by(func.date(AIGeneratedContents.created_at))
            .order_by(func.date(AIGeneratedContents.created_at))
        ).all()
        
        gen_dict = {str(row.date): row.gen_count for row in generation_data}
        
        # Daily chat message data
        message_data = session.exec(
            select(
                func.date(ChatMessage.created_at).label('date'),
                func.count(ChatMessage.message_id).label('msg_count')
            )
            .where(ChatMessage.created_at >= start_date)
            .group_by(func.date(ChatMessage.created_at))
            .order_by(func.date(ChatMessage.created_at))
        ).all()
        
        msg_dict = {str(row.date): row.msg_count for row in message_data}
        
        # Merge data
        all_dates = sorted(set(gen_dict.keys()) | set(msg_dict.keys()))
        
        daily_usage = [
            DailyAIUsagePoint(
                date=date,
                generations=gen_dict.get(date, 0),
                chat_messages=msg_dict.get(date, 0)
            )
            for date in all_dates
        ]
        
        return AIUsageTrendStats(
            daily_usage=daily_usage,
            period_start=start_date,
            period_end=now,
        )
    
    @staticmethod
    def get_content_statistics(session: Session, limit: int = 10) -> ContentStatistics:
        """Get content statistics"""
        
        total_studysets = session.exec(
            select(func.count(StudySet.studyset_id))
        ).one() or 0
        
        total_terms = session.exec(
            select(func.count(Term.term_id))
        ).one() or 0
        
        avg_terms = total_terms / total_studysets if total_studysets > 0 else 0
        
        # Studysets with AI content
        from app.models.enums import ContentType
        studysets_with_ai = session.exec(
            select(func.count(StudySet.studyset_id))
            .where(StudySet.content_type == ContentType.AI_GENERATED)
        ).one() or 0
        
        # Top studysets by learners
        top_by_learners_query = (
            select(
                StudySet.studyset_id,
                StudySet.title,
                StudySet.created_at,
                User.username.label('owner_username'),
                func.count(distinct(Term.term_id)).label('term_count'),
                func.count(distinct(StudyActivity.user_id)).label('learner_count'),
                func.count(StudyActivity.activity_id).label('activity_count'),
            )
            .join(User, StudySet.owner_id == User.user_id)
            .outerjoin(StudySetTerm, StudySetTerm.studyset_id == StudySet.studyset_id)
            .outerjoin(Term, Term.term_id == StudySetTerm.term_id)
            .outerjoin(StudyActivity, StudyActivity.studyset_id == StudySet.studyset_id)
            .group_by(StudySet.studyset_id, User.username)
            .order_by(func.count(distinct(StudyActivity.user_id)).desc())
            .limit(limit)
        )
        
        top_learners_data = session.exec(top_by_learners_query).all()
        
        top_by_learners = []
        for row in top_learners_data:
            # Calculate average completion rate
            avg_completion = session.exec(
                select(func.avg(ProgressSummary.completion_rate))
                .where(ProgressSummary.studyset_id == row.studyset_id)
            ).one() or 0
            
            top_by_learners.append(PopularStudySetMetrics(
                studyset_id=row.studyset_id,
                title=row.title,
                owner_username=row.owner_username,
                term_count=row.term_count,
                total_learners=row.learner_count,
                total_activities=row.activity_count,
                average_completion_rate=round(avg_completion, 2) if avg_completion else 0,
                created_at=row.created_at,
            ))
        
        # Top studysets by activities
        top_by_activities_query = (
            select(
                StudySet.studyset_id,
                StudySet.title,
                StudySet.created_at,
                User.username.label('owner_username'),
                func.count(distinct(Term.term_id)).label('term_count'),
                func.count(distinct(StudyActivity.user_id)).label('learner_count'),
                func.count(StudyActivity.activity_id).label('activity_count'),
            )
            .join(User, StudySet.owner_id == User.user_id)
            .outerjoin(StudySetTerm, StudySetTerm.studyset_id == StudySet.studyset_id)
            .outerjoin(Term, Term.term_id == StudySetTerm.term_id)
            .outerjoin(StudyActivity, StudyActivity.studyset_id == StudySet.studyset_id)
            .group_by(StudySet.studyset_id, User.username)
            .order_by(func.count(StudyActivity.activity_id).desc())
            .limit(limit)
        )
        
        top_activities_data = session.exec(top_by_activities_query).all()
        
        top_by_activities = []
        for row in top_activities_data:
            avg_completion = session.exec(
                select(func.avg(ProgressSummary.completion_rate))
                .where(ProgressSummary.studyset_id == row.studyset_id)
            ).one() or 0
            
            top_by_activities.append(PopularStudySetMetrics(
                studyset_id=row.studyset_id,
                title=row.title,
                owner_username=row.owner_username,
                term_count=row.term_count,
                total_learners=row.learner_count,
                total_activities=row.activity_count,
                average_completion_rate=round(avg_completion, 2) if avg_completion else 0,
                created_at=row.created_at,
            ))
        
        # Category distribution
        category_data = session.exec(
            select(
                StudySet.category,
                func.count(StudySet.studyset_id).label('count')
            )
            .where(StudySet.category.isnot(None))
            .group_by(StudySet.category)
            .order_by(func.count(StudySet.studyset_id).desc())
        ).all()
        
        categories = [
            {"category": row.category, "count": row.count}
            for row in category_data
        ]
        
        return ContentStatistics(
            total_studysets=total_studysets,
            total_terms=total_terms,
            average_terms_per_studyset=round(avg_terms, 2),
            studysets_with_ai_content=studysets_with_ai,
            top_studysets_by_learners=top_by_learners,
            top_studysets_by_activities=top_by_activities,
            categories=categories,
        )
    
    @staticmethod
    def get_admin_dashboard(session: Session) -> AdminDashboardStats:
        """Get complete admin dashboard statistics"""
        
        return AdminDashboardStats(
            system_overview=AdminService.get_system_overview(session),
            user_stats=AdminService.get_user_statistics(session),
            learning_stats=AdminService.get_learning_statistics(session),
            class_stats=AdminService.get_class_statistics(session),
            ai_usage_stats=AdminService.get_ai_usage_statistics(session),
            content_stats=AdminService.get_content_statistics(session),
            generated_at=datetime.utcnow(),
        )
