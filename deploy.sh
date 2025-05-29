#!/bin/bash

# Deployment script for jckpt-web Vite.js website on Ubuntu NodeJS droplet
# This script will:
# 1. Update the system
# 2. Install Node.js and npm
# 3. Install PM2 for process management
# 4. Set up Nginx as a reverse proxy
# 5. Configure SSL with Let's Encrypt
# 6. Clone and deploy the website from GitHub
# 7. Create environment variables file

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
BLUE='\033[0;34m'
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

# Create environment variables file
print_section "Creating environment variables file"
echo -e "${BLUE}Creating .env file with configuration...${NC}"

cat > $APP_DIR/repo/.env << EOL
# Reown AppKit Configuration
VITE_PROJECT_ID=ed3488dca46e90854aad49512f12974f

# Biconomy Configuration
VITE_BICONOMY_BUNDLER_URL=https://bundler.biconomy.io/api/v3/11155111/bundler_3ZJtBn931UQkjAArKcvdpezF

# RPC Configuration
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161

# Gelato Configuration
VITE_GELATO_API_KEY=RLxH5KgK3A4tT5oB_5tsXOf4fIi9_0mwKomJtOVpxBs_

# Additional Environment Variables
NODE_ENV=development
VITE_APP_NAME=$APP_NAME
VITE_DOMAIN=$DOMAIN

# Build Configuration
GENERATE_SOURCEMAP=false
EOL

# Set proper permissions for .env file
chmod 600 $APP_DIR/repo/.env
chown $USER:$USER $APP_DIR/repo/.env

echo -e "${GREEN}Environment file created successfully at $APP_DIR/repo/.env${NC}"
echo -e "${YELLOW}Note: .env file is secured with 600 permissions${NC}"

# Show the created environment variables (for verification)
echo -e "\n${BLUE}Created environment variables:${NC}"
grep -v "^#" $APP_DIR/repo/.env | grep -v "^$" | while read line; do
    echo -e "  ${YELLOW}$line${NC}"
done

# Install dependencies
print_section "Installing project dependencies"
npm install --legacy-peer-deps

# Check if we should build for production or run in development
echo -e "\n${YELLOW}Choose deployment mode:${NC}"
echo -e "1. Development mode (npm run dev)"
echo -e "2. Production mode (npm run build + serve)"
echo -e "3. Auto-detect based on environment"

# For automation, we'll default to development mode, but you can change this
DEPLOYMENT_MODE="development"

if [ "$DEPLOYMENT_MODE" = "production" ]; then
    print_section "Building for production"
    
    # Update NODE_ENV in .env for production
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' $APP_DIR/repo/.env
    
    # Build the application
    npm run build
    
    # Install a static file server
    npm install -g serve
    
    DEV_COMMAND="serve -s dist -l 5173"
    DEV_PORT=5173
    
    echo -e "${GREEN}Production build completed${NC}"
else
    print_section "Setting up development mode"
    
    # Check if dev script exists in package.json and determine the likely port
    if grep -q "\"dev\"" package.json; then
        echo -e "${GREEN}Found dev script in package.json${NC}"
        DEV_COMMAND="npm run dev"

        # Try to determine the dev server port
        if grep -q "vite" package.json; then
            echo -e "${GREEN}Detected Vite.js project - likely using port 5173${NC}"
            DEV_PORT=5173
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
fi

echo -e "${GREEN}Application will run on port $DEV_PORT${NC}"

# Create a startup script for PM2
print_section "Creating startup script for PM2"
cat > $APP_DIR/start.sh << EOL
#!/bin/bash
cd $APP_DIR/repo

# Load environment variables
if [ -f .env ]; then
    export \$(cat .env | grep -v '^#' | xargs)
fi

echo "Starting application on port $DEV_PORT..."
echo "Using command: $DEV_COMMAND"

# Set HOST to 0.0.0.0 to allow external access
export HOST=0.0.0.0
export PORT=$DEV_PORT

# Start the application
$DEV_COMMAND
EOL

chmod +x $APP_DIR/start.sh
echo -e "${GREEN}Created startup script at $APP_DIR/start.sh${NC}"

# Install any additional dependencies needed for development
print_section "Installing additional dependencies"
npm install --save-dev nodemon concurrently --legacy-peer-deps

# Configure PM2 to start the application
print_section "Configuring PM2"

# Stop any existing instance
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Start the application with PM2 using the start script
pm2 start $APP_DIR/start.sh --name $APP_NAME --watch --ignore-watch="node_modules .git"

# Save PM2 configuration and set up startup script
pm2 save
pm2 startup

# Ensure PM2 restarts on system reboot
systemctl enable pm2-$USER.service 2>/dev/null || echo "Could not enable PM2 service, may need manual setup"

echo -e "${GREEN}Application is now running with PM2${NC}"

# Configure Nginx
print_section "Configuring Nginx"
cat > /etc/nginx/sites-available/$DOMAIN << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Main application proxy
    location / {
        proxy_pass http://localhost:$DEV_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # WebSocket support for hot module replacement
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;
    }

    # Handle Vite HMR WebSocket
    location /vite-dev-server {
        proxy_pass http://localhost:$DEV_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header Origin \$http_origin;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # No caching for development
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    expires off;

    # Increase client max body size
    client_max_body_size 50M;
}
EOL

# Enable the site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Remove default nginx site if it exists
rm -f /etc/nginx/sites-enabled/default

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

# Create update script
print_section "Creating update script"
cat > $APP_DIR/update.sh << EOL
#!/bin/bash
cd $APP_DIR/repo

echo "Updating application..."

# Pull latest changes
git pull

