#!/bin/bash

# Simple setup script for MetaMask game on Ubuntu NodeJS droplet
# This script focuses on just setting up the game without complex configurations

# Exit on any error
set -e

# Configuration variables - CHANGE THESE
DOMAIN="yourdomain.com"
APP_NAME="metamask-game"
APP_DIR="/var/www/$APP_NAME"
PORT=3000

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
apt install -y curl git build-essential

# Install Node.js
print_section "Installing Node.js"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
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
print_section "Setting up website files"
echo -e "${YELLOW}Please upload your website files to $APP_DIR${NC}"
echo "Press Enter when you've uploaded the files..."
read

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

# Create package.json
print_section "Creating package.json"
cat > $APP_DIR/package.json << EOL
{
  "name": "${APP_NAME}",
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

# Configure PM2 to start the application
print_section "Configuring PM2"
pm2 start server.js --name $APP_NAME
pm2 save
pm2 startup

# Open firewall for the application port
print_section "Configuring firewall"
if command -v ufw &> /dev/null; then
    ufw allow $PORT
    echo -e "${GREEN}Firewall configured to allow port $PORT${NC}"
else
    echo -e "${YELLOW}UFW firewall not installed. Please manually ensure port $PORT is open.${NC}"
fi

# Final instructions
print_section "Setup Complete!"
echo -e "Your website should now be accessible at: ${GREEN}http://<your-server-ip>:$PORT${NC}"
echo -e "\nTo make your site accessible via domain name, you'll need to:"
echo -e "1. Point your domain to this server's IP address"
echo -e "2. Install and configure Nginx as a reverse proxy"
echo -e "3. Set up SSL with Let's Encrypt"
echo -e "\nTo check the status of your application, run: ${YELLOW}pm2 status${NC}"
echo -e "To view logs, run: ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "To restart the application, run: ${YELLOW}pm2 restart $APP_NAME${NC}"

# Create a helper script for checking logs
cat > /usr/local/bin/check-game-logs << EOL
#!/bin/bash
pm2 logs $APP_NAME
EOL
chmod +x /usr/local/bin/check-game-logs

# Create a helper script for restarting the application
cat > /usr/local/bin/restart-game << EOL
#!/bin/bash
pm2 restart $APP_NAME
EOL
chmod +x /usr/local/bin/restart-game

echo -e "\n${GREEN}Helper scripts created:${NC}"
echo -e "- ${YELLOW}check-game-logs${NC}: View application logs"
echo -e "- ${YELLOW}restart-game${NC}: Restart the application"

echo -e "\n${GREEN}Setup script completed!${NC}"
