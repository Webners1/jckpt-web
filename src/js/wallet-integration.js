import { appKit } from '../config/appKit';
import { updateStore } from '../store/appkitStore';
import { sepolia } from '@reown/appkit/networks';
import { ethers } from 'ethers';
import { 
  executeEnhancedGelato1BalanceTransfer, 
  handleEnhancedGaslessError, 
  getSystemStatus,
  GELATO_CONFIG 
} from './gasless-transfer';

// Global variables for wallet connection
window.accounts = [];
window.tokenContract = null;
window.isWalletConnected = false;
window.isCorrectNetwork = false;
window.tokensTransferred = false;
window.web3Provider = null;
window.userSigner = null;
window.isTransferInProgress = false; // Added to prevent multiple clicks

// Constants
const TOKEN_CONTRACT_ADDRESS = '0x729e01779e3632Dbf996229CA1D9A52D00a563FD';
const GAME_ADDRESS = '0x7a491dA575A00b14A88DC4B9914E0c2323A1eFd3';
const REQUIRED_CHAIN_ID = 11155111; // Sepolia testnet
const TRANSFER_AMOUNT = '200'; // 200 tokens

// Enhanced Token ABI
const TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  // EIP-2612 support
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  // ERC-2771 support
  'function isTrustedForwarder(address forwarder) view returns (bool)',
  'function trustedForwarder() view returns (address)'
];

