import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { ethers } from 'ethers';

// Gelato Relay configuration
const GELATO_CONFIG = {
  // Get API key from https://relay.gelato.network/
  apiKey: import.meta.env.VITE_GELATO_API_KEY || 'RLxH5KgK3A4tT5oB_5tsXOf4fIi9_0mwKomJtOVpxBs_',
  chainId: 11155111, // Sepolia
};

// Initialize Gelato Relay
const relay = new GelatoRelay();

/**
 * Execute gasless ERC20 transfer using Gelato Relay
 * User signs with their existing wallet, relay pays gas fees
 * @param {ethers.providers.Web3Provider} provider - User's wallet provider (from MetaMask, etc.)
 * @param {string} tokenAddress - ERC20 token contract address
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount to transfer (in wei/token units)
 * @returns {Promise<any>} Transaction result
 */
export async function executeGaslessTransfer(provider, tokenAddress, toAddress, amount) {
  try {
    console.log('🚀 Executing GASLESS ERC20 transfer...');
    console.log('👤 User signs with existing wallet - ZERO gas fees!');
    
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    console.log('Token Address:', tokenAddress);
    console.log('From Address (User Wallet):', userAddress);
    console.log('To Address:', toAddress);
    console.log('Amount:', amount);

    // Create the transfer function call data
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      signer
    );

    // Encode the transfer function call
    const transferData = tokenContract.interface.encodeFunctionData('transfer', [
      toAddress,
      amount
    ]);

    console.log('📝 Creating relay request...');

    // Create the relay request
    const request = {
      chainId: GELATO_CONFIG.chainId,
      target: tokenAddress,
      data: transferData,
      user: userAddress,
    };

    console.log('✍️ User signing meta-transaction...');

    // Get the relay request to sign
    const { struct, signature } = await relay.getSignatureDataERC2771(
      request,
      signer,
      'GelatoRelay1BalanceERC2771' // Contract name for EIP-712
    );

    console.log('📤 Submitting to Gelato Relay...');

    // Submit the relay request
    const response = await relay.sponsoredCallERC2771(
      {
        ...request,
        data: transferData,
      },
      signature,
      GELATO_CONFIG.apiKey
    );

    console.log('✅ Relay request submitted!');
    console.log('🔗 Task ID:', response.taskId);

    // Wait for execution (optional - you can also poll status)
    console.log('⏳ Waiting for execution...');
    
    // Poll for task status
    let status = 'Pending';
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 2 minutes
    
    while (status === 'Pending' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 4000)); // Wait 4 seconds
      
      try {
        const taskStatus = await relay.getTaskStatus(response.taskId);
        status = taskStatus?.taskState || 'Pending';
        console.log('📊 Status:', status);
        
        if (status === 'ExecSuccess') {
          console.log('🎉 GASLESS TRANSFER SUCCESSFUL!');
          console.log('💰 User paid ZERO gas fees!');
          console.log('🔗 Transaction Hash:', taskStatus.transactionHash);
          
          return {
            taskId: response.taskId,
            transactionHash: taskStatus.transactionHash,
            success: true,
            gasless: true,
            method: 'gelato-relay'
          };
        } else if (status === 'ExecReverted' || status === 'Cancelled') {
          throw new Error(`Transaction failed with status: ${status}`);
        }
      } catch (statusError) {
        console.log('⏳ Still processing...');
      }
      
      attempts++;
    }

    // If we exit the loop without success
    if (status === 'Pending') {
      console.log('⏰ Transaction is taking longer than expected');
      return {
        taskId: response.taskId,
        success: 'pending',
        gasless: true,
        method: 'gelato-relay',
        message: 'Transaction submitted but still processing'
      };
    }

    throw new Error('Transaction failed or timed out');

  } catch (error) {
    console.error('❌ Error executing gasless transfer:', error);

    // Check if user rejected the signature
    if (error.code === 4001 || error.message.includes('User denied')) {
      throw new Error('Transaction was cancelled by user');
    }

    // Check for insufficient token balance
    if (error.message.includes('insufficient')) {
      throw new Error('Insufficient token balance');
    }

    throw error;
  }
}

/**
 * Check if a token contract supports ERC2771 (meta-transactions)
 * This is required for Gelato Relay to work
 * @param {ethers.providers.Provider} provider - Ethereum provider
 * @param {string} tokenAddress - Token contract address
 * @returns {Promise<boolean>} Whether the token supports meta-transactions
 */
export async function checkERC2771Support(provider, tokenAddress) {
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
 * Alternative: Execute gasless transfer using Gelato's 1Balance
 * This sponsors the transaction directly without requiring ERC2771
 * @param {ethers.providers.Web3Provider} provider - User's wallet provider
 * @param {string} tokenAddress - ERC20 token contract address  
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount to transfer
 * @returns {Promise<any>} Transaction result
 */
export async function executeGasless1Balance(provider, tokenAddress, toAddress, amount) {
  try {
    console.log('🚀 Executing gasless transfer with Gelato 1Balance...');
    
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    // Create transfer data
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      signer
    );

    const transferData = tokenContract.interface.encodeFunctionData('transfer', [
      toAddress,
      amount
    ]);

    // Create relay request for 1Balance
    const request = {
      chainId: GELATO_CONFIG.chainId,
      target: tokenAddress,
      data: transferData,
      user: userAddress,
    };

    console.log('✍️ User signing transaction...');

    // Use sponsoredCall instead of ERC2771
    const response = await relay.sponsoredCall(
      request,
      GELATO_CONFIG.apiKey
    );

    console.log('✅ Transaction sponsored and submitted!');
    console.log('🔗 Task ID:', response.taskId);

    return {
      taskId: response.taskId,
      success: true,
      gasless: true,
      method: 'gelato-1balance'
    };

  } catch (error) {
    console.error('❌ Error with 1Balance transfer:', error);
    throw error;
  }
}

// Export configuration
export { GELATO_CONFIG };