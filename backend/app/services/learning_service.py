"""
Learning Service - Spaced Repetition Algorithm (SM-2)
Handles learning logic, review scheduling, and progress tracking
"""
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlmodel import Session, select, func

from app.models import StudyActivity, Term, ProgressSummary, StudySet


class SpacedRepetitionSM2:
    """
    Implementation of SM-2 (SuperMemo 2) Algorithm
    
    Variables:
    - EF (Easiness Factor): starts at 2.5, min 1.3
    - recall_score (q): 0-5 rating of recall quality
    - interval: days until next review
    - repetitions: number of consecutive correct recalls
    
    Formula:
    - If q >= 3: interval increases (spaced repetition)
    - If q < 3: restart (interval = 1)
    - EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    """
    
    MIN_EF = 1.3
    INITIAL_EF = 2.5
    
    @staticmethod
    def calculate_next_review(
        recall_score: int,
        current_ef: float,
        current_interval: int,
        repetitions: int = 0
    ) -> tuple[float, int, int, datetime]:
        """
        Calculate next review date based on SM-2 algorithm
        Returns:
            tuple: (new_ef, new_interval, new_repetitions, next_review_date)
        """
        new_ef = current_ef + (0.1 - (5 - recall_score) * (0.08 + (5 - recall_score) * 0.02))
        new_ef = max(new_ef, SpacedRepetitionSM2.MIN_EF)

        if recall_score < 3:
            new_interval = 1
            new_repetitions = 0
        else:
            new_repetitions = repetitions + 1
            
            if new_repetitions == 1:
                new_interval = 1
            elif new_repetitions == 2:
                new_interval = 6
            else:
                new_interval = int(current_interval * new_ef)
        
        next_review_date = datetime.utcnow() + timedelta(days=new_interval)
        
        return new_ef, new_interval, new_repetitions, next_review_date


