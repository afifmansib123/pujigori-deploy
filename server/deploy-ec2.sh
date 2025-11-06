#!/bin/bash

###############################################################################
# PujiGori Backend - EC2 Deployment Script
#
# This script automates the deployment process on AWS EC2
# Run this script on your EC2 instance after initial setup
###############################################################################

set -e  # Exit on any error

echo "🚀 Starting PujiGori Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$HOME/pujigori-backend"
REPO_URL="https://github.com/afifmansib123/pujigori-deploy.git"
BRANCH="main"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please do not run this script as root${NC}"
    exit 1
fi

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Step 1: Pull latest code
print_info "Pulling latest code from repository..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull origin "$BRANCH"
    print_success "Code updated"
else
    cd "$HOME"
    git clone "$REPO_URL" pujigori-backend
    cd "$APP_DIR"
    print_success "Repository cloned"
fi

# Navigate to server directory
cd "$APP_DIR/server"

# Step 2: Install dependencies
print_info "Installing dependencies..."
npm ci --only=production
print_success "Dependencies installed"

# Step 3: Build TypeScript
print_info "Building TypeScript..."
npm run build
print_success "Build completed"

# Step 4: Create logs directory
mkdir -p logs
print_success "Logs directory created"

# Step 5: Restart PM2 process
print_info "Restarting application with PM2..."
if pm2 describe pujigori-backend > /dev/null 2>&1; then
    pm2 restart ecosystem.config.js
    print_success "Application restarted"
else
    pm2 start ecosystem.config.js
    pm2 save
    print_success "Application started"
fi

# Step 6: Show status
echo ""
print_success "Deployment completed successfully!"
echo ""
print_info "Application Status:"
pm2 status pujigori-backend

echo ""
print_info "View logs with: pm2 logs pujigori-backend"
print_info "Monitor with: pm2 monit"
print_info "Stop with: pm2 stop pujigori-backend"

echo ""
print_success "🎉 Deployment finished!"
