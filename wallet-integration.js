/**
 * Wallet Integration Example
 * This file demonstrates how to integrate the multi-wallet modal into your application
 */

// Initialize Web3 and wallet-related variables
let web3;
let accounts = [];
let chainId;
let provider;
let isWalletConnected = false;
let currentWallet = null;

// Required chain ID (Sepolia testnet)
const REQUIRED_CHAIN_ID = '0xaa36a7'; // 11155111 in decimal

// Token contract address on Sepolia
const TOKEN_CONTRACT_ADDRESS = '0xe42b6bF1fE13A4b24EDdC1DB3cdA1EeF2156DcAB';

// Initialize the wallet modal
const walletModal = new WalletModal();

// Initialize the wallet modal with callbacks
walletModal.init({
  onConnect: handleWalletConnected,
  onError: handleWalletError
});

/**
 * Handle wallet connection
 * @param {Object} connectionInfo - Information about the connected wallet
 */
async function handleWalletConnected(connectionInfo) {
  console.log('Wallet connected:', connectionInfo);
  
  // Set global variables
  web3 = connectionInfo.web3;
  accounts = connectionInfo.accounts;
  chainId = connectionInfo.chainId;
  provider = connectionInfo.provider;
  currentWallet = connectionInfo.wallet;
  isWalletConnected = true;
  
  // Update UI to show connected state
  updateWalletUI();
  
  // Check if on the correct network
  await checkNetwork();
  
  // Initialize token contract
  initializeTokenContract();
  
  // Trigger any additional actions needed after wallet connection
  onWalletConnected();
}

/**
 * Handle wallet connection errors
 * @param {Error} error - The error object
 */
function handleWalletError(error) {
  console.error('Wallet connection error:', error);
  
  // Show error message to user
  const errorMessage = error.message || 'Failed to connect wallet';
  showNotification('error', `Connection Error: ${errorMessage}`);
  
  // Update UI to show disconnected state
  updateWalletUI();
}

/**
 * Check if the connected wallet is on the required network
 */
async function checkNetwork() {
  if (!isWalletConnected) return;
  
  // Convert chainId to hex if it's a number
  const currentChainIdHex = typeof chainId === 'number' 
    ? `0x${chainId.toString(16)}` 
    : chainId;
  
  console.log(`Current chain ID: ${currentChainIdHex}, Required: ${REQUIRED_CHAIN_ID}`);
  
  if (currentChainIdHex !== REQUIRED_CHAIN_ID) {
    showNotification('warning', 'Please switch to Sepolia testnet');
    
    try {
      // Request network switch
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: REQUIRED_CHAIN_ID }]
      });
      
      // Update chainId after successful switch
      chainId = await provider.request({ method: 'eth_chainId' });
      console.log('Switched to chain ID:', chainId);
      
      showNotification('success', 'Successfully switched to Sepolia testnet');
    } catch (error) {
      console.error('Failed to switch network:', error);
      
      // If the network is not added to the wallet, add it
      if (error.code === 4902) {
        try {
          await addSepoliaNetwork();
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          showNotification('error', 'Failed to add Sepolia network to your wallet');
        }
      } else {
        showNotification('error', 'Failed to switch to Sepolia network');
      }
    }
  }
}

/**
 * Add Sepolia network to wallet if not available
 */
async function addSepoliaNetwork() {
  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: REQUIRED_CHAIN_ID,
      chainName: 'Sepolia Testnet',
      nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://sepolia.infura.io/v3/27e484dcd9e3efcfd25a83a78777cdf1'],
      blockExplorerUrls: ['https://sepolia.etherscan.io']
    }]
  });
  
  showNotification('success', 'Sepolia network added to your wallet');
}

/**
 * Initialize the token contract
 */
