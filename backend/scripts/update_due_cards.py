"""
Update StudyActivity to create due cards for testing
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models import StudyActivity, User, Term, StudySet
from datetime import datetime, timedelta
import uuid

def main():
    user_id_str = "cc881455-3c42-4987-b708-743cc07f0076"
    user_id = uuid.UUID(user_id_str)
    
    with Session(engine) as session:
        # Check user exists
        user = session.get(User, user_id)
        if not user:
            print(f"❌ User {user_id_str} not found!")
            return
        
        print(f"✓ Found user: {user.email} ({user.full_name})")
        
        # Get all StudyActivity for this user
        activities = session.exec(
            select(StudyActivity)
            .where(StudyActivity.user_id == user_id)
        ).all()
        
        print(f"\n📊 Found {len(activities)} study activities for this user")
        
        if len(activities) == 0:
            # No activities, create some from existing studysets
            print("\n⚠️  No activities found. Creating sample activities...")
            
            # Get first studyset
            studysets = session.exec(select(StudySet).limit(1)).all()
            if not studysets:
                print("❌ No studysets found in database!")
                return
            
            studyset = studysets[0]
            
            # Get terms from this studyset
            terms = session.exec(
                select(Term)
                .where(Term.studyset_id == studyset.studyset_id)
                .limit(5)
            ).all()
            
            if not terms:
                print("❌ No terms found in studyset!")
                return
            
            # Create activities for these terms
            now = datetime.utcnow()
            for i, term in enumerate(terms):
                activity = StudyActivity(
                    activity_id=uuid.uuid4(),
                    user_id=user_id,
                    studyset_id=studyset.studyset_id,
                    term_id=term.term_id,
                    start_time=now - timedelta(hours=i+1),
                    end_time=now - timedelta(hours=i+1),
                    recall_score=3,
                    ef=2.5,
                    interval=1,
                    repetitions=1,
                    next_review_date=now - timedelta(hours=i),  # Due now
                    response_time=5.0,
                    created_at=now - timedelta(hours=i+1),
                    updated_at=now - timedelta(hours=i+1)
                )
                session.add(activity)
            
            session.commit()
            print(f"✓ Created {len(terms)} sample activities")
            activities = terms  # Just for count
        
        else:
            # Update latest activity per term to be due now
            now = datetime.utcnow()
            
            # Group by term_id and get latest
            term_latest = {}
            for activity in activities:
                if activity.term_id not in term_latest:
                    term_latest[activity.term_id] = activity
                elif activity.created_at > term_latest[activity.term_id].created_at:
                    term_latest[activity.term_id] = activity
            
            # Update latest activities to be due
            update_count = 0
            for i, activity in enumerate(list(term_latest.values())[:10]):
                # Set next_review_date to past (due now)
                activity.next_review_date = now - timedelta(hours=i+1)
                activity.updated_at = now
                session.add(activity)
                update_count += 1
            
            session.commit()
            print(f"✓ Updated {update_count} latest activities (per term) to be due now")
        
        # Verify
        due_activities = session.exec(
            select(StudyActivity)
            .where(
                StudyActivity.user_id == user_id,
                StudyActivity.next_review_date.isnot(None),
                StudyActivity.next_review_date <= datetime.utcnow()
            )
        ).all()
        
        print(f"\n✅ Result: {len(due_activities)} cards are now due for review!")
        print(f"\n🔗 Test in frontend: /dashboard/quick-review")

if __name__ == "__main__":
    main()
