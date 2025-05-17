#!/bin/bash

# MetaMask Game Deployment Script
# This script deploys the MetaMask game website to a server
# Usage: ./deploy-metamask-game.sh [server_ip]

# Exit on any error
set -e

# Default values
SERVER_IP="134.209.83.136"
SERVER_USER="root"
DOMAIN="jackpt.com"
APP_DIR="/var/www/metamask-game"
PORT=3001

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server IP is provided as argument
if [ ! -z "$1" ]; then
  SERVER_IP="$1"
  echo -e "${YELLOW}Using server IP: ${SERVER_IP}${NC}"
fi

# Function to run commands on the server
run_on_server() {
  echo -e "${YELLOW}Running on server: $1${NC}"
  ssh ${SERVER_USER}@${SERVER_IP} "$1"
}

# Function to print section header
print_section() {
  echo -e "\n${GREEN}==== $1 ====${NC}\n"
}

# Check if we can connect to the server
print_section "Checking server connection"
if ssh -q ${SERVER_USER}@${SERVER_IP} exit; then
  echo -e "${GREEN}Connection successful!${NC}"
else
  echo -e "${RED}Failed to connect to ${SERVER_USER}@${SERVER_IP}${NC}"
  echo -e "Please check your SSH configuration and try again."
  exit 1
fi

# Update system and install dependencies
print_section "Updating system and installing dependencies"
run_on_server "apt update && apt upgrade -y"
run_on_server "apt install -y curl git build-essential nginx certbot python3-certbot-nginx"

# Install Node.js
print_section "Installing Node.js"
run_on_server "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
run_on_server "apt install -y nodejs"
run_on_server "npm install -g pm2"

# Create application directory
print_section "Creating application directory"
run_on_server "mkdir -p ${APP_DIR}"
run_on_server "mkdir -p ${APP_DIR}/images"
run_on_server "mkdir -p ${APP_DIR}/config"

# Create server.js file
print_section "Creating server.js file"
cat > server.js.tmp << 'EOL'
const express = require('express');
const path = require('path');
const fs = require('fs');
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

// Handle all routes and serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});
EOL
scp server.js.tmp ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/server.js
rm server.js.tmp

# Create package.json file
print_section "Creating package.json file"
cat > package.json.tmp << 'EOL'
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
scp package.json.tmp ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/package.json
rm package.json.tmp

# Install dependencies
print_section "Installing dependencies"
run_on_server "cd ${APP_DIR} && npm install"

# Configure Nginx
print_section "Configuring Nginx"
cat > nginx.conf.tmp << EOL
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL
scp nginx.conf.tmp ${SERVER_USER}@${SERVER_IP}:/etc/nginx/sites-available/${DOMAIN}
rm nginx.conf.tmp

# Enable the site and restart Nginx
print_section "Enabling site and restarting Nginx"
run_on_server "ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/"
run_on_server "rm -f /etc/nginx/sites-enabled/default"
run_on_server "nginx -t && systemctl restart nginx"

# Set up SSL with Let's Encrypt
print_section "Setting up SSL with Let's Encrypt"
run_on_server "certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN}"

# Transfer website files
print_section "Transferring website files"
echo -e "${YELLOW}Transferring HTML, JS, CSS, and image files...${NC}"

# Check if index.html exists in the current directory
if [ -f "index.html" ]; then
  scp index.html ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
  echo "Transferred index.html"
else
  echo -e "${RED}index.html not found in current directory${NC}"
  exit 1
fi

# Transfer JS files
for file in *.js *.static.js; do
  if [ -f "$file" ]; then
    scp "$file" ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
    echo "Transferred $file"
  fi
done

# Transfer CSS files
for file in *.css *.static.css; do
  if [ -f "$file" ]; then
    scp "$file" ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
    echo "Transferred $file"
  fi
done

# Transfer image files
for file in *.png *.jpg *.jpeg *.gif *.ico *.svg; do
  if [ -f "$file" ]; then
    scp "$file" ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/
    echo "Transferred $file"
  fi
done

# Transfer images directory if it exists
if [ -d "images" ]; then
  scp -r images/* ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/images/
  echo "Transferred images directory"
fi

# Transfer config directory if it exists
if [ -d "config" ]; then
  scp -r config/* ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/config/
  echo "Transferred config directory"
fi

# Start the application with PM2
print_section "Starting the application with PM2"
run_on_server "cd ${APP_DIR} && pm2 start server.js --name metamask-game"
run_on_server "pm2 save"
run_on_server "pm2 startup"

# Check status
print_section "Checking status"
run_on_server "pm2 status"
run_on_server "systemctl status nginx"

# Final message
print_section "Deployment Complete!"
echo -e "${GREEN}Your MetaMask game website has been deployed successfully!${NC}"
echo -e "It should now be accessible at: ${GREEN}https://${DOMAIN}${NC}"
echo -e "\nTo check the status of your application, run: ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'${NC}"
echo -e "To view logs, run: ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs metamask-game'${NC}"
echo -e "To restart the application, run: ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart metamask-game'${NC}"
