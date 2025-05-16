# MetaMask Game Deployment Guide

This guide provides step-by-step instructions for deploying the MetaMask-enabled game on an Ubuntu NodeJS droplet.

## Prerequisites

- An Ubuntu server (preferably Ubuntu 20.04 LTS or newer)
- A domain name pointing to your server (optional, but recommended)
- Basic knowledge of Linux command line

## Deployment Options

You have two options for deploying the application:

1. **Automated Deployment**: Using the provided deployment scripts
2. **Manual Deployment**: Following step-by-step instructions

## Option 1: Automated Deployment

### Using the Full Deployment Script

The `deploy.sh` script automates the entire deployment process, including:
- System updates
- Node.js installation
- Nginx configuration
- SSL setup with Let's Encrypt
- Application deployment and configuration

1. Upload the `deploy.sh` script to your server:
   ```bash
   scp deploy.sh user@your-server-ip:~/
   ```

2. Connect to your server:
   ```bash
   ssh user@your-server-ip
   ```

3. Make the script executable:
   ```bash
   chmod +x deploy.sh
   ```

4. Edit the script to update configuration variables:
   ```bash
   nano deploy.sh
   ```
   Update the following variables:
   - `DOMAIN`: Your domain name
   - `EMAIL`: Your email address (for SSL certificate)
   - `APP_NAME`: Application name
   - `APP_DIR`: Application directory
   - `GIT_REPO`: Git repository URL (if using Git)

5. Run the script:
   ```bash
   sudo ./deploy.sh
   ```

### Using the Simple Setup Script

The `setup-metamask-game.sh` script provides a simpler setup without Nginx or SSL:

1. Upload the script to your server:
   ```bash
   scp setup-metamask-game.sh user@your-server-ip:~/
   ```

2. Connect to your server:
   ```bash
   ssh user@your-server-ip
   ```

3. Make the script executable:
   ```bash
   chmod +x setup-metamask-game.sh
   ```

4. Edit the script to update configuration variables:
   ```bash
   nano setup-metamask-game.sh
   ```

5. Run the script:
   ```bash
   sudo ./setup-metamask-game.sh
   ```

## Option 2: Manual Deployment

### 1. Update System and Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git build-essential

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Create Application Directory

```bash
# Create directory
sudo mkdir -p /var/www/metamask-game

# Set permissions
sudo chown -R $USER:$USER /var/www/metamask-game
```

### 3. Deploy Application Files

Upload your application files to the server:

```bash
# Option 1: Using SCP
scp -r ./* user@your-server-ip:/var/www/metamask-game/

# Option 2: Using Git
cd /var/www/metamask-game
git clone https://github.com/yourusername/your-repo.git .
```

### 4. Install Application Dependencies

```bash
cd /var/www/metamask-game
npm install
```

### 5. Configure and Start the Application

```bash
# Start the application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Configure PM2 to start on system boot
pm2 startup
```

### 6. Set Up Nginx (Optional, but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/metamask-game
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/metamask-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Set Up SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Set up automatic renewal
echo "0 3 * * * certbot renew --quiet" | sudo tee -a /etc/crontab
```

## Managing Your Application

### Checking Application Status

```bash
pm2 status
```

### Viewing Logs

```bash
pm2 logs metamask-game
```

### Restarting the Application

```bash
pm2 restart metamask-game
```

### Stopping the Application

```bash
pm2 stop metamask-game
```

## Troubleshooting

### Application Not Starting

Check the logs for errors:

```bash
pm2 logs metamask-game
```

### Nginx Not Working

Check Nginx configuration:

```bash
sudo nginx -t
sudo systemctl status nginx
```

### SSL Certificate Issues

Check Certbot logs:

```bash
sudo certbot certificates
```

## Security Considerations

1. **Firewall**: Configure UFW to allow only necessary ports:
   ```bash
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

2. **Regular Updates**: Keep your system updated:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Secure Nginx**: Implement security headers and HTTPS redirects.

4. **Monitoring**: Set up monitoring for your application.

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Support

If you encounter any issues during deployment, please contact your system administrator or refer to the documentation for the specific component causing the issue.
