#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Headless Builder API${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Register
echo -e "${GREEN}1. Creating test account...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@agency.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "agencyName": "Test Agency"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get token. Trying to login instead...${NC}"

  LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@agency.com",
      "password": "password123"
    }')

  echo "$LOGIN_RESPONSE" | jq '.'
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
fi

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to authenticate. Exiting.${NC}"
  exit 1
fi

echo -e "${GREEN}Token obtained: ${TOKEN:0:20}...${NC}\n"

# Step 2: Create Hero Component
echo -e "${GREEN}2. Creating Hero component...${NC}"
HERO_RESPONSE=$(curl -s -X POST $API_URL/api/components \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Hero Section",
    "category": "Hero",
    "description": "Section hero avec titre, sous-titre et CTA",
    "schema": {
      "fields": [
        {
          "name": "title",
          "type": "text",
          "label": "Titre principal",
          "required": true,
          "defaultValue": "Bienvenue"
        },
        {
          "name": "subtitle",
          "type": "textarea",
          "label": "Sous-titre"
        },
        {
          "name": "backgroundImage",
          "type": "image",
          "label": "Image de fond"
        },
        {
          "name": "ctaText",
          "type": "text",
          "label": "Texte du bouton",
          "defaultValue": "En savoir plus"
        },
        {
          "name": "ctaUrl",
          "type": "url",
          "label": "Lien du bouton"
        }
      ]
    }
  }')

echo "$HERO_RESPONSE" | jq '.'
HERO_ID=$(echo "$HERO_RESPONSE" | jq -r '.id')
echo -e "${GREEN}Hero ID: $HERO_ID${NC}\n"

# Step 3: Create Card Component
echo -e "${GREEN}3. Creating Card component...${NC}"
CARD_RESPONSE=$(curl -s -X POST $API_URL/api/components \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Card",
    "category": "Card",
    "description": "Carte avec image et texte",
    "schema": {
      "fields": [
        {
          "name": "image",
          "type": "image",
          "label": "Image",
          "required": true
        },
        {
          "name": "title",
          "type": "text",
          "label": "Titre",
          "required": true
        },
        {
          "name": "description",
          "type": "textarea",
          "label": "Description"
        }
      ]
    }
  }')

echo "$CARD_RESPONSE" | jq '.'
CARD_ID=$(echo "$CARD_RESPONSE" | jq -r '.id')
echo -e "${GREEN}Card ID: $CARD_ID${NC}\n"

# Step 4: List all components
echo -e "${GREEN}4. Listing all components...${NC}"
curl -s $API_URL/api/components \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Step 5: Get Hero component details
echo -e "${GREEN}5. Getting Hero component details...${NC}"
curl -s $API_URL/api/components/$HERO_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Step 6: Update Hero component
echo -e "${GREEN}6. Updating Hero component...${NC}"
curl -s -X PUT $API_URL/api/components/$HERO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "description": "Section hero mise à jour avec nouveau design"
  }' | jq '.'
echo ""

# Step 7: Filter by category
echo -e "${GREEN}7. Filtering components by category (Hero)...${NC}"
curl -s "$API_URL/api/components?category=Hero" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Step 8: Search components
echo -e "${GREEN}8. Searching components (hero)...${NC}"
curl -s "$API_URL/api/components?search=hero" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\nComponent IDs for manual testing:"
echo -e "Hero: ${GREEN}$HERO_ID${NC}"
echo -e "Card: ${GREEN}$CARD_ID${NC}"
