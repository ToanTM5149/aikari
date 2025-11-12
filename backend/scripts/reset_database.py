#!/usr/bin/env python3
"""
Script để reset database và tạo lại cấu trúc mới
Không cần psql command line, sử dụng Python trực tiếp
"""
import sys
import os
from pathlib import Path

# Thêm thư mục backend vào path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings


def reset_database():
    """Xóa và tạo lại database"""
    print("🔄 Đang reset database...")
    
    # Kết nối đến PostgreSQL server (không cần database cụ thể)
    # Tạo connection string không có database name
    server_uri = str(settings.SQLALCHEMY_DATABASE_URI).rsplit('/', 1)[0]
    
    try:
        # Kết nối đến postgres database (database mặc định)
        engine = create_engine(
            f"{server_uri}/postgres",
            isolation_level="AUTOCOMMIT"
        )
        
        db_name = settings.POSTGRES_DB
        
        with engine.connect() as conn:
            # Kiểm tra xem database có tồn tại không
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
            )
            exists = result.fetchone() is not None
            
            if exists:
                print(f"⚠️  Database '{db_name}' đã tồn tại. Đang xóa...")
                # Terminate tất cả connections đến database
                conn.execute(
                    text(f"""
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = '{db_name}' AND pid <> pg_backend_pid()
                    """)
                )
                # Xóa database
                conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
                print(f"✅ Đã xóa database '{db_name}'")
            
            # Tạo database mới
            print(f"📦 Đang tạo database '{db_name}' mới...")
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            print(f"✅ Đã tạo database '{db_name}' thành công!")
            
    except Exception as e:
        print(f"❌ Lỗi khi reset database: {e}")
        print("\n💡 Hãy đảm bảo:")
        print("   1. PostgreSQL đang chạy")
        print("   2. Thông tin trong file .env đúng (POSTGRES_SERVER, POSTGRES_USER, POSTGRES_PASSWORD)")
        print("   3. User có quyền tạo/xóa database")
        sys.exit(1)


def main():
    print("=" * 60)
    print("🔄 RESET DATABASE SCRIPT")
    print("=" * 60)
    print()
    
    # Xác nhận
    response = input("⚠️  BẠN CÓ CHẮC MUỐN XÓA TẤT CẢ DỮ LIỆU? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("❌ Đã hủy.")
        sys.exit(0)
    
    print()
    reset_database()
    print()
    print("=" * 60)
    print("✅ Hoàn thành! Bây giờ bạn có thể chạy migration:")
    print("   alembic upgrade head")
    print("=" * 60)


if __name__ == "__main__":
    main()