function initializeTokenContract() {
  if (!isWalletConnected) return;
  
  // Token ABI (simplified for this example)
  const tokenABI = [
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
  
  // Create contract instance
  window.tokenContract = new web3.eth.Contract(tokenABI, TOKEN_CONTRACT_ADDRESS);
  
  console.log('Token contract initialized');
}

/**
 * Update UI elements based on wallet connection state
 */
function updateWalletUI() {
  const connectButton = document.getElementById('connectWalletButton');
  const walletAddress = document.getElementById('walletAddress');
  const walletNetwork = document.getElementById('walletNetwork');
  
  if (!connectButton) return;
  
  if (isWalletConnected && accounts.length > 0) {
    // Update connect button
    connectButton.textContent = 'Wallet Connected';
    connectButton.classList.add('connected');
    
    // Show wallet address if element exists
    if (walletAddress) {
      const shortAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`;
      walletAddress.textContent = shortAddress;
      walletAddress.style.display = 'block';
    }
    
    // Show network info if element exists
    if (walletNetwork) {
      const networkName = getNetworkName(chainId);
      walletNetwork.textContent = networkName;
      walletNetwork.style.display = 'block';
      
      // Add network-specific class
      walletNetwork.className = 'wallet-network';
      if (chainId === REQUIRED_CHAIN_ID) {
        walletNetwork.classList.add('correct-network');
      } else {
        walletNetwork.classList.add('wrong-network');
      }
    }
  } else {
    // Update connect button
    connectButton.textContent = 'Connect Wallet';
    connectButton.classList.remove('connected');
    
    // Hide wallet address if element exists
    if (walletAddress) {
      walletAddress.style.display = 'none';
    }
    
    // Hide network info if element exists
    if (walletNetwork) {
      walletNetwork.style.display = 'none';
    }
  }
}

/**
 * Get network name from chain ID
 * @param {string|number} chainId - The chain ID
 * @returns {string} - Network name
 */
function getNetworkName(chainId) {
  // Convert to hex if it's a number
  const chainIdHex = typeof chainId === 'number' 
    ? `0x${chainId.toString(16)}` 
    : chainId;
  
  const networks = {
    '0x1': 'Ethereum Mainnet',
    '0x3': 'Ropsten Testnet',
    '0x4': 'Rinkeby Testnet',
    '0x5': 'Goerli Testnet',
    '0x2a': 'Kovan Testnet',
    '0xaa36a7': 'Sepolia Testnet',
    '0x89': 'Polygon Mainnet',
    '0x13881': 'Mumbai Testnet',
    '0x38': 'BSC Mainnet',
    '0x61': 'BSC Testnet'
  };
  
  return networks[chainIdHex] || `Unknown Network (${chainIdHex})`;
}

/**
 * Show notification to the user
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {string} message - Notification message
 */
function showNotification(type, message) {
  // Check if notification container exists, create if not
  let notificationContainer = document.getElementById('notificationContainer');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notificationContainer';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '20px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.zIndex = '9999';
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-message">${message}</div>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Add styles
  notification.style.backgroundColor = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3'
  }[type] || '#333';
  
  notification.style.color = '#fff';
  notification.style.padding = '12px 16px';
  notification.style.marginBottom = '10px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  notification.style.width = '300px';
  notification.style.maxWidth = '100%';
  notification.style.animation = 'slideInRight 0.3s ease-out';
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Add close button functionality
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode === notificationContainer) {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
          notificationContainer.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}

/**
 * Actions to perform after wallet connection
 */
function onWalletConnected() {
  // Check token balance
  checkTokenBalance();
  
  // Additional initialization can be done here
}

/**
 * Check token balance
 */
async function checkTokenBalance() {
  if (!isWalletConnected || !window.tokenContract) return;
  
  try {
    const balance = await window.tokenContract.methods.balanceOf(accounts[0]).call();
    const decimals = await window.tokenContract.methods.decimals().call();
    
    // Convert balance to token units
    const divisor = new web3.utils.BN(10).pow(new web3.utils.BN(decimals));
    const balanceBN = new web3.utils.BN(balance);
    const tokenBalance = balanceBN.div(divisor).toString();
    
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
 * Connect wallet button click handler
 */
function connectWalletButtonClick() {
  if (isWalletConnected) {
    // Already connected, show wallet info or disconnect
    showWalletInfo();
  } else {
    // Open wallet modal to connect
    walletModal.open();
  }
}

/**
 * Show wallet info or disconnect options
 */
function showWalletInfo() {
  // Implement wallet info display or disconnect functionality
  console.log('Wallet already connected:', currentWallet);
  console.log('Account:', accounts[0]);
  console.log('Chain ID:', chainId);
}

// Export functions for use in HTML
window.connectWalletButtonClick = connectWalletButtonClick;
window.checkTokenBalance = checkTokenBalance;
