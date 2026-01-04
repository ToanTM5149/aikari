"""
Analytics Service - Class performance and student progress tracking
"""
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlmodel import Session, select, func, and_, or_

from app.models import (
    Class, 
    ClassMember, 
    StudySet, 
    Term,
    StudyActivity, 
    ProgressSummary,
    User,
    ClassStudySet
)
from app.models.enums import MembershipStatus
from app.schemas.class_ import (
    StudentProgressDetail,
    ClassAnalyticsOverview,
    StudySetAnalytics,
    LeaderboardEntry,
)


class AnalyticsService:
    """Service for class analytics and reporting"""
    
    @staticmethod
    def get_student_progress_detail(
        session: Session,
        class_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> StudentProgressDetail | None:
        """Get detailed progress for a single student in a class"""
        
        # Get user info
        user = session.get(User, user_id)
        if not user:
            return None
        
        # Get all studysets in the class
        class_studysets_statement = (
            select(ClassStudySet)
            .where(ClassStudySet.class_id == class_id)
        )
        class_studysets = session.exec(class_studysets_statement).all()
        studyset_ids = [cs.studyset_id for cs in class_studysets]
        
        # Get progress summaries for this user across class studysets
        progress_statement = (
            select(ProgressSummary)
            .where(
                and_(
                    ProgressSummary.user_id == user_id,
                    ProgressSummary.studyset_id.in_(studyset_ids)
                )
            )
        )
        progress_summaries = session.exec(progress_statement).all()
        
        # Get study activities for calculations
        activities_statement = (
            select(StudyActivity)
            .where(
                and_(
                    StudyActivity.user_id == user_id,
                    StudyActivity.studyset_id.in_(studyset_ids)
                )
            )
        )
        activities = session.exec(activities_statement).all()
        
        # Calculate metrics
        total_studysets = len(studyset_ids)
        completed_studysets = sum(1 for p in progress_summaries if p.completion_rate >= 80.0)
        total_terms_studied = sum(
            p.mastered_terms + p.reviewing_terms + p.forgotten_terms 
            for p in progress_summaries
        )
        
        # Calculate average accuracy from activities
        if activities:
            total_correct = sum(1 for a in activities if a.is_correct)
            total_incorrect = sum(1 for a in activities if not a.is_correct)
            total_reviews = total_correct + total_incorrect
            average_accuracy = (total_correct / total_reviews * 100) if total_reviews > 0 else 0.0
        else:
            average_accuracy = 0.0
        
        total_study_time = sum(
            int(a.response_time) if a.response_time else 0 
            for a in activities
        )
        
        # Last activity
        last_activity = max(
            (a.created_at for a in activities),
            default=None
        )
        
        # Calculate mastery percentage (using completion_rate)
        if progress_summaries:
            mastery_percentage = sum(p.completion_rate for p in progress_summaries) / len(progress_summaries)
        else:
            mastery_percentage = 0.0
        
        # Count weak terms (terms with low recall score)
        weak_terms_count = sum(
            len([a for a in activities if a.term_id in [t.term_id for t in session.exec(
                select(Term).where(Term.studyset_id == p.studyset_id)
            ).all()] and a.recall_score < 3])
            for p in progress_summaries
        )
        
        return StudentProgressDetail(
            user_id=user_id,
            username=user.username,
            email=user.email,
            total_studysets=total_studysets,
            completed_studysets=completed_studysets,
            total_terms_studied=total_terms_studied,
            average_accuracy=round(average_accuracy, 2),
            total_study_time=total_study_time,
            last_activity=last_activity,
            mastery_percentage=round(mastery_percentage, 2),
            weak_terms_count=weak_terms_count
        )
    
    @staticmethod
    def get_class_overview(
        session: Session,
        class_id: uuid.UUID
    ) -> ClassAnalyticsOverview | None:
        """Get overview analytics for a class"""
        
        # Get class info
        class_obj = session.get(Class, class_id)
        if not class_obj:
            return None
        
        # Get all approved members
        members_statement = (
            select(ClassMember)
            .where(
                and_(
                    ClassMember.class_id == class_id,
                    ClassMember.status == MembershipStatus.ACTIVE
                )
            )
        )
        members = session.exec(members_statement).all()
        total_members = len(members)
        
        # Get active members (studied in last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        active_member_ids = set()
        
        for member in members:
            recent_activity = session.exec(
                select(StudyActivity)
                .where(
                    and_(
                        StudyActivity.user_id == member.user_id,
                        StudyActivity.created_at >= seven_days_ago
                    )
                )
                .limit(1)
            ).first()
            if recent_activity:
                active_member_ids.add(member.user_id)
        
        active_members = len(active_member_ids)
        
        # Get class studysets
        class_studysets_statement = (
            select(ClassStudySet)
            .where(ClassStudySet.class_id == class_id)
        )
        class_studysets = session.exec(class_studysets_statement).all()
        studyset_ids = [cs.studyset_id for cs in class_studysets]
        total_studysets = len(studyset_ids)
        
        # Count total terms
        total_terms = 0
        for studyset_id in studyset_ids:
            terms_count = session.exec(
                select(func.count(Term.term_id))
                .where(Term.studyset_id == studyset_id)
            ).one()
            total_terms += terms_count
        
        # Calculate average completion rate and accuracy
        all_progress = []
        for member in members:
            progress_statement = (
                select(ProgressSummary)
                .where(
                    and_(
                        ProgressSummary.user_id == member.user_id,
                        ProgressSummary.studyset_id.in_(studyset_ids)
                    )
                )
            )
            member_progress = session.exec(progress_statement).all()
            all_progress.extend(member_progress)
        
        # Get all activities for accuracy calculation
        all_activities = session.exec(
            select(StudyActivity)
            .where(StudyActivity.studyset_id.in_(studyset_ids))
        ).all()
        
        if all_progress:
            average_completion_rate = sum(p.completion_rate for p in all_progress) / len(all_progress)
            
            # Calculate accuracy from activities
            total_correct = sum(1 for a in all_activities if a.is_correct)
            total_incorrect = sum(1 for a in all_activities if not a.is_correct)
            total_reviews = total_correct + total_incorrect
            average_accuracy = (total_correct / total_reviews * 100) if total_reviews > 0 else 0.0
        else:
            average_completion_rate = 0.0
            average_accuracy = 0.0
        
        # Count study sessions (unique combinations of user_id, studyset_id, and date)
        # Since session_id is not stored in DB, we count unique (user_id, studyset_id, date) combinations
        # Reuse all_activities that was already fetched above
        unique_sessions = set()
        for activity in all_activities:
            session_key = (
                activity.user_id,
                activity.studyset_id,
                activity.created_at.date() if activity.created_at else activity.start_time.date()
            )
            unique_sessions.add(session_key)
        
        total_study_sessions = len(unique_sessions)
        
        # Calculate total study time (reuse all_activities from above)
        total_study_time = sum(
            int(a.response_time) if a.response_time else 0 
            for a in all_activities
        )
        
        # Find most and least active students
        student_activities = {}
        for member in members:
            student_progress = AnalyticsService.get_student_progress_detail(
                session, class_id, member.user_id
            )
            if student_progress:
                student_activities[member.user_id] = student_progress
        
        most_active = None
        least_active = None
        
        if student_activities:
            # Most active by total study time
            most_active = max(
                student_activities.values(),
                key=lambda x: x.total_study_time,
                default=None
            )
            
            # Least active (but with some activity)
            active_students = [s for s in student_activities.values() if s.total_study_time > 0]
            if active_students:
                least_active = min(
                    active_students,
                    key=lambda x: x.total_study_time
                )
        
        return ClassAnalyticsOverview(
            class_id=class_id,
            class_name=class_obj.class_name,
            total_members=total_members,
            active_members=active_members,
            total_studysets=total_studysets,
            total_terms=total_terms,
            average_completion_rate=round(average_completion_rate, 2),
            average_accuracy=round(average_accuracy, 2),
            total_study_sessions=total_study_sessions,
            total_study_time=total_study_time,
            most_active_student=most_active,
            least_active_student=least_active
        )
    
    @staticmethod
    def get_studyset_analytics(
        session: Session,
        class_id: uuid.UUID,
        studyset_id: uuid.UUID
    ) -> StudySetAnalytics | None:
        """Get analytics for a specific studyset in a class"""
        
        # Verify studyset is in class
        class_studyset = session.exec(
            select(ClassStudySet)
            .where(
                and_(
                    ClassStudySet.class_id == class_id,
                    ClassStudySet.studyset_id == studyset_id
                )
            )
        ).first()
        
        if not class_studyset:
            return None
        
        # Get studyset info
        studyset = session.get(StudySet, studyset_id)
        if not studyset:
            return None
        
        # Count terms
        total_terms = session.exec(
            select(func.count(Term.term_id))
            .where(Term.studyset_id == studyset_id)
        ).one()
        
        # Get class members
        members = session.exec(
            select(ClassMember)
            .where(
                and_(
                    ClassMember.class_id == class_id,
                    ClassMember.status == MembershipStatus.ACTIVE
                )
            )
        ).all()
        
        # Calculate student progress
        students_started = 0
        students_completed = 0
        progress_percentages = []
        accuracy_values = []
        completion_times = []
        
        for member in members:
            progress = session.exec(
                select(ProgressSummary)
                .where(
                    and_(
                        ProgressSummary.user_id == member.user_id,
                        ProgressSummary.studyset_id == studyset_id
                    )
                )
            ).first()
            
            total_terms = progress.mastered_terms + progress.reviewing_terms + progress.forgotten_terms
            if progress and total_terms > 0:
                students_started += 1
                progress_percentages.append(progress.completion_rate)
                
                if progress.completion_rate >= 80.0:
                    students_completed += 1
                
                # Calculate accuracy from activities
                member_activities = session.exec(
                    select(StudyActivity)
                    .where(
                        and_(
                            StudyActivity.user_id == member.user_id,
                            StudyActivity.studyset_id == studyset_id
                        )
                    )
                ).all()
                
                if member_activities:
                    correct = sum(1 for a in member_activities if a.is_correct)
                    total = len(member_activities)
                    if total > 0:
                        accuracy = (correct / total) * 100
                        accuracy_values.append(accuracy)
                
                # Get study time
                activities = session.exec(
                    select(StudyActivity)
                    .where(
                        and_(
                            StudyActivity.user_id == member.user_id,
                            StudyActivity.studyset_id == studyset_id
                        )
                    )
                ).all()
                
                if activities:
                    study_time = sum(int(a.response_time) if a.response_time else 0 for a in activities)
                    completion_times.append(study_time)
        
        average_progress = sum(progress_percentages) / len(progress_percentages) if progress_percentages else 0.0
        average_accuracy = sum(accuracy_values) / len(accuracy_values) if accuracy_values else 0.0
        average_completion_time = sum(completion_times) // len(completion_times) if completion_times else None
        
        # Find most difficult terms (highest error rate)
        terms = session.exec(
            select(Term)
            .where(Term.studyset_id == studyset_id)
        ).all()
        
        term_difficulties = []
        for term in terms:
            activities = session.exec(
                select(StudyActivity)
                .where(StudyActivity.term_id == term.term_id)
            ).all()
            
            if activities:
                incorrect = sum(1 for a in activities if not a.is_correct)
                total = len(activities)
                error_rate = (incorrect / total) * 100
                
                term_difficulties.append({
                    "term_id": str(term.term_id),
                    "term_text": term.term_text,
                    "error_rate": round(error_rate, 2)
                })
        
        # Sort by error rate and get top 5
        most_difficult_terms = sorted(
            term_difficulties,
            key=lambda x: x["error_rate"],
            reverse=True
        )[:5]
        
        return StudySetAnalytics(
            studyset_id=studyset_id,
            studyset_name=studyset.studyset_name,
            total_terms=total_terms,
            students_started=students_started,
            students_completed=students_completed,
            average_progress=round(average_progress, 2),
            average_accuracy=round(average_accuracy, 2),
            average_completion_time=average_completion_time,
            most_difficult_terms=most_difficult_terms
        )
    
    @staticmethod
    def get_class_leaderboard(
        session: Session,
        class_id: uuid.UUID,
        sort_by: str = "mastery"  # mastery, accuracy, streak, time
    ) -> list[LeaderboardEntry]:
        """Get leaderboard for a class"""
        
        # Get all approved members
        members = session.exec(
            select(ClassMember)
            .where(
                and_(
                    ClassMember.class_id == class_id,
                    ClassMember.status == MembershipStatus.ACTIVE
                )
            )
        ).all()
        
        # Get class studysets
        class_studysets = session.exec(
            select(ClassStudySet)
            .where(ClassStudySet.class_id == class_id)
        ).all()
        studyset_ids = [cs.studyset_id for cs in class_studysets]
        
        # Build leaderboard entries
        entries = []
        
        for member in members:
            user = session.get(User, member.user_id)
            if not user:
                continue
            
            # Get progress summaries
            progress_summaries = session.exec(
                select(ProgressSummary)
                .where(
                    and_(
                        ProgressSummary.user_id == member.user_id,
                        ProgressSummary.studyset_id.in_(studyset_ids)
                    )
                )
            ).all()
            
            # Calculate metrics
            total_terms_mastered = sum(
                (p.mastered_terms + p.reviewing_terms + p.forgotten_terms) 
                for p in progress_summaries 
                if p.completion_rate >= 80.0
            )
            
            # Get study activities first
            activities = session.exec(
                select(StudyActivity)
                .where(
                    and_(
                        StudyActivity.user_id == member.user_id,
                        StudyActivity.studyset_id.in_(studyset_ids)
                    )
                )
                .order_by(StudyActivity.created_at.desc())
            ).all()
            
            # Calculate accuracy from activities
            total_correct = sum(1 for a in activities if a.is_correct)
            total_incorrect = sum(1 for a in activities if not a.is_correct)
            total_reviews = total_correct + total_incorrect
            accuracy = (total_correct / total_reviews * 100) if total_reviews > 0 else 0.0
            
            total_study_time = sum(
                int(a.response_time) if a.response_time else 0 
                for a in activities
            )
            
            last_study_date = activities[0].created_at if activities else None
            
            # Calculate streak (simplified - consecutive days with activity)
            study_streak_days = 0
            if activities:
                current_date = datetime.utcnow().date()
                dates_with_activity = sorted(
                    set(a.created_at.date() for a in activities),
                    reverse=True
                )
                
                for i, date in enumerate(dates_with_activity):
                    expected_date = current_date - timedelta(days=i)
                    if date == expected_date:
                        study_streak_days += 1
                    else:
                        break
            
            entries.append(
                LeaderboardEntry(
                    rank=0,  # Will be set after sorting
                    user_id=member.user_id,
                    username=user.username,
                    email=user.email,
                    total_terms_mastered=total_terms_mastered,
                    accuracy=round(accuracy, 2),
                    study_streak_days=study_streak_days,
                    total_study_time=total_study_time,
                    last_study_date=last_study_date
                )
            )
        
        # Sort entries based on sort_by parameter
        if sort_by == "accuracy":
            entries.sort(key=lambda x: x.accuracy, reverse=True)
        elif sort_by == "streak":
            entries.sort(key=lambda x: x.study_streak_days, reverse=True)
        elif sort_by == "time":
            entries.sort(key=lambda x: x.total_study_time, reverse=True)
        else:  # mastery (default)
            entries.sort(key=lambda x: x.total_terms_mastered, reverse=True)
        
        # Assign ranks
        for i, entry in enumerate(entries, start=1):
            entry.rank = i
        
        return entries
