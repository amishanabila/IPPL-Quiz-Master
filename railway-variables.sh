#!/bin/bash
# This script shows the exact variables to set in Railway Dashboard

echo "=========================================="
echo "RAILWAY BACKEND ENVIRONMENT VARIABLES"
echo "=========================================="
echo ""
echo "Go to: railway.app → IPPL-Quiz-Master → Backend → Variables"
echo ""
echo "Add/Update these variables (copy-paste each line):"
echo ""
echo "------- START COPY -------"
cat << 'EOF'
PORT=5000
NODE_ENV=production
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_USER=root
DB_PASSWORD=wKdNtcTjTLGpGzQyIAmhxyEsAyLlSBGC
DB_NAME=railway
JWT_SECRET=1a3a0a279b9fd4bb17aa84f910a4884d957c1343d757c425975eb706c70d808d6cb3cda1d2eeab5344ece3fa16667ebbe43e089ffa93f87e401935b150c11cc3
EMAIL_USER=amishanabila37@gmail.com
EMAIL_PASSWORD=xawn wvup jarh lfde
FRONTEND_URL=https://ippl-quiz-master.vercel.app
EOF
echo ""
echo "------- END COPY -------"
echo ""
echo "After adding variables:"
echo "1. Click 'Save Variables'"
echo "2. Wait for auto-redeploy (1-2 minutes)"
echo "3. Test /health endpoint"
echo ""
echo "=========================================="