# Backup current .env file
if [ -f .env ]; then
    cp .env .env.backup
    echo "Backed up .env file"
fi

# Recreate .env file (in case there are updates)
cat > .env << 'EOF'
# Reown AppKit Configuration
VITE_PROJECT_ID=ed3488dca46e90854aad49512f12974f
VITE_BICONOMY_BUNDLER_URL=https://bundler.biconomy.io/api/v3/11155111/bundler_3ZJtBn931UQkjAArKcvdpezF
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
VITE_GELATO_API_KEY=RLxH5KgK3A4tT5oB_5tsXOf4fIi9_0mwKomJtOVpxBs_
NODE_ENV=development
VITE_APP_NAME=$APP_NAME
VITE_DOMAIN=$DOMAIN
GENERATE_SOURCEMAP=false
EOF

# Set proper permissions
chmod 600 .env
chown $USER:$USER .env

# Install dependencies
npm install --legacy-peer-deps

# Restart application
pm2 restart $APP_NAME

echo "Update completed successfully!"
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs $APP_NAME"
EOL

chmod +x $APP_DIR/update.sh

# Create environment management script
cat > $APP_DIR/manage-env.sh << EOL
#!/bin/bash
# Environment management script

case "\$1" in
    show)
        echo "Current environment variables:"
        cat $APP_DIR/repo/.env
        ;;
    backup)
        cp $APP_DIR/repo/.env $APP_DIR/repo/.env.backup.\$(date +%Y%m%d_%H%M%S)
        echo "Environment file backed up"
        ;;
    restore)
        if [ -f $APP_DIR/repo/.env.backup ]; then
            cp $APP_DIR/repo/.env.backup $APP_DIR/repo/.env
            echo "Environment file restored from backup"
            pm2 restart $APP_NAME
        else
            echo "No backup file found"
        fi
        ;;
    edit)
        nano $APP_DIR/repo/.env
        echo "Environment file edited. Restart app with: pm2 restart $APP_NAME"
        ;;
    *)
        echo "Usage: \$0 {show|backup|restore|edit}"
        echo "  show    - Display current environment variables"
        echo "  backup  - Create backup of .env file"
        echo "  restore - Restore .env from backup"
        echo "  edit    - Edit .env file with nano"
        ;;
esac
EOL

chmod +x $APP_DIR/manage-env.sh

# Final instructions
print_section "Deployment Complete!"
echo -e "Your web application should now be accessible at: ${GREEN}https://$DOMAIN${NC}"
echo -e "\n${BLUE}Management Commands:${NC}"
echo -e "Check status: ${YELLOW}pm2 status${NC}"
echo -e "View logs: ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "Restart app: ${YELLOW}pm2 restart $APP_NAME${NC}"
echo -e "Update app: ${YELLOW}$APP_DIR/update.sh${NC}"
echo -e "Manage environment: ${YELLOW}$APP_DIR/manage-env.sh [show|backup|restore|edit]${NC}"

echo -e "\n${BLUE}Environment Variables Location:${NC}"
echo -e "File: ${YELLOW}$APP_DIR/repo/.env${NC}"
echo -e "Permissions: ${YELLOW}600 (read/write for owner only)${NC}"

echo -e "\n${BLUE}Useful PM2 Commands:${NC}"
echo -e "pm2 status                    - Show all processes"
echo -e "pm2 logs $APP_NAME            - Show app logs"
echo -e "pm2 logs $APP_NAME --lines 50 - Show last 50 log lines"
echo -e "pm2 monit                     - Monitor processes"
echo -e "pm2 restart $APP_NAME         - Restart the app"
echo -e "pm2 stop $APP_NAME            - Stop the app"
echo -e "pm2 start $APP_NAME           - Start the app"

# Check if the site is accessible
print_section "Checking if the site is accessible"
sleep 5  # Give the app a moment to start

if command -v curl &> /dev/null; then
    HTTP_STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$DEV_PORT || echo "Failed")
    if [ "\$HTTP_STATUS" = "200" ] || [ "\$HTTP_STATUS" = "301" ] || [ "\$HTTP_STATUS" = "302" ]; then
        echo -e "${GREEN}Local application is running on port $DEV_PORT!${NC}"
    else
        echo -e "${YELLOW}Local app returned HTTP status \$HTTP_STATUS. Check logs with: pm2 logs $APP_NAME${NC}"
    fi
    
    # Check external access
    HTTP_STATUS_EXT=\$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN || echo "Failed")
    if [ "\$HTTP_STATUS_EXT" = "200" ] || [ "\$HTTP_STATUS_EXT" = "301" ] || [ "\$HTTP_STATUS_EXT" = "302" ]; then
        echo -e "${GREEN}External site is accessible at $DOMAIN!${NC}"
    else
        echo -e "${YELLOW}External site returned HTTP status \$HTTP_STATUS_EXT${NC}"
        echo -e "Common issues:"
        echo -e "1. DNS may not be configured yet - check your domain settings"
        echo -e "2. Firewall may be blocking port 80/443 - check ufw status"
        echo -e "3. Nginx configuration issue - check nginx error logs"
    fi
else
    echo -e "${YELLOW}curl is not installed. Please check manually if the site is accessible.${NC}"
fi

# Show current PM2 status
print_section "Current Application Status"
pm2 status

echo -e "\n${GREEN}Deployment completed successfully!${NC}"
echo -e "Your Vite.js application with gasless transfer functionality is now live at:"
echo -e "${GREEN}https://$DOMAIN${NC}"
echo -e "\n${YELLOW}Note: The .env file contains sensitive API keys and is secured with 600 permissions.${NC}"
echo -e "${YELLOW}Use the management scripts provided for safe environment variable handling.${NC}"