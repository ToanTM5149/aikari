"""
Script to list all users in the system
"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

# Fix encoding for Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from sqlmodel import Session, select
from app.core.db import engine
from app.models import User, UserRole
from datetime import datetime


def list_users():
    """List all users in the system"""
    print("=" * 80)
    print("👥 DANH SÁCH USERS TRONG HỆ THỐNG")
    print("=" * 80)
    
    with Session(engine) as session:
        # Get all users
        statement = select(User).order_by(User.created_at)
        users = session.exec(statement).all()
        
        if not users:
            print("\n❌ Không có user nào trong hệ thống!")
            return
        
        print(f"\n📊 Tổng số users: {len(users)}\n")
        
        # Group by role
        teachers = [u for u in users if u.role == UserRole.TEACHER]
        students = [u for u in users if u.role == UserRole.STUDENT]
        admins = [u for u in users if u.role == UserRole.ADMIN]
        
        print(f"👨‍🏫 Teachers: {len(teachers)}")
        print(f"👨‍🎓 Students: {len(students)}")
        print(f"👑 Admins: {len(admins)}")
        print("\n" + "-" * 80)
        
        # Display all users
        for idx, user in enumerate(users, 1):
            role_emoji = "👑" if user.role == UserRole.ADMIN else "👨‍🏫" if user.role == UserRole.TEACHER else "👨‍🎓"
            role_name = user.role.value.upper()
            
            print(f"\n{idx}. {role_emoji} {user.full_name}")
            print(f"   Username: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Role: {role_name}")
            print(f"   User ID: {user.user_id}")
            print(f"   Created: {user.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if user.phone_numbers:
                print(f"   Phone: {user.phone_numbers}")
            if user.city or user.country:
                location = ", ".join(filter(None, [user.city, user.country]))
                print(f"   Location: {location}")
        
        print("\n" + "=" * 80)
        print("✅ Hoàn thành!")
        print("=" * 80)


if __name__ == "__main__":
    list_users()
