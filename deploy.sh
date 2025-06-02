#!/bin/bash

# Deployment script for jckpt-web Vite.js website on Ubuntu NodeJS droplet
# This script will:
# 1. Update the system
# 2. Install Node.js and npm
# 3. Install PM2 for process management
# 4. Set up Nginx as a reverse proxy
# 5. Configure SSL with Let's Encrypt
# 6. Clone and deploy the website from GitHub

# Exit on any error
set -e

# Configuration variables - CHANGE THESE
DOMAIN="jackpt.com"
EMAIL="faizan_babar70@yahoo.com"
APP_NAME="jckpt-web"
APP_DIR="/var/www/$APP_NAME"
NODE_VERSION="18"
GIT_REPO="https://github.com/Webners1/jckpt-web.git"

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

# Check for additional dependencies that might be needed
print_section "Checking for additional dependencies"
if ! command -v gcc &> /dev/null; then
    echo "Installing build tools..."
    apt-get install -y build-essential
fi

if ! command -v python3 &> /dev/null; then
    echo "Installing Python3..."
    apt-get install -y python3
fi

# Install Node.js
print_section "Installing Node.js $NODE_VERSION"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# Verify Node.js and npm installation
node -v
npm -v

# Install PM2 globally
print_section "Installing PM2 process manager"
npm install -g pm2

# Create application directory
print_section "Setting up application directory"
mkdir -p $APP_DIR
chown -R $USER:$USER $APP_DIR

# Ensure proper permissions
chmod -R 755 $APP_DIR

# Deploy website files
print_section "Deploying website files"

# Clone from Git repository
echo "Cloning from Git repository..."
git clone $GIT_REPO $APP_DIR/repo
cd $APP_DIR/repo

# Install dependencies
print_section "Installing project dependencies"
npm install --legacy-peer-deps

# Check if dev script exists in package.json and determine the likely port
if grep -q "\"dev\"" package.json; then
    echo -e "${GREEN}Found dev script in package.json${NC}"
    DEV_COMMAND="npm run dev"

    # Try to determine the dev server port
    if grep -q "vite" package.json; then
        echo -e "${GREEN}Detected Vite.js project - likely using port 5173${NC}"
        DEV_PORT=8001
    elif grep -q "next" package.json; then
        echo -e "${GREEN}Detected Next.js project - likely using port 3000${NC}"
        DEV_PORT=3000
    elif grep -q "react-scripts" package.json; then
        echo -e "${GREEN}Detected Create React App - likely using port 3000${NC}"
        DEV_PORT=3000
    else
        echo -e "${YELLOW}Could not determine project type, assuming port 3000${NC}"
        DEV_PORT=3000
    fi
elif grep -q "\"start\"" package.json; then
    echo -e "${GREEN}Found start script in package.json${NC}"
    DEV_COMMAND="npm run start"
    DEV_PORT=3000
else
    echo -e "${YELLOW}Could not find dev or start script, checking available scripts...${NC}"
    grep -A 10 "scripts" package.json
    echo -e "${YELLOW}Using npm run dev as default${NC}"
    DEV_COMMAND="npm run dev"
    DEV_PORT=3000
fi

echo -e "${GREEN}Development server will likely run on port $DEV_PORT${NC}"

# Create a startup script for PM2
print_section "Creating startup script for PM2"
cat > $APP_DIR/start.sh << EOL
#!/bin/bash
cd $APP_DIR/repo
echo "Starting development server on port $DEV_PORT..."
# Set HOST to 0.0.0.0 to allow external access
export HOST=0.0.0.0
export PORT=$DEV_PORT
$DEV_COMMAND
EOL

chmod +x $APP_DIR/start.sh
echo -e "${GREEN}Created startup script at $APP_DIR/start.sh${NC}"

# Install any additional dependencies needed for development
print_section "Installing additional dependencies"
npm install --save-dev nodemon concurrently --legacy-peer-deps

# Configure PM2 to start the application in development mode
print_section "Configuring PM2 for development mode"

# Stop any existing instance
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Start the application with PM2 using the start script
pm2 start $APP_DIR/start.sh --name $APP_NAME

# Save PM2 configuration and set up startup script
pm2 save
pm2 startup

# Ensure PM2 restarts on system reboot
systemctl enable pm2-$USER.service 2>/dev/null || echo "Could not enable PM2 service, may need manual setup"

echo -e "${GREEN}Application is now running in development mode with PM2${NC}"

# Configure Nginx
print_section "Configuring Nginx for development server"
cat > /etc/nginx/sites-available/$DOMAIN << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Use the detected development server port
    location / {
        proxy_pass http://localhost:$DEV_PORT;  # Detected dev server port
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;

        # WebSocket support for hot module replacement
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # Fallback to port 3000 if 5173 doesn't work
    location @fallback {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # No caching for development
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    expires off;
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
echo -e "Your web application should now be accessible at: ${GREEN}https://$DOMAIN${NC}"
echo -e "\nTo check the status of your application, run: ${YELLOW}pm2 status${NC}"
echo -e "To view logs, run: ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "To restart the application, run: ${YELLOW}pm2 restart $APP_NAME${NC}"
echo -e "\nTo update the application in the future:"
echo -e "1. ${YELLOW}cd $APP_DIR/repo${NC}"
echo -e "2. ${YELLOW}git pull${NC}"
echo -e "3. ${YELLOW}npm install --legacy-peer-deps${NC}"
echo -e "4. ${YELLOW}pm2 restart $APP_NAME${NC}"

# Save the update commands to a script for easy future updates
cat > $APP_DIR/update.sh << EOL
#!/bin/bash
cd $APP_DIR/repo
git pull
npm install --legacy-peer-deps
pm2 restart $APP_NAME
echo "Update completed successfully!"
EOL

chmod +x $APP_DIR/update.sh
echo -e "\nA convenient update script has been created at: ${YELLOW}$APP_DIR/update.sh${NC}"

# Check if the site is accessible
print_section "Checking if the site is accessible"
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN || echo "Failed")
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo -e "${GREEN}Site is accessible!${NC}"
    else
        echo -e "${YELLOW}Site returned HTTP status $HTTP_STATUS. You may need to check your configuration.${NC}"
        echo -e "Common issues:"
        echo -e "1. DNS may not be configured yet - check your domain settings"
        echo -e "2. Firewall may be blocking port 80/443 - check ufw status"
        echo -e "3. Nginx configuration issue - check nginx error logs"
    fi
else
    echo -e "${YELLOW}curl is not installed. Please check manually if the site is accessible.${NC}"
fi

# Cleanup
print_section "Cleaning up"
echo -e "Removing temporary files..."

# Remove any unnecessary files
if [ -d "$APP_DIR/repo" ]; then
    echo "Cleaning up repository directory..."
    # Don't remove node_modules since we need them for development
    # Just ensure proper permissions
    chown -R $USER:$USER $APP_DIR/repo
    chmod -R 755 $APP_DIR/repo
fi

echo -e "\n${GREEN}Web application deployment in DEVELOPMENT MODE completed successfully!${NC}"
echo -e "Your application is now running in development mode at ${GREEN}https://$DOMAIN${NC}"
echo -e "${YELLOW}Note: This is a development deployment. For production, consider building the app instead.${NC}"