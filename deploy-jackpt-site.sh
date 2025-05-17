#!/bin/bash

# Deployment script for MetaMask game on Ubuntu NodeJS droplet
# Server: 134.209.83.136
# Domain: jackpt.com
# User: root
# Repository: https://github.com/Webners1/jckpt-web.git

# Exit on any error
set -e

# Configuration variables
SERVER_IP="134.209.83.136"
SERVER_USER="root"
SERVER_PASS="BGmKYP2QU^qESq"
DOMAIN="jackpt.com"
APP_DIR="/var/www/metamask-game"
PORT=3001
REPO_URL="https://github.com/Webners1/jckpt-web.git"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
print_section() {
    echo -e "\n${GREEN}==== $1 ====${NC}\n"
}

# Connect to server and run command
run_ssh_command() {
    ssh ${SERVER_USER}@${SERVER_IP} "$1"
}

# Main deployment process
print_section "Starting deployment to ${SERVER_IP}"

# Update system and install dependencies
print_section "Updating system and installing dependencies"
run_ssh_command "apt update && apt upgrade -y"
run_ssh_command "apt install -y curl git build-essential nginx certbot python3-certbot-nginx"

# Install Node.js if not already installed
print_section "Setting up Node.js"
run_ssh_command "if ! command -v node &> /dev/null; then curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install -y nodejs; fi"
run_ssh_command "if ! command -v pm2 &> /dev/null; then npm install -g pm2; fi"
run_ssh_command "node -v && npm -v"

# Create application directory
print_section "Setting up application directory"
run_ssh_command "mkdir -p ${APP_DIR}"

# Clone or update repository
print_section "Cloning/updating repository"
run_ssh_command "if [ -d \"${APP_DIR}/.git\" ]; then cd ${APP_DIR} && git pull; else git clone ${REPO_URL} ${APP_DIR}; fi"

# Create server.js file
print_section "Creating Express server"
cat > server.js.tmp << 'EOL'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

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

# Create package.json if it doesn't exist
print_section "Setting up package.json"
run_ssh_command "if [ ! -f \"${APP_DIR}/package.json\" ]; then 
cat > ${APP_DIR}/package.json << 'EOL'
{
  \"name\": \"metamask-game\",
  \"version\": \"1.0.0\",
  \"description\": \"MetaMask-enabled web game\",
  \"main\": \"server.js\",
  \"scripts\": {
    \"start\": \"node server.js\"
  },
  \"dependencies\": {
    \"express\": \"^4.18.2\"
  }
}
EOL
fi"

# Install dependencies
print_section "Installing Node.js dependencies"
run_ssh_command "cd ${APP_DIR} && npm install"

# Configure Nginx
print_section "Configuring Nginx"
run_ssh_command "cat > /etc/nginx/sites-available/${DOMAIN} << 'EOL'
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOL"

# Enable the site
run_ssh_command "ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/"
run_ssh_command "rm -f /etc/nginx/sites-enabled/default"
run_ssh_command "nginx -t && systemctl restart nginx"

# Set up SSL with Let's Encrypt
print_section "Setting up SSL with Let's Encrypt"
run_ssh_command "certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN}"

# Start the application with PM2
print_section "Starting the application with PM2"
run_ssh_command "cd ${APP_DIR} && pm2 stop metamask-game 2>/dev/null || true"
run_ssh_command "cd ${APP_DIR} && pm2 delete metamask-game 2>/dev/null || true"
run_ssh_command "cd ${APP_DIR} && pm2 start server.js --name metamask-game"
run_ssh_command "pm2 save"
run_ssh_command "pm2 startup"

# Check status
print_section "Checking deployment status"
run_ssh_command "pm2 status"
run_ssh_command "curl -I http://${DOMAIN} || echo 'Site not yet accessible'"

# Final message
print_section "Deployment Complete!"
echo -e "${GREEN}Your MetaMask game website has been deployed successfully!${NC}"
echo -e "It should now be accessible at: ${GREEN}https://${DOMAIN}${NC}"
echo -e "\nTo check the status of your application, run: ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'${NC}"
echo -e "To view logs, run: ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs metamask-game'${NC}"
echo -e "To restart the application, run: ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart metamask-game'${NC}"
