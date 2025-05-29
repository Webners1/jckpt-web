import { ethers } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';

// Enhanced configuration to prevent dashboard issues
export const GELATO_CONFIG = {
  apiKey: import.meta.env.VITE_GELATO_API_KEY || 'RLxH5KgK3A4tT5oB_5tsXOf4fIi9_0mwKomJtOVpxBs_',
  chainId: 11155111, // Sepolia
  trustedForwarder: '0xd8253782c45a12053594b9deB72d8e8aB2Fca54c',
  maxRetries: 8, // Reduced to prevent spam
  retryDelay: 5000, // Increased delay
  timeout: 90000, // Longer timeout
  
  // Rate limiting protection
  rateLimit: {
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 100,
    cooldownPeriod: 60000 // 1 minute cooldown after failures
  },
  
  // Circuit breaker to prevent cascading failures
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 300000 // 5 minutes
  }
};

// Rate limiting and circuit breaker state
let requestHistory = [];
let circuitBreakerState = {
  failures: 0,
  lastFailure: null,
  isOpen: false
};

const relay = new GelatoRelay({
contract: {
    relay1BalanceERC2771:"0xd8253782c45a12053594b9deB72d8e8aB2Fca54c"
    }
});

// Enhanced token ABI
const ENHANCED_TOKEN_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  'function isTrustedForwarder(address forwarder) view returns (bool)',
  'function trustedForwarder() view returns (address)'
];

/**
 * MAIN ENHANCED TRANSFER FUNCTION - Prevents dashboard issues
 * @param {ethers.Signer} signer - User's wallet signer
 * @param {string} tokenAddress - ERC20 token contract address  
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount to transfer in token units
 * @returns {Promise<TransferResult>} Transaction result
 */
export async function executeEnhancedGelato1BalanceTransfer(signer, tokenAddress, toAddress, amount, tokenContract) {
  console.log('🚀 Starting enhanced gasless transfer...');
  
  try {
    // Pre-flight checks to prevent failures
    await preFlightValidation(signer, tokenAddress, toAddress, amount);
    
    // Check rate limits to prevent rejection
    await checkRateLimits();
    
    // Check circuit breaker to prevent cascading failures
    checkCircuitBreaker();
    console.log({tokenContract})
    // Execute the transfer with enhanced error handling
    const result = await executeTransferWithRetry(signer, tokenAddress, toAddress, amount, tokenContract);
  
    // Update success metrics
    updateSuccessMetrics();
    
    return result;
    
  } catch (error) {
    // Handle failure and update circuit breaker
    handleTransferFailure(error);
    throw error;
  }
}

/**
 * Pre-flight validation to prevent common failures
 */
async function preFlightValidation(signer, tokenAddress, toAddress, amount) {
  console.log('🔍 Running pre-flight checks...');
  
  // 1. Validate wallet connection
  if (!signer || !signer.provider) {
    throw new Error('WALLET_NOT_CONNECTED: Please connect your wallet');
  }
  
  // 2. Check network
  const network = await signer.provider.getNetwork();
  if (Number(network.chainId) !== GELATO_CONFIG.chainId) {
    throw new Error(`WRONG_NETWORK: Please switch to Sepolia testnet (${GELATO_CONFIG.chainId})`);
  }
  
  // 3. Validate addresses
  if (!ethers.isAddress(tokenAddress)) {
    throw new Error('INVALID_TOKEN_ADDRESS: Invalid token contract address');
  }
  if (!ethers.isAddress(toAddress)) {
    throw new Error('INVALID_RECIPIENT: Invalid recipient address');
  }
  
  // 4. Check token balance
  const tokenContract = new ethers.Contract(tokenAddress, ENHANCED_TOKEN_ABI, signer);
  const userAddress = await signer.getAddress();
  const balance = await tokenContract.balanceOf(userAddress);
  if (balance < amount) {
    const decimals = await tokenContract.decimals();
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    const amountFormatted = ethers.formatUnits(amount, decimals);
    throw new Error(`INSUFFICIENT_BALANCE: Have ${balanceFormatted}, need ${amountFormatted}`);
  }
  
  // 5. Validate amount (not zero, not negative)
  if (amount <= 0) {
    throw new Error('INVALID_AMOUNT: Amount must be greater than zero');
  }
  
  // 6. Check if contract exists and is valid
  const code = await signer.provider.getCode(tokenAddress);
  if (code === '0x') {
    throw new Error('INVALID_CONTRACT: Token contract does not exist');
  }
  
  console.log('✅ All pre-flight checks passed');
}

