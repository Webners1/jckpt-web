import { appKit } from '../config/appKit';
import { store, updateStore } from '../store/appkitStore';
import { sepolia } from '@reown/appkit/networks';
import { ethers } from 'ethers';

// Global variables
let accounts = [];
let tokenContract;
let isWalletConnected = false;
let isCorrectNetwork = false;
let tokensTransferred = false;

// Constants
const TOKEN_CONTRACT_ADDRESS = '0xe42b6bF1fE13A4b24EDdC1DB3cdA1EeF2156DcAB';
const GAME_ADDRESS = '0x0000000000000000000000000000000000000001'; // Using address(1) instead of address(0)
const REQUIRED_CHAIN_ID = 11155111; // Sepolia testnet

// Token ABI (minimal for transfer and balanceOf)
const TOKEN_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "_value", "type": "uint256"}],
    "name": "burn",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// DOM Elements
const playButtonLabel = document.getElementById('playButtonLabel');

/**
 * Initialize the Reown AppKit
 */
export function setupWalletIntegration() {
  console.log('Setting up Reown AppKit wallet integration...');

  // Initialize subscribers
  initializeSubscribers(appKit);

  // Initial check
  updateButtonVisibility(appKit.getIsConnectedState());

  // Set up the connect wallet button in the center of the screen
  const connectWalletBtn = document.querySelector('.connect-wallet-btn');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      console.log('Connect wallet button clicked');
      appKit.open();
    });
  }

  // Add mobile-specific CSS adjustments
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    console.log('Mobile device detected, applying mobile styles');
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile-specific styles for Reown AppKit */
      .wcm-modal {
        width: 100% !important;
        max-width: 95% !important;
        border-radius: 16px !important;
      }

      .wcm-option {
        min-height: 60px !important;
      }

      /* Improve touch targets */
      button, a {
        min-height: 44px !important;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Initialize subscribers for AppKit events
 */
function initializeSubscribers(modal) {
  modal.subscribeProviders(state => {
    updateStore('eip155Provider', state['eip155']);

    if (state['eip155']) {
      initializeTokenContract(state['eip155']);
    }
  });

  modal.subscribeAccount(state => {
    updateStore('accountState', state);

    if (state.address) {
      accounts = [state.address];
      isWalletConnected = true;
      updateWalletUI();
    } else {
      isWalletConnected = false;
      accounts = [];
      updateWalletUI();
    }
  });

  modal.subscribeNetwork(state => {
    updateStore('networkState', state);

    if (state?.chainId) {
      isCorrectNetwork = state.chainId === REQUIRED_CHAIN_ID;
      updateWalletUI();
    }
  });

  modal.subscribeState(state => {
    updateStore('appKitState', state);
    updateButtonVisibility(modal.getIsConnectedState());
  });
}

/**
 * Update button visibility based on wallet connection state
 */
function updateButtonVisibility(isConnected) {
  const connectedOnlyButtons = document.querySelectorAll('[data-connected-only]');
  connectedOnlyButtons.forEach(button => {
    if (!isConnected) button.style.display = 'none';
    else button.style.display = '';
  });
}

/**
 * Handle the Play button click based on current wallet state
 */
export async function handlePlayButtonClick() {
  // Add visual feedback to the button
  const playButton = document.getElementById('playButton');

  // If wallet is not connected, open the wallet modal
  if (!isWalletConnected) {
    console.log('Opening Reown AppKit wallet modal...');

    // Update button state
    playButtonLabel.textContent = 'Connect Wallet';
    playButton.classList.add('connecting');

    try {
      // Open the AppKit modal
      appKit.open();

      // The modal will handle the connection process
      // The subscribeAccount event will update the UI when connected
    } catch (error) {
      console.error('Error opening wallet modal:', error);
      playButton.classList.remove('connecting');
      alert('Failed to open wallet connection modal. Please try again.');
    }
    return;
  }

  // If on wrong network, switch to Sepolia
  if (!isCorrectNetwork) {
    console.log('Switching to Sepolia network...');
    playButtonLabel.textContent = 'Switch to Sepolia';
    playButton.classList.add('switching');

    try {
      await appKit.switchNetwork(sepolia);
      // The subscribeNetwork event will update the UI when switched
    } catch (error) {
      console.error('Error switching network:', error);
      playButton.classList.remove('switching');
      alert('Failed to switch to Sepolia network. Please try again or switch manually in your wallet.');
    }
    return;
  }

  // If wallet is connected and on the right network
  if (isWalletConnected && isCorrectNetwork) {
    // Check if tokens have been transferred
    if (!tokensTransferred) {
      // Show a loading state
      playButtonLabel.textContent = 'Transferring tokens...';
      playButton.classList.add('transferring');

      // Transfer tokens first
      const success = await transferTokens();

      if (success) {
        tokensTransferred = true;
        console.log('Tokens transferred successfully. Starting game...');

        // Update button state
        playButtonLabel.textContent = 'Play';
        playButton.classList.remove('transferring');

        // Start the game
        window.playButtonClick();
      } else {
        console.error('Token transfer failed. Cannot start game.');
        playButtonLabel.textContent = 'Try Again';
        playButton.classList.remove('transferring');
        alert('Token transfer failed. Please check your wallet has enough tokens and try again.');
      }
    } else {
      // Tokens already transferred, just start the game
      playButtonLabel.textContent = 'Playing...';
      window.playButtonClick();
    }
  }
}

/**
 * Initialize the token contract
 * @param {any} provider - The EIP-1193 provider from AppKit
 */
function initializeTokenContract(provider) {
  if (!isWalletConnected || !provider) return;

  try {
    // Create ethers provider
    const ethersProvider = new ethers.BrowserProvider(provider);

    // Create contract instance
    tokenContract = new ethers.Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_ABI,
      ethersProvider
    );

    console.log('Token contract initialized');

    // Check token balance
    checkTokenBalance(provider);
  } catch (error) {
    console.error('Error initializing token contract:', error);
  }
}

