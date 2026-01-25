#!/usr/bin/env python3
"""Check enrollment records in database"""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Count total enrollments
    result = conn.execute(text('SELECT COUNT(*) FROM "StudentStudySet"'))
    total = result.scalar()
    print(f"Total enrollments: {total}")
    
    # Count enrollments with last_studied_at
    result = conn.execute(text('SELECT COUNT(*) FROM "StudentStudySet" WHERE last_studied_at IS NOT NULL'))
    studied = result.scalar()
    print(f"Enrollments with last_studied_at: {studied}")
    
    # Show sample enrollments
    result = conn.execute(text('SELECT student_id, studyset_id, enrolled_at, last_studied_at FROM "StudentStudySet" LIMIT 5'))
    print("\nSample enrollments:")
    for row in result:
        print(f"  Student: {row[0]}, StudySet: {row[1]}, Enrolled: {row[2]}, Last Studied: {row[3]}")
