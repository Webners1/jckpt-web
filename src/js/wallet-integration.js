import { appKit } from '../config/appKit';
import { updateStore } from '../store/appkitStore';
import { sepolia } from '@reown/appkit/networks';
import { ethers } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';

// Gelato configuration
const GELATO_CONFIG = {
  // Get API key from https://app.gelato.network/
  apiKey: import.meta.env.VITE_GELATO_API_KEY || 'your-gelato-api-key-here',
  chainId: 11155111, // Sepolia
};

// Initialize Gelato Relay with ERC-2771 configuration
// For sponsoredCallERC2771 on Sepolia, we need the trusted forwarder address
const relay = new GelatoRelay({
  contract: {
    relay1BalanceERC2771: "0xd8253782c45a12053594b9deB72d8e8aB2Fca54c" // Sepolia trusted forwarder for sponsoredCallERC2771
  }
});

// Global variables for wallet connection (will be available on window object)
window.accounts = [];
window.tokenContract = null;
window.isWalletConnected = false;
window.isCorrectNetwork = false;
window.tokensTransferred = false;
window.web3Provider = null;
window.userSigner = null; // Store user's signer for gasless transactions

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
 * Execute gasless ERC20 transfer FROM user wallet TO game address using ERC-2771 meta-transactions
 * User signs the transfer transaction but pays ZERO gas fees
 * @param {ethers.Signer} signer - User's wallet signer
 * @param {string} tokenAddress - ERC20 token contract address (must support ERC-2771)
 * @param {string} toAddress - Game address to receive tokens
 * @param {string} amount - Amount to transfer (in wei/token units)
 * @returns {Promise<any>} Transaction result
 */