/**
 * Rate limiting check to prevent API rejections
 */
async function checkRateLimits() {
  const now = Date.now();
  
  // Clean old requests from history
  requestHistory = requestHistory.filter(timestamp => 
    now - timestamp < 3600000 // Keep last hour
  );
  
  // Check per-minute limit
  const recentRequests = requestHistory.filter(timestamp => 
    now - timestamp < 60000 // Last minute
  );
  
  if (recentRequests.length >= GELATO_CONFIG.rateLimit.maxRequestsPerMinute) {
    const waitTime = 60000 - (now - Math.min(...recentRequests));
    throw new Error(`RATE_LIMIT_EXCEEDED: Too many requests. Wait ${Math.ceil(waitTime/1000)} seconds`);
  }
  
  // Check per-hour limit  
  if (requestHistory.length >= GELATO_CONFIG.rateLimit.maxRequestsPerHour) {
    const waitTime = 3600000 - (now - Math.min(...requestHistory));
    throw new Error(`HOURLY_LIMIT_EXCEEDED: Hourly limit reached. Wait ${Math.ceil(waitTime/60000)} minutes`);
  }
  
  // Add current request to history
  requestHistory.push(now);
  console.log(`📊 Rate limit check: ${recentRequests.length}/${GELATO_CONFIG.rateLimit.maxRequestsPerMinute} per minute, ${requestHistory.length}/${GELATO_CONFIG.rateLimit.maxRequestsPerHour} per hour`);
}

/**
 * Circuit breaker to prevent cascading failures
 */
function checkCircuitBreaker() {
  const now = Date.now();
  
  // Reset circuit breaker after timeout
  if (circuitBreakerState.isOpen && 
      circuitBreakerState.lastFailure && 
      now - circuitBreakerState.lastFailure > GELATO_CONFIG.circuitBreaker.resetTimeout) {
    console.log('🔄 Circuit breaker reset - attempting to resume service');
    circuitBreakerState.isOpen = false;
    circuitBreakerState.failures = 0;
  }
  
  if (circuitBreakerState.isOpen) {
    const waitTime = GELATO_CONFIG.circuitBreaker.resetTimeout - (now - circuitBreakerState.lastFailure);
    throw new Error(`SERVICE_TEMPORARILY_UNAVAILABLE: Too many failures. Service suspended for ${Math.ceil(waitTime/60000)} minutes`);
  }
}

/**
 * Execute transfer with intelligent retry logic
 */
