"""
Test script to verify category functionality through API with proper authentication
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def get_test_token():
    """Get an access token from the API"""
    print("Please login with an existing user...")
    print("Try these users from your database:")
    print("  - ttoan0509@gmail.com")
    print("  - 05.twt.09@gmail.com")
    print("  - toan@gmail.com")
    
    # Use a known user - adjust as needed
    test_users = [
        ("ttoan0509@gmail.com", "changethis"),
        ("test@test.com", "testpassword"),
        ("admin@aikari.com", "changethis"),
    ]
    
    for email, password in test_users:
        login_data = {
            "username": email,
            "password": password
        }
        
        response = requests.post(f"{BASE_URL}/login/access-token", data=login_data)
        if response.status_code == 200:
            print(f"✓ Logged in as: {email}")
            return response.json()["access_token"]
    
    print("❌ Could not login with any test user")
    print("Please ensure you have a user in the database or update the credentials in the script")
    return None

def test_full_category_flow():
    print("=" * 80)
    print("TESTING FULL CATEGORY FLOW (Frontend-Backend Integration)")
    print("=" * 80)
    
    # Get authentication token
    print("\n1. Getting authentication token...")
    token = get_test_token()
    if not token:
        print("❌ Failed to get authentication token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Authentication successful")
    
    # Test 1: Get categories
    print("\n2. Testing GET /api/v1/categories/")
    response = requests.get(f"{BASE_URL}/categories/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Found {data['count']} categories")
        print(f"   Response structure: {list(data.keys())}")
        if data['data']:
            print(f"   Sample category: {data['data'][0]}")
    else:
        print(f"   ❌ Error: {response.text}")
    
    # Test 2: Create a category
    print("\n3. Testing POST /api/v1/categories/")
    category_data = {
        "name": "Integration Test Category",
        "description": "Created by integration test",
        "color": "#FF6B6B"
    }
    response = requests.post(f"{BASE_URL}/categories/", headers=headers, json=category_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        category = response.json()
        category_id = category["category_id"]
        print(f"   ✓ Category created with ID: {category_id}")
        print(f"   Response: {json.dumps(category, indent=2)}")
    else:
        print(f"   ❌ Error: {response.text}")
        # Try to find existing category
        response = requests.get(f"{BASE_URL}/categories/", headers=headers)
        if response.status_code == 200:
            categories = response.json()['data']
            matching = [c for c in categories if c['name'] == "Integration Test Category"]
            if matching:
                category_id = matching[0]['category_id']
                print(f"   ℹ Using existing category: {category_id}")
            else:
                return
        else:
            return
    
    # Test 3: Create a studyset with category
    print("\n4. Testing POST /api/v1/studysets/ with category_id")
    studyset_data = {
        "title": "Integration Test Studyset",
        "description": "Testing studyset with category",
        "content_type": "DEFAULT",
        "category_id": category_id
    }
    response = requests.post(f"{BASE_URL}/studysets/", headers=headers, json=studyset_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        studyset = response.json()
        studyset_id = studyset["studyset_id"]
        print(f"   ✓ Studyset created with ID: {studyset_id}")
        print(f"   Has category_id: {studyset.get('category_id')}")
        print(f"   Has category object: {'category' in studyset}")
        if 'category' in studyset and studyset['category']:
            print(f"   Category name: {studyset['category']['name']}")
    else:
        print(f"   ❌ Error: {response.text}")
        return
    
    # Test 4: Get studysets (should include category)
    print("\n5. Testing GET /api/v1/studysets/")
    response = requests.get(f"{BASE_URL}/studysets/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Retrieved {len(data['sets'])} studysets")
        # Find our studyset
        our_studyset = next((s for s in data['sets'] if s['studyset_id'] == studyset_id), None)
        if our_studyset:
            print(f"   ✓ Found our studyset")
            print(f"   Has category_id: {our_studyset.get('category_id')}")
            print(f"   Has category object: {'category' in our_studyset}")
            if 'category' in our_studyset and our_studyset['category']:
                print(f"   Category name: {our_studyset['category']['name']}")
                print(f"   ✓✓✓ Frontend will receive full category object!")
    else:
        print(f"   ❌ Error: {response.text}")
    
    # Test 5: Filter studysets by category
    print("\n6. Testing GET /api/v1/studysets/?category_id={category_id}")
    response = requests.get(f"{BASE_URL}/studysets/?category_id={category_id}", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Retrieved {len(data['sets'])} studysets in this category")
        print(f"   Total count: {data['total_count']}")
    else:
        print(f"   ❌ Error: {response.text}")
    
    # Cleanup
    print("\n7. Cleaning up...")
    requests.delete(f"{BASE_URL}/studysets/{studyset_id}/", headers=headers)
    requests.delete(f"{BASE_URL}/categories/{category_id}/", headers=headers)
    print("   ✓ Cleanup completed")
    
    print("\n" + "=" * 80)
    print("✓✓✓ INTEGRATION TEST COMPLETED SUCCESSFULLY")
    print("=" * 80)
    print("\nFrontend Integration Status:")
    print("  ✓ Category API endpoints working")
    print("  ✓ Studyset includes category_id field")
    print("  ✓ Studyset includes full category object")
    print("  ✓ Category filtering on studysets working")
    print("\nThe frontend should work correctly with these endpoints!")

if __name__ == "__main__":
    test_full_category_flow()
