"""
Direct database test for category functionality
"""
import uuid
from datetime import datetime

from app.core.db import engine
from app.models.category import Category
from app.models.studyset import StudySet
from sqlmodel import Session, select

def test_category_database():
    print("=" * 60)
    print("TESTING CATEGORY DATABASE FUNCTIONALITY")
    print("=" * 60)
    
    with Session(engine) as session:
        # Get a user to test with
        from app.models.user import User
        user = session.exec(select(User).limit(1)).first()
        if not user:
            print("❌ No users found in database")
            return
        
        print(f"\n✓ Testing with user: {user.email}")
        user_id = user.user_id
        
        # Step 1: Create a category
        print("\n1. Creating a test category...")
        test_category = Category(
            category_id=uuid.uuid4(),
            name="Database Test Category",
            description="Testing category functionality directly",
            color="#FF5733",
            owner_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(test_category)
        session.commit()
        session.refresh(test_category)
        print(f"✓ Category created with ID: {test_category.category_id}")
        print(f"  Name: {test_category.name}")
        print(f"  Color: {test_category.color}")
        
        # Step 2: Create a studyset with the category
        print("\n2. Creating a studyset with the category...")
        from app.models.enums import ContentType
        test_studyset = StudySet(
            studyset_id=uuid.uuid4(),
            title="Test Studyset with Category",
            description="Testing studyset-category relationship",
            owner_id=user_id,
            content_type=ContentType.DEFAULT,
            category_id=test_category.category_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(test_studyset)
        session.commit()
        session.refresh(test_studyset)
        print(f"✓ Studyset created with ID: {test_studyset.studyset_id}")
        print(f"  Title: {test_studyset.title}")
        print(f"  Category ID: {test_studyset.category_id}")
        
        # Step 3: Query studysets by category
        print("\n3. Querying studysets by category...")
        statement = select(StudySet).where(StudySet.category_id == test_category.category_id)
        studysets = session.exec(statement).all()
        print(f"✓ Found {len(studysets)} studyset(s) in this category")
        for ss in studysets:
            print(f"  - {ss.title}")
        
        # Step 4: Test relationship loading
        print("\n4. Testing category relationship...")
        category_from_studyset = test_studyset.category
        if category_from_studyset:
            print(f"✓ Category relationship loaded successfully")
            print(f"  Category name: {category_from_studyset.name}")
        else:
            print(f"❌ Category relationship not loaded")
        
        # Step 5: Count studysets in category
        print("\n5. Counting studysets in category...")
        from sqlalchemy import func
        count_statement = select(func.count(StudySet.studyset_id)).where(
            StudySet.category_id == test_category.category_id
        )
        count = session.exec(count_statement).one()
        print(f"✓ Category has {count} studyset(s)")
        
        # Step 6: Update category
        print("\n6. Updating category...")
        test_category.name = "Updated Database Test Category"
        test_category.color = "#00FF00"
        test_category.updated_at = datetime.utcnow()
        session.add(test_category)
        session.commit()
        session.refresh(test_category)
        print(f"✓ Category updated")
        print(f"  New name: {test_category.name}")
        print(f"  New color: {test_category.color}")
        
        # Step 7: Cleanup - delete studyset
        print("\n7. Cleaning up - deleting studyset...")
        session.delete(test_studyset)
        session.commit()
        print(f"✓ Studyset deleted")
        
        # Step 8: Cleanup - delete category
        print("\n8. Cleaning up - deleting category...")
        session.delete(test_category)
        session.commit()
        print(f"✓ Category deleted")
        
        # Step 9: Verify database schema
        print("\n9. Verifying database schema...")
        from sqlalchemy import inspect
        inspector = inspect(engine)
        
        # Check StudySet columns
        studyset_columns = {col['name']: str(col['type']) for col in inspector.get_columns('StudySet')}
        print(f"✓ StudySet columns:")
        for col_name, col_type in studyset_columns.items():
            print(f"  - {col_name}: {col_type}")
        
        # Verify category_id exists
        if 'category_id' in studyset_columns:
            print(f"\n✓✓✓ SUCCESS: category_id column exists in StudySet table")
        else:
            print(f"\n❌❌❌ FAILURE: category_id column NOT FOUND in StudySet table")
        
        # Check foreign key constraints
        fks = inspector.get_foreign_keys('StudySet')
        category_fk = [fk for fk in fks if 'category' in str(fk).lower()]
        if category_fk:
            print(f"✓ Foreign key constraint exists for category")
        
    print("\n" + "=" * 60)
    print("DATABASE TESTING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_category_database()
