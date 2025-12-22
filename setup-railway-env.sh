#!/bin/bash
# Railway Environment Variables Setup Script
# Run this to set up environment variables for Railway backend service

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Railway Environment Variables Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Please set the following environment variables in Railway Dashboard:${NC}\n"
echo -e "${YELLOW}Go to: Railway → Select Project → Backend Service → Variables${NC}\n"

# Display all variables
variables=(
    "PORT=5000"
    "NODE_ENV=production"
    "DB_HOST=shuttle.proxy.rlwy.net"
    "DB_PORT=43358"
    "DB_USER=root"
    "DB_PASSWORD=wKdNtcTjTLGpGzQyIAmhxyEsAyLlSBGC"
    "DB_NAME=railway"
    "JWT_SECRET=1a3a0a279b9fd4bb17aa84f910a4884d957c1343d757c425975eb706c70d808d6cb3cda1d2eeab5344ece3fa16667ebbe43e089ffa93f87e401935b150c11cc3"
    "EMAIL_USER=amishanabila37@gmail.com"
    "EMAIL_PASSWORD=xawn wvup jarh lfde"
    "FRONTEND_URL=https://ippl-quiz-master.vercel.app"
)

echo -e "${GREEN}Copy and paste each variable:${NC}\n"
for var in "${variables[@]}"; do
    echo -e "${GREEN}✓${NC} $var"
done

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}After setting variables:${NC}"
echo -e "${BLUE}1. Save and Railway will auto-redeploy${NC}"
echo -e "${BLUE}2. Check deployment logs${NC}"
echo -e "${BLUE}3. Test /health endpoint${NC}"
echo -e "${BLUE}========================================${NC}\n"
