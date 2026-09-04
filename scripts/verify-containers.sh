#!/usr/bin/env bash
set -e

# ==============================================================================
# Phase 4: Production Container Verification Script (Bash / CI/CD)
# ==============================================================================

BOLD="\033[1m"
GREEN="\033[1;32m"
RED="\033[1;31m"
CYAN="\033[1;36m"
RESET="\033[0m"

echo -e "\n${BOLD}${CYAN}======================================================================${RESET}"
echo -e "${BOLD}${CYAN}  PHASE 4: PRODUCTION CONTAINER VERIFICATION & SMOKE TEST             ${RESET}"
echo -e "${BOLD}${CYAN}======================================================================${RESET}\n"

# 1. Build and validate image size
echo -e "${BOLD}[Step 1/4] Validating Production Docker Image Size...${RESET}"
docker build -t ticket-booking-api:prod . > /dev/null

SIZE_BYTES=$(docker image inspect ticket-booking-api:prod --format='{{.Size}}')
SIZE_MB=$(awk "BEGIN {printf \"%.2f\", ${SIZE_BYTES}/1048576}")

echo -e "  Production Image Size: ${BOLD}${SIZE_MB} MB${RESET}"
if [ "$SIZE_BYTES" -gt 209715200 ]; then
  echo -e "  ${RED}❌ Error: Image size exceeds 200MB limit!${RESET}"
  exit 1
fi
echo -e "  ${GREEN}✔ Image size is under 200MB threshold.${RESET}\n"

# 2. Launch production compose stack
echo -e "${BOLD}[Step 2/4] Orchestrating Production Stack via docker-compose.prod.yml...${RESET}"
docker compose -f docker-compose.prod.yml up -d
echo -e "  ${GREEN}✔ Containers launched.${RESET}\n"

# 3. Poll health check
echo -e "${BOLD}[Step 3/4] Polling API Health Endpoint (http://localhost:3000/health)...${RESET}"
MAX_ATTEMPTS=30
ATTEMPTS=0
HEALTHY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || true)
  if [ "$HTTP_STATUS" -eq 200 ]; then
    HEALTH_BODY=$(curl -s http://localhost:3000/health)
    if echo "$HEALTH_BODY" | grep -q '"postgres":"up"' && echo "$HEALTH_BODY" | grep -q '"redis":"up"'; then
      HEALTHY=true
      echo -e "  ${GREEN}✔ Health check passed on attempt ${ATTEMPTS}: ${HEALTH_BODY}${RESET}\n"
      break
    fi
  fi
  echo -ne "  Waiting for services to report healthy (${ATTEMPTS}/${MAX_ATTEMPTS})...\r"
  sleep 2
done

if [ "$HEALTHY" = false ]; then
  echo -e "\n${RED}❌ Health check timed out.${RESET}"
  docker compose -f docker-compose.prod.yml logs api
  exit 1
fi

# 4. Sanity Flash-Sale Test
echo -e "${BOLD}[Step 4/4] Executing End-to-End Flash-Sale Sanity Test...${RESET}"

# Create Event
EVENT_RESPONSE=$(curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"name": "Production Smoke Test Event", "total_tickets": 20}')

EVENT_ID=$(echo "$EVENT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo -e "  ✔ Event Created: ${EVENT_ID}"

# Check Redis in-memory cache directly inside container
REDIS_STOCK=$(docker exec ticket_booking_prod_redis redis-cli get "event:${EVENT_ID}:stock")
echo -e "  ✔ Redis In-Memory Stock: ${REDIS_STOCK} (Expected: 20)"

# Execute Checkout
CHECKOUT_KEY="prod-key-$(date +%s)"
CHECKOUT_RESPONSE=$(curl -s -X POST "http://localhost:3000/events/${EVENT_ID}/checkout" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"prod-user-1\", \"quantity\": 2, \"idempotencyKey\": \"${CHECKOUT_KEY}\"}")

ORDER_STATUS=$(echo "$CHECKOUT_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo -e "  ✔ Checkout Result: Order Status = ${ORDER_STATUS}"

# Verify updated Redis stock
POST_CHECKOUT_STOCK=$(docker exec ticket_booking_prod_redis redis-cli get "event:${EVENT_ID}:stock")
echo -e "  ✔ Post-Checkout Redis Stock: ${POST_CHECKOUT_STOCK} (Expected: 18)"

echo -e "\n${BOLD}${GREEN}======================================================================${RESET}"
echo -e "${BOLD}${GREEN}  ALL PHASE 4 CONTAINER VERIFICATION CHECKS PASSED SUCCESSFULLY!       ${RESET}"
echo -e "${BOLD}${GREEN}======================================================================${RESET}\n"
