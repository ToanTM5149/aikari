"""
Test script for Admin Statistics API endpoints
Requires a running backend server and an admin user token
"""
import httpx
import json
from datetime import datetime


# Configuration
BASE_URL = "http://localhost:8000/api"
ADMIN_TOKEN = None  # Set this after logging in


def print_section(title: str):
    """Print a section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def print_response(response: httpx.Response):
    """Pretty print response"""
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2, default=str))
    else:
        print(f"Error: {response.text}")
    print()


async def test_admin_endpoints():
    """Test all admin endpoints"""
    
    async with httpx.AsyncClient() as client:
        
        # ================================================================
        # 1. Login as admin to get token
        # ================================================================
        print_section("1. Login as Admin")
        
        login_response = await client.post(
            f"{BASE_URL}/login/access-token",
            data={
                "username": "admin",  # Default admin username
                "password": "changethis123",  # Default admin password
            }
        )
        
        print_response(login_response)
        
        if login_response.status_code != 200:
            print("❌ Failed to login. Make sure you have an admin user.")
            print("You can create one using the database initialization script.")
            return
        
        global ADMIN_TOKEN
        ADMIN_TOKEN = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        
        # ================================================================
        # 2. Get Complete Dashboard
        # ================================================================
        print_section("2. Complete Admin Dashboard")
        
        dashboard_response = await client.get(
            f"{BASE_URL}/admin/dashboard/",
            headers=headers
        )
        print_response(dashboard_response)
        
        # ================================================================
        # 3. System Overview
        # ================================================================
        print_section("3. System Overview Statistics")
        
        overview_response = await client.get(
            f"{BASE_URL}/admin/statistics/overview/",
            headers=headers
        )
        print_response(overview_response)
        
        # ================================================================
        # 4. User Statistics
        # ================================================================
        print_section("4. User Statistics")
        
        user_stats_response = await client.get(
            f"{BASE_URL}/admin/statistics/users/?top_limit=5",
            headers=headers
        )
        print_response(user_stats_response)
        
        # ================================================================
        # 5. Learning Overview
        # ================================================================
        print_section("5. Learning Overview Statistics")
        
        learning_response = await client.get(
            f"{BASE_URL}/admin/statistics/learning/overview/",
            headers=headers
        )
        print_response(learning_response)
        
        # ================================================================
        # 6. Learning Trends
        # ================================================================
        print_section("6. Learning Trends (Last 7 Days)")
        
        trends_response = await client.get(
            f"{BASE_URL}/admin/statistics/learning/trends/?days=7",
            headers=headers
        )
        print_response(trends_response)
        
        # ================================================================
        # 7. Class Statistics
        # ================================================================
        print_section("7. Class Statistics")
        
        class_stats_response = await client.get(
            f"{BASE_URL}/admin/statistics/classes/?top_limit=5",
            headers=headers
        )
        print_response(class_stats_response)
        
        # ================================================================
        # 8. AI Usage Overview
        # ================================================================
        print_section("8. AI Usage Overview")
        
        ai_overview_response = await client.get(
            f"{BASE_URL}/admin/statistics/ai/overview/",
            headers=headers
        )
        print_response(ai_overview_response)
        
        # ================================================================
        # 9. AI Usage Trends
        # ================================================================
        print_section("9. AI Usage Trends (Last 14 Days)")
        
        ai_trends_response = await client.get(
            f"{BASE_URL}/admin/statistics/ai/trends/?days=14",
            headers=headers
        )
        print_response(ai_trends_response)
        
        # ================================================================
        # 10. Content Statistics
        # ================================================================
        print_section("10. Content Statistics")
        
        content_response = await client.get(
            f"{BASE_URL}/admin/statistics/content/?top_limit=5",
            headers=headers
        )
        print_response(content_response)
        
        # ================================================================
        # 11. Test Permissions (Try as non-admin)
        # ================================================================
        print_section("11. Permission Test (Should Fail for Non-Admin)")
        
        # Try to access admin endpoint without admin role
        non_admin_response = await client.get(
            f"{BASE_URL}/admin/statistics/overview/",
            # No headers or invalid token
        )
        
        print("Expected: 401 Unauthorized or 403 Forbidden")
        print_response(non_admin_response)
        
        print("\n" + "=" * 80)
        print("  ✅ All tests completed!")
        print("=" * 80)


if __name__ == "__main__":
    import asyncio
    
    print("""
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║              ADMIN STATISTICS API TEST SCRIPT                         ║
║                                                                       ║
║  This script tests all admin statistics endpoints.                   ║
║  Make sure the backend server is running on http://localhost:8000    ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
    """)
    
    asyncio.run(test_admin_endpoints())
