#!/bin/bash

# Deployment script for MetaMask-enabled website on Ubuntu NodeJS droplet
# This script will:
# 1. Update the system
# 2. Install Node.js and npm
# 3. Install PM2 for process management
# 4. Set up Nginx as a reverse proxy
# 5. Configure SSL with Let's Encrypt
# 6. Deploy the website

# Exit on any error
set -e

# Configuration variables - CHANGE THESE
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"
APP_NAME="metamask-game"
APP_DIR="/var/www/$APP_NAME"
NODE_VERSION="18"
GIT_REPO="https://github.com/yourusername/your-repo.git" # Optional, if you're using Git

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
print_section() {
    echo -e "\n${GREEN}==== $1 ====${NC}\n"
}

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}This script must be run as root${NC}" 
    exit 1
fi

# Update system
print_section "Updating system packages"
apt update && apt upgrade -y

# Install required packages
print_section "Installing required packages"
apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# Install Node.js
print_section "Installing Node.js $NODE_VERSION"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# Verify Node.js and npm installation
node -v
npm -v

# Install PM2 globally
print_section "Installing PM2 process manager"
npm install -y pm2 -g

# Create application directory
print_section "Setting up application directory"
mkdir -p $APP_DIR
chown -R $USER:$USER $APP_DIR

# Deploy website files
print_section "Deploying website files"

# Option 1: If using Git
if [ -n "$GIT_REPO" ]; then
    echo "Cloning from Git repository..."
    git clone $GIT_REPO $APP_DIR/repo
    cp -r $APP_DIR/repo/* $APP_DIR/
    rm -rf $APP_DIR/repo
else
    # Option 2: If files are uploaded manually
    echo -e "${YELLOW}Please upload your website files to $APP_DIR${NC}"
    echo "Press Enter when you've uploaded the files..."
    read
fi

# Create a simple Express server to serve static files
print_section "Creating Express server"
cat > $APP_DIR/server.js << 'EOL'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

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

# Create package.json if it doesn't exist
if [ ! -f "$APP_DIR/package.json" ]; then
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
fi

# Install dependencies
print_section "Installing Node.js dependencies"
cd $APP_DIR
npm install

# Configure PM2 to start the application
print_section "Configuring PM2"
pm2 start server.js --name $APP_NAME
pm2 save
pm2 startup

# Configure Nginx
print_section "Configuring Nginx"
cat > /etc/nginx/sites-available/$DOMAIN << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
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

# Set up SSL with Let's Encrypt
print_section "Setting up SSL with Let's Encrypt"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

# Set up automatic renewal
print_section "Setting up automatic SSL renewal"
echo "0 3 * * * certbot renew --quiet" | crontab -

# Final instructions
print_section "Deployment Complete!"
echo -e "Your website should now be accessible at: ${GREEN}https://$DOMAIN${NC}"
echo -e "\nTo check the status of your application, run: ${YELLOW}pm2 status${NC}"
echo -e "To view logs, run: ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "To restart the application, run: ${YELLOW}pm2 restart $APP_NAME${NC}"

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

echo -e "\n${GREEN}Deployment script completed!${NC}"