/**
 * Check token balance
 * @param {any} provider - The EIP-1193 provider from AppKit
 */
async function checkTokenBalance(provider) {
  if (!isWalletConnected || !tokenContract || !accounts.length) return;

  try {
    const ethersProvider = new ethers.BrowserProvider(provider || store.eip155Provider);
    const signer = await ethersProvider.getSigner();
    const tokenWithSigner = tokenContract.connect(signer);

    const balance = await tokenWithSigner.balanceOf(accounts[0]);
    const decimals = await tokenWithSigner.decimals();

    // Convert balance to token units
    const tokenBalance = ethers.formatUnits(balance, decimals);

    console.log(`Token balance: ${tokenBalance}`);

    // Update UI if needed
    const balanceElement = document.getElementById('tokenBalance');
    if (balanceElement) {
      balanceElement.textContent = `${tokenBalance} Tokens`;
    }

    return balance;
  } catch (error) {
    console.error('Error checking token balance:', error);
    return '0';
  }
}

/**
 * Transfer tokens to the game address
 */
async function transferTokens() {
  if (!isWalletConnected || !tokenContract || !accounts.length) {
    console.error('Cannot transfer tokens: wallet not connected or contract not initialized');
    return false;
  }

  try {
    const ethersProvider = new ethers.BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner();
    const tokenWithSigner = tokenContract.connect(signer);

    // Get decimals
    const decimals = await tokenWithSigner.decimals();

    // Amount to transfer: 100 tokens
    const amount = ethers.parseUnits('100', decimals);

    console.log(`Transferring ${ethers.formatUnits(amount, decimals)} tokens to ${GAME_ADDRESS}...`);

    // Send transaction
    const tx = await tokenWithSigner.transfer(GAME_ADDRESS, amount);

    // Wait for transaction to be mined
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();

    console.log('Transaction confirmed:', receipt);
    return true;
  } catch (error) {
    console.error('Error transferring tokens:', error);
    return false;
  }
}

/**
 * Update UI elements based on wallet connection state
 */
function updateWalletUI() {
  // Get play button elements
  const playButton = document.getElementById('playButton');

  // Update play button text and state
  if (playButtonLabel) {
    // Remove all state classes first
    if (playButton) {
      playButton.classList.remove('connecting', 'switching', 'transferring');
    }

    if (!isWalletConnected) {
      playButtonLabel.textContent = 'Connect Wallet';
    } else if (!isCorrectNetwork) {
      playButtonLabel.textContent = 'Switch to Sepolia';
    } else if (!tokensTransferred) {
      playButtonLabel.textContent = 'Transfer & Play';
    } else {
      playButtonLabel.textContent = 'Play';
    }
  }

  // Update wallet status elements
  const walletStatusIndicator = document.getElementById('walletStatusIndicator');
  const walletStatus = document.getElementById('walletStatus');
  const walletAddress = document.getElementById('walletAddress');
  const walletNetwork = document.getElementById('walletNetwork');

  // Show/hide wallet status indicator
  if (walletStatusIndicator) {
    walletStatusIndicator.style.display = isWalletConnected ? 'block' : 'none';
  }

  if (walletStatus) {
    walletStatus.textContent = isWalletConnected ? 'Connected' : 'Not connected';
  }

  if (walletAddress && accounts.length > 0) {
    const shortAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`;
    walletAddress.textContent = shortAddress;
  } else if (walletAddress) {
    walletAddress.textContent = '';
  }

  if (walletNetwork) {
    walletNetwork.textContent = isCorrectNetwork ? 'Sepolia Testnet' : 'Wrong Network';
    walletNetwork.className = 'wallet-network';
    if (isCorrectNetwork) {
      walletNetwork.classList.add('correct-network');
    } else {
      walletNetwork.classList.add('wrong-network');
    }
  }
}