async function executeTransferWithRetry(signer, tokenAddress, toAddress, amount, tokenContract) {
  const userAddress = await signer.getAddress();
  const network = await signer.provider.getNetwork();

  // Create transfer data
  
  const {data : transferData} = await tokenContract.transfer.populateTransaction(toAddress, amount);
  
  console.log('📋 Transfer Details:');
  console.log(`  From: ${userAddress}`);
  console.log(`  To: ${toAddress}`);
  console.log(`  Amount: ${amount}`);
  
  let lastError;
  let attempt = 0;
  
  while (attempt < GELATO_CONFIG.maxRetries) {
    try {
      attempt++;
      console.log(`🔄 Attempt ${attempt}/${GELATO_CONFIG.maxRetries}`);
      
      // Create Gelato request
      const request = {
        chainId: (network.chainId),
        target: tokenAddress,
        data: transferData,
        user: userAddress,
    
      };
      
      console.log('📤 Submitting to Gelato...');
      
      // Submit with exponential backoff for retries
      const relayResponse = await relay.sponsoredCallERC2771(request,signer, GELATO_CONFIG.apiKey);
      console.log(`🔗 Task ID: ${relayResponse.taskId}`);
      
      // Wait for completion with enhanced monitoring
      const result = await waitForTaskCompletionEnhanced(relayResponse.taskId);
      
      return {
        taskId: relayResponse.taskId,
        transactionHash: result.transactionHash,
        success: true,
        gasless: true,
        method: 'gelato-enhanced-transfer',
        attempts: attempt
      };
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
      
      // Don't retry for certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      // Exponential backoff for retries
      if (attempt < GELATO_CONFIG.maxRetries) {
        const delay = GELATO_CONFIG.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${delay/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries exhausted
  throw new Error(`TRANSFER_FAILED_ALL_RETRIES: ${lastError?.message || 'Unknown error after all retries'}`);
}

/**
 * Enhanced task monitoring to prevent timeouts and detect issues early
 */
async function waitForTaskCompletionEnhanced(taskId) {
  console.log('⏳ Monitoring transaction execution...');
  
  let attempts = 0;
  const startTime = Date.now();
  let lastKnownState = null;
  
  while (attempts < GELATO_CONFIG.maxRetries) {
    try {
      // Adaptive polling - start fast, then slow down
      const pollDelay = attempts < 3 ? 2000 : attempts < 6 ? 5000 : 8000;
      await new Promise(resolve => setTimeout(resolve, pollDelay));
      
      const taskStatus = await relay.getTaskStatus(taskId);
      
      if (!taskStatus) {
        attempts++;
        console.log('📊 No status yet, continuing to poll...');
        continue;
      }
      
      // Log state changes
      if (taskStatus.taskState !== lastKnownState) {
        console.log(`📊 Status changed: ${lastKnownState} → ${taskStatus.taskState}`);
        lastKnownState = taskStatus.taskState;
      }
      
      switch (taskStatus.taskState) {
        case 'ExecSuccess':
          console.log('🎉 Transaction successful!');
          return {
            taskId,
            transactionHash: taskStatus.transactionHash,
            success: true,
            executionTime: Date.now() - startTime
          };
          
        case 'ExecReverted':
          const revertReason = taskStatus.lastCheckMessage || 'Transaction reverted';
          console.error('❌ Transaction reverted:', revertReason);
          throw new Error(`TRANSACTION_REVERTED: ${revertReason}`);
          
        case 'Cancelled':
          const cancelReason = taskStatus.lastCheckMessage || 'Transaction cancelled';
          console.error('❌ Transaction cancelled:', cancelReason);
          throw new Error(`TRANSACTION_CANCELLED: ${cancelReason}`);
          
        case 'NotFound':
          throw new Error('TASK_NOT_FOUND: Task not found in Gelato system');
          
        case 'WaitingForConfirmation':
        case 'Pending':
        case 'CheckPending':
          // Normal processing states - continue polling
          break;
          
        default:
          console.log(`📋 Current status: ${taskStatus.taskState}`);
      }
      
      // Timeout protection
      const elapsed = Date.now() - startTime;
      if (elapsed > GELATO_CONFIG.timeout) {
        console.warn('⏰ Polling timeout reached');
        return {
          taskId,
          success: 'timeout',
          message: 'Transaction submitted but confirmation timed out',
          executionTime: elapsed
        };
      }
      
      attempts++;
      
    } catch (error) {
      if (error.message.includes('TRANSACTION_') || error.message.includes('TASK_')) {
        throw error; // Re-throw our custom errors
      }
      
      console.warn('⚠️ Status check failed, retrying...', error.message);
      attempts++;
      
      // If status checks keep failing, assume network issues
      if (attempts > 5) {
        throw new Error('STATUS_CHECK_FAILED: Unable to monitor transaction status');
      }
    }
  }
  
  // Polling exhausted but might still be processing
  console.log('⏰ Status polling exhausted');
  return {
    taskId,
    success: 'unknown',
    message: 'Transaction status unknown - check manually',
    executionTime: Date.now() - startTime
  };
}

/**
 * Determine if error should not be retried
 */
function isNonRetryableError(error) {
  const nonRetryablePatterns = [
    'WALLET_NOT_CONNECTED',
    'WRONG_NETWORK', 
    'INVALID_',
    'INSUFFICIENT_BALANCE',
    'User denied',
    'rejected',
    'cancelled',
    'RATE_LIMIT_EXCEEDED',
    'HOURLY_LIMIT_EXCEEDED',
    'SERVICE_TEMPORARILY_UNAVAILABLE'
  ];
  
  return nonRetryablePatterns.some(pattern => 
    error.message?.includes(pattern)
  );
}

/**
 * Update success metrics and reset circuit breaker
 */
function updateSuccessMetrics() {
  // Reset circuit breaker on success
  if (circuitBreakerState.failures > 0) {
    console.log('✅ Resetting circuit breaker after successful transaction');
    circuitBreakerState.failures = 0;
    circuitBreakerState.lastFailure = null;
  }
}

/**
 * Handle transfer failures and update circuit breaker
 */
function handleTransferFailure(error) {
  const now = Date.now();
  
  // Update circuit breaker
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailure = now;
  
  if (circuitBreakerState.failures >= GELATO_CONFIG.circuitBreaker.failureThreshold) {
    console.error('🔴 Circuit breaker opened - too many failures');
    circuitBreakerState.isOpen = true;
  }
  
  console.error('❌ Transfer failed:', error.message);
}

/**
 * Enhanced error handling with prevention focus
 */
export function handleEnhancedGaslessError(error) {
  console.error('❌ Enhanced gasless transfer error:', error);
  
  // Wallet connection issues
  if (error.message.includes('WALLET_NOT_CONNECTED')) {
    return {
      type: 'WALLET_ERROR',
      message: error.message,
      userMessage: 'Please connect your wallet and try again.',
      action: 'connect_wallet'
    };
  }
  
  // Network issues
  if (error.message.includes('WRONG_NETWORK')) {
    return {
      type: 'NETWORK_ERROR', 
      message: error.message,
      userMessage: 'Please switch to Sepolia testnet in your wallet.',
      action: 'switch_network'
    };
  }
  
  // Rate limiting
  if (error.message.includes('RATE_LIMIT') || error.message.includes('LIMIT_EXCEEDED')) {
    return {
      type: 'RATE_LIMIT',
      message: error.message,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      action: 'wait_and_retry'
    };
  }
  
  // Circuit breaker
  if (error.message.includes('SERVICE_TEMPORARILY_UNAVAILABLE')) {
    return {
      type: 'SERVICE_ERROR',
      message: error.message,
      userMessage: 'Service is temporarily unavailable. Please try again later.',
      action: 'try_later'
    };
  }
  
  // Balance issues
  if (error.message.includes('INSUFFICIENT_BALANCE')) {
    return {
      type: 'BALANCE_ERROR',
      message: error.message,
      userMessage: 'Insufficient token balance. Please get more tokens.',
      action: 'get_tokens'
    };
  }
  
  // User rejection
  if (error.code === 4001 || error.message.includes('User denied') || error.message.includes('rejected')) {
    return {
      type: 'USER_REJECTED',
      message: 'User cancelled transaction',
      userMessage: 'Transaction cancelled. Please try again and approve in your wallet.',
      action: 'retry'
    };
  }
  
  // Transaction failures
  if (error.message.includes('TRANSACTION_REVERTED')) {
    return {
      type: 'TRANSACTION_ERROR',
      message: error.message,
      userMessage: 'Transaction failed. Please check your token balance and network.',
      action: 'check_balance'
    };
  }
  
  // Timeout
  if (error.message.includes('timeout')) {
    return {
      type: 'TIMEOUT_ERROR',
      message: error.message,
      userMessage: 'Transaction is taking longer than expected. It may still complete.',
      action: 'wait_or_retry'
    };
  }
  
  // Generic error
  return {
    type: 'UNKNOWN_ERROR',
    message: error.message,
    userMessage: 'An unexpected error occurred. Please try again.',
    action: 'retry'
  };
}

/**
 * Get current system status for monitoring
 */
export function getSystemStatus() {
  const now = Date.now();
  const recentRequests = requestHistory.filter(timestamp => now - timestamp < 60000);
  
  return {
    rateLimit: {
      requestsThisMinute: recentRequests.length,
      requestsThisHour: requestHistory.length,
      maxPerMinute: GELATO_CONFIG.rateLimit.maxRequestsPerMinute,
      maxPerHour: GELATO_CONFIG.rateLimit.maxRequestsPerHour
    },
    circuitBreaker: {
      isOpen: circuitBreakerState.isOpen,
      failures: circuitBreakerState.failures,
      threshold: GELATO_CONFIG.circuitBreaker.failureThreshold,
      resetIn: circuitBreakerState.lastFailure ? 
        Math.max(0, GELATO_CONFIG.circuitBreaker.resetTimeout - (now - circuitBreakerState.lastFailure)) : 0
    },
    healthy: !circuitBreakerState.isOpen && recentRequests.length < GELATO_CONFIG.rateLimit.maxRequestsPerMinute
  };
}
