"""
Learning Service - Spaced Repetition Algorithm (SM-2)
Handles learning logic, review scheduling, and progress tracking
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, select, func

from app.models import StudyActivity, Term, ProgressSummary, StudySet, StudySetTerm

logger = logging.getLogger(__name__)


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
        Uses local timezone (UTC+7) for "today" calculation
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
        
        # Get "today" in local timezone (UTC+7) for calculation
        local_tz = timezone(timedelta(hours=7))
        now_utc = datetime.utcnow()
        now_local = now_utc.replace(tzinfo=timezone.utc).astimezone(local_tz)
        
        # Calculate next_review_date based on local "today"
        next_review_local = now_local + timedelta(days=new_interval)
        
        # Convert back to UTC naive datetime for storage
        next_review_date = next_review_local.astimezone(timezone.utc).replace(tzinfo=None)
        
        return new_ef, new_interval, new_repetitions, next_review_date


class LearningService:
    """Service for managing learning sessions and progress"""
    
    @staticmethod
    def get_next_term_to_review(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID
    ) -> Term | None:
        """
        Get the next term that needs review based on spaced repetition
        
        Priority:
        1. Terms that are due for review (next_review_date <= now)
        2. Terms never studied before
        3. Terms with lowest EF (hardest ones)
        """
        # Get all terms in studyset
        # PHASE 3.2: Read from StudySetTerm junction table
        terms_statement = (
            select(Term)
            .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
            .where(StudySetTerm.studyset_id == studyset_id)
        )
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
        
        # Get "today" in local timezone (UTC+7) for comparison
        local_tz = timezone(timedelta(hours=7))
        now_utc = datetime.utcnow()
        now_local = now_utc.replace(tzinfo=timezone.utc).astimezone(local_tz).replace(tzinfo=None)
        
        for term in all_terms:
            activity = term_activity_map.get(term.term_id)
            
            if not activity:
                # Never studied
                new_terms.append(term)
            elif activity.next_review_date:
                # Convert next_review_date (stored as UTC) to local for comparison
                next_review_utc = activity.next_review_date.replace(tzinfo=timezone.utc)
                next_review_local = next_review_utc.astimezone(local_tz).replace(tzinfo=None)
                
                if next_review_local <= now_local:
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
        Get all terms for a learning session
        
        Returns ALL terms in the studyset, ordered by priority:
        1. Due for review (oldest first)
        2. Never studied (new terms)
        3. Already reviewed (lowest EF = hardest first)
        
        This ensures users always see all flashcards in their set,
        regardless of when they were last reviewed.
        """
        # Get all terms in studyset
        # PHASE 3.2: Read from StudySetTerm junction table
        terms_statement = (
            select(Term)
            .join(StudySetTerm, StudySetTerm.term_id == Term.term_id)
            .where(StudySetTerm.studyset_id == studyset_id)
        )
        all_terms = list(session.exec(terms_statement).all())
        
        if not all_terms:
            return []
        
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
        
        # Categorize terms for priority ordering
        due_terms = []
        new_terms = []
        reviewed_terms = []
        
        # Get "today" in local timezone (UTC+7) for comparison
        local_tz = timezone(timedelta(hours=7))
        now_utc = datetime.utcnow()
        now_local = now_utc.replace(tzinfo=timezone.utc).astimezone(local_tz).replace(tzinfo=None)
        
        for term in all_terms:
            activity = term_activity_map.get(term.term_id)
            
            if not activity:
                # Never studied - high priority
                new_terms.append(term)
            elif activity.next_review_date:
                # Convert next_review_date (stored as UTC) to local for comparison
                next_review_utc = activity.next_review_date.replace(tzinfo=timezone.utc)
                next_review_local = next_review_utc.astimezone(local_tz).replace(tzinfo=None)
                
                if next_review_local <= now_local:
                    # Due for review - highest priority
                    due_terms.append((term, activity))
            else:
                # Already reviewed, not due yet - lowest priority
                reviewed_terms.append((term, activity))
        
        # Sort by priority
        due_terms.sort(key=lambda x: x[1].next_review_date)
        reviewed_terms.sort(key=lambda x: x[1].ef)  # Hardest cards first
        
        # Combine all terms in priority order
        session_terms = []
        
        # Priority 1: Due terms
        session_terms.extend([term for term, _ in due_terms])
        
        # Priority 2: New terms
        session_terms.extend(new_terms)
        
        # Priority 3: Reviewed terms
        session_terms.extend([term for term, _ in reviewed_terms])
        
        return session_terms
    
    @staticmethod
    def record_review(
        session: Session,
        user_id: uuid.UUID,
        studyset_id: uuid.UUID,
        term_id: uuid.UUID,
        recall_score: int,
        hint_used: bool = False,
        response_time: float = 0.0
    ) -> StudyActivity:
        """
        Record a study activity and update progress
        
        Args:
            recall_score: 0-5 rating (0=complete blackout, 5=perfect recall)
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
        
        # Get repetitions from previous activity if it was correct
        # This tracks consecutive correct answers for SM-2 algorithm
        if prev_activity and prev_activity.recall_score >= 3:
            repetitions = prev_activity.repetitions
        else:
            repetitions = 0
        
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
            hint_used=hint_used,
            retry_count=0,
            recall_score=recall_score,
            ef=new_ef,
            interval=new_interval,
            repetitions=new_repetitions,
            next_review_date=next_review_date,
            response_time=response_time
        )
        
        session.add(activity)
        session.commit()
        session.refresh(activity)

        # Update progress summary
        LearningService.update_progress_summary(session, user_id, studyset_id)

        # Update StudentStudySet last_studied_at (auto-enrollment if not enrolled)
        from app.crud.student_studyset import update_last_studied
        update_last_studied(
            session=session,
            student_id=user_id,
            studyset_id=studyset_id,
            timestamp=activity.end_time
        )

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
        # PHASE 3.2: Count from StudySetTerm junction table
        total_terms_statement = (
            select(func.count(StudySetTerm.term_id))
            .where(StudySetTerm.studyset_id == studyset_id)
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
                "average_recall_score": 0.0,
                "difficulty_distribution": {
                    "again": 0,
                    "hard": 0,
                    "good": 0,
                    "easy": 0
                }
            }
        
        # Calculate difficulty distribution
        again_count = sum(1 for a in activities if a.recall_score <= 1)
        hard_count = sum(1 for a in activities if a.recall_score == 2)
        good_count = sum(1 for a in activities if 3 <= a.recall_score <= 4)
        easy_count = sum(1 for a in activities if a.recall_score == 5)
        
        avg_recall_score = sum(a.recall_score for a in activities) / len(activities)
        
        return {
            "total_reviewed": len(activities),
            "average_recall_score": avg_recall_score,
            "difficulty_distribution": {
                "again": again_count,
                "hard": hard_count,
                "good": good_count,
                "easy": easy_count
            }
        }    
    @staticmethod
    def get_all_due_cards(
        session: Session,
        user_id: uuid.UUID,
        include_future: bool = False
    ) -> dict[str, Any]:
        """
        Get all due cards across all studysets for a user

        OPTIMIZED: Uses SQL-level filtering and bulk data loading

        Args:
            user_id: User ID
            include_future: If True, include cards due in the next 7 days

        Returns:
            Dictionary with due cards information
        """
        # Get "today" in local timezone (UTC+7) for comparison
        local_tz = timezone(timedelta(hours=7))
        now_utc = datetime.utcnow()
        now_local = now_utc.replace(tzinfo=timezone.utc).astimezone(local_tz).replace(tzinfo=None)

        today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now_local.replace(hour=23, minute=59, second=59, microsecond=999999)
        week_end_local = now_local + timedelta(days=7)
        week_end = week_end_local.astimezone(timezone.utc).replace(tzinfo=None)

        # OPTIMIZATION 1: Use window function to get latest activity per term in ONE query
        latest_activities_subquery = (
            select(
                StudyActivity.user_id,
                StudyActivity.term_id,
                StudyActivity.studyset_id,
                StudyActivity.next_review_date,
                StudyActivity.ef,
                StudyActivity.interval,
                StudyActivity.created_at,
                func.row_number().over(
                    partition_by=StudyActivity.term_id,
                    order_by=StudyActivity.next_review_date.desc(),
                ).label('rn')
            )
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.next_review_date.isnot(None)
            )
            .subquery()
        )

        # Get only the latest activity per term
        activities_statement = (
            select(
                latest_activities_subquery.c.term_id,
                latest_activities_subquery.c.studyset_id,
                latest_activities_subquery.c.next_review_date,
                latest_activities_subquery.c.ef,
                latest_activities_subquery.c.interval,
                latest_activities_subquery.c.created_at
            )
            .where(latest_activities_subquery.c.rn == 1)
        )

        # OPTIMIZATION 2: Apply date filter at SQL level
        if not include_future:
            # Only get cards due today or tomorrow (including overdue cards)
            # Convert tomorrow end (local time) to UTC for comparison
            tomorrow_end_local = today_end + timedelta(days=1)
            tomorrow_end_utc = tomorrow_end_local.replace(tzinfo=local_tz).astimezone(timezone.utc).replace(tzinfo=None)
            activities_statement = activities_statement.where(
                latest_activities_subquery.c.next_review_date <= tomorrow_end_utc
            )
        else:
            # Get cards due in next 7 days
            activities_statement = activities_statement.where(
                latest_activities_subquery.c.next_review_date <= week_end
            )

        latest_activities = session.exec(activities_statement).all()

        if not latest_activities:
            return {
                "total_due": 0,
                "due_today": 0,
                "due_this_week": 0,
                "cards": [],
                "studysets_affected": []
            }

        # OPTIMIZATION 3: Bulk load terms and studysets
        term_ids = [a.term_id for a in latest_activities]
        studyset_ids = list(set(a.studyset_id for a in latest_activities))

        # Load all terms in one query
        terms_statement = select(Term).where(Term.term_id.in_(term_ids))
        terms = session.exec(terms_statement).all()
        terms_map = {t.term_id: t for t in terms}

        # Load all studysets in one query with eager loading of category
        from sqlalchemy.orm import selectinload
        studysets_statement = (
            select(StudySet)
            .where(StudySet.studyset_id.in_(studyset_ids))
            .options(selectinload(StudySet.category))
        )
        studysets = session.exec(studysets_statement).all()
        studysets_map = {s.studyset_id: s for s in studysets}

        # Process activities and build due cards
        due_cards = []
        due_today = 0
        due_this_week = 0
        studysets_affected = set()

        for activity in latest_activities:
            term = terms_map.get(activity.term_id)
            studyset = studysets_map.get(activity.studyset_id)

            if not term or not studyset:
                continue

            # Date comparison (same logic as before)
            next_review_utc = activity.next_review_date.replace(tzinfo=timezone.utc)
            next_review_local = next_review_utc.astimezone(local_tz).replace(tzinfo=None)
            next_review_date_only = next_review_local.date()
            today_date = now_local.date()
            tomorrow_date = today_date + timedelta(days=1)

            is_due_now = next_review_date_only <= today_date or next_review_date_only == tomorrow_date
            is_due_today = next_review_date_only <= tomorrow_date
            is_due_week = activity.next_review_date <= week_end

            studysets_affected.add(activity.studyset_id)

            if is_due_now:
                due_cards.append({
                    "term_id": activity.term_id,
                    "studyset_id": activity.studyset_id,
                    "studyset_name": studyset.title,
                    "category_id": studyset.category_id,
                    "category_name": studyset.category.name if studyset.category else None,
                    "term_text": term.term_text,
                    "definition": term.definition,
                    "example": term.example,
                    "image_url": term.image_url,
                    "next_review_date": activity.next_review_date,
                    "ef": activity.ef,
                    "interval": activity.interval,
                    "last_reviewed": activity.created_at
                })

            if is_due_today:
                due_today += 1
            if is_due_week:
                due_this_week += 1

        # Sort by next_review_date (oldest first)
        due_cards.sort(key=lambda x: x["next_review_date"])

        return {
            "total_due": len(due_cards),
            "due_today": due_today,
            "due_this_week": due_this_week,
            "cards": due_cards,
            "studysets_affected": list(studysets_affected)
        }
    
    @staticmethod
    def create_quick_review_session(
        session: Session,
        user_id: uuid.UUID,
        studyset_ids: list[uuid.UUID] | None = None,
        max_cards: int = 20
    ) -> dict[str, Any]:
        """
        Create a quick review session with due cards
        
        Args:
            user_id: User ID
            studyset_ids: Optional list of studyset IDs to filter. If None, include all.
            max_cards: Maximum number of cards in session
        
        Returns:
            Session information with cards
        """
        # Get all due cards
        due_data = LearningService.get_all_due_cards(
            session=session,
            user_id=user_id,
            include_future=False
        )
        
        cards = due_data["cards"]
        
        # Filter by studyset_ids if provided
        if studyset_ids:
            cards = [c for c in cards if c["studyset_id"] in studyset_ids]
        
        # Limit to max_cards
        cards = cards[:max_cards]
        
        # Convert to NextTermResponse format
        cards_response = []
        studysets_included = set()
        
        for card in cards:
            studysets_included.add(card["studyset_id"])
            
            # Get previous activity to determine if term is new
            prev_activity_statement = (
                select(StudyActivity)
                .where(
                    StudyActivity.user_id == user_id,
                    StudyActivity.term_id == card["term_id"]
                )
                .order_by(StudyActivity.created_at.desc())
            )
            prev_activity = session.exec(prev_activity_statement).first()
            
            cards_response.append({
                "term_id": card["term_id"],
                "term_text": card["term_text"],
                "definition": card["definition"],
                "example": card["example"],
                "image_url": card["image_url"],
                "category": None,
                "is_new": False,  # Due cards are never new
                "previous_recall_score": prev_activity.recall_score if prev_activity else None,
                "next_review_date": card["next_review_date"],
                "studyset_id": str(card["studyset_id"]),  # Include studyset_id for review submission
            })
        
        return {
            "session_id": str(uuid.uuid4()),
            "total_cards": len(cards_response),
            "cards": cards_response,
            "studysets_included": list(studysets_included),
            "started_at": datetime.utcnow()
        }