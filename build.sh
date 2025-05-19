#!/bin/bash

# Build script for Jackpot Game with Reown AppKit

echo "Installing dependencies..."
npm install

echo "Building the project..."
npm run build

echo "Build complete! The output is in the dist directory."
echo "To start the server, run: npm start"
