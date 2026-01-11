"""
Check due cards dates to debug why cards still showing
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models import StudyActivity, Term, StudySet
from datetime import datetime
import uuid

def main():
    user_id = uuid.UUID("cc881455-3c42-4987-b708-743cc07f0076")
    
    with Session(engine) as session:
        now = datetime.utcnow()
        print(f"Current time (UTC): {now}")
        print(f"{'='*80}\n")
        
        # Get all activities with next_review_date
        activities = session.exec(
            select(StudyActivity)
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.next_review_date.isnot(None)
            )
        ).all()
        
        # Group by term_id and get latest
        term_latest = {}
        for activity in activities:
            if activity.term_id not in term_latest:
                term_latest[activity.term_id] = activity
            else:
                if activity.created_at > term_latest[activity.term_id].created_at:
                    term_latest[activity.term_id] = activity
        
        print(f"Total unique terms with next_review_date: {len(term_latest)}\n")
        
        # Check ALL activities per term to debug
        term_all_activities = {}
        for activity in activities:
            if activity.term_id not in term_all_activities:
                term_all_activities[activity.term_id] = []
            term_all_activities[activity.term_id].append(activity)
        
        # Check due cards
        due_count = 0
        for term_id, activity in term_latest.items():
            is_due = activity.next_review_date <= now
            
            if is_due:
                term = session.get(Term, term_id)
                studyset = session.get(StudySet, activity.studyset_id)
                
                # Get all activities for this term
                all_acts = sorted(term_all_activities[term_id], key=lambda x: x.created_at, reverse=True)
                
                print(f"✓ DUE CARD:")
                print(f"  Term: {term.term_text if term else 'Unknown'}")
                print(f"  StudySet: {studyset.title if studyset else 'Unknown'}")
                print(f"  Activity being used (latest by created_at):")
                print(f"    - Created at: {activity.created_at}")
                print(f"    - Activity ID: {activity.activity_id}")
                print(f"    - Next review date: {activity.next_review_date}")
                print(f"    - Recall score: {activity.recall_score}")
                print(f"    - Interval: {activity.interval} days")
                print(f"  All activities for this term ({len(all_acts)} total):")
                for idx, act in enumerate(all_acts[:3], 1):
                    print(f"    {idx}. Created: {act.created_at}, Next review: {act.next_review_date}, Score: {act.recall_score}")
                print(f"  Hours overdue: {(now - activity.next_review_date).total_seconds() / 3600:.1f}")
                print()
                
                due_count += 1
        
        print(f"{'='*80}")
        print(f"Total due cards: {due_count}")
        print(f"{'='*80}")

if __name__ == "__main__":
    main()
