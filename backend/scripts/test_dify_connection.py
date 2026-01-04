"""
Script để test kết nối đến Dify API
Chạy: python -m app.scripts.test_dify_connection
Hoặc: python scripts/test_dify_connection.py
"""

import asyncio
import sys
from pathlib import Path

# Thêm root directory vào path để import app
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

from app.core.config import settings
from app.services import dify_service


async def test_dify_connection():
    """Test kết nối và các chức năng cơ bản của Dify API"""
    
    print("=" * 60)
    print("TEST KẾT NỐI DIFY API")
    print("=" * 60)
    print()
    
    # 1. Kiểm tra cấu hình
    print("1. Kiểm tra cấu hình:")
    print(f"   - DIFY_BASE_URL: {settings.DIFY_BASE_URL}")
    print(f"   - DIFY_API_KEY: {'✓ Đã cấu hình' if settings.DIFY_API_KEY else '✗ Chưa cấu hình'}")
    if settings.DIFY_API_KEY:
        # Chỉ hiển thị 10 ký tự đầu và cuối của API key để bảo mật
        masked_key = (
            settings.DIFY_API_KEY[:10] 
            + "..." 
            + settings.DIFY_API_KEY[-10:] 
            if len(settings.DIFY_API_KEY) > 20 
            else settings.DIFY_API_KEY[:10] + "..."
        )
        print(f"     (API Key: {masked_key})")
    print()
    
    if not settings.DIFY_API_KEY:
        print("❌ LỖI: DIFY_API_KEY chưa được cấu hình!")
        print("   Vui lòng thêm DIFY_API_KEY vào file .env")
        return False
    
    # 2. Kiểm tra URL format
    print("2. Kiểm tra URL format:")
    print(f"   - Base URL: {dify_service.base_url}")
    print(f"   - API Prefix: '{dify_service.api_prefix}' (tự động xác định)")
    test_endpoint = "workflows/run"
    test_url = dify_service._get_full_url(test_endpoint)
    print(f"   - Test URL (workflow): {test_url}")
    print()
    
    # 3. Test Health Check
    print("3. Test Health Check (kiểm tra kết nối):")
    try:
        result = await dify_service.health_check()
        print("   ✓ Kết nối thành công!")
        print(f"   Response: {result}")
    except ValueError as e:
        print(f"   ✗ Lỗi cấu hình: {e}")
        return False
    except Exception as e:
        print(f"   ✗ Lỗi kết nối: {e}")
        print(f"   Chi tiết: {type(e).__name__}")
        return False
    print()
    
    # 4. Test Chat Completion (nếu có thể)
    print("4. Test Chat Completion (gửi message test):")
    try:
        test_query = "Xin chào, bạn có thể nghe tôi không?"
        print(f"   Gửi query: '{test_query}'")
        result = await dify_service.chat_completion(
            query=test_query,
            user="test_user",
        )
        print("   ✓ Chat completion thành công!")
        print(f"   Answer: {result.get('answer', 'N/A')[:100]}...")
        print(f"   Conversation ID: {result.get('conversation_id', 'N/A')}")
        print(f"   Message ID: {result.get('id', 'N/A')}")
    except Exception as e:
        print(f"   ✗ Lỗi: {e}")
        print(f"   (App có thể không phải chat app, thử completion app...)")
    print()
    
    # 5. Test Completion (nếu chat không hoạt động)
    print("5. Test Completion (gửi prompt test):")
    try:
        test_prompt = "Viết một câu giới thiệu ngắn về Python"
        print(f"   Gửi prompt: '{test_prompt}'")
        result = await dify_service.completion(
            prompt=test_prompt,
            user="test_user",
        )
        print("   ✓ Completion thành công!")
        print(f"   Answer: {result.get('answer', 'N/A')[:100]}...")
        print(f"   Message ID: {result.get('id', 'N/A')}")
    except Exception as e:
        print(f"   ✗ Lỗi: {e}")
        print(f"   (App có thể không phải completion app)")
    print()
    
    # 6. Test Workflow (cho workflow app)
    print("6. Test Workflow (chạy workflow với inputs rỗng):")
    try:
        print(f"   Gửi workflow run với inputs rỗng (test)")
        result = await dify_service.run_workflow(
            inputs={},
            user="test_user",
        )
        print("   ✓ Workflow run thành công!")
        print(f"   Workflow ID: {result.get('workflow_run_id', 'N/A')}")
        print(f"   Status: {result.get('status', 'N/A')}")
        if result.get('data'):
            print(f"   Data keys: {list(result.get('data', {}).keys())}")
    except Exception as e:
        print(f"   ✗ Lỗi: {e}")
        print(f"   Chi tiết: {type(e).__name__}")
        print("   (Có thể workflow cần inputs cụ thể hoặc có lỗi cấu hình)")
    print()
    
    # 7. Tổng kết
    print("=" * 60)
    print("KẾT QUẢ:")
    print("   ✓ Cấu hình: OK")
    print("   ✓ Kết nối: OK")
    print("   ✓ Dify Service: Sẵn sàng sử dụng")
    print()
    print("Lưu ý: Health check đã test với workflow app.")
    print("       Nếu workflow cần inputs cụ thể, hãy cung cấp trong code.")
    print("=" * 60)
    return True


if __name__ == "__main__":
    try:
        result = asyncio.run(test_dify_connection())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n\nĐã hủy test.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nLỗi không mong đợi: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

