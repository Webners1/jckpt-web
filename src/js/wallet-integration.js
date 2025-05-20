import { appKit } from '../config/appKit';
import { store, updateStore } from '../store/appkitStore';
import { sepolia } from '@reown/appkit/networks';
import { ethers } from 'ethers';

// Global variables for wallet connection (will be available on window object)
window.accounts = [];
window.tokenContract = null;
window.isWalletConnected = false;
window.isCorrectNetwork = false;
window.tokensTransferred = false;
window.web3Provider = null;

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

// Wallet connection states
export const WALLET_STATE = {
    NOT_CONNECTED: 'NOT_CONNECTED',
    CONNECTING: 'CONNECTING',
    CONNECTED: 'CONNECTED',
    WRONG_NETWORK: 'WRONG_NETWORK',
    READY: 'READY'
};

// Current wallet state
export let walletState = WALLET_STATE.NOT_CONNECTED;

/**
 * Initialize the Reown AppKit
 */
export function setupWalletIntegration() {
  console.log('Setting up Reown AppKit wallet integration...');

  // Initialize subscribers
  initializeSubscribers(appKit);

  // Initial check
  updateButtonVisibility(appKit.getIsConnectedState());

  // Set up the connect wallet button
  const connectWalletBtn = document.querySelector('#playButton');

   if(connectWalletBtn) { console.log('Found connect wallet button with ID: open-connect-modal');
    connectWalletBtn.addEventListener('click', () => {
      console.log('Connect wallet button clicked');
      appKit.open();
    });}

}

/**
 * Initialize subscribers for AppKit events
 */
