#!/usr/bin/env python3
"""
Script để thêm các cột category và subcategory vào bảng StudySet
"""
import sys
from pathlib import Path

# Thêm thư mục backend vào path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings


def add_columns():
    """Thêm các cột category và subcategory vào bảng StudySet"""
    print("🔧 Đang thêm các cột category và subcategory vào bảng StudySet...")
    
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        
        with engine.connect() as conn:
            # Kiểm tra xem cột đã tồn tại chưa
            result = conn.execute(
                text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = 'StudySet'
                    AND column_name IN ('category', 'subcategory')
                """)
            )
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Thêm cột category nếu chưa có
            if 'category' not in existing_columns:
                print("  ➕ Đang thêm cột 'category'...")
                conn.execute(
                    text('ALTER TABLE "StudySet" ADD COLUMN category VARCHAR(100)')
                )
                conn.commit()
                print("  ✅ Đã thêm cột 'category'")
            else:
                print("  ℹ️  Cột 'category' đã tồn tại")
            
            # Thêm cột subcategory nếu chưa có
            if 'subcategory' not in existing_columns:
                print("  ➕ Đang thêm cột 'subcategory'...")
                conn.execute(
                    text('ALTER TABLE "StudySet" ADD COLUMN subcategory VARCHAR(100)')
                )
                conn.commit()
                print("  ✅ Đã thêm cột 'subcategory'")
            else:
                print("  ℹ️  Cột 'subcategory' đã tồn tại")
            
            print("\n✅ Hoàn tất! Các cột đã được thêm vào bảng StudySet")
            
    except Exception as e:
        print(f"❌ Lỗi khi thêm cột: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    add_columns()

