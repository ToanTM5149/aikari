#!/usr/bin/env python3
"""
Script để kiểm tra image_url của terms mới tạo
"""
import sys
from pathlib import Path

# Thêm thư mục backend vào path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings


def check_recent_terms():
    """Kiểm tra các terms mới tạo gần đây"""
    print("🔍 Đang kiểm tra các terms mới tạo...")
    
    try:
        engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
        
        with engine.connect() as conn:
            # Lấy 5 terms mới nhất
            result = conn.execute(
                text("""
                    SELECT 
                        term_id,
                        term_text,
                        definition,
                        image_url,
                        LENGTH(image_url) as image_url_length,
                        created_at
                    FROM "Term"
                    ORDER BY created_at DESC
                    LIMIT 5
                """)
            )
            
            terms = result.fetchall()
            print(f"\n📋 {len(terms)} terms mới nhất:")
            print("=" * 80)
            
            for term in terms:
                term_id, term_text, definition, image_url, length, created_at = term
                print(f"\nTerm ID: {term_id}")
                print(f"  Text: {term_text[:50]}...")
                print(f"  Definition: {definition[:50]}...")
                print(f"  Image URL: {repr(image_url)}")
                print(f"  Image URL Length: {length if length else 0}")
                print(f"  Created: {created_at}")
                
                if image_url:
                    if image_url.startswith('data:'):
                        print(f"  ✅ Base64 image (length: {len(image_url)})")
                    elif image_url.startswith('http'):
                        print(f"  ✅ HTTP URL")
                    else:
                        print(f"  ⚠️  Unknown format")
                else:
                    print(f"  ❌ No image URL")
            
            print("=" * 80)
                
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    check_recent_terms()