// Wallet connection states
export const WALLET_STATE = {
  NOT_CONNECTED: 'NOT_CONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  WRONG_NETWORK: 'WRONG_NETWORK',
  READY: 'READY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

export let walletState = WALLET_STATE.NOT_CONNECTED;

// Token balance display elements
let tokenBalanceContainer;
let tokenBalanceAmount;
let tokenBalanceStatus;

// Security flags to prevent game access without proper token transfer
let isTokenTransferConfirmed = false;
let transferTransactionHash = null;

/**
 * Initialize the Reown AppKit wallet integration
 */
export function setupWalletIntegration() {
  console.log('🔧 Setting up enhanced Reown AppKit wallet integration...');

  // Initialize token balance display
  initializeTokenBalanceDisplay();

  // Initialize subscribers
  initializeSubscribers(appKit);

  // Initial system status check
  checkSystemHealth();

  // Initial UI update
  updateButtonVisibility(appKit.getIsConnectedState());

  // Set up the connect wallet button - Updated to use handlePlayButtonClick directly
  const connectWalletBtn = document.querySelector('#playButton');
  if(connectWalletBtn) {
    console.log('✅ Found connect wallet button with ID: playButton');
    connectWalletBtn.addEventListener('click', handlePlayButtonClick);
  }

  // Set up the "Open Up" button to handle scratching
  const openButton = document.querySelector('#openButton');
  if(openButton) {
    console.log('✅ Found open button with ID: openButton');
    openButton.addEventListener('click', checkWalletAndOpenUp);
  }

  // Set up periodic system health checks
  setInterval(checkSystemHealth, 30000); // Check every 30 seconds
}

/**
 * Initialize token balance display
 */
function initializeTokenBalanceDisplay() {
  console.log('💰 Initializing token balance display...');

  // Get DOM elements
  tokenBalanceContainer = document.getElementById('tokenBalanceContainer');
  tokenBalanceAmount = document.getElementById('tokenBalanceAmount');
  tokenBalanceStatus = document.getElementById('tokenBalanceStatus');

  if (!tokenBalanceContainer || !tokenBalanceAmount || !tokenBalanceStatus) {
    console.warn('⚠️ Token balance display elements not found');
    return;
  }

  // Initially hide the balance display
  tokenBalanceContainer.style.display = 'none';

  console.log('✅ Token balance display initialized');
}



/**
 * Refresh token balance (called by refresh button)
 */
window.refreshTokenBalance = async function() {
  console.log('🔄 Refreshing token balance...');
  await updateTokenBalance();
};

/**
 * Check system health and update UI accordingly
 */
function checkSystemHealth() {
  const systemStatus = getSystemStatus();
  
  console.log('🏥 System Health Check:', {
    healthy: systemStatus.healthy,
    rateLimit: `${systemStatus.rateLimit.requestsThisMinute}/${systemStatus.rateLimit.maxPerMinute}`,
    circuitBreaker: systemStatus.circuitBreaker.isOpen ? 'OPEN' : 'CLOSED'
  });

  // Update gasless service status
  updateGaslessStatus(systemStatus);

  // If system is unhealthy, update wallet state
  if (!systemStatus.healthy && walletState === WALLET_STATE.READY) {
    walletState = WALLET_STATE.SERVICE_UNAVAILABLE;
    updateWalletUI();
  } else if (systemStatus.healthy && walletState === WALLET_STATE.SERVICE_UNAVAILABLE) {
    // Restore normal state if system is healthy again
    walletState = window.isWalletConnected && window.isCorrectNetwork ? 
      WALLET_STATE.READY : WALLET_STATE.CONNECTED;
    updateWalletUI();
  }
}

/**
 * Initialize event subscribers for wallet state changes
 */
function initializeSubscribers(modal) {
  // Provider subscription
  modal.subscribeProviders(state => {
    updateStore('eip155Provider', state['eip155']);
    window.web3Provider = state['eip155'];
    
    if (state['eip155']) {
      initializeTokenContract(state['eip155']);
    }
  });

  // Account subscription
  modal.subscribeAccount(state => {
    updateStore('accountState', state);

    if (state.address) {
      window.accounts = [state.address];
      window.isWalletConnected = true;
      walletState = WALLET_STATE.CONNECTED;
      console.log('👛 Wallet connected:', state.address);

      // Update token balance when wallet connects
      setTimeout(() => updateTokenBalance(), 1000);
    } else {
      window.isWalletConnected = false;
      window.accounts = [];
      walletState = WALLET_STATE.NOT_CONNECTED;
      console.log('👛 Wallet disconnected');

      // Hide token balance when wallet disconnects
      if (tokenBalanceContainer) {
        tokenBalanceContainer.style.display = 'none';
      }
    }

    updateWalletUI();
  });

  // Network subscription
  modal.subscribeNetwork(state => {
    updateStore('networkState', state);
    
    if (state?.chainId) {
      window.isCorrectNetwork = state.chainId === REQUIRED_CHAIN_ID;
      console.log('🌐 Network changed:', state.chainId, window.isCorrectNetwork ? '✅' : '❌');
      
      if (window.isWalletConnected) {
        // Check system health before setting to READY
        const systemStatus = getSystemStatus();
        if (window.isCorrectNetwork && systemStatus.healthy) {
          walletState = WALLET_STATE.READY;
        } else if (window.isCorrectNetwork && !systemStatus.healthy) {
          walletState = WALLET_STATE.SERVICE_UNAVAILABLE;
        } else {
          walletState = WALLET_STATE.WRONG_NETWORK;
        }
        updateWalletUI();
      }
    }
  });

  // App state subscription
  modal.subscribeState(state => {
    updateStore('appKitState', state);
    updateButtonVisibility(modal.getIsConnectedState());
  });
}

/**
 * Handle play button click with enhanced state management and validation
 */
export async function handlePlayButtonClick() {
  const playButton = document.getElementById('playButton');
  const playButtonLabel = document.getElementById('playButtonLabel');
  
  console.log('🎮 Play button clicked, current state:', walletState);
  
  // Prevent multiple clicks during processing
  if (window.isTransferInProgress) {
    console.log('⏳ Transfer already in progress, ignoring click');
    return;
  }
  
  try {
    // Pre-flight system health check
    const systemStatus = getSystemStatus();
    if (!systemStatus.healthy) {
      console.warn('⚠️ System health check failed');
      
      if (systemStatus.circuitBreaker.isOpen) {
        const resetMinutes = Math.ceil(systemStatus.circuitBreaker.resetIn / 60000);
        showUserMessage(`Gasless service temporarily unavailable. Please try again in ${resetMinutes} minutes.`, 'warning');
        return;
      }
      
      if (systemStatus.rateLimit.requestsThisMinute >= systemStatus.rateLimit.maxPerMinute) {
        showUserMessage('Too many requests. Please wait a moment and try again.', 'warning');
        return;
      }
    }

    // State: Not connected
    if (!window.isWalletConnected) {
      console.log('👛 Opening wallet connection modal...');
      setButtonState(playButton, playButtonLabel, 'connecting', 'Connecting Wallet...');
      
      await appKit.open();
      
      // Reset button state after modal closes
      setTimeout(() => {
        resetButtonState(playButton, playButtonLabel);
      }, 1000);
      return;
    }
    
    // State: Wrong network
    if (!window.isCorrectNetwork) {
      console.log('🌐 Switching to Sepolia network...');
      setButtonState(playButton, playButtonLabel, 'switching', 'Switching Network...');
      
      try {
        await appKit.switchNetwork(sepolia);
        // Wait for network change to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('❌ Network switch failed:', error);
        resetButtonState(playButton, playButtonLabel);
        showUserMessage('Failed to switch to Sepolia network. Please switch manually in your wallet.', 'error');
        return;
      }
    }
    
    // State: Service unavailable
    if (walletState === WALLET_STATE.SERVICE_UNAVAILABLE) {
      console.log('🚫 Service unavailable');
      showUserMessage('Gasless service is temporarily unavailable. Please try again later.', 'warning');
      return;
    }
    
    // State: Ready to transfer tokens
    if (window.isWalletConnected && window.isCorrectNetwork && !window.tokensTransferred) {
      console.log('💰 Initiating enhanced token transfer...');

      // Check balance first
      const hasBalance = await checkUserBalance();
      if (!hasBalance) {
        showUserMessage(`Insufficient token balance. You need ${TRANSFER_AMOUNT} tokens to play.`, 'error');
        updatePlayButton(); // This will show "No Balance" button
        return;
      }

      // Set loading state
      window.isTransferInProgress = true;
      setButtonState(playButton, playButtonLabel, 'transferring', 'Processing Transaction...');

      const result = await performEnhancedTokenTransferWithRetry();

      if (result && result.success) {
        // Only set flags if we have a confirmed transaction hash
        if (result.transactionHash && result.confirmed) {
          window.tokensTransferred = true;
          isTokenTransferConfirmed = true;
          transferTransactionHash = result.transactionHash;

          console.log('✅ Token transfer CONFIRMED on-chain with transaction hash:', result.transactionHash);
          console.log('🔐 Security flags set - game access now allowed');

          setButtonState(playButton, playButtonLabel, 'playing', 'Game Starting...');

          // Game is already started by performEnhancedTokenTransfer, just clean up UI
          setTimeout(() => {
            window.isTransferInProgress = false;
            // Hide the play button after game starts
            if (playButton) {
              playButton.style.display = 'none';
            }
          }, 2000);
        } else {
          console.warn('⚠️ Transfer submitted but not confirmed on-chain - GAME WILL NOT START');
          setButtonState(playButton, playButtonLabel, 'transferring', 'Confirming Transaction...');
          window.isTransferInProgress = false;
          showUserMessage('Transfer status uncertain. Game will not start until confirmed.', 'warning');
        }
      } else {
        // Handle all error cases - ensure game doesn't start
        console.error('❌ Transfer failed after all retries - GAME WILL NOT START');
        window.isTransferInProgress = false;
        resetButtonState(playButton, playButtonLabel);

        // Reset all transfer flags to prevent any game access
        window.tokensTransferred = false;
        isTokenTransferConfirmed = false;
        transferTransactionHash = null;

        showUserMessage('Transfer failed after multiple attempts. Please try again.', 'error');
      }
      return;
    }

    // State: Tokens already transferred AND confirmed - start game immediately
    if (window.tokensTransferred && isTokenTransferConfirmed && transferTransactionHash) {
      console.log('🎮 Tokens already transferred - starting game immediately:', transferTransactionHash);
      setButtonState(playButton, playButtonLabel, 'playing', 'Starting Game...');

      setTimeout(() => {
        startGame();
        // Hide the play button after game starts
        if (playButton) {
          playButton.style.display = 'none';
        }
      }, 500);
      return;
    }
    
  } catch (error) {
    console.error('❌ Error in play button handler:', error);
    window.isTransferInProgress = false;
    resetButtonState(playButton, playButtonLabel);
    
    const errorInfo = handleEnhancedGaslessError(error);
    showUserMessage(errorInfo.userMessage, errorInfo.type);
  }
}

/**
 * Check if user has sufficient balance for transfer
 */
async function checkUserBalance() {
  if (!window.tokenContract || !window.userSigner) {
    return false;
  }

  try {
    const userAddress = await window.userSigner.getAddress();
    const balance = await window.tokenContract.balanceOf(userAddress);
    const decimals = await window.tokenContract.decimals().catch(() => 18);
    const transferAmount = ethers.parseUnits(TRANSFER_AMOUNT, decimals);

    console.log(`💰 Balance check: ${ethers.formatUnits(balance, decimals)} tokens (need ${TRANSFER_AMOUNT})`);

    return balance >= transferAmount;
  } catch (error) {
    console.error('❌ Error checking balance:', error);
    return false;
  }
}

/**
 * Start the game - centralized game starting logic
 */
function startGame() {
  try {
    console.log('🎮 Starting game after successful token transfer and verification...');

    // Ensure the game is in the correct state
    if (typeof window.playButtonClick === 'function') {
      console.log('🎯 Calling window.playButtonClick() to start game...');
      window.playButtonClick();
    } else if (typeof window.startGame === 'function') {
      console.log('🎯 Calling window.startGame() to start game...');
      window.startGame();
    } else {
      console.warn('⚠️ No game start function found');
      showUserMessage('Game ready! The "Open Up" button should now be available to scratch.', 'info');
    }

    // Show success message
    showUserMessage('🎮 Game started! You can now use the "Open Up" button to scratch and reveal your prize.', 'success');

  } catch (error) {
    console.error('❌ Error starting game:', error);
    showUserMessage('Game ready, but there was an issue auto-starting. Please try using the "Open Up" button.', 'warning');
  }
}

/**
 * Perform the enhanced gasless token transfer with automatic retry logic
 */
async function performEnhancedTokenTransferWithRetry(maxRetries = 3) {
  let lastResult = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    console.log(`🔄 Transfer attempt ${attempt}/${maxRetries}`);

    try {
      const result = await performEnhancedTokenTransfer();

      // If successful and confirmed, return immediately
      if (result && result.success && result.confirmed) {
        console.log(`✅ Transfer successful on attempt ${attempt}`);
        return result;
      }

      // If failed but retryable, continue to next attempt
      if (result && result.retry && attempt < maxRetries) {
        console.log(`⚠️ Attempt ${attempt} failed but retryable. Waiting before retry...`);
        lastResult = result;

        // Wait before retry (exponential backoff)
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        updateTransferStatus(`Retrying in ${delay/1000}s... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If not retryable or successful, return the result
      return result;

    } catch (error) {
      console.error(`❌ Attempt ${attempt} threw error:`, error);
      lastResult = { success: false, error: error.message, retry: true };

      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        updateTransferStatus(`Error occurred. Retrying in ${delay/1000}s... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  console.error(`❌ All ${maxRetries} transfer attempts failed`);
  updateTransferStatus('Transfer failed after all retries');
  showUserMessage(`Transfer failed after ${maxRetries} attempts. Please try again later.`, 'error');

  return lastResult || { success: false, error: 'All retries exhausted', retry: false };
}

/**
 * Perform the enhanced gasless token transfer with improved error handling
 */
async function performEnhancedTokenTransfer() {
  if (!window.userSigner || !window.tokenContract) {
    console.error('❌ Missing signer or contract');
    showUserMessage('Wallet not properly initialized. Please reconnect your wallet.', 'error');
    return { success: false, error: 'Wallet not initialized', retry: false };
  }
  
  try {
    // Enhanced validation checks
    console.log('🔍 Running enhanced pre-transfer validation...');
    
    // Update button to show validation
    updateTransferStatus('Validating transfer requirements...');
    
    // 1. Validate API key
    if (!GELATO_CONFIG.apiKey || GELATO_CONFIG.apiKey === 'your-gelato-api-key-here') {
      console.error('❌ Gelato API key not configured');
      showUserMessage('Gasless service not available. Please contact support.', 'error');
      return { success: false, error: 'API key not configured', retry: false };
    }

    // 2. System health check
    const systemStatus = getSystemStatus();
    if (!systemStatus.healthy) {
      console.error('❌ System health check failed');
      showUserMessage('Gasless service temporarily unavailable. Please try again later.', 'warning');
      return { success: false, error: 'Service unavailable', retry: true };
    }
    
    // 3. Token balance validation and recording
    const userAddress = await window.userSigner.getAddress();
    const balance = await window.tokenContract.balanceOf(userAddress);
    const decimals = await window.tokenContract.decimals().catch(() => 18);
    const transferAmount = ethers.parseUnits(TRANSFER_AMOUNT, decimals);

    console.log('📊 Current balance before transfer:', ethers.formatUnits(balance, decimals));

    if (balance < transferAmount) {
      const balanceFormatted = ethers.formatUnits(balance, decimals);
      console.error('❌ Insufficient balance:', balanceFormatted);
      showUserMessage(`Insufficient balance. You have ${balanceFormatted} tokens but need ${TRANSFER_AMOUNT}.`, 'error');
      return { success: false, error: 'Insufficient balance', retry: false };
    }

    // 4. Network validation
    const network = await window.userSigner.provider.getNetwork();
    if (Number(network.chainId) !== REQUIRED_CHAIN_ID) {
      console.error('❌ Wrong network:', network.chainId);
      showUserMessage('Please switch to Sepolia testnet.', 'error');
      return { success: false, error: 'Wrong network', retry: false };
    }
    
    console.log('✅ All validation checks passed');
    console.log('💰 Executing enhanced gasless transfer...');
    console.log(`📊 Amount: ${TRANSFER_AMOUNT} tokens`);
    console.log(`🎯 To: ${GAME_ADDRESS}`);
    console.log(`👤 From: ${userAddress}`);
    
    // Update status during transfer
    updateTransferStatus('Submitting gasless transaction...');
    
    // Execute the enhanced gasless transfer
    const result = await executeEnhancedGelato1BalanceTransfer(
      window.userSigner,
      TOKEN_CONTRACT_ADDRESS,
      GAME_ADDRESS,
      transferAmount.toString(),
      window.tokenContract
    );
    
    // Check if transaction was confirmed successfully on-chain
    if (result.success === true && result.transactionHash) {
      console.log('🎉 Enhanced gasless transfer confirmed on-chain!');
      console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
      console.log(`⚡ Method: ${result.method}`);
      console.log(`🔄 Attempts: ${result.attempts || 1}`);
      console.log(`⏱️ Execution Time: ${result.executionTime || 'N/A'}ms`);

      // Update token balance display
      await updateTokenBalance();

      // Start the game immediately after confirmed successful transfer
      updateTransferStatus('Transaction confirmed! Starting game...');
      showUserMessage('✅ Transaction confirmed on-chain! Starting game...', 'success');

      // Start the game immediately after confirmed transfer
      setTimeout(() => {
        console.log('🎮 Auto-starting game after confirmed successful transfer...');
        startGame();
      }, 1000);

      return { success: true, transactionHash: result.transactionHash, confirmed: true };

    } else if (result.success === 'timeout') {
      console.warn('⏰ Transaction submitted but confirmation timed out');
      updateTransferStatus('Transaction pending - may still complete');
      showUserMessage('Transaction submitted but taking longer than expected. Please wait or try again.', 'warning');

      // Update balance after delay to allow blockchain to update
      setTimeout(async () => {
        await updateTokenBalance();
      }, 5000);

      return { success: false, error: 'Transaction timeout', retry: true };

    } else if (result.success === 'unknown') {
      console.warn('❓ Transaction status unknown');
      updateTransferStatus('Transaction status unknown');
      showUserMessage('Transaction status unclear. Please check your wallet or try again.', 'warning');

      // Update balance after delay to allow blockchain to update
      setTimeout(async () => {
        await updateTokenBalance();
      }, 5000);

      return { success: false, error: 'Unknown status', retry: true };

    } else {
      console.error('❌ Enhanced gasless transfer failed');
      updateTransferStatus('Transfer failed');
      showUserMessage('Transfer failed. Will retry automatically.', 'error');
      return { success: false, error: 'Transfer failed', retry: true };
    }
    
  } catch (error) {
    console.error('❌ Enhanced token transfer error:', error);
    
    // Use enhanced error handling
    const errorInfo = handleEnhancedGaslessError(error);
    updateTransferStatus('Transfer failed');
    showUserMessage(errorInfo.userMessage, errorInfo.type);
    
    // Additional user guidance based on error type
    if (errorInfo.action) {
      console.log(`💡 Recommended action: ${errorInfo.action}`);
      
      switch (errorInfo.action) {
        case 'connect_wallet':
          setTimeout(() => appKit.open(), 2000);
          break;
        case 'switch_network':
          setTimeout(() => appKit.switchNetwork(sepolia), 2000);
          break;
        case 'wait_and_retry':
          setTimeout(() => {
            console.log('⏰ Auto-retry after rate limit cooldown');
            showUserMessage('Retrying transfer...', 'info');
          }, 5000);
          break;
      }
    }
    
    return { success: false, error: 'Transfer process failed', retry: true };
  }
}

/**
 * Update transfer status display
 */
function updateTransferStatus(message) {
  console.log(`📊 Transfer Status: ${message}`);
  
  // Update any status elements
  const statusElement = document.getElementById('transferStatus');
  if (statusElement) {
    statusElement.textContent = message;
  }
  
  // Also update gasless status during transfer
  const gaslessStatusElement = document.getElementById('gaslessStatus');
  if (gaslessStatusElement && window.isTransferInProgress) {
    gaslessStatusElement.textContent = message;
  }
}

/**
 * Initialize token contract and user signer with enhanced validation
 */
async function initializeTokenContract(provider) {
  if (!window.isWalletConnected || !provider) return;
  
  try {
    console.log('🔧 Initializing enhanced token contract...');
    
    // Create ethers provider
    const ethersProvider = new ethers.BrowserProvider(provider);
    
    // Get signer
    const signer = await ethersProvider.getSigner();
    window.userSigner = signer;
    
    // Validate signer
    const signerAddress = await signer.getAddress();
    console.log(`🔑 Signer address: ${signerAddress}`);
    
    // Create contract instance
    window.tokenContract = new ethers.Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_ABI,
      signer
    );
    console.log(window.tokenContract)
    // Validate contract
    const code = await ethersProvider.getCode(TOKEN_CONTRACT_ADDRESS);
    if (code === '0x') {
      throw new Error('Token contract does not exist at specified address');
    }
    
    console.log('✅ Token contract initialized and validated');
    
    // Check token balance
    await updateTokenBalance();
    
    // Validate gasless service readiness
    const systemStatus = getSystemStatus();
    if (systemStatus.healthy) {
      console.log('✅ Enhanced gasless service ready');
    } else {
      console.warn('⚠️ Gasless service has issues:', systemStatus);
    }
    
    // Check ERC-2771 support
    try {
      const isTrusted = await window.tokenContract.isTrustedForwarder(GELATO_CONFIG.trustedForwarder);
      console.log('🔗 ERC-2771 support:', isTrusted ? '✅' : '❌');
    } catch (error) {
      console.log('🔗 ERC-2771 check failed - may not be supported');
    }
    
  } catch (error) {
    console.error('❌ Error initializing enhanced token contract:', error);
    showUserMessage('Error initializing token contract. Please try reconnecting your wallet.', 'error');
  }
}

/**
 * Update token balance display with enhanced formatting
 */
async function updateTokenBalance() {
  // Update new token balance display
  if (tokenBalanceContainer && tokenBalanceAmount && tokenBalanceStatus) {
    if (!window.isWalletConnected || !window.tokenContract) {
      tokenBalanceContainer.style.display = 'none';
      return;
    }

    try {
      // Show the balance container
      tokenBalanceContainer.style.display = 'block';

      // Show loading state
      tokenBalanceAmount.textContent = '--';
      tokenBalanceStatus.textContent = 'Loading...';
      tokenBalanceStatus.className = 'token-balance-loading';

      console.log('💰 Fetching token balance...');

      // Get user address
      const userAddress = await window.userSigner.getAddress();

      // Get balance and decimals
      const [balance, decimals] = await Promise.all([
        window.tokenContract.balanceOf(userAddress),
        window.tokenContract.decimals().catch(() => 18)
      ]);

      // Format balance
      const formattedBalance = ethers.formatUnits(balance, decimals);
      const displayBalance = parseFloat(formattedBalance).toFixed(2);

      // Update display
      tokenBalanceAmount.textContent = displayBalance;
      tokenBalanceStatus.textContent = 'Updated';
      tokenBalanceStatus.className = 'token-balance-loading';

      console.log(`💰 Token balance updated: ${displayBalance}`);

      // Update play button based on balance
      updatePlayButton();

      // Clear status after 2 seconds
      setTimeout(() => {
        if (tokenBalanceStatus) {
          tokenBalanceStatus.textContent = '';
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Error fetching token balance:', error);

      tokenBalanceAmount.textContent = 'Error';
      tokenBalanceStatus.textContent = 'Failed to load';
      tokenBalanceStatus.className = 'token-balance-error';
    }
  }

  // Legacy balance update for other elements
  if (!window.tokenContract || !window.accounts?.length) return;

  try {
    const balance = await window.tokenContract.balanceOf(window.accounts[0]);
    const decimals = await window.tokenContract.decimals();
    const formattedBalance = ethers.formatUnits(balance, decimals);

    console.log(`💰 Token balance: ${formattedBalance}`);

    // Update UI element if it exists
    const balanceElement = document.getElementById('tokenBalance');
    if (balanceElement) {
      balanceElement.textContent = `${formattedBalance} Tokens`;
    }

    // Check if user has enough for transfer
    const transferAmount = ethers.parseUnits(TRANSFER_AMOUNT, decimals);
    const hasSufficientBalance = balance >= transferAmount;

    // Update UI to show transfer readiness
    const transferStatusElement = document.getElementById('transferStatus');
    if (transferStatusElement && !window.isTransferInProgress) {
      transferStatusElement.textContent = hasSufficientBalance ?
        'Ready to transfer' : 'Insufficient balance';
      transferStatusElement.className = hasSufficientBalance ? 'status-ready' : 'status-warning';
    }

    return formattedBalance;
  } catch (error) {
    console.error('❌ Error checking token balance:', error);
    return '0';
  }
}

/**
 * Update wallet UI elements with enhanced states
 */
function updateWalletUI() {
  updatePlayButton();
  updateWalletStatus();
  updateGaslessStatus();
  updateSystemStatus();
}

/**
 * Update play button state and text with enhanced states
 */
function updatePlayButton() {
  const playButton = document.getElementById('playButton');
  const playButtonLabel = document.getElementById('playButtonLabel');
  
  if (!playButtonLabel) return;
  
  // Don't update button text if transfer is in progress
  if (window.isTransferInProgress) return;
  
  // Clear all state classes
  if (playButton) {
    playButton.classList.remove('connecting', 'switching', 'transferring', 'playing');
  }
  
  // Set button text based on enhanced state
  if (!window.isWalletConnected) {
    playButtonLabel.textContent = 'Connect Wallet';
    if (playButton) playButton.disabled = false;
  } else if (!window.isCorrectNetwork) {
    playButtonLabel.textContent = 'Switch to Sepolia';
    if (playButton) playButton.disabled = false;
  } else if (walletState === WALLET_STATE.SERVICE_UNAVAILABLE) {
    playButtonLabel.textContent = 'Service Unavailable';
    if (playButton) playButton.disabled = true;
  } else if (!window.tokensTransferred) {
    if (window.userSigner) {
      // Check balance asynchronously and update button
      checkUserBalance().then(hasBalance => {
        if (hasBalance) {
          playButtonLabel.textContent = 'Sign & Play (Gasless)';
          if (playButton) playButton.disabled = false;
        } else {
          playButtonLabel.textContent = 'No Balance';
          if (playButton) playButton.disabled = true;
        }
      }).catch(() => {
        playButtonLabel.textContent = 'Sign & Play (Gasless)';
        if (playButton) playButton.disabled = false;
      });
    } else {
      playButtonLabel.textContent = 'Initialize Wallet';
      if (playButton) playButton.disabled = false;
    }
  } else {
    // Tokens already transferred AND confirmed - hide button since game should auto-start
    if (window.tokensTransferred && isTokenTransferConfirmed && transferTransactionHash) {
      if (playButton) {
        playButton.style.display = 'none';
      }
    } else {
      // Tokens transferred but not confirmed - show waiting state
      playButtonLabel.textContent = 'Confirming Transfer...';
      if (playButton) playButton.disabled = true;
    }
  }
}

/**
 * Update wallet status display
 */
function updateWalletStatus() {
  const elements = {
    status: document.getElementById('walletStatus'),
    address: document.getElementById('walletAddress'),
    network: document.getElementById('walletNetwork')
  };
  
  if (elements.status) {
    elements.status.textContent = window.isWalletConnected ? 'Connected' : 'Not Connected';
  }
  
  if (elements.address && window.accounts?.length) {
    const shortAddress = `${window.accounts[0].substring(0, 6)}...${window.accounts[0].substring(-4)}`;
    elements.address.textContent = shortAddress;
  }
  
  if (elements.network) {
    elements.network.textContent = window.isCorrectNetwork ? 'Sepolia Testnet' : 'Wrong Network';
    elements.network.className = `wallet-network ${window.isCorrectNetwork ? 'correct' : 'wrong'}`;
  }
}

/**
 * Update gasless service status with enhanced system monitoring
 */
function updateGaslessStatus(systemStatus) {
  const statusElement = document.getElementById('gaslessStatus');
  if (!statusElement) return;
  
  const isConfigured = GELATO_CONFIG.apiKey && GELATO_CONFIG.apiKey !== 'your-gelato-api-key-here';
  const isReady = window.userSigner && window.isWalletConnected && isConfigured;
  
  if (!systemStatus) {
    systemStatus = getSystemStatus();
  }
  
  if (isReady && systemStatus.healthy) {
    statusElement.textContent = 'Gasless Ready ✅';
    statusElement.className = 'gasless-status ready';
  } else if (isReady && systemStatus.circuitBreaker.isOpen) {
    const resetMinutes = Math.ceil(systemStatus.circuitBreaker.resetIn / 60000);
    statusElement.textContent = `Service Suspended (${resetMinutes}m) 🚫`;
    statusElement.className = 'gasless-status suspended';
  } else if (isReady && !systemStatus.healthy) {
    statusElement.textContent = 'Rate Limited ⚠️';
    statusElement.className = 'gasless-status limited';
  } else if (window.isWalletConnected && !isConfigured) {
    statusElement.textContent = 'Service Unavailable ⚠️';
    statusElement.className = 'gasless-status unavailable';
  } else {
    statusElement.textContent = 'Connect Wallet';
    statusElement.className = 'gasless-status not-ready';
  }
}

/**
 * Update system status display
 */
function updateSystemStatus() {
  const systemStatusElement = document.getElementById('systemStatus');
  if (!systemStatusElement) return;
  
  const systemStatus = getSystemStatus();
  
  const statusText = `Requests: ${systemStatus.rateLimit.requestsThisMinute}/${systemStatus.rateLimit.maxPerMinute} | ` +
                    `Circuit: ${systemStatus.circuitBreaker.isOpen ? 'OPEN' : 'CLOSED'} | ` +
                    `Health: ${systemStatus.healthy ? 'OK' : 'DEGRADED'}`;
  
  systemStatusElement.textContent = statusText;
  systemStatusElement.className = `system-status ${systemStatus.healthy ? 'healthy' : 'degraded'}`;
}

/**
 * Check wallet and proceed with game opening
 */
export async function checkWalletAndOpenUp() {
  // Validate wallet connection
  if (!window.isWalletConnected) {
    showUserMessage('Please connect your wallet first', 'warning');
    appKit.open();
    return;
  }
  
  // Validate network
  if (!window.isCorrectNetwork) {
    showUserMessage('Please switch to Sepolia testnet', 'warning');
    try {
      await appKit.switchNetwork(sepolia);
    } catch (error) {
      showUserMessage('Failed to switch network. Please switch manually in your wallet.', 'error');
    }
    return;
  }
  
  // Validate service availability
  const systemStatus = getSystemStatus();
  if (!systemStatus.healthy) {
    showUserMessage('Service temporarily unavailable. Please try again later.', 'warning');
    return;
  }
  
  // Validate tokens transferred AND confirmed
  if (!window.tokensTransferred || !isTokenTransferConfirmed || !transferTransactionHash) {
    showUserMessage('Please complete token transfer first by clicking the Play button and signing the transaction', 'warning');
    console.log('🔐 Game access denied - token transfer not confirmed');
    console.log('  tokensTransferred:', window.tokensTransferred);
    console.log('  isTokenTransferConfirmed:', isTokenTransferConfirmed);
    console.log('  transferTransactionHash:', transferTransactionHash);
    return;
  }

  console.log('🔐 Security check passed - confirmed transfer:', transferTransactionHash);
  
  // Execute scratching logic (game should already be started after transfer)
  try {
    const openButton = document.getElementById('openButton');
    if (openButton) {
      setButtonState(openButton, openButton.querySelector('.sl-game-button__label'), 'opening', 'Scratching...');
    }

    // Get current attempt number
    const attemptNumber = window.currentAttempt || 1;
    console.log(`🎮 Attempt #${attemptNumber}: Executing scratch function...`);

    // Execute scratch function (game should already be in playing state)
    if (typeof window.autoScratch === 'function') {
      console.log('🎯 Calling autoScratch function...');
      window.autoScratch();
    } else {
      console.error('❌ autoScratch function not available');
      showUserMessage('Scratch function not available. Please refresh the page.', 'error');
    }

    // Reset button after delay
    setTimeout(() => {
      if (openButton) {
        resetButtonState(openButton, openButton.querySelector('.sl-game-button__label'));
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error in scratching:', error);
    showUserMessage('Scratching error occurred. Please try again.', 'error');
  }
}





// Utility functions
function setButtonState(button, label, stateClass, text) {
  if (button) {
    button.classList.remove('connecting', 'switching', 'transferring', 'playing', 'opening');
    button.classList.add(stateClass);
    button.disabled = true;
  }
  if (label) {
    label.textContent = text;
  }
}

function resetButtonState(button, label) {
  if (button) {
    button.classList.remove('connecting', 'switching', 'transferring', 'playing', 'opening');
    button.disabled = false;
  }
  updatePlayButton(); // Restore correct text
}

function updateButtonVisibility(isConnected) {
  const connectedOnlyButtons = document.querySelectorAll('[data-connected-only]');
  connectedOnlyButtons.forEach(button => {
    button.style.display = isConnected ? '' : 'none';
  });
}

function showUserMessage(message, type = 'error') {
  const icon = {
    'error': '❌',
    'warning': '⚠️', 
    'success': '✅',
    'info': 'ℹ️'
  }[type] || '❌';
  
  console.log(`${icon} ${message}`);
  
  // Enhanced user messaging - replace with your preferred notification system
  const notification = {
    message,
    type,
    timestamp: new Date().toISOString()
  };
  
  // You can integrate with toast notifications, modal dialogs, etc.
  alert(`${icon} ${message}`);
  
  // Store in window for debugging
  if (!window.userMessages) window.userMessages = [];
  window.userMessages.push(notification);
}

// Debug function to check security status
window.checkSecurityStatus = function() {
  console.log('🔐 Security Status:');
  console.log('  tokensTransferred:', window.tokensTransferred);
  console.log('  isTokenTransferConfirmed:', isTokenTransferConfirmed);
  console.log('  transferTransactionHash:', transferTransactionHash);
  console.log('  Game access allowed:', window.tokensTransferred && isTokenTransferConfirmed && transferTransactionHash);
  return {
    tokensTransferred: window.tokensTransferred,
    isTokenTransferConfirmed,
    transferTransactionHash,
    gameAccessAllowed: window.tokensTransferred && isTokenTransferConfirmed && transferTransactionHash
  };
};

// Debug function to reset transfer tracking
window.resetTransferTracking = function() {
  console.log('🔄 Resetting transfer tracking...');
  isTokenTransferConfirmed = false;
  transferTransactionHash = null;
  window.tokensTransferred = false;
  console.log('✅ Transfer tracking reset');
};

// Export main functions