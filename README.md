# Jackpot Game with Reown AppKit Wallet Integration

A web-based jackpot game with Reown AppKit wallet integration for connecting to Ethereum wallets and transferring ERC20 tokens.

## Features

- Vite-based frontend for fast development and optimized builds
- Reown AppKit integration for wallet connectivity
- Mobile-friendly wallet connections (iOS and Android)
- ERC20 token transfers on Sepolia testnet
- Express.js server for production deployment

## Prerequisites

- Node.js 16.x or higher
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Webners1/jckpt-web.git
   cd jckpt-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the development server:

```bash
npm run dev
```

This will start the Vite development server at http://localhost:3000.

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a `dist` directory with the optimized build.

## Running in Production

To run the application in production:

```bash
npm start
```

This will start the Express.js server serving the optimized build.

## PM2 Deployment

To deploy with PM2:

```bash
npm run pm2
```

To restart the PM2 service:

```bash
npm run pm2:restart
```

To view logs:

```bash
npm run pm2:logs
```

## Wallet Integration

The application uses Reown AppKit for wallet integration, supporting:

- MetaMask
- WalletConnect
- Coinbase Wallet
- Trust Wallet
- And many other wallets

## Token Contract

The application interacts with an ERC20 token contract on the Sepolia testnet:

- Contract Address: `0xe42b6bF1fE13A4b24EDdC1DB3cdA1EeF2156DcAB`
- Required Network: Sepolia (Chain ID: 11155111)
- Token Transfer: 100 tokens are transferred to address(1) before playing the game

## Mobile Support

The application is fully responsive and supports mobile devices. Wallet connections on mobile devices will:

1. Deep link to the wallet app if installed
2. Provide QR codes for WalletConnect
3. Offer installation links if the wallet is not installed

## License

All rights reserved.

## Contact

For any questions or support, please contact the repository owner.