async function executeGaslessTransfer(signer, tokenAddress, toAddress, amount) {
  try {
    console.log('🚀 Executing GASLESS ERC20 transfer FROM user wallet TO game address...');
    console.log('🎮 Transfer: User Wallet → Game Address (100 tokens)');
    console.log('✍️ User signs transaction but pays ZERO gas fees!');
    console.log('🔐 Using ERC-2771 meta-transactions for security');

    const userAddress = await signer.getAddress();
    const provider = signer.provider;
    const network = await provider.getNetwork();

    console.log('📋 Transfer Details:');
    console.log('  Token Contract:', tokenAddress);
    console.log('  FROM (User Wallet):', userAddress);
    console.log('  TO (Game Address):', toAddress);
    console.log('  Amount:', amount, 'tokens');
    console.log('  Chain ID:', network.chainId.toString());

    // Validate API key
    if (!GELATO_CONFIG.apiKey || GELATO_CONFIG.apiKey === 'your-gelato-api-key-here') {
      throw new Error('Gelato API key not configured. Get one from https://app.gelato.network/');
    }

    // Check if token contract supports ERC-2771 meta-transactions
    console.log('🔍 Checking if token contract supports ERC-2771 meta-transactions...');
    const supportsERC2771 = await checkERC2771Support(provider, tokenAddress);

    if (!supportsERC2771) {
      console.warn('⚠️ Token contract does not support ERC-2771 meta-transactions');
      console.warn('💡 For gasless transfers, the token contract must inherit from ERC2771Context');
      console.warn('🔧 Contract needs to trust Gelato forwarder: 0xd8253782c45a12053594b9deB72d8e8aB2Fca54c');
      console.warn('📖 See: https://docs.gelato.network/web3-services/relay/erc-2771-recommended');
      // We'll still try the transfer, but it might fail
    } else {
      console.log('✅ Token contract supports ERC-2771 meta-transactions!');
      console.log('🎯 Ready for gasless user-to-game token transfers');
    }

    // Create the transfer function call data using ethers v6 syntax
    const tokenContract = new ethers.Contract(
      tokenAddress,
      TOKEN_ABI,
      signer
    );

    // Generate the transfer transaction data: transfer(gameAddress, amount)
    // This will transfer tokens FROM the user's wallet TO the game address
    const { data } = await tokenContract.transfer.populateTransaction(toAddress, amount);

    console.log('📝 Creating ERC-2771 meta-transaction for token transfer...');
    console.log('📋 Transaction data:', data);
    console.log('🔍 Function signature:', data.slice(0, 10)); // First 4 bytes (function selector)

    // Verify this matches the expected transfer function signature
    const expectedTransferSig = '0xa9059cbb'; // transfer(address,uint256)
    const actualSig = data.slice(0, 10);
    console.log('✅ Expected transfer signature:', expectedTransferSig);
    console.log('🎯 Actual signature matches:', actualSig === expectedTransferSig ? '✅ YES' : '❌ NO');

    console.log('📊 Meta-transaction details:');
    console.log('  Target Contract:', tokenAddress, '(Token Contract)');
    console.log('  Function Call:', 'transfer(gameAddress, amount)');
    console.log('  User (Signer):', userAddress);
    console.log('  Tokens will move FROM user wallet TO game address');

    // Create ERC-2771 sponsored call request with user signature
    // This creates a meta-transaction where:
    // 1. User signs the transfer transaction
    // 2. Gelato relays it to the token contract
    // 3. Token contract executes: transfer(gameAddress, amount)
    // 4. Tokens move from user's wallet to game address
    const request = {
      chainId: network.chainId,
      target: tokenAddress, // Token contract address (must support ERC-2771)
      data: data, // transfer(gameAddress, amount) call data
      user: userAddress, // User's address for signature verification
      userDeadline: Math.floor(Date.now() / 1000) + 300, // 5 minutes deadline
      isConcurrent: false // Use sequential nonce-based approach for reliability
    };

    console.log('🎯 ERC-2771 Request details:', {
      chainId: request.chainId.toString(),
      target: request.target,
      user: request.user,
      dataLength: request.data.length,
      userDeadline: request.userDeadline,
      isConcurrent: request.isConcurrent
    });

    console.log('📤 Submitting ERC-2771 request to Gelato Relay...');
    console.log('🔑 Using API key for sponsorship...');
    console.log('✍️ User will be prompted to sign the transaction...');

    // Submit the ERC-2771 sponsored call with user signature
    // This will prompt the user to sign the transaction in their wallet
    const relayResponse = await relay.sponsoredCallERC2771(request, signer, GELATO_CONFIG.apiKey);

    console.log('✅ Relay request submitted successfully!');
    console.log('🔗 Task ID:', relayResponse.taskId);

    // Wait for execution with improved polling
    console.log('⏳ Waiting for transaction execution...');

    // Initial wait
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Poll for task status with retries
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        const taskStatus = await relay.getTaskStatus(relayResponse.taskId);

        if (taskStatus && taskStatus.taskState === 'ExecSuccess') {
          console.log('🎉 GASLESS TRANSFER SUCCESSFUL!');
          console.log('💰 User paid ZERO gas fees!');
          console.log('🔗 Transaction Hash:', taskStatus.transactionHash);

          return {
            taskId: relayResponse.taskId,
            transactionHash: taskStatus.transactionHash,
            success: true,
            gasless: true,
            method: 'gelato-relay-erc2771-sponsored'
          };
        } else if (taskStatus && taskStatus.taskState === 'Cancelled') {
          console.error('❌ TRANSACTION CANCELLED BY GELATO');
          console.error('🔍 CANCELLATION DETAILS:', {
            taskState: taskStatus.taskState,
            lastCheckMessage: taskStatus.lastCheckMessage,
            lastCheckDate: taskStatus.lastCheckDate,
            taskId: relayResponse.taskId,
            createdDate: taskStatus.createdDate,
            executionDate: taskStatus.executionDate,
            chainId: taskStatus.chainId
          });

          // Analyze cancellation reason
          let cancellationReason = 'Unknown cancellation reason';
          const lastCheck = taskStatus.lastCheckMessage || '';

          if (lastCheck.includes('insufficient') || lastCheck.includes('balance')) {
            cancellationReason = 'Insufficient balance (either your tokens or Gelato sponsor balance)';
            console.error('💰 CANCELLATION REASON: Insufficient balance detected');
          } else if (lastCheck.includes('revert') || lastCheck.includes('execution reverted')) {
            cancellationReason = 'Transaction would revert (likely insufficient token balance or contract error)';
            console.error('🔄 CANCELLATION REASON: Transaction would revert');
          } else if (lastCheck.includes('gas') || lastCheck.includes('out of gas')) {
            cancellationReason = 'Gas estimation failed or gas limit exceeded';
            console.error('⛽ CANCELLATION REASON: Gas-related issue');
          } else if (lastCheck.includes('nonce')) {
            cancellationReason = 'Nonce mismatch or duplicate transaction';
            console.error('🔢 CANCELLATION REASON: Nonce issue');
          } else if (lastCheck.includes('timeout') || lastCheck.includes('expired')) {
            cancellationReason = 'Transaction timed out waiting for execution';
            console.error('⏰ CANCELLATION REASON: Timeout');
          } else if (lastCheck.includes('allowance')) {
            cancellationReason = 'Insufficient token allowance for transfer';
            console.error('🔐 CANCELLATION REASON: Allowance issue');
          } else if (lastCheck.includes('sponsor')) {
            cancellationReason = 'Gelato sponsor account has insufficient funds';
            console.error('💳 CANCELLATION REASON: Sponsor balance issue');
          } else if (lastCheck) {
            cancellationReason = `Gelato cancellation: ${lastCheck}`;
            console.error('❓ CANCELLATION REASON:', lastCheck);
          }

          console.error('💡 FINAL CANCELLATION REASON:', cancellationReason);
          throw new Error(`Transaction cancelled: ${cancellationReason}`);

        } else if (taskStatus && taskStatus.taskState === 'ExecReverted') {
          console.error('❌ TRANSACTION REVERTED ON BLOCKCHAIN');
          console.error('🔍 REVERT DETAILS:', {
            taskState: taskStatus.taskState,
            lastCheckMessage: taskStatus.lastCheckMessage,
            lastCheckDate: taskStatus.lastCheckDate,
            taskId: relayResponse.taskId
          });

          let revertReason = 'Transaction reverted on blockchain';
          const lastCheck = taskStatus.lastCheckMessage || '';

          if (lastCheck.includes('insufficient') || lastCheck.includes('balance')) {
            revertReason = 'Insufficient token balance for transfer';
            console.error('💰 REVERT REASON: Insufficient token balance');
          } else if (lastCheck.includes('allowance')) {
            revertReason = 'Insufficient token allowance';
            console.error('🔐 REVERT REASON: Allowance issue');
          } else if (lastCheck.includes('transfer')) {
            revertReason = 'Token transfer failed';
            console.error('📤 REVERT REASON: Transfer failed');
          } else if (lastCheck) {
            revertReason = `Blockchain revert: ${lastCheck}`;
            console.error('❓ REVERT REASON:', lastCheck);
          }

          console.error('💡 FINAL REVERT REASON:', revertReason);
          throw new Error(`Transaction reverted: ${revertReason}`);
        } else if (taskStatus && taskStatus.taskState === 'WaitingForConfirmation') {
          console.log('⏰ Transaction submitted to blockchain, waiting for confirmation...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          attempts++;
          continue;
        } else {
          console.log(`📋 Task status: ${taskStatus?.taskState || 'Unknown'}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
          continue;
        }
      } catch (statusError) {
        console.log('⚠️ Status check failed, retrying...', statusError.message);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // If we get here, polling timed out but task was submitted
    console.log('⏰ Transaction submitted but status polling timed out');
    console.log('✅ This is normal - transaction may still be processing on blockchain');
    console.log('🔗 Task ID for reference:', relayResponse.taskId);

    // Return success since the transaction was submitted successfully
    return {
      taskId: relayResponse.taskId,
      success: true, // Changed from 'pending' to true since submission was successful
      gasless: true,
      method: 'gelato-relay-erc2771-sponsored',
      message: 'Transaction submitted successfully via Gelato Relay ERC-2771'
    };

  } catch (error) {
    console.error('❌ Error executing gasless transfer:', error);
    console.error('🔍 Detailed error information:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      response: error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Enhanced error handling with specific reasons
    if (error.code === 4001 || error.message.includes('User denied') || error.message.includes('rejected')) {
      console.error('🚫 GELATO ERROR REASON: User rejected transaction');
      throw new Error('Transaction was cancelled by user');
    }

    if (error.message.includes('insufficient funds') || error.message.includes('insufficient balance')) {
      console.error('💰 GELATO ERROR REASON: Insufficient token balance');
      throw new Error('Insufficient token balance for transfer');
    }

    if (error.message.includes('API key') || error.message.includes('unauthorized') || error.message.includes('not configured')) {
      console.error('🔑 GELATO ERROR REASON: API key not configured or invalid');
      throw new Error('Gelato API key not configured. Please add VITE_GELATO_API_KEY to your .env file');
    }

    if (error.message.includes('1Balance') || error.message.includes('insufficient sponsor balance')) {
      console.error('💳 GELATO ERROR REASON: Insufficient sponsor balance');
      throw new Error('Gelato sponsor balance insufficient. Please add funds to your 1Balance account');
    }

    if (error.message.includes('network') || error.message.includes('chain')) {
      console.error('🌐 GELATO ERROR REASON: Network not supported or mismatch');
      throw new Error('Network not supported by Gelato Relay or network mismatch');
    }

    // Generic Gelato errors
    if (error.message.includes('Gelato') || error.response?.status >= 400) {
      console.error('⚡ GELATO ERROR REASON: Relay service error -', error.message);
      throw new Error(`Gelato Relay error: ${error.message}`);
    }

    console.error('❓ GELATO ERROR REASON: Unknown error -', error.message);
    throw error;
  }
}

/**
 * Check if a token contract supports ERC2771 (meta-transactions)
 * @param {ethers.Provider} provider - Ethereum provider
 * @param {string} tokenAddress - Token contract address
 * @returns {Promise<boolean>} Whether the token supports meta-transactions
 */
async function checkERC2771Support(provider, tokenAddress) {
  try {
    const contract = new ethers.Contract(
      tokenAddress,
      [
        'function isTrustedForwarder(address forwarder) view returns (bool)',
        'function trustedForwarder() view returns (address)'
      ],
      provider
    );

    // Gelato's trusted forwarder address on Sepolia
    const gelatoForwarder = '0xd8253782c45a12053594b9deB72d8e8aB2Fca54c';

    try {
      const isTrusted = await contract.isTrustedForwarder(gelatoForwarder);
      return isTrusted;
    } catch {
      // Try alternative method
      try {
        const trustedForwarder = await contract.trustedForwarder();
        return trustedForwarder.toLowerCase() === gelatoForwarder.toLowerCase();
      } catch {
        return false;
      }
    }
  } catch (error) {
    console.log('Token does not support ERC2771 meta-transactions');
    return false;
  }
}

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

   if(connectWalletBtn) {
     console.log('Found connect wallet button with ID: playButton');
    connectWalletBtn.addEventListener('click', () => {
      console.log('Connect wallet button clicked');
      appKit.open();
    });
   }
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
 * Initialize the token contract and user signer
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

    // Store the signer globally for gasless transactions
    window.userSigner = signer;

    // Create contract instance
    window.tokenContract = new ethers.Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_ABI,
      signer
    );

    console.log('Token contract initialized');
    console.log('User signer stored for Gelato gasless transactions');

    // Check if API key is configured
    if (!GELATO_CONFIG.apiKey || GELATO_CONFIG.apiKey === 'your-gelato-api-key-here') {
      console.warn('⚠️ Gelato API key not configured. Gasless transactions will fail.');
    } else {
      console.log('✅ Ready for gasless transfers via Gelato Relay');
    }

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
 * Transfer tokens using Gelato Relay - completely gasless transactions
 * User only signs, Gelato pays ALL gas fees
 */
async function transferTokens() {
  if (!window.isWalletConnected || !window.tokenContract || !window.accounts || !window.accounts.length) {
    console.error('Cannot transfer tokens: wallet not connected or contract not initialized');
    return false;
  }

  try {
    // Check if API key is configured
    if (!GELATO_CONFIG.apiKey || GELATO_CONFIG.apiKey === 'your-gelato-api-key-here') {
      console.error('❌ Gelato API key not configured');
      alert(
        'Gasless service not configured properly. Please contact support to set up the Gelato API key.'
      );
      return false;
    }

    // Get decimals
    const decimals = await window.tokenContract.decimals().catch(e => {
      console.error('Error getting decimals:', e);
      return 18; // Default to 18 decimals if contract call fails
    });

    // Amount to transfer: 100 tokens (as per requirements)
    const amount = ethers.parseUnits('100', decimals);

    console.log('🚀 GELATO GASLESS TRANSFER INITIATED');
    console.log(`💰 Transferring ${ethers.formatUnits(amount, decimals)} tokens`);
    console.log('👤 User will only SIGN - NO GAS PAYMENT required!');
    console.log('🔄 Gelato Relay will handle ALL gas fees');

    // Check balance from user's wallet
    const balance = await window.tokenContract.balanceOf(window.accounts[0]);
    if (balance < amount) {
      console.error(`Insufficient token balance. Have: ${ethers.formatUnits(balance, decimals)}, Need: 100`);
      alert('You do not have enough tokens to play. Please get more tokens and try again.');
      return false;
    }

    // Execute gasless transfer using Gelato Relay
    if (window.userSigner) {
      try {
        console.log('🎯 EXECUTING GASLESS TRANSFER VIA GELATO RELAY');
        console.log('📝 User will only sign the meta-transaction');
        console.log('⛽ Gelato will pay ALL gas fees');
        console.log('💸 User pays ZERO gas fees!');
        console.log('🔄 Transfer from user wallet to game address');

        // Execute gasless transfer using Gelato Relay
        const gaslessResult = await executeGaslessTransfer(
          window.userSigner,
          TOKEN_CONTRACT_ADDRESS,
          GAME_ADDRESS,       // To game address
          amount.toString()
        );

        // Only consider it successful if we have both success=true AND a transaction hash
        if (gaslessResult.success === true && gaslessResult.transactionHash) {
          console.log('🎉 GELATO GASLESS TRANSFER SUCCESSFUL!');
          console.log('✅ Tokens transferred via Gelato Relay without gas fees!');
          console.log('🔗 Transaction Hash:', gaslessResult.transactionHash);
          console.log('💰 User paid ZERO gas fees! 🎉');
          console.log('🚀 Method: Gelato Relay gasless transaction');

          // Update token balance
          await checkTokenBalance();

          return true;
        } else if (gaslessResult.success === true && !gaslessResult.transactionHash) {
          // Transaction was submitted but no hash yet (still pending)
          console.log('⏰ Transaction submitted successfully but still pending confirmation');
          console.log('🔗 Task ID:', gaslessResult.taskId);
          throw new Error('Transaction submitted but still pending - please wait and try again');
        } else {
          throw new Error('Transaction failed');
        }

      } catch (gaslessError) {
        console.error('❌ Gelato gasless transfer failed:', gaslessError);
        console.log(gaslessError);
        console.log(gaslessResult);
        console.error('🔍 Full error details:', {
          message: gaslessError.message,
          code: gaslessError.code,
          stack: gaslessError.stack,
          name: gaslessError.name
        });
        console.log('💡 This application only supports gasless transactions');

        // Show specific error message based on the error type
        if (gaslessError.message.includes('cancelled by user')) {
          console.error('❌ ERROR REASON: User cancelled the transaction');
          alert('❌ Transaction Cancelled\n\nReason: You cancelled the transaction in your wallet.\n\nPlease try again and approve the transaction.');
          return false;
        } else if (gaslessError.message.includes('insufficient')) {
          console.error('❌ ERROR REASON: Insufficient token balance');
          alert('❌ Insufficient Balance\n\nReason: You don\'t have enough tokens.\n\nYou need at least 100 tokens to play.');
          return false;
        } else if (gaslessError.message.includes('configuration error') || gaslessError.message.includes('not configured')) {
          console.error('❌ ERROR REASON: Gelato API key not configured');
          alert(
            '❌ Configuration Error\n\n' +
            'Reason: Gelato API key not configured properly.\n\n' +
            'Steps to fix:\n' +
            '1. Get API key from https://relay.gelato.network/\n' +
            '2. Add VITE_GELATO_API_KEY=your-key to .env file\n' +
            '3. Add credits to your Gelato account'
          );
          return false;
        } else if (gaslessError.message.includes('temporarily unavailable') || gaslessError.message.includes('SIME token')) {
          console.error('❌ ERROR REASON: Gasless service temporarily unavailable');
          alert(
            '❌ Service Unavailable\n\n' +
            'Reason: Gasless service is temporarily unavailable.\n\n' +
            'Please try again in a moment. If the issue persists, contact support.'
          );
          return false;
        } else if (gaslessError.message.includes('cancelled')) {
          console.error('❌ ERROR REASON: Transaction cancelled by Gelato');

          // Extract specific cancellation reason from error message
          let specificReason = 'Unknown cancellation reason';
          if (gaslessError.message.includes('insufficient balance')) {
            specificReason = 'You don\'t have enough tokens or Gelato sponsor balance is insufficient';
          } else if (gaslessError.message.includes('would revert')) {
            specificReason = 'Transaction would fail (likely insufficient token balance)';
          } else if (gaslessError.message.includes('gas')) {
            specificReason = 'Gas estimation failed or gas limit exceeded';
          } else if (gaslessError.message.includes('sponsor')) {
            specificReason = 'Gelato sponsor account has insufficient funds';
          } else if (gaslessError.message.includes('allowance')) {
            specificReason = 'Insufficient token allowance';
          }

          alert(
            '❌ Transaction Cancelled\n\n' +
            'Reason: ' + specificReason + '\n\n' +
            'Please check your token balance and try again.'
          );
          return false;
        } else if (gaslessError.message.includes('reverted')) {
          console.error('❌ ERROR REASON: Transaction reverted on blockchain');

          let revertReason = 'Transaction failed on blockchain';
          if (gaslessError.message.includes('insufficient')) {
            revertReason = 'Insufficient token balance for transfer';
          } else if (gaslessError.message.includes('allowance')) {
            revertReason = 'Insufficient token allowance';
          } else if (gaslessError.message.includes('transfer')) {
            revertReason = 'Token transfer failed';
          }

          alert(
            '❌ Transaction Reverted\n\n' +
            'Reason: ' + revertReason + '\n\n' +
            'Please check your token balance and try again.'
          );
          return false;
        } else if (gaslessError.message.includes('still pending')) {
          console.error('❌ ERROR REASON: Previous transaction still pending');
          alert(
            '⏰ Transaction Pending\n\n' +
            'Reason: Your previous transaction is still being processed.\n\n' +
            'Please wait 30-60 seconds and try again.'
          );
          return false;
        } else if (gaslessError.message.includes('timeout') || gaslessError.message.includes('polling timed out')) {
          console.error('❌ ERROR REASON: Transaction status polling timed out');
          console.log('⏰ Transaction submitted but status polling timed out');
          console.log('⚠️ Waiting for blockchain confirmation before allowing game to start');
          alert(
            '⏰ Transaction Processing\n\n' +
            'Reason: Transaction is taking longer than expected to confirm.\n\n' +
            'The transaction was submitted successfully but needs more time. Please wait and try again.'
          );
          return false;
        } else {
          console.error('❌ ERROR REASON: Unknown error -', gaslessError.message);
          alert(
            '❌ Transaction Failed\n\n' +
            'Reason: ' + gaslessError.message + '\n\n' +
            'This application only supports gasless transactions. Please try again or contact support if the issue persists.'
          );
          return false;
        }
      }
    } else {
      console.log('⚠️ Gasless not available: User signer missing');
      alert(
        'Wallet connection incomplete. Please reconnect your wallet and try again.'
      );
      return false;
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
      // Show text based on whether user signer is available for gasless
      if (window.userSigner) {
        playButtonLabel.textContent = 'Sign & Play (Gasless)';
      } else {
        playButtonLabel.textContent = 'Connect Wallet';
      }
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

  // Update gasless status if elements exist
  const smartAccountStatus = document.getElementById('smartAccountStatus');
  const smartAccountAddress = document.getElementById('smartAccountAddress');

  if (smartAccountStatus) {
    const apiKeyConfigured = GELATO_CONFIG.apiKey && GELATO_CONFIG.apiKey !== 'your-gelato-api-key-here';

    if (window.userSigner && window.isWalletConnected && apiKeyConfigured) {
      smartAccountStatus.textContent = 'Gelato Gasless Ready ✓';
      smartAccountStatus.className = 'smart-account-status ready gelato-gasless';
    } else if (window.userSigner && window.isWalletConnected && !apiKeyConfigured) {
      smartAccountStatus.textContent = 'API Key Required ⚠️';
      smartAccountStatus.className = 'smart-account-status config-needed';
      smartAccountStatus.title = 'Add VITE_GELATO_API_KEY to .env file';
    } else {
      smartAccountStatus.textContent = 'Connect Wallet for Gasless';
      smartAccountStatus.className = 'smart-account-status not-ready';
    }
  }

  if (smartAccountAddress) {
    if (window.accounts && window.accounts.length > 0) {
      const shortAddress = `${window.accounts[0].substring(0, 6)}...${window.accounts[0].substring(window.accounts[0].length - 4)}`;
      smartAccountAddress.textContent = `Wallet: ${shortAddress}`;
    } else {
      smartAccountAddress.textContent = '';
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