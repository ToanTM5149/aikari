#!/usr/bin/env python3
"""
Script để kiểm tra các cột trong bảng Term
"""
import sys
from pathlib import Path

# Thêm thư mục backend vào path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings


def check_term_columns():
    """Kiểm tra các cột trong bảng Term"""
    print("🔍 Đang kiểm tra cấu trúc bảng Term...")
    
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        
        with engine.connect() as conn:
            # Lấy danh sách tất cả các cột trong bảng Term
            result = conn.execute(
                text("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = 'Term'
                    ORDER BY ordinal_position
                """)
            )
            
            columns = result.fetchall()
            print(f"\n📋 Danh sách các cột trong bảng Term ({len(columns)} cột):")
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
            
            if has_category or has_subcategory:
                print("\n⚠️  Bảng Term vẫn có cột category/subcategory")
            else:
                print("\n✅ Bảng Term không có cột category/subcategory (đã di chuyển sang StudySet)")
                
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    check_term_columns()

