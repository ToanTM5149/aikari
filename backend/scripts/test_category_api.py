"""
Test script to verify category functionality
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_categories():
    print("=" * 60)
    print("TESTING CATEGORY FUNCTIONALITY")
    print("=" * 60)
    
    # Step 1: Login
    print("\n1. Logging in...")
    login_data = {
        "username": "ttoan0509@gmail.com",  # Adjust as needed
        "password": "123456"  # Adjust as needed
    }
    
    response = requests.post(f"{BASE_URL}/login/access-token", data=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful")
    
    # Step 2: Get existing categories
    print("\n2. Getting existing categories...")
    response = requests.get(f"{BASE_URL}/categories/", headers=headers)
    if response.status_code == 200:
        categories = response.json()
        print(f"✓ Found {categories['count']} existing categories")
        for cat in categories['data']:
            print(f"  - {cat['name']} (ID: {cat['category_id']})")
    else:
        print(f"❌ Failed to get categories: {response.status_code}")
        print(response.text)
    
    # Step 3: Create a new category
    print("\n3. Creating a new category...")
    new_category = {
        "name": "Test Category",
        "description": "A test category created by the test script",
        "color": "#FF5733"
    }
    
    response = requests.post(f"{BASE_URL}/categories/", headers=headers, json=new_category)
    if response.status_code == 200:
        created_cat = response.json()
        category_id = created_cat["category_id"]
        print(f"✓ Category created successfully (ID: {category_id})")
        print(f"  Name: {created_cat['name']}")
        print(f"  Description: {created_cat['description']}")
        print(f"  Color: {created_cat['color']}")
    else:
        print(f"❌ Failed to create category: {response.status_code}")
        print(response.text)
        # If it already exists, try to get it
        response = requests.get(f"{BASE_URL}/categories/", headers=headers)
        if response.status_code == 200:
            categories = response.json()
            for cat in categories['data']:
                if cat['name'] == "Test Category":
                    category_id = cat['category_id']
                    print(f"ℹ Using existing category (ID: {category_id})")
                    break
        return
    
    # Step 4: Get single category
    print("\n4. Getting the created category by ID...")
    response = requests.get(f"{BASE_URL}/categories/{category_id}/", headers=headers)
    if response.status_code == 200:
        cat = response.json()
        print(f"✓ Category retrieved successfully")
        print(f"  Name: {cat['name']}")
    else:
        print(f"❌ Failed to get category: {response.status_code}")
        print(response.text)
    
    # Step 5: Update category
    print("\n5. Updating the category...")
    update_data = {
        "name": "Updated Test Category",
        "description": "This category was updated",
        "color": "#00FF00"
    }
    
    response = requests.put(f"{BASE_URL}/categories/{category_id}/", headers=headers, json=update_data)
    if response.status_code == 200:
        updated_cat = response.json()
        print(f"✓ Category updated successfully")
        print(f"  New Name: {updated_cat['name']}")
        print(f"  New Description: {updated_cat['description']}")
        print(f"  New Color: {updated_cat['color']}")
    else:
        print(f"❌ Failed to update category: {response.status_code}")
        print(response.text)
    
    # Step 6: Get categories with count
    print("\n6. Getting categories with studyset count...")
    response = requests.get(f"{BASE_URL}/categories/with-count/", headers=headers)
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Retrieved {result['count']} categories with counts")
        for cat in result['data']:
            print(f"  - {cat['name']}: {cat['studyset_count']} studysets")
    else:
        print(f"❌ Failed to get categories with count: {response.status_code}")
        print(response.text)
    
    # Step 7: Create studyset with category
    print("\n7. Creating a studyset with the category...")
    studyset_data = {
        "title": "Test Studyset with Category",
        "description": "Testing category assignment",
        "category_id": category_id,
        "content_type": "DEFAULT"
    }
    
    response = requests.post(f"{BASE_URL}/studysets/", headers=headers, json=studyset_data)
    if response.status_code == 200:
        studyset = response.json()
        studyset_id = studyset["studyset_id"]
        print(f"✓ Studyset created successfully (ID: {studyset_id})")
        print(f"  Title: {studyset['title']}")
        print(f"  Category ID: {studyset.get('category_id')}")
    else:
        print(f"❌ Failed to create studyset: {response.status_code}")
        print(response.text)
        studyset_id = None
    
    # Step 8: Get studysets filtered by category
    print("\n8. Getting studysets filtered by category...")
    response = requests.get(f"{BASE_URL}/studysets/?category_id={category_id}", headers=headers)
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Found {result['total_count']} studysets in this category")
        for ss in result['sets']:
            print(f"  - {ss['title']}")
    else:
        print(f"❌ Failed to get studysets by category: {response.status_code}")
        print(response.text)
    
    # Step 9: Delete studyset (cleanup)
    if studyset_id:
        print("\n9. Deleting test studyset...")
        response = requests.delete(f"{BASE_URL}/studysets/{studyset_id}/", headers=headers)
        if response.status_code == 200:
            print(f"✓ Studyset deleted successfully")
        else:
            print(f"❌ Failed to delete studyset: {response.status_code}")
            print(response.text)
    
    # Step 10: Delete category (cleanup)
    print("\n10. Deleting test category...")
    response = requests.delete(f"{BASE_URL}/categories/{category_id}/", headers=headers)
    if response.status_code == 200:
        print(f"✓ Category deleted successfully")
    else:
        print(f"❌ Failed to delete category: {response.status_code}")
        print(response.text)
    
    print("\n" + "=" * 60)
    print("CATEGORY TESTING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_categories()
