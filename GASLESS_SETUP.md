# Gelato Relay Gasless Transaction Setup Guide

This application **ONLY** supports gasless transactions using Gelato Relay SDK. Users will never pay gas fees.

## 🚨 Important: Gelato Relay Gasless Only

- **Uses Gelato Relay** for sponsored transactions
- **Direct transfers** from user's existing wallet
- **No fallback** to regular transactions
- **No gas fees** for users
- **Gelato Sponsor API Key** required for functionality

## 🔧 Setup Required

### 1. Get Gelato API Key

1. Go to [Gelato App](https://app.gelato.network/)
2. Create an account and login
3. Create a new **Relay App** for Sepolia testnet
4. Get your **Sponsor API Key** from the app dashboard

### 2. Update Environment Variables

Copy `.env.example` to `.env` and update:

```bash
# Replace with your actual Gelato Sponsor API Key
VITE_GELATO_API_KEY=your-gelato-sponsor-api-key-here
```

### 3. Fund Your 1Balance Account

- **For Testnets (Sepolia)**: Deposit Sepolia ETH
- **For Mainnets**: Deposit USDC
- The 1Balance account pays all gas fees for users
- Monitor balance regularly at [Gelato App](https://app.gelato.network/)

## 🎯 How It Works

1. **User connects wallet** (no ETH required)
2. **User signs transaction** (direct from their wallet)
3. **Gelato Relay executes** (pays all gas fees via 1Balance)
4. **Tokens transfer** from user wallet to game address
5. **User pays nothing** (completely gasless)

## ❌ What Happens Without Valid Setup

If Gelato is not properly configured:

- ❌ **Application will NOT work**
- ❌ **No fallback to regular transactions**
- ❌ **Users cannot play the game**
- ⚠️ **Error messages will appear**

## 🔍 Troubleshooting

### Common Issues:

1. **"SmartAccountInsufficientFundsError"**
   - Paymaster has no funds
   - Invalid paymaster URL
   - Paymaster not configured for your dApp

2. **"Gasless Setup Required"**
   - Missing Biconomy configuration
   - Invalid API keys
   - Network mismatch

3. **"User denied transaction"**
   - User cancelled the signature
   - This is normal user behavior

## 💡 Best Practices

- **Monitor paymaster balance** regularly
- **Test on testnet** before production
- **Have backup paymaster** for high availability
- **Clear error messages** for users when gasless fails

## 🎮 User Experience

- **Zero gas fees** - Users never pay anything
- **Simple signing** - Just approve transactions
- **Clear feedback** - Know when gasless is working
- **No confusion** - No gas fee prompts ever

This ensures a smooth, gasless-only experience for all users.
