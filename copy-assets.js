/**
 * Script to copy static assets from the original project to the new Vite structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination directories
const sourceDir = __dirname;
const publicDir = path.join(__dirname, 'public');
const imagesDir = path.join(publicDir, 'images');

// Create directories if they don't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// List of static assets to copy
const staticAssets = [
  { src: '5761a2bc0aeddcb0e023054f07c06cd8.static.ico', dest: 'favicon.ico' },
  { src: '8a3e73bf364519a0c1500790dfe30126.static.png', dest: 'images/logo.png' },
  { src: 'ebc867d208121361e627fb5579f0df62.static.png', dest: 'images/girl.png' },
  { src: 'b8ff2f53616496a445960886a0815330.static.png', dest: 'images/cloud.png' },
  { src: '900b64ebcfff1253a99d05eaf4041504.static.png', dest: 'images/play.png' },
  { src: 'b4df4ed232655d0b172bdf333d135668.static.png', dest: 'images/open.png' },
  { src: '6d8685d3ca1fe1acadbcb1b3d5385fef.static.png', dest: 'images/claim.png' }
];

// Copy each asset
staticAssets.forEach(asset => {
  try {
    const sourcePath = path.join(sourceDir, asset.src);
    const destPath = path.join(publicDir, asset.dest);
    
    if (fs.existsSync(sourcePath)) {
      // Create directory if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${asset.src} to ${asset.dest}`);
    } else {
      console.warn(`Source file not found: ${asset.src}`);
    }
  } catch (error) {
    console.error(`Error copying ${asset.src}:`, error);
  }
});

console.log('Static assets copied successfully!');
