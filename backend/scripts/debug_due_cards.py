"""
Debug due cards issue
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models import StudyActivity
from datetime import datetime
import uuid

def main():
    user_id = uuid.UUID("cc881455-3c42-4987-b708-743cc07f0076")
    
    with Session(engine) as session:
        # Get all activities with next_review_date
        activities = session.exec(
            select(StudyActivity)
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.next_review_date.isnot(None)
            )
        ).all()
        
        print(f"Total activities with next_review_date: {len(activities)}\n")
        
        now = datetime.utcnow()
        print(f"Current time (UTC): {now}\n")
        
        # Group by term_id
        term_activities = {}
        for activity in activities:
            if activity.term_id not in term_activities:
                term_activities[activity.term_id] = []
            term_activities[activity.term_id].append(activity)
        
        print(f"Unique terms: {len(term_activities)}\n")
        
        # Check each term
        due_count = 0
        for term_id, acts in term_activities.items():
            # Sort by created_at desc
            acts_sorted = sorted(acts, key=lambda x: x.created_at, reverse=True)
            latest = acts_sorted[0]
            
            is_due = latest.next_review_date <= now if latest.next_review_date else False
            
            print(f"Term: {term_id}")
            print(f"  Total activities: {len(acts)}")
            print(f"  Latest created_at: {latest.created_at}")
            print(f"  Latest next_review_date: {latest.next_review_date}")
            print(f"  Is due: {is_due}")
            
            if is_due:
                due_count += 1
                print(f"  ✓ DUE!")
            print()
        
        print(f"\n{'='*60}")
        print(f"SUMMARY: {due_count} terms are due for review")
        print(f"{'='*60}")

if __name__ == "__main__":
    main()