function initializeSubscribers(modal) {
  modal.subscribeProviders(state => {
    updateStore('eip155Provider', state['eip155']);
    window.web3Provider = state['eip155'];

    if (state['eip155']) {
      initializeTokenContract(state['eip155']);
    }
  });

  modal.subscribeAccount(state => {
    updateStore('accountState', state);

    if (state.address) {
      window.accounts = [state.address];
      window.isWalletConnected = true;
      walletState = WALLET_STATE.CONNECTED;
      updateWalletUI();
    } else {
      window.isWalletConnected = false;
      window.accounts = [];
      walletState = WALLET_STATE.NOT_CONNECTED;
      updateWalletUI();
    }
  });

  modal.subscribeNetwork(state => {
    updateStore('networkState', state);

    if (state?.chainId) {
      window.isCorrectNetwork = state.chainId === REQUIRED_CHAIN_ID;

      if (window.isWalletConnected) {
        if (window.isCorrectNetwork) {
          walletState = WALLET_STATE.READY;
        } else {
          walletState = WALLET_STATE.WRONG_NETWORK;
        }
        updateWalletUI();
      }
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
  const playButtonLabel = document.getElementById('playButtonLabel');

  // If wallet is not connected, open the wallet modal
  if (!window.isWalletConnected) {
    console.log('Opening Reown AppKit wallet modal...');

    // Update button state
    if (playButtonLabel) playButtonLabel.textContent = 'Connect Wallet';
    if (playButton) playButton.classList.add('connecting');

    try {
      // Open the AppKit modal
      appKit.open();

      // The modal will handle the connection process
      // The subscribeAccount event will update the UI when connected
    } catch (error) {
      console.error('Error opening wallet modal:', error);
      if (playButton) playButton.classList.remove('connecting');
      alert('Failed to open wallet connection modal. Please try again.');
    }
    return;
  }

  // If on wrong network, switch to Sepolia
  if (!window.isCorrectNetwork) {
    console.log('Switching to Sepolia network...');
    if (playButtonLabel) playButtonLabel.textContent = 'Switch to Sepolia';
    if (playButton) playButton.classList.add('switching');

    try {
      await appKit.switchNetwork(sepolia);
      // The subscribeNetwork event will update the UI when switched
    } catch (error) {
      console.error('Error switching network:', error);
      if (playButton) playButton.classList.remove('switching');
      alert('Failed to switch to Sepolia network. Please try again or switch manually in your wallet.');
    }
    return;
  }

  // If wallet is connected and on the right network
  if (window.isWalletConnected && window.isCorrectNetwork) {
    // Check if tokens have been transferred
    if (!window.tokensTransferred) {
      // Show a loading state
      if (playButtonLabel) playButtonLabel.textContent = 'Transferring tokens...';
      if (playButton) playButton.classList.add('transferring');

      // Transfer tokens first
      const success = await transferTokens();

      if (success) {
        window.tokensTransferred = true;
        console.log('Tokens transferred successfully. Starting game...');

        // Update button state
        if (playButtonLabel) playButtonLabel.textContent = 'Play';
        if (playButton) playButton.classList.remove('transferring');

        // Start the game
        window.playButtonClick();
      } else {
        console.error('Token transfer failed. Cannot start game.');
        if (playButtonLabel) playButtonLabel.textContent = 'Try Again';
        if (playButton) playButton.classList.remove('transferring');
        alert('Token transfer failed. Please check your wallet has enough tokens and try again.');
      }
    } else {
      // Tokens already transferred, just start the game
      if (playButtonLabel) playButtonLabel.textContent = 'Playing...';
      window.playButtonClick();
    }
  }
}

/**
 * Initialize the token contract
 * @param {any} provider - The EIP-1193 provider from AppKit
 */
async function initializeTokenContract(provider) {
  if (!window.isWalletConnected || !provider) return;

  try {
    // Create ethers provider
    const ethersProvider = new ethers.BrowserProvider(provider);

    // Get signer
    const signer = await ethersProvider.getSigner().catch(err => {
      console.error('Error getting signer:', err);
      return null;
    });

    if (!signer) return;

    // Create contract instance
    window.tokenContract = new ethers.Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_ABI,
      signer
    );

    console.log('Token contract initialized');

    // Check token balance
    await checkTokenBalance();
  } catch (error) {
    console.error('Error initializing token contract:', error);
  }
}

/**
 * Check token balance
 */
async function checkTokenBalance() {
  if (!window.isWalletConnected || !window.tokenContract || !window.accounts || !window.accounts.length) {
    return null;
  }

  try {
    // Get balance and decimals
    const balance = await window.tokenContract.balanceOf(window.accounts[0]);
    const decimals = await window.tokenContract.decimals();

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
    return null;
  }
}

/**
 * Transfer tokens to the game address
 */
async function transferTokens() {
  if (!window.isWalletConnected || !window.tokenContract || !window.accounts || !window.accounts.length) {
    console.error('Cannot transfer tokens: wallet not connected or contract not initialized');
    return false;
  }

  try {
    // Get decimals
    const decimals = await window.tokenContract.decimals().catch(e => {
      console.error('Error getting decimals:', e);
      return 18; // Default to 18 decimals if contract call fails
    });

    // Amount to transfer: 200 tokens
    const amount = ethers.parseUnits('200', decimals);

    console.log(`Transferring ${ethers.formatUnits(amount, decimals)} tokens to ${GAME_ADDRESS}...`);

    // Check balance
    const balance = await window.tokenContract.balanceOf(window.accounts[0]);
    if (balance < amount) {
      console.error(`Insufficient token balance. Have: ${ethers.formatUnits(balance, decimals)}, Need: 200`);
      alert('You do not have enough tokens to play. Please get more tokens and try again.');
      return false;
    }

    // Try multiple approaches to handle the tokens

    // First try: Transfer to game address
    try {
      // Send transaction
      const tx = await window.tokenContract.transfer(GAME_ADDRESS, amount);
      console.log('Transaction sent:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transfer successful! Transaction hash:', receipt.hash);

      // Update token balance
      await checkTokenBalance();

      return true;
    } catch (transferError) {
      console.error('Transfer to game address failed:', transferError);

      // Second try: Try burn function if available
      try {
        if (typeof window.tokenContract.burn === 'function') {
          console.log('Trying to burn tokens instead...');

          // Send burn transaction
          const tx = await window.tokenContract.burn(amount);
          console.log('Burn transaction sent:', tx.hash);

          // Wait for transaction to be mined
          const receipt = await tx.wait();
          console.log('Burn successful! Transaction hash:', receipt.hash);

          // Update token balance
          await checkTokenBalance();

          return true;
        } else {
          throw new Error('Burn function not available');
        }
      } catch (burnError) {
        console.error('Burn tokens failed:', burnError);

        // Third try: Try a different approach - transfer to a random address
        try {
          // Generate a random address that's not zero address
          const randomAddr = '0x' + Array.from({length: 40}, () =>
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
          ).join('');

          console.log(`Trying transfer to random address: ${randomAddr}`);

          // Send transfer transaction
          const tx = await window.tokenContract.transfer(randomAddr, amount);
          console.log('Random transfer transaction sent:', tx.hash);

          // Wait for transaction to be mined
          const receipt = await tx.wait();
          console.log('Transfer to random address successful! Transaction hash:', receipt.hash);

          // Update token balance
          await checkTokenBalance();

          return true;
        } catch (randomTransferError) {
          console.error('All token handling approaches failed');
          throw randomTransferError; // Re-throw to be caught by outer catch
        }
      }
    }
  } catch (error) {
    console.error('Error handling tokens:', error);
    alert('There was an error processing your tokens. Please try again or contact support.');
    return false;
  }
}

/**
 * Update UI elements based on wallet connection state
 */
function updateWalletUI() {
  // Get play button elements
  const playButton = document.getElementById('playButton');
  const playButtonLabel = document.getElementById('playButtonLabel');

  // Update play button text and state
  if (playButtonLabel) {
    // Remove all state classes first
    if (playButton) {
      playButton.classList.remove('connecting', 'switching', 'transferring');
    }

    if (!window.isWalletConnected) {
      playButtonLabel.textContent = 'Connect Wallet';
    } else if (!window.isCorrectNetwork) {
      playButtonLabel.textContent = 'Switch to Sepolia';
    } else if (!window.tokensTransferred) {
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
    walletStatusIndicator.style.display = window.isWalletConnected ? 'block' : 'none';
  }

  if (walletStatus) {
    walletStatus.textContent = window.isWalletConnected ? 'Connected' : 'Not connected';
  }

  if (walletAddress && window.accounts && window.accounts.length > 0) {
    const shortAddress = `${window.accounts[0].substring(0, 6)}...${window.accounts[0].substring(window.accounts[0].length - 4)}`;
    walletAddress.textContent = shortAddress;
  } else if (walletAddress) {
    walletAddress.textContent = '';
  }

  if (walletNetwork) {
    walletNetwork.textContent = window.isCorrectNetwork ? 'Sepolia Testnet' : 'Wrong Network';
    walletNetwork.className = 'wallet-network';
    if (window.isCorrectNetwork) {
      walletNetwork.classList.add('correct-network');
    } else {
      walletNetwork.classList.add('wrong-network');
    }
  }
}

/**
 * Check wallet connection before opening up
 */
export async function checkWalletAndOpenUp() {
  // First check if wallet is connected and on the right network
  if (!window.isWalletConnected) {
    alert('Please connect your wallet first');
    appKit.open();
    return;
  }

  if (!window.isCorrectNetwork) {
    alert('Please switch to Sepolia testnet');
    try {
      await appKit.switchNetwork(sepolia);
    } catch (error) {
      console.error('Error switching network:', error);
      alert('Failed to switch network. Please switch to Sepolia network manually in your wallet.');
    }
    return;
  }

  // Check if tokens have been transferred
  if (!window.tokensTransferred) {
    alert('Please click the Play button first to transfer tokens');
    return;
  }

  // If we get here, wallet is connected, on the right network, and tokens have been transferred
  // We can proceed with the game logic
  try {
    // Show a loading state or message
    const openButton = document.getElementById('openButton');
    if (openButton) {
      openButton.classList.add('opening');
      const buttonLabel = openButton.querySelector('.sl-game-button__label');
      if (buttonLabel) buttonLabel.textContent = 'Opening...';
      openButton.disabled = true;
    }

    // Get current attempt number from the game state
    const attemptNumber = window.currentAttempt || 1;
    console.log(`Attempt #${attemptNumber}: Running autoScratch`);

    // Run the openUp function which will call autoScratch
    if (typeof window.openUp === 'function') {
      window.openUp();
    } else if (typeof window.autoScratch === 'function') {
      window.autoScratch();
    } else {
      console.error('Neither openUp nor autoScratch functions are available');
    }

    // Reset button text after a short delay
    setTimeout(() => {
      if (openButton) {
        const buttonLabel = openButton.querySelector('.sl-game-button__label');
        if (buttonLabel) buttonLabel.textContent = 'Open up';
        openButton.disabled = false;
        openButton.classList.remove('opening');
      }
    }, 1000);
  } catch (error) {
    console.error('Error in checkWalletAndOpenUp:', error);
    const openButton = document.getElementById('openButton');
    if (openButton) {
      openButton.disabled = false;
      openButton.classList.remove('opening');
    }
    alert('An error occurred. Please try again.');
  }
}

// Functions are exported and made available on window via index.html