#!/bin/bash

# Quick fix script for Rollup native binary issue
# This script fixes the current deployment without running the full deployment script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/jckpt-web"
APP_NAME="jckpt-web"

echo -e "${GREEN}=== Quick Fix for Rollup Native Binary Issue ===${NC}\n"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}This script must be run as root${NC}"
    exit 1
fi

# Navigate to the project directory
cd $APP_DIR/repo || {
    echo -e "${RED}Could not navigate to $APP_DIR/repo${NC}"
    exit 1
}

echo -e "${YELLOW}Current directory: $(pwd)${NC}"

# Stop the current PM2 process
echo -e "${GREEN}Stopping current PM2 process...${NC}"
pm2 stop $APP_NAME 2>/dev/null || true

# Fix Rollup native binary issue
echo -e "${GREEN}Fixing Rollup native binary dependencies...${NC}"

# Remove node_modules and package-lock.json to start fresh
echo "Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Set npm configuration for Linux x64
echo "Setting npm configuration for Linux x64..."
npm config set target_arch x64
npm config set target_platform linux

# Install dependencies with specific Rollup binaries
echo "Installing dependencies with Rollup native binaries..."
npm install --legacy-peer-deps

# Install specific Rollup native binaries
echo "Installing Rollup native binaries..."
npm install @rollup/rollup-linux-x64-gnu --save-dev --legacy-peer-deps || echo "Failed to install @rollup/rollup-linux-x64-gnu"
npm install @rollup/rollup-linux-x64-musl --save-dev --legacy-peer-deps || echo "Failed to install @rollup/rollup-linux-x64-musl"

# Install Rollup globally as fallback
echo "Installing Rollup globally as fallback..."
npm install -g rollup || echo "Failed to install rollup globally"

# Rebuild native dependencies
echo "Rebuilding native dependencies..."
npm rebuild --legacy-peer-deps || echo "Failed to rebuild dependencies"

# Final install to ensure everything is in place
echo "Final dependency installation..."
npm install --legacy-peer-deps

# Test if Vite can start
echo -e "${GREEN}Testing if Vite can start...${NC}"
timeout 10s npm run dev > /tmp/vite-test.log 2>&1 &
VITE_PID=$!
sleep 5

# Check if Vite started successfully
if ps -p $VITE_PID > /dev/null; then
    echo -e "${GREEN}✅ Vite started successfully!${NC}"
    kill $VITE_PID 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Vite test completed. Check logs for details.${NC}"
fi

# Show any error logs
if [ -f /tmp/vite-test.log ]; then
    echo -e "${YELLOW}Vite test output:${NC}"
    cat /tmp/vite-test.log
    rm /tmp/vite-test.log
fi

# Restart PM2 process
echo -e "${GREEN}Restarting PM2 process...${NC}"
pm2 restart $APP_NAME || {
    echo -e "${YELLOW}PM2 restart failed, trying to start fresh...${NC}"
    pm2 start $APP_DIR/start.sh --name $APP_NAME
}

# Show PM2 status
echo -e "${GREEN}Current PM2 status:${NC}"
pm2 status

# Show recent logs
echo -e "${GREEN}Recent application logs:${NC}"
pm2 logs $APP_NAME --lines 10

echo -e "\n${GREEN}=== Fix completed! ===${NC}"
echo -e "Check the logs above to see if the issue is resolved."
echo -e "If the application is still not working, you may need to run the full deployment script again."
