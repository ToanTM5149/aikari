#!/bin/bash

# Admin Statistics API Test Script
# This script tests all admin endpoints using curl

set -e

BASE_URL="http://localhost:8000/api"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="changethis123"

echo "════════════════════════════════════════════════════════════════"
echo "  Admin Statistics API Test"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Login as Admin
# ============================================================================
echo -e "${BLUE}[1/10] Logging in as admin...${NC}"

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USERNAME}&password=${ADMIN_PASSWORD}")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ Failed to login. Check credentials or create admin user first.${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# ============================================================================
# 2. Test System Overview
# ============================================================================
echo -e "${BLUE}[2/10] Testing System Overview...${NC}"
curl -s -X GET "${BASE_URL}/admin/statistics/overview/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ System Overview OK${NC}\n"

# ============================================================================
# 3. Test User Statistics
# ============================================================================
echo -e "${BLUE}[3/10] Testing User Statistics...${NC}"
curl -s -X GET "${BASE_URL}/admin/statistics/users/?top_limit=5" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ User Statistics OK${NC}\n"

# ============================================================================
# 4. Test Learning Overview
# ============================================================================
echo -e "${BLUE}[4/10] Testing Learning Overview...${NC}"
curl -s -X GET "${BASE_URL}/admin/statistics/learning/overview/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ Learning Overview OK${NC}\n"

# ============================================================================
# 5. Test Learning Trends
# ============================================================================
echo -e "${BLUE}[5/10] Testing Learning Trends...${NC}"
curl -s -X GET "${BASE_URL}/admin/statistics/learning/trends/?days=7" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ Learning Trends OK${NC}\n"

# ============================================================================
# 6. Test Class Statistics
# ============================================================================
echo -e "${BLUE}[6/10] Testing Class Statistics...${NC}"
curl -s -X GET "${BASE_URL}/admin/statistics/classes/?top_limit=5" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ Class Statistics OK${NC}\n"

# ============================================================================
# 7. Test AI Usage Overview
# ============================================================================
echo -e "${BLUE}[7/10] Testing AI Usage Overview...${NC}"
curl -s -X GET "${BASE_URL}/admin/statistics/ai/overview/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ AI Usage Overview OK${NC}\n"

# ============================================================================
# 8. Test AI Usage Trends
# ============================================================================
echo -e "${BLUE}[8/10] Testing AI Usage Trends...${NC}"
curl -s -X GET "${BASE_URL}/admin/statistics/ai/trends/?days=14" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ AI Usage Trends OK${NC}\n"

# ============================================================================
# 9. Test Content Statistics
# ============================================================================
echo -e "${BLUE}[9/10] Testing Content Statistics...${NC}"
curl -s -X GET "${BASE_URL}/admin/statistics/content/?top_limit=5" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ Content Statistics OK${NC}\n"

# ============================================================================
# 10. Test Complete Dashboard
# ============================================================================
echo -e "${BLUE}[10/10] Testing Complete Dashboard...${NC}"
curl -s -X GET "${BASE_URL}/admin/dashboard/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
echo -e "${GREEN}✅ Complete Dashboard OK${NC}\n"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ All Admin API Tests Passed!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Available Endpoints:"
echo "  • GET /api/admin/dashboard/"
echo "  • GET /api/admin/statistics/overview/"
echo "  • GET /api/admin/statistics/users/"
echo "  • GET /api/admin/statistics/learning/overview/"
echo "  • GET /api/admin/statistics/learning/trends/"
echo "  • GET /api/admin/statistics/classes/"
echo "  • GET /api/admin/statistics/ai/overview/"
echo "  • GET /api/admin/statistics/ai/trends/"
echo "  • GET /api/admin/statistics/content/"
echo ""
