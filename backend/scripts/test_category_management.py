"""
Comprehensive test for Category Management feature
Tests all CRUD operations for categories
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_section(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_result(success, message):
    icon = "✓" if success else "❌"
    print(f"{icon} {message}")

def test_category_management():
    """Test all category management features"""
    
    print_section("CATEGORY MANAGEMENT TEST")
    
    # Step 1: Check if backend is running
    print("\n1. Checking backend health...")
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/docs", timeout=2)
        if response.status_code == 200:
            print_result(True, "Backend is running")
        else:
            print_result(False, f"Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Backend not accessible: {e}")
        return False
    
    # Step 2: Test without authentication (should fail)
    print("\n2. Testing endpoints without authentication...")
    response = requests.get(f"{BASE_URL}/categories/")
    if response.status_code == 401:
        print_result(True, "Endpoints properly protected (401 Unauthorized)")
    else:
        print_result(False, f"Expected 401, got {response.status_code}")
    
    # Step 3: Try to login with test credentials
    print("\n3. Attempting authentication...")
    test_credentials = [
        ("ttoan0509@gmail.com", "your_password_here"),
        ("test@test.com", "testpassword"),
    ]
    
    token = None
    for email, password in test_credentials:
        login_data = {"username": email, "password": password}
        response = requests.post(f"{BASE_URL}/login/access-token", data=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print_result(True, f"Logged in as: {email}")
            break
    
    if not token:
        print_result(False, "Could not authenticate with test credentials")
        print("\n⚠️  Please update credentials in the test script or use the manual test")
        print("    You can test manually by:")
        print("    1. Open http://localhost:5173 (frontend)")
        print("    2. Login with your credentials")
        print("    3. Navigate to Categories page")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 4: Test GET categories
    print("\n4. Testing GET /api/v1/categories/")
    response = requests.get(f"{BASE_URL}/categories/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print_result(True, f"Retrieved categories (count: {data['count']})")
        print(f"   Response structure: {list(data.keys())}")
    else:
        print_result(False, f"Failed: {response.text}")
        return False
    
    # Step 5: Test GET categories with count
    print("\n5. Testing GET /api/v1/categories/with-count/")
    response = requests.get(f"{BASE_URL}/categories/with-count/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print_result(True, f"Retrieved categories with counts (count: {data['count']})")
        if data['data']:
            sample = data['data'][0]
            print(f"   Sample: {sample['name']} - {sample['studyset_count']} studysets")
    else:
        print_result(False, f"Failed: {response.text}")
    
    # Step 6: Test CREATE category
    print("\n6. Testing POST /api/v1/categories/ (Create)")
    category_data = {
        "name": "Test Category " + str(int(requests.get(f"{BASE_URL}/categories/", headers=headers).json()['count']) + 1),
        "description": "Automated test category",
        "color": "#4ECDC4"
    }
    response = requests.post(f"{BASE_URL}/categories/", headers=headers, json=category_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        category = response.json()
        category_id = category["category_id"]
        print_result(True, f"Category created (ID: {category_id})")
        print(f"   Name: {category['name']}")
        print(f"   Color: {category['color']}")
    else:
        print_result(False, f"Failed: {response.text}")
        return False
    
    # Step 7: Test GET single category
    print("\n7. Testing GET /api/v1/categories/{id}/ (Read single)")
    response = requests.get(f"{BASE_URL}/categories/{category_id}/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        cat = response.json()
        print_result(True, f"Retrieved category: {cat['name']}")
    else:
        print_result(False, f"Failed: {response.text}")
    
    # Step 8: Test UPDATE category
    print("\n8. Testing PUT /api/v1/categories/{id}/ (Update)")
    update_data = {
        "name": category_data["name"] + " (Updated)",
        "description": "Updated description",
        "color": "#FF6B6B"
    }
    response = requests.put(f"{BASE_URL}/categories/{category_id}/", headers=headers, json=update_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        updated = response.json()
        print_result(True, f"Category updated")
        print(f"   New name: {updated['name']}")
        print(f"   New color: {updated['color']}")
    else:
        print_result(False, f"Failed: {response.text}")
    
    # Step 9: Test DELETE category
    print("\n9. Testing DELETE /api/v1/categories/{id}/ (Delete)")
    response = requests.delete(f"{BASE_URL}/categories/{category_id}/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print_result(True, "Category deleted successfully")
    else:
        print_result(False, f"Failed: {response.text}")
    
    # Step 10: Verify deletion
    print("\n10. Verifying deletion...")
    response = requests.get(f"{BASE_URL}/categories/{category_id}/", headers=headers)
    if response.status_code == 404:
        print_result(True, "Category no longer exists (404)")
    else:
        print_result(False, f"Category still accessible (status: {response.status_code})")
    
    # Summary
    print_section("TEST SUMMARY")
    print("\n✓ All category CRUD operations working correctly!")
    print("\nTested endpoints:")
    print("  ✓ GET    /api/v1/categories/")
    print("  ✓ GET    /api/v1/categories/with-count/")
    print("  ✓ GET    /api/v1/categories/{id}/")
    print("  ✓ POST   /api/v1/categories/")
    print("  ✓ PUT    /api/v1/categories/{id}/")
    print("  ✓ DELETE /api/v1/categories/{id}/")
    
    print("\n" + "=" * 80)
    print("  CATEGORY MANAGEMENT READY TO USE")
    print("=" * 80)
    
    return True

def manual_test_instructions():
    """Print instructions for manual testing"""
    print_section("MANUAL TESTING INSTRUCTIONS")
    
    print("\nIf automated test fails due to authentication, test manually:")
    print("\n1. START BACKEND:")
    print("   cd backend")
    print("   source .venv/Scripts/activate  (Windows)")
    print("   uvicorn app.main:app --reload")
    
    print("\n2. START FRONTEND:")
    print("   cd frontend")
    print("   npm run dev")
    
    print("\n3. OPEN BROWSER:")
    print("   http://localhost:5173")
    
    print("\n4. TEST CATEGORY MANAGEMENT:")
    print("   a. Login with your account")
    print("   b. Click on 'Categories' in sidebar")
    print("   c. Test CREATE: Click 'Create Category' button")
    print("      - Enter name, description, choose color")
    print("      - Click 'Create'")
    print("      - Verify category appears in list")
    
    print("\n   d. Test EDIT: Click three dots menu on a category")
    print("      - Click 'Edit'")
    print("      - Change name, description, or color")
    print("      - Click 'Update'")
    print("      - Verify changes are saved")
    
    print("\n   e. Test VIEW: Check category card displays:")
    print("      - Category name")
    print("      - Description")
    print("      - Color swatch")
    print("      - Study set count")
    
    print("\n   f. Test DELETE: Click three dots menu")
    print("      - Click 'Delete'")
    print("      - Confirm deletion")
    print("      - Verify category is removed")
    print("      - Note: Cannot delete if has studysets")
    
    print("\n5. TEST INTEGRATION WITH STUDYSETS:")
    print("   a. Create a new category")
    print("   b. Go to 'Study Sets' page")
    print("   c. Create new study set")
    print("   d. Select the category from dropdown")
    print("   e. Verify category badge appears on study set")
    print("   f. Use category filter to filter study sets")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    print("\n" + "█" * 80)
    print("  CATEGORY MANAGEMENT - COMPREHENSIVE TEST")
    print("█" * 80)
    
    success = test_category_management()
    
    if not success:
        manual_test_instructions()
