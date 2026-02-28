#!/bin/bash

# HR Override Endpoint Test Script
# This script tests the new /api/leaves/:id/override endpoint

echo "🧪 Testing HR Override Endpoint"
echo "================================"
echo ""

# Configuration
API_URL="http://localhost:5000/api"
LEAVE_ID="YOUR_LEAVE_ID_HERE"
TOKEN="YOUR_HR_ADMIN_TOKEN_HERE"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Test Configuration:"
echo "   API URL: $API_URL"
echo "   Leave ID: $LEAVE_ID"
echo "   Token: ${TOKEN:0:20}..."
echo ""

# Test 1: Override Approve
echo "Test 1: Override Approve"
echo "------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/leaves/$LEAVE_ID/override" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "comment": "Test override approve"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Success${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Failed${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 2: Override Reject
echo "Test 2: Override Reject"
echo "------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/leaves/$LEAVE_ID/override" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "comment": "Test override reject"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Success${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Failed${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 3: Invalid Status
echo "Test 3: Invalid Status (Should Fail)"
echo "-------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/leaves/$LEAVE_ID/override" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INVALID",
    "comment": "Test invalid status"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Correctly Rejected${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Should have failed with 400${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 4: Missing Comment
echo "Test 4: Missing Comment (Should Fail)"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/leaves/$LEAVE_ID/override" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Correctly Rejected${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Should have failed with 400${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 5: Invalid Leave ID
echo "Test 5: Invalid Leave ID (Should Fail)"
echo "---------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/leaves/invalid_id/override" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "comment": "Test invalid ID"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Correctly Rejected${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Should have failed with 400${NC} (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 6: Response Time
echo "Test 6: Response Time Check"
echo "----------------------------"
START=$(date +%s%N)
curl -s -X PUT "$API_URL/leaves/$LEAVE_ID/override" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "comment": "Response time test"
  }' > /dev/null
END=$(date +%s%N)
DURATION=$((($END - $START) / 1000000))

if [ $DURATION -lt 2000 ]; then
  echo -e "${GREEN}✅ Fast Response${NC} (${DURATION}ms)"
else
  echo -e "${YELLOW}⚠️  Slow Response${NC} (${DURATION}ms)"
fi
echo ""

echo "================================"
echo "🎉 Testing Complete"
echo ""
echo "Next Steps:"
echo "1. Check backend logs for any errors"
echo "2. Verify database updates"
echo "3. Test in frontend UI"
echo "4. Check audit trail entries"
