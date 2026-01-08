"""
Simple Category Management Test
Just checks if the endpoints and components are properly set up
"""

def check_backend_files():
    """Check if backend files are in place"""
    import os
    
    print("=" * 80)
    print("BACKEND FILES CHECK")
    print("=" * 80)
    
    backend_base = "C:/Users/Toan Tran/Desktop/Work/aikari/backend/app"
    
    files_to_check = [
        ("models/category.py", "Category Model"),
        ("schemas/category.py", "Category Schema"),
        ("crud/category.py", "Category CRUD"),
        ("api/routes/categories.py", "Category API Routes"),
    ]
    
    all_exist = True
    for file_path, description in files_to_check:
        full_path = os.path.join(backend_base, file_path)
        exists = os.path.exists(full_path)
        status = "✓" if exists else "❌"
        print(f"{status} {description}: {file_path}")
        if not exists:
            all_exist = False
    
    return all_exist

def check_frontend_files():
    """Check if frontend files are in place"""
    import os
    
    print("\n" + "=" * 80)
    print("FRONTEND FILES CHECK")
    print("=" * 80)
    
    frontend_base = "C:/Users/Toan Tran/Desktop/Work/aikari/frontend/app"
    
    files_to_check = [
        ("redux/features/category/api.ts", "Category API Hooks"),
        ("components/pages/dashboard/category-management.tsx", "Category Management Page"),
        ("components/pages/dashboard/create-category-dialog.tsx", "Create Category Dialog"),
        ("components/pages/dashboard/edit-category-dialog.tsx", "Edit Category Dialog"),
        ("routes/dashboard/categories.tsx", "Category Route"),
        ("components/category-filter.tsx", "Category Filter Component"),
    ]
    
    all_exist = True
    for file_path, description in files_to_check:
        full_path = os.path.join(frontend_base, file_path)
        exists = os.path.exists(full_path)
        status = "✓" if exists else "❌"
        print(f"{status} {description}: {file_path}")
        if not exists:
            all_exist = False
    
    return all_exist

def check_database_schema():
    """Check database schema"""
    print("\n" + "=" * 80)
    print("DATABASE SCHEMA CHECK")
    print("=" * 80)
    
    try:
        import sys
        sys.path.insert(0, 'C:/Users/Toan Tran/Desktop/Work/aikari/backend')
        
        from app.core.db import engine
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        
        # Check Category table
        if 'Category' in inspector.get_table_names():
            print("✓ Category table exists")
            columns = inspector.get_columns('Category')
            print("  Columns:")
            for col in columns:
                print(f"    - {col['name']}: {col['type']}")
        else:
            print("❌ Category table not found")
            return False
        
        # Check StudySet.category_id
        if 'StudySet' in inspector.get_table_names():
            columns = {col['name']: col for col in inspector.get_columns('StudySet')}
            if 'category_id' in columns:
                print("✓ StudySet.category_id column exists")
                print(f"  Type: {columns['category_id']['type']}")
            else:
                print("❌ StudySet.category_id column not found")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

def check_api_routes():
    """Check if category routes are registered"""
    print("\n" + "=" * 80)
    print("API ROUTES CHECK")
    print("=" * 80)
    
    try:
        import sys
        sys.path.insert(0, 'C:/Users/Toan Tran/Desktop/Work/aikari/backend')
        
        from app.api.main import api_router
        
        # Check if categories route is included
        routes = []
        for route in api_router.routes:
            if hasattr(route, 'path'):
                routes.append(route.path)
        
        category_routes = [r for r in routes if 'categories' in r.lower()]
        
        if category_routes:
            print("✓ Category routes registered:")
            for route in category_routes:
                print(f"  - {route}")
            return True
        else:
            print("❌ No category routes found")
            return False
            
    except Exception as e:
        print(f"❌ Error checking routes: {e}")
        return False

def print_summary(backend_ok, frontend_ok, db_ok, routes_ok):
    """Print test summary"""
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    print(f"\n{'✓' if backend_ok else '❌'} Backend Files: {'OK' if backend_ok else 'MISSING FILES'}")
    print(f"{'✓' if frontend_ok else '❌'} Frontend Files: {'OK' if frontend_ok else 'MISSING FILES'}")
    print(f"{'✓' if db_ok else '❌'} Database Schema: {'OK' if db_ok else 'ISSUE FOUND'}")
    print(f"{'✓' if routes_ok else '❌'} API Routes: {'OK' if routes_ok else 'NOT REGISTERED'}")
    
    all_ok = backend_ok and frontend_ok and db_ok and routes_ok
    
    if all_ok:
        print("\n" + "🎉" * 40)
        print("\n✓✓✓ ALL CHECKS PASSED! ✓✓✓")
        print("\nCategory Management is ready to use!")
        print("\nNext steps:")
        print("1. Start backend:  uvicorn app.main:app --reload")
        print("2. Start frontend: npm run dev")
        print("3. Login and navigate to Categories page")
        print("4. Test create, edit, and delete operations")
        print("\n" + "🎉" * 40)
    else:
        print("\n⚠️  Some issues found. Please check the errors above.")
    
    return all_ok

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("  CATEGORY MANAGEMENT - SETUP VERIFICATION")
    print("=" * 80 + "\n")
    
    backend_ok = check_backend_files()
    frontend_ok = check_frontend_files()
    db_ok = check_database_schema()
    routes_ok = check_api_routes()
    
    print_summary(backend_ok, frontend_ok, db_ok, routes_ok)
