#!/bin/bash

# Cleanup and setup script for MetaMask game on Ubuntu NodeJS droplet
# This script will:
# 1. Clean up existing configurations
# 2. Set up the MetaMask game properly

# Exit on any error
set -e

# Configuration variables
DOMAIN="jackpt.com"
APP_NAME="metamask-game"
APP_DIR="/var/www/$APP_NAME"
PORT=3001

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
print_section() {
    echo -e "\n${GREEN}==== $1 ====${NC}\n"
}

# Cleanup existing configurations
print_section "Cleaning up existing configurations"

# Stop any existing PM2 processes
echo "Stopping any existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Find and kill any processes using port 3000 or 3001
echo "Killing any processes using ports 3000 or 3001..."
kill $(lsof -t -i:3000) 2>/dev/null || true
kill $(lsof -t -i:3001) 2>/dev/null || true

# Clean up Nginx configurations
echo "Cleaning up Nginx configurations..."
rm -f /etc/nginx/sites-enabled/* 2>/dev/null || true
rm -f /etc/nginx/sites-available/$DOMAIN 2>/dev/null || true

# Create application directory
print_section "Setting up application directory"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/config
chown -R $USER:$USER $APP_DIR

# Copy website files to the application directory
print_section "Copying website files"
cp -r /root/index.html $APP_DIR/ 2>/dev/null || true
cp -r /root/config $APP_DIR/ 2>/dev/null || true

# Create server.js file
print_section "Creating Express server"
cat > $APP_DIR/server.js << 'EOL'
/**
 * Express server for MetaMask-enabled web game
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Middleware for logging
app.use((req, res, next) => {
  const now = new Date();
  console.log(`${now.toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle all other routes and serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
EOL

# Create package.json
print_section "Creating package.json"
cat > $APP_DIR/package.json << 'EOL'
{
  "name": "metamask-game",
  "version": "1.0.0",
  "description": "MetaMask-enabled web game",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOL

# Install dependencies
print_section "Installing Node.js dependencies"
cd $APP_DIR
npm install

# Configure Nginx
print_section "Configuring Nginx"
cat > /etc/nginx/sites-available/$DOMAIN << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Configure PM2 to start the application
print_section "Configuring PM2"
cd $APP_DIR
pm2 start server.js --name $APP_NAME
pm2 save
pm2 startup

# Set up SSL with Let's Encrypt
print_section "Setting up SSL with Let's Encrypt"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

# Final instructions
print_section "Setup Complete!"
echo -e "Your website should now be accessible at: ${GREEN}https://$DOMAIN${NC}"
echo -e "\nTo check the status of your application, run: ${YELLOW}pm2 status${NC}"
echo -e "To view logs, run: ${YELLOW}pm2 logs $APP_NAME${NC}"

# Check if the site is accessible
print_section "Checking if the site is accessible"
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN || echo "Failed")
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo -e "${GREEN}Site is accessible!${NC}"
    else
        echo -e "${YELLOW}Site returned HTTP status $HTTP_STATUS. You may need to check your configuration.${NC}"
    fi
else
    echo -e "${YELLOW}curl is not installed. Please check manually if the site is accessible.${NC}"
fi

echo -e "\n${GREEN}Setup script completed!${NC}"
