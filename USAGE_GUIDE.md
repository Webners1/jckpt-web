# MetaMask Game Deployment Script Usage Guide

This guide explains how to use the deployment script to deploy your MetaMask game website to your server.

## Prerequisites

- A server with Ubuntu installed (Digital Ocean droplet)
- SSH access to the server
- Domain name pointing to your server IP
- Your MetaMask game files in the current directory

## Files Required in Your Directory

Make sure you have the following files in your directory before running the deployment script:

- `index.html` (required)
- JavaScript files (*.js, *.static.js)
- CSS files (*.css, *.static.css)
- Image files (*.png, *.jpg, *.jpeg, *.gif, *.ico, *.svg)
- `images/` directory (if you have additional images)
- `config/` directory (if you have configuration files)

## Using the Deployment Script

1. Make the script executable:

```bash
chmod +x deploy-metamask-game.sh
```

2. Run the script:

```bash
./deploy-metamask-game.sh
```

By default, the script will deploy to the server IP `134.209.83.136`. If you want to deploy to a different server, you can specify the IP address as an argument:

```bash
./deploy-metamask-game.sh your-server-ip
```

## What the Script Does

The deployment script performs the following actions:

1. Checks the connection to your server
2. Updates the system and installs required packages
3. Installs Node.js and PM2
4. Creates the application directory
5. Sets up the Express server (server.js)
6. Configures Nginx as a reverse proxy
7. Sets up SSL with Let's Encrypt
8. Transfers all your website files to the server
9. Starts the application with PM2
10. Checks the status of the deployment

## After Deployment

After the deployment is complete, your website should be accessible at:

```
https://jackpt.com
```

## Maintenance Commands

Here are some useful commands for maintaining your deployment:

- Check application status:
  ```bash
  ssh root@134.209.83.136 'pm2 status'
  ```

- View application logs:
  ```bash
  ssh root@134.209.83.136 'pm2 logs metamask-game'
  ```

- Restart the application:
  ```bash
  ssh root@134.209.83.136 'pm2 restart metamask-game'
  ```

- View Nginx status:
  ```bash
  ssh root@134.209.83.136 'systemctl status nginx'
  ```

## Troubleshooting

If you encounter issues with the deployment:

1. Check the logs:
   ```bash
   ssh root@134.209.83.136 'pm2 logs metamask-game'
   ```

2. Check Nginx logs:
   ```bash
   ssh root@134.209.83.136 'tail -f /var/log/nginx/error.log'
   ```

3. Check if the port is in use:
   ```bash
   ssh root@134.209.83.136 'lsof -i :3001'
   ```

4. Restart the services:
   ```bash
   ssh root@134.209.83.136 'pm2 restart metamask-game && systemctl restart nginx'
   ```

## Updating Your Website

To update your website after making changes:

1. Run the deployment script again:
   ```bash
   ./deploy-metamask-game.sh
   ```

   This will transfer all your updated files and restart the application.

2. Alternatively, you can transfer only the changed files:
   ```bash
   scp your-changed-file.js root@134.209.83.136:/var/www/metamask-game/
   ssh root@134.209.83.136 'pm2 restart metamask-game'
   ```
