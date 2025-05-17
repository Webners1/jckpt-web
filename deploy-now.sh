#!/bin/bash

# Simple deployment script for jackpt.com
# Server: 134.209.83.136
# User: root
# Domain: jackpt.com

# Exit on any error
set -e

# Server details
SERVER="root@134.209.83.136"
APP_DIR="/var/www/metamask-game"
PORT=3001

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==== Deploying to jackpt.com ====${NC}\n"

# Check SSH connection
echo -e "${YELLOW}Checking SSH connection...${NC}"
ssh -q $SERVER exit
if [ $? -eq 0 ]; then
  echo -e "${GREEN}SSH connection successful!${NC}"
else
  echo -e "${RED}SSH connection failed. Please check your SSH configuration.${NC}"
  exit 1
fi

# Create application directory if it doesn't exist
echo -e "\n${YELLOW}Creating application directory...${NC}"
ssh $SERVER "mkdir -p $APP_DIR"

# Configure Nginx
echo -e "\n${YELLOW}Configuring Nginx...${NC}"
ssh $SERVER "cat > /etc/nginx/sites-available/jackpt.com << 'EOL'
server {
    listen 80;
    server_name jackpt.com www.jackpt.com;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOL"

# Enable the site
echo -e "\n${YELLOW}Enabling site...${NC}"
ssh $SERVER "ln -sf /etc/nginx/sites-available/jackpt.com /etc/nginx/sites-enabled/"
ssh $SERVER "rm -f /etc/nginx/sites-enabled/default"
ssh $SERVER "nginx -t && systemctl restart nginx"

# Set up SSL with Let's Encrypt
echo -e "\n${YELLOW}Setting up SSL...${NC}"
ssh $SERVER "certbot --nginx -d jackpt.com -d www.jackpt.com --non-interactive --agree-tos -m admin@jackpt.com"

# Clone or update the GitHub repository
echo -e "\n${YELLOW}Cloning/updating GitHub repository...${NC}"
REPO_URL="https://github.com/Webners1/jckpt-web.git"

# Check if the directory already has a git repository
ssh $SERVER "if [ -d \"$APP_DIR/.git\" ]; then
  cd $APP_DIR && git fetch && git reset --hard origin/master
else
  rm -rf $APP_DIR/* && git clone $REPO_URL $APP_DIR
fi"

echo -e "${GREEN}Repository cloned/updated successfully!${NC}"

# Create server.js file
echo -e "\n${YELLOW}Creating server.js file...${NC}"
cat > server.js.tmp << 'EOL'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Handle all routes and serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOL
scp server.js.tmp $SERVER:$APP_DIR/server.js
rm server.js.tmp

# Create package.json if it doesn't exist
echo -e "\n${YELLOW}Creating package.json file...${NC}"
ssh $SERVER "if [ ! -f \"$APP_DIR/package.json\" ]; then
cat > $APP_DIR/package.json << 'EOL'
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
echo -e "\n${YELLOW}Installing dependencies...${NC}"
ssh $SERVER "cd $APP_DIR && npm install"

# Start the application with PM2
echo -e "\n${YELLOW}Starting application with PM2...${NC}"
ssh $SERVER "cd $APP_DIR && npm install -g pm2"
ssh $SERVER "cd $APP_DIR && pm2 stop metamask-game 2>/dev/null || true"
ssh $SERVER "cd $APP_DIR && pm2 delete metamask-game 2>/dev/null || true"
ssh $SERVER "cd $APP_DIR && pm2 start server.js --name metamask-game"
ssh $SERVER "pm2 save"
ssh $SERVER "pm2 startup"

# Check status
echo -e "\n${YELLOW}Checking deployment status...${NC}"
ssh $SERVER "pm2 status"

# Final message
echo -e "\n${GREEN}==== Deployment Complete! ====${NC}"
echo -e "Your website should now be accessible at: ${GREEN}https://jackpt.com${NC}"
echo -e "\nTo check the status of your application, run: ${YELLOW}ssh root@134.209.83.136 'pm2 status'${NC}"
echo -e "To view logs, run: ${YELLOW}ssh root@134.209.83.136 'pm2 logs metamask-game'${NC}"
echo -e "To restart the application, run: ${YELLOW}ssh root@134.209.83.136 'pm2 restart metamask-game'${NC}"
