#!/usr/bin/env python3
"""Check enrollment records for specific user"""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.db import engine
from app.models import User
from sqlalchemy import text
from sqlmodel import Session, select

with Session(engine) as session:
    # Find user by email
    user = session.exec(select(User).where(User.email == "ttoan0509@gmail.com")).first()
    
    if not user:
        print("User not found!")
        sys.exit(1)
    
    print(f"User found: {user.user_id} ({user.email})")
    print(f"Role: {user.role}")
    
    # Check enrollments
    result = session.execute(text("""
        SELECT 
            sss.studyset_id,
            sss.enrolled_at,
            sss.last_studied_at,
            ss.title,
            ss.owner_id
        FROM "StudentStudySet" sss
        JOIN "StudySet" ss ON sss.studyset_id = ss.studyset_id
        WHERE sss.student_id = :user_id
        ORDER BY sss.enrolled_at DESC
    """), {"user_id": user.user_id})
    
    enrollments = result.fetchall()
    print(f"\nTotal enrollments: {len(enrollments)}")
    
    if enrollments:
        print("\nEnrollments:")
        for row in enrollments:
            is_owner = row[4] == user.user_id
            print(f"  - {row[3]} (ID: {row[0]})")
            print(f"    Enrolled: {row[1]}")
            print(f"    Last Studied: {row[2]}")
            print(f"    Is Owner: {is_owner}")
            print()
    else:
        print("\nNo enrollments found!")
        
        # Check if user has any studysets they own
        owned_result = session.execute(text("""
            SELECT studyset_id, title
            FROM "StudySet"
            WHERE owner_id = :user_id
        """), {"user_id": user.user_id})
        
        owned = owned_result.fetchall()
        print(f"\nOwned studysets: {len(owned)}")
        for row in owned:
            print(f"  - {row[1]} (ID: {row[0]})")
