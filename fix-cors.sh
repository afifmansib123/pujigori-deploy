#!/bin/bash
# Quick CORS Fix Script for EC2
# Run this on your EC2 instance

echo "🔧 Fixing CORS Configuration..."

# Navigate to server directory
cd ~/pujigori-deploy/server || cd /home/ubuntu/pujigori-deploy/server || cd /home/ec2-user/pujigori-deploy/server

# Backup old .env
cp .env .env.backup.$(date +%s) 2>/dev/null

# Update CORS-related environment variables
echo "📝 Updating environment variables..."

# Remove old FRONTEND_URL and ALLOWED_ORIGINS lines
grep -v "^FRONTEND_URL=" .env > .env.tmp 2>/dev/null || touch .env.tmp
grep -v "^ALLOWED_ORIGINS=" .env.tmp > .env.tmp2
mv .env.tmp2 .env.tmp

# Add new CORS settings
echo "" >> .env.tmp
echo "# Frontend URLs (for CORS and redirects)" >> .env.tmp
echo "FRONTEND_URL=https://pujigori-deploy.vercel.app" >> .env.tmp
echo "FRONTEND_SUCCESS_URL=https://pujigori-deploy.vercel.app/payment/success" >> .env.tmp
echo "FRONTEND_FAIL_URL=https://pujigori-deploy.vercel.app/payment/failed" >> .env.tmp
echo "ALLOWED_ORIGINS=https://pujigori-deploy.vercel.app,https://pujigori-deploy-git-*.vercel.app,http://localhost:3000" >> .env.tmp

# Replace old .env with new one
mv .env.tmp .env

echo "✅ Environment variables updated"

# Show the CORS-related variables
echo ""
echo "🔍 Current CORS settings:"
grep "FRONTEND_URL\|ALLOWED_ORIGINS" .env

echo ""
echo "🔄 Restarting PM2..."
pm2 restart all

echo ""
echo "✅ Done! Checking PM2 status..."
pm2 status

echo ""
echo "📊 Checking logs for CORS configuration..."
sleep 2
pm2 logs --lines 20 --nostream

echo ""
echo "✅ CORS fix complete!"
echo "🌐 Your frontend (https://pujigori-deploy.vercel.app) should now be able to connect!"
