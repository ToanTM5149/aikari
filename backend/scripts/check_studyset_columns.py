#!/usr/bin/env python3
"""
Script để kiểm tra xem các cột category và subcategory đã tồn tại trong bảng StudySet chưa
"""
import sys
from pathlib import Path

# Thêm thư mục backend vào path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings


def check_columns():
    """Kiểm tra các cột trong bảng StudySet"""
    print("🔍 Đang kiểm tra cấu trúc bảng StudySet...")
    
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        
        with engine.connect() as conn:
            # Kiểm tra xem bảng StudySet có tồn tại không
            result = conn.execute(
                text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'StudySet'
                    )
                """)
            )
            table_exists = result.scalar()
            
            if not table_exists:
                print("❌ Bảng 'StudySet' không tồn tại!")
                return
            
            print("✅ Bảng 'StudySet' tồn tại")
            
            # Lấy danh sách tất cả các cột trong bảng StudySet
            result = conn.execute(
                text("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = 'StudySet'
                    ORDER BY ordinal_position
                """)
            )
            
            columns = result.fetchall()
            print(f"\n📋 Danh sách các cột trong bảng StudySet ({len(columns)} cột):")
            print("-" * 60)
            
            has_category = False
            has_subcategory = False
            
            for col in columns:
                col_name, data_type, is_nullable = col
                nullable_str = "NULL" if is_nullable == "YES" else "NOT NULL"
                print(f"  - {col_name:20} | {data_type:20} | {nullable_str}")
                
                if col_name == "category":
                    has_category = True
                if col_name == "subcategory":
                    has_subcategory = True
            
            print("-" * 60)
            
            if has_category and has_subcategory:
                print("\n✅ Các cột 'category' và 'subcategory' đã tồn tại!")
            else:
                print("\n❌ Thiếu các cột:")
                if not has_category:
                    print("   - category")
                if not has_subcategory:
                    print("   - subcategory")
                print("\n💡 Hãy chạy lại migration:")
                print("   cd backend && source .venv/bin/activate && alembic upgrade head")
            
            # Kiểm tra revision hiện tại
            print("\n🔍 Kiểm tra migration revision...")
            result = conn.execute(
                text("SELECT version_num FROM alembic_version")
            )
            current_revision = result.scalar()
            print(f"   Revision hiện tại: {current_revision}")
            
            if current_revision == "ea99bae7785f":
                print("   ✅ Migration 'move_category_from_term_to_studyset' đã được apply")
            else:
                print(f"   ⚠️  Revision hiện tại không phải 'ea99bae7785f'")
                print("   💡 Có thể cần chạy: alembic upgrade head")
                
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    check_columns()