class LearningService:
    """Service for managing learning sessions and progress"""
    
    @staticmethod
    def get_next_term_to_review(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID,
        exclude_recent_minutes: int = 5
    ) -> Term | None:
        """
        Get the next term that needs review based on spaced repetition
        
        Priority:
        1. Terms that are due for review (next_review_date <= now)
        2. Terms never studied before
        3. Terms with lowest EF (hardest ones)
        
        Args:
            exclude_recent_minutes: Exclude terms reviewed in the last N minutes
                                   to avoid showing the same term multiple times in one session
        """
        # Get all terms in studyset
        terms_statement = select(Term).where(Term.studyset_id == studyset_id)
        all_terms = session.exec(terms_statement).all()
        
        if not all_terms:
            return None
        
        # Get user's study activities for this studyset
        activities_statement = (
            select(StudyActivity)
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.studyset_id == studyset_id
            )
        )
        activities = session.exec(activities_statement).all()
        
        # Create map of term_id -> latest activity
        term_activity_map: dict[uuid.UUID, StudyActivity] = {}
        for activity in activities:
            if activity.term_id not in term_activity_map:
                term_activity_map[activity.term_id] = activity
            else:
                # Keep the most recent activity
                if activity.created_at > term_activity_map[activity.term_id].created_at:
                    term_activity_map[activity.term_id] = activity
        
        # Categorize terms
        due_terms = []
        new_terms = []
        reviewed_terms = []
        
        now = datetime.utcnow()
        recent_threshold = now - timedelta(minutes=exclude_recent_minutes)
        
        for term in all_terms:
            activity = term_activity_map.get(term.term_id)
            
            if not activity:
                # Never studied
                new_terms.append(term)
            elif activity.created_at > recent_threshold:
                # Recently reviewed in this session - skip
                continue
            elif activity.next_review_date and activity.next_review_date <= now:
                # Due for review
                due_terms.append((term, activity))
            else:
                # Already reviewed, not due yet
                reviewed_terms.append((term, activity))
        
        # Priority 1: Due terms (oldest first)
        if due_terms:
            due_terms.sort(key=lambda x: x[1].next_review_date)
            return due_terms[0][0]
        
        # Priority 2: New terms
        if new_terms:
            return new_terms[0]
        
        # Priority 3: Reviewed terms with lowest EF (hardest)
        if reviewed_terms:
            reviewed_terms.sort(key=lambda x: x[1].ef)
            return reviewed_terms[0][0]
        
        return None
    
    @staticmethod
    def get_terms_for_session(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID,
        limit: int = 20
    ) -> list[Term]:
        """
        Get a list of terms for a learning session
        
        Returns up to 'limit' terms prioritized by review schedule
        """
        # Get all terms in studyset
        terms_statement = select(Term).where(Term.studyset_id == studyset_id)
        all_terms = list(session.exec(terms_statement).all())
        
        if not all_terms:
            return []
        
        # Limit session size to available terms
        actual_limit = min(limit, len(all_terms))
        
        # Get user's study activities for this studyset
        activities_statement = (
            select(StudyActivity)
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.studyset_id == studyset_id
            )
        )
        activities = session.exec(activities_statement).all()
        
        # Create map of term_id -> latest activity
        term_activity_map: dict[uuid.UUID, StudyActivity] = {}
        for activity in activities:
            if activity.term_id not in term_activity_map:
                term_activity_map[activity.term_id] = activity
            else:
                # Keep the most recent activity
                if activity.created_at > term_activity_map[activity.term_id].created_at:
                    term_activity_map[activity.term_id] = activity
        
        # Categorize terms
        due_terms = []
        new_terms = []
        reviewed_terms = []
        
        now = datetime.utcnow()
        recent_threshold = now - timedelta(minutes=5)
        
        for term in all_terms:
            activity = term_activity_map.get(term.term_id)
            
            if not activity:
                # Never studied
                new_terms.append(term)
            elif activity.created_at > recent_threshold:
                # Recently reviewed in this session - skip
                continue
            elif activity.next_review_date and activity.next_review_date <= now:
                # Due for review
                due_terms.append((term, activity))
            else:
                # Already reviewed, not due yet
                reviewed_terms.append((term, activity))
        
        # Sort by priority
        # Due terms: oldest first
        due_terms.sort(key=lambda x: x[1].next_review_date)
        
        # Reviewed terms: lowest EF first (hardest)
        reviewed_terms.sort(key=lambda x: x[1].ef)
        
        # Collect terms for session
        session_terms = []
        
        # If limit is greater than or equal to total terms, include all terms
        # This allows users to study all terms from the beginning in a new session
        include_all = actual_limit >= len(all_terms)
        
        # Add due terms first (highest priority for spaced repetition)
        for term, _ in due_terms:
            if not include_all and len(session_terms) >= actual_limit:
                break
            session_terms.append(term)
        
        # Add new terms (second priority)
        for term in new_terms:
            if not include_all and len(session_terms) >= actual_limit:
                break
            session_terms.append(term)
        
        # Add reviewed terms if still need more (lowest priority, but still included)
        for term, _ in reviewed_terms:
            if not include_all and len(session_terms) >= actual_limit:
                break
            session_terms.append(term)
        
        # If no terms found (all are reviewed and not due), return all terms anyway
        # This allows users to study again even if spaced repetition says they don't need to
        if not session_terms:
            # Return all terms, excluding recently reviewed ones
            for term in all_terms:
                activity = term_activity_map.get(term.term_id)
                if not activity or activity.created_at <= recent_threshold:
                    if not include_all and len(session_terms) >= actual_limit:
                        break
                    session_terms.append(term)
        
        return session_terms
    
    @staticmethod
    def record_review(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID,
        term_id: uuid.UUID,
        recall_score: int,
        is_correct: bool,
        hint_used: bool = False,
        response_time: float = 0.0
    ) -> StudyActivity:
        """
        Record a study activity and update progress
        
        Args:
            recall_score: 0-5 rating (0=complete blackout, 5=perfect recall)
            is_correct: Whether answer was correct
            hint_used: Whether user used a hint
            response_time: Response time in seconds
        """
        # Get previous activity for this term
        prev_activity_statement = (
            select(StudyActivity)
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.term_id == term_id
            )
            .order_by(StudyActivity.created_at.desc())
        )
        prev_activity = session.exec(prev_activity_statement).first()
        
        # Get current values or defaults
        current_ef = prev_activity.ef if prev_activity else SpacedRepetitionSM2.INITIAL_EF
        current_interval = prev_activity.interval if prev_activity else 0
        repetitions = 0
        
        if prev_activity and prev_activity.is_correct:
            # Count consecutive correct answers
            repetitions = 1
            # Could track this better with a counter field
        
        # Calculate next review using SM-2
        new_ef, new_interval, new_repetitions, next_review_date = (
            SpacedRepetitionSM2.calculate_next_review(
                recall_score=recall_score,
                current_ef=current_ef,
                current_interval=current_interval,
                repetitions=repetitions
            )
        )
        
        # Create new activity
        activity = StudyActivity(
            user_id=user_id,
            studyset_id=studyset_id,
            term_id=term_id,
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow(),
            is_correct=is_correct,
            hint_used=hint_used,
            retry_count=0,
            recall_score=recall_score,
            ef=new_ef,
            interval=new_interval,
            next_review_date=next_review_date,
            response_time=response_time
        )
        
        session.add(activity)
        session.commit()
        session.refresh(activity)
        
        # Update progress summary
        LearningService.update_progress_summary(session, user_id, studyset_id)
        
        return activity
    
    @staticmethod
    def update_progress_summary(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID
    ) -> ProgressSummary:
        """
        Update or create progress summary for a user and studyset
        """
        # Get or create progress summary
        progress_statement = (
            select(ProgressSummary)
            .where(
                ProgressSummary.user_id == user_id,
                ProgressSummary.studyset_id == studyset_id
            )
        )
        progress = session.exec(progress_statement).first()
        
        if not progress:
            progress = ProgressSummary(
                user_id=user_id,
                studyset_id=studyset_id
            )
            session.add(progress)
        
        # Get all activities for this studyset
        activities_statement = (
            select(StudyActivity)
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.studyset_id == studyset_id
            )
        )
        activities = list(session.exec(activities_statement).all())
        
        if not activities:
            session.commit()
            session.refresh(progress)
            return progress
        
        # Calculate statistics
        total_terms_statement = (
            select(func.count(Term.term_id))
            .where(Term.studyset_id == studyset_id)
        )
        total_terms = session.exec(total_terms_statement).one()
        
        # Get latest activity per term
        term_latest_activity: dict[uuid.UUID, StudyActivity] = {}
        for activity in activities:
            if activity.term_id not in term_latest_activity:
                term_latest_activity[activity.term_id] = activity
            else:
                if activity.created_at > term_latest_activity[activity.term_id].created_at:
                    term_latest_activity[activity.term_id] = activity
        
        # Categorize terms
        mastered = 0  # EF > 2.5 and interval > 21 days
        reviewing = 0  # Studied but not mastered
        forgotten = 0  # Recent recall_score < 3
        
        for activity in term_latest_activity.values():
            if activity.ef > 2.5 and activity.interval > 21:
                mastered += 1
            elif activity.recall_score < 3:
                forgotten += 1
            else:
                reviewing += 1
        
        # Calculate averages
        total_activities = len(activities)
        avg_recall_score = sum(a.recall_score for a in activities) / total_activities if total_activities > 0 else 0.0
        
        activities_with_time = [a for a in activities if a.response_time and a.response_time > 0]
        avg_response_time = (
            sum(a.response_time for a in activities_with_time) / len(activities_with_time)
            if activities_with_time else 0.0
        )
        
        # Update progress
        progress.mastered_terms = mastered
        progress.reviewing_terms = reviewing
        progress.forgotten_terms = forgotten
        progress.average_recall_score = avg_recall_score
        progress.average_response_time = avg_response_time
        progress.completion_rate = (len(term_latest_activity) / total_terms * 100) if total_terms > 0 else 0
        progress.updated_at = datetime.utcnow()
        
        # Calculate next due date
        next_due_activities = [
            a for a in term_latest_activity.values()
            if a.next_review_date and a.next_review_date > datetime.utcnow()
        ]
        if next_due_activities:
            next_due_activities.sort(key=lambda x: x.next_review_date)
            progress.next_due_date = next_due_activities[0].next_review_date
        
        session.add(progress)
        session.commit()
        session.refresh(progress)
        
        return progress
    
    @staticmethod
    def get_session_summary(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID,
        since: datetime | None = None
    ) -> dict[str, Any]:
        """
        Get summary statistics for a learning session
        """
        if not since:
            since = datetime.utcnow() - timedelta(hours=1)
        else:
            # Normalize to UTC naive datetime if timezone-aware
            if since.tzinfo is not None:
                since = since.replace(tzinfo=None)
        
        activities_statement = (
            select(StudyActivity)
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.studyset_id == studyset_id,
                StudyActivity.created_at >= since
            )
        )
        activities = list(session.exec(activities_statement).all())
        
        if not activities:
            return {
                "total_reviewed": 0,
                "correct": 0,
                "incorrect": 0,
                "accuracy": 0.0,
                "average_recall_score": 0.0
            }
        
        correct = sum(1 for a in activities if a.is_correct)
        incorrect = len(activities) - correct
        accuracy = (correct / len(activities)) * 100
        avg_recall_score = sum(a.recall_score for a in activities) / len(activities)
        
        return {
            "total_reviewed": len(activities),
            "correct": correct,
            "incorrect": incorrect,
            "accuracy": accuracy,
            "average_recall_score": avg_recall_score
        }
