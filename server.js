/**
 * Enhanced Express server for Vite-built Jackpot Game with Reown AppKit
 * Features:
 * - Static file serving
 * - CORS support
 * - Compression
 * - Security headers
 * - Basic logging
 * - Health check endpoint
 */

// Use ES modules
import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';

// Get the directory name (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(compression()); // Compress responses
app.use(morgan('combined', { stream: accessLogStream })); // Log requests to file
app.use(morgan('dev')); // Log requests to console

// Security headers with exceptions for Reown AppKit and wallet connections
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net", "unpkg.com"],
        connectSrc: [
          "'self'",
          "*.infura.io",
          "*.alchemyapi.io",
          "*.sepolia.io",
          "*.walletconnect.com",
          "*.walletconnect.org",
          "wss://*.walletconnect.org",
          "wss://*.walletconnect.com",
          "*.coinbase.com",
          "*.reown.xyz",
          "*.reown.app",
          "*"
        ],
        frameSrc: ["'self'", "chrome-extension://*"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com"],
        fontSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
      },
    },
  })
);

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist'), {
  // Set cache control headers for static assets
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache');
    } else if (
      filePath.endsWith('.js') ||
      filePath.endsWith('.css') ||
      filePath.endsWith('.png') ||
      filePath.endsWith('.jpg') ||
      filePath.endsWith('.ico') ||
      filePath.endsWith('.svg')
    ) {
      // Cache static assets for 1 day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle all other routes and serve the Vite-built index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Log uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
