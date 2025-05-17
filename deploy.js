/**
 * MetaMask Game Deployment Script Runner
 * 
 * This script runs the deployment script for the MetaMask game website.
 * It provides a simple interface to deploy the website to your server.
 * 
 * Usage:
 *   node deploy.js [server_ip]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Default server IP
const DEFAULT_SERVER_IP = '134.209.83.136';

// Get server IP from command line arguments
const serverIP = process.argv[2] || DEFAULT_SERVER_IP;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if deployment script exists
if (!fs.existsSync(path.join(__dirname, 'deploy-metamask-game.sh'))) {
  console.error('\x1b[31mError: deploy-metamask-game.sh not found in the current directory\x1b[0m');
  console.log('Please make sure the deployment script is in the same directory as this script.');
  process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(path.join(__dirname, 'index.html'))) {
  console.error('\x1b[31mError: index.html not found in the current directory\x1b[0m');
  console.log('Please make sure index.html is in the same directory as this script.');
  process.exit(1);
}

// Make the deployment script executable
try {
  execSync('chmod +x deploy-metamask-game.sh');
} catch (error) {
  console.error('\x1b[31mError making deployment script executable:\x1b[0m', error.message);
  process.exit(1);
}

// Display deployment information
console.log('\x1b[32m==== MetaMask Game Deployment ====\x1b[0m\n');
console.log(`Server IP: \x1b[33m${serverIP}\x1b[0m`);
console.log(`Domain: \x1b[33mjackpt.com\x1b[0m`);
console.log('\nThe following files will be deployed:');

// Count files to be deployed
let htmlCount = 0;
let jsCount = 0;
let cssCount = 0;
let imageCount = 0;
let configCount = 0;

// Check HTML files
if (fs.existsSync(path.join(__dirname, 'index.html'))) {
  htmlCount++;
}

// Check JS files
const jsFiles = fs.readdirSync(__dirname).filter(file => 
  file.endsWith('.js') || file.endsWith('.static.js')
);
jsCount = jsFiles.length;

// Check CSS files
const cssFiles = fs.readdirSync(__dirname).filter(file => 
  file.endsWith('.css') || file.endsWith('.static.css')
);
cssCount = cssFiles.length;

// Check image files
const imageFiles = fs.readdirSync(__dirname).filter(file => 
  file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || 
  file.endsWith('.gif') || file.endsWith('.ico') || file.endsWith('.svg')
);
imageCount = imageFiles.length;

// Check images directory
if (fs.existsSync(path.join(__dirname, 'images')) && fs.statSync(path.join(__dirname, 'images')).isDirectory()) {
  const imagesInDir = fs.readdirSync(path.join(__dirname, 'images')).length;
  imageCount += imagesInDir;
}

// Check config directory
if (fs.existsSync(path.join(__dirname, 'config')) && fs.statSync(path.join(__dirname, 'config')).isDirectory()) {
  const configsInDir = fs.readdirSync(path.join(__dirname, 'config')).length;
  configCount = configsInDir;
}

console.log(`- HTML files: \x1b[33m${htmlCount}\x1b[0m`);
console.log(`- JavaScript files: \x1b[33m${jsCount}\x1b[0m`);
console.log(`- CSS files: \x1b[33m${cssCount}\x1b[0m`);
console.log(`- Image files: \x1b[33m${imageCount}\x1b[0m`);
console.log(`- Config files: \x1b[33m${configCount}\x1b[0m`);

// Ask for confirmation
rl.question('\nDo you want to proceed with the deployment? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n\x1b[32mStarting deployment...\x1b[0m\n');
    
    try {
      // Run the deployment script
      execSync(`./deploy-metamask-game.sh ${serverIP}`, { stdio: 'inherit' });
      
      console.log('\n\x1b[32mDeployment completed successfully!\x1b[0m');
      console.log(`Your website should now be accessible at: \x1b[33mhttps://jackpt.com\x1b[0m`);
    } catch (error) {
      console.error('\n\x1b[31mDeployment failed:\x1b[0m', error.message);
      console.log('Please check the error message above and try again.');
    }
  } else {
    console.log('\n\x1b[33mDeployment cancelled.\x1b[0m');
  }
  
  rl.close();
});
