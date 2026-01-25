#!/usr/bin/env python3
"""Script to check if migrations have been applied"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.db import engine
from sqlalchemy import inspect, text

def check_migrations():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    # Check StudentStudySet table
    has_student_studyset = 'StudentStudySet' in tables
    print(f"✅ StudentStudySet table: {'EXISTS' if has_student_studyset else 'MISSING'}")
    
    if has_student_studyset:
        # Check indexes for StudentStudySet
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'StudentStudySet'
            """))
            idx_names = [row[0] for row in result]
            print(f"   Indexes: {idx_names}")
    
    # Check performance indexes
    print("\n🔍 Checking performance indexes...")
    with engine.connect() as conn:
        # Check StudyActivity indexes
        result = conn.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname LIKE 'idx_studyactivity%'
        """))
        study_activity_idx = [row[0] for row in result]
        print(f"✅ StudyActivity indexes: {len(study_activity_idx)} found")
        if study_activity_idx:
            print(f"   Examples: {study_activity_idx[:3]}")
        
        # Check ProgressSummary indexes
        result = conn.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname LIKE 'idx_progresssummary%'
        """))
        progress_idx = [row[0] for row in result]
        print(f"✅ ProgressSummary indexes: {len(progress_idx)} found")
        if progress_idx:
            print(f"   Examples: {progress_idx[:3]}")
        
        # Check other performance indexes
        result = conn.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname IN (
                'idx_classmember_user_class',
                'idx_classmember_class_status',
                'idx_classstudyset_class',
                'idx_term_studyset',
                'idx_testquestion_term'
            )
        """))
        other_idx = [row[0] for row in result]
        print(f"✅ Other performance indexes: {len(other_idx)} found")
        if other_idx:
            print(f"   Examples: {other_idx[:3]}")
    
    print(f"\n📊 Total tables in database: {len(tables)}")
    
    # Summary
    print("\n" + "="*50)
    if has_student_studyset and (len(study_activity_idx) > 0 or len(progress_idx) > 0):
        print("✅ CẢ HAI MIGRATION ĐÃ ĐƯỢC ÁP DỤNG!")
    elif has_student_studyset:
        print("⚠️  StudentStudySet đã có, nhưng performance indexes chưa có")
    elif len(study_activity_idx) > 0 or len(progress_idx) > 0:
        print("⚠️  Performance indexes đã có, nhưng StudentStudySet chưa có")
    else:
        print("❌ CẢ HAI MIGRATION CHƯA ĐƯỢC ÁP DỤNG")

if __name__ == "__main__":
    check_migrations()
