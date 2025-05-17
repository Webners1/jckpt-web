/**
 * Multi-Wallet Connection Modal
 * Supports: MetaMask, WalletConnect, Coinbase Wallet, Trust Wallet, and more
 */

class WalletModal {
  constructor() {
    this.isInitialized = false;
    this.isOpen = false;
    this.selectedWallet = null;
    this.onConnectCallback = null;
    this.onErrorCallback = null;
    this.web3 = null;
    this.provider = null;
    this.accounts = [];
    this.chainId = null;

    // Wallet options
    this.wallets = [
      {
        id: 'metamask',
        name: 'MetaMask',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzMiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMyAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMxLjE0MDQgMEwxOC4zNDQ2IDkuNzIyMTdMMjAuNjE5OCA0LjQyNDc4TDMxLjE0MDQgMFoiIGZpbGw9IiNFMTc3MjYiLz4KPHBhdGggZD0iTTEuODU5MzggMEwxNC41NTEgOS44MjYwOUwxMi4zODAyIDQuNDI0NzhMMS44NTkzOCAwWk0yNi42NTEgMjEuNDg3TDE2LjQ5NzEgMjEuNDg3TDE4LjEzOTggMjYuNDc4M0wxMy42NTQ4IDI5Ljk5OTlMMjMuOTEzNCAzMi4wMDAxTDMxLjQ0NTMgMjEuNDg3SDI2LjY1MVpNNi4zNDg5NiAyMS40ODdMMC44MTY0MDYgMzIuMDAwMUwxMS4wNzUgMjkuOTk5OUw2LjU5MDA0IDI2LjQ3ODNMOC4yMzI3NiAyMS40ODdINi4zNDg5NloiIGZpbGw9IiNFMjc2MjUiLz4KPHBhdGggZD0iTTExLjM4MTIgMTUuMDQzNUw5LjQxNjAyIDE4LjMwNDRMMTkuNjIzMyAxOC4zMDQ0TDE5LjI3MTcgNy42OTU2NUwxMS4zODEyIDE1LjA0MzVaTTIxLjYxODggMTUuMDQzNUwyOS40MDY5IDcuNjk1NjVMMjkuMDU1MyAxOC4zMDQ0TDIxLjU4MzYgMTguMzA0NEwyMS42MTg4IDE1LjA0MzVaTTExLjA3NSAyOS45OTk5TDE4LjAzNDQgMjcuNjA4N0wxMi4xNzQ4IDIxLjU5MDlMMTEuMDc1IDI5Ljk5OTlaIiBmaWxsPSIjRTI3NjI1Ii8+CjxwYXRoIGQ9Ik0yMC44MjU0IDI3LjYwODdMMjMuOTEzNCAzMC4wMDAxTDIwLjgyNTQgMjEuNTkwOUwyMC44MjU0IDI3LjYwODdaIiBmaWxsPSIjRTI3NjI1Ii8+CjxwYXRoIGQ9Ik0yMC44MjU0IDI3LjYwODdMMTguMDM0NCAyNy42MDg3TDE5LjA2OTQgMjkuNzM5MUwxOS4xNzQ4IDMxLjQ3ODNMMjAuODI1NCAyNy42MDg3WiIgZmlsbD0iI0QwNkYyNyIvPgo8cGF0aCBkPSJNMTIuMTc0OCAyMS41OTA5TDExLjA3NSAyOS45OTk5TDEzLjY1NDggMjkuOTk5OUwxMi4xNzQ4IDIxLjU5MDlaIiBmaWxsPSIjRTI3NjI1Ii8+CjxwYXRoIGQ9Ik0xOS4xNzQ4IDMxLjQ3ODNMMTkuMDY5NCAyOS43MzkxTDE4LjEzOTggMjguOTU2NUwxNC44NjAyIDI4Ljk1NjVMMTMuOTMwNiAyOS43MzkxTDEzLjgyNTIgMzEuNDc4M0wxMS4wNzUgMjkuOTk5OUwxMy42NTQ4IDMyLjAwMDFMMTguMDM0NCAzMi4wMDAxTDIzLjkxMzQgMzIuMDAwMUwyNi40OTMyIDI5Ljk5OTlMMTkuMTc0OCAzMS40NzgzWiIgZmlsbD0iI0MwQUMxMSIvPgo8cGF0aCBkPSJNMTguMDM0NCAyNy42MDg3TDE5LjA2OTQgMjkuNzM5MUwxOC4xMzk4IDI4Ljk1NjVMMTQuODYwMiAyOC45NTY1TDEzLjkzMDYgMjkuNzM5MUwxMi4xNzQ4IDIxLjU5MDlMMTguMDM0NCAyNy42MDg3WiIgZmlsbD0iI0UyNzYyNSIvPgo8cGF0aCBkPSJNMTkuMjcxNyA3LjY5NTY1TDExLjM4MTIgMTUuMDQzNUwxMi4xNzQ4IDIxLjU5MDlMMTguMDM0NCAyNy42MDg3TDIwLjgyNTQgMjcuNjA4N0wyMC44MjU0IDIxLjU5MDlMMjEuNjE4OCAxNS4wNDM1TDI5LjQwNjkgNy42OTU2NUwxOS4yNzE3IDcuNjk1NjVaIiBmaWxsPSIjRjVCRDJEIi8+CjxwYXRoIGQ9Ik0xOS4yNzE3IDcuNjk1NjVMMTAuMDgxMSAxLjczOTEzTDExLjM4MTIgMTUuMDQzNUwxOS4yNzE3IDcuNjk1NjVaIiBmaWxsPSIjRTI3NjI1Ii8+CjxwYXRoIGQ9Ik0yOS40MDY5IDcuNjk1NjVMMjIuOTE4OCAxLjczOTEzTDE5LjI3MTcgNy42OTU2NUwyOS40MDY5IDcuNjk1NjVaIiBmaWxsPSIjRTI3NjI1Ii8+CjxwYXRoIGQ9Ik0xMC4wODExIDEuNzM5MTNMMTkuMjcxNyA3LjY5NTY1TDExLjM4MTIgMTUuMDQzNUwxMC4wODExIDEuNzM5MTNaIiBmaWxsPSIjRTI3NjI1Ii8+CjxwYXRoIGQ9Ik0yMi45MTg4IDEuNzM5MTNMMjkuNDA2OSA3LjY5NTY1TDIxLjYxODggMTUuMDQzNUwyMi45MTg4IDEuNzM5MTNaIiBmaWxsPSIjRTI3NjI1Ii8+CjxwYXRoIGQ9Ik05LjQxNjAyIDE4LjMwNDRMMTEuMzgxMiAxNS4wNDM1TDEyLjE3NDggMjEuNTkwOUw5LjQxNjAyIDE4LjMwNDRaIiBmaWxsPSIjRTI3NjI1Ii8+CjxwYXRoIGQ9Ik0yMS41ODM2IDE4LjMwNDRMMjAuODI1NCAyMS41OTA5TDIxLjYxODggMTUuMDQzNUwyMS41ODM2IDE4LjMwNDRaIiBmaWxsPSIjRTI3NjI1Ii8+Cjwvc3ZnPgo=',
        description: 'Connect to your MetaMask Wallet',
        isInstalled: () => typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
        connect: this.connectMetaMask.bind(this)
      },
      {
        id: 'walletconnect',
        name: 'WalletConnect',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAzMCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYuMDMxMjUgMy41NjI1QzEyLjA2MjUgLTEuMTg3NSAxNy45Mzc1IC0xLjE4NzUgMjMuOTY4OCAzLjU2MjVDMjQuNjU2MiA0LjEyNSAyNC42NTYyIDUuMDYyNSAyMy45Njg4IDUuNjI1TDIyLjA5MzggNy41QzIxLjc1IDcuODQzNzUgMjEuMTg3NSA3Ljg0Mzc1IDIwLjg0MzggNy41QzE2LjY4NzUgNC4xMjUgMTMuMzEyNSA0LjEyNSA5LjE1NjI1IDcuNUM4LjgxMjUgNy44NDM3NSA4LjI1IDcuODQzNzUgNy45MDYyNSA3LjVMNi4wMzEyNSA1LjYyNUM1LjM0Mzc1IDUuMDYyNSA1LjM0Mzc1IDQuMTI1IDYuMDMxMjUgMy41NjI1Wk0wLjkzNzUgOC42NTYyNUMyLjA2MjUgNy41MzEyNSAzLjg3NSA3LjUzMTI1IDUgOC42NTYyNUwxNSAxOC42NTYyTDI1IDguNjU2MjVDMjYuMTI1IDcuNTMxMjUgMjcuOTM3NSA3LjUzMTI1IDI5LjA2MjUgOC42NTYyNUMzMC4xODc1IDkuNzgxMjUgMzAuMTg3NSAxMS41OTM4IDI5LjA2MjUgMTIuNzE4OEwxNy4wMzEyIDI0Ljc1QzE1LjkwNjIgMjUuODc1IDE0LjA5MzggMjUuODc1IDEyLjk2ODggMjQuNzVMMC45Mzc1IDEyLjcxODhDLTAuMTg3NSAxMS41OTM4IC0wLjE4NzUgOS43ODEyNSAwLjkzNzUgOC42NTYyNVoiIGZpbGw9IiMzMzk2RkYiLz4KPC9zdmc+Cg==',
        description: 'Scan with WalletConnect to connect',
        isInstalled: () => true, // Always available
        connect: this.connectWalletConnect.bind(this)
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE2IDZDMTAuNDc3MiA2IDYgMTAuNDc3MiA2IDE2QzYgMjEuNTIyOCAxMC40NzcyIDI2IDE2IDI2QzIxLjUyMjggMjYgMjYgMjEuNTIyOCAyNiAxNkMyNiAxMC40NzcyIDIxLjUyMjggNiAxNiA2Wk0xMi40MzAxIDE0LjU3NjlDMTIuMTk2OCAxNC41NzY5IDEyLjAwNzEgMTQuNzY2NiAxMi4wMDcxIDE1LjAwMDFWMTdDMTIuMDA3MSAxNy4yMzM1IDEyLjE5NjggMTcuNDIzMiAxMi40MzAxIDE3LjQyMzJIMTkuNTY5OUMxOS44MDMyIDE3LjQyMzIgMTkuOTkyOSAxNy4yMzM1IDE5Ljk5MjkgMTdWMTUuMDAwMUMxOS45OTI5IDE0Ljc2NjYgMTkuODAzMiAxNC41NzY5IDE5LjU2OTkgMTQuNTc2OUgxMi40MzAxWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
        description: 'Connect to your Coinbase Wallet',
        isInstalled: () => typeof window.coinbaseWalletExtension !== 'undefined',
        connect: this.connectCoinbaseWallet.bind(this)
      },
      {
        id: 'trustwallet',
        name: 'Trust Wallet',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzE2MzNDQyIvPgo8cGF0aCBkPSJNMTYuMDAwMSA2QzE5LjA3MjcgNiAyMS42NzY0IDYuNjIzNzYgMjMuNTQ1NSA3LjI5NzI1QzI1LjE5NzQgNy44OTYzNSAyNi4wMDAxIDkuNTk0NzggMjYuMDAwMSAxMS4zNjg2VjE1LjA3NTRDMjYuMDAwMSAxNi4yNzU0IDI1LjUzNjQgMTcuNDI2MSAyNC43MDkxIDE4LjI3ODlMMTcuNDU0NSAyNS43NjA0QzE2Ljg0NTUgMjYuMzg0MSAxNS44OTQ1IDI2LjA4MjIgMTUuNjM2NCAyNS4yNTQ3QzE1LjU2MzYgMjUuMDUyOSAxNS41NjM2IDI0LjgyNjMgMTUuNjM2NCAyNC42MjQ1QzE1LjcwOTEgMjQuNDIyNyAxNS44NTQ1IDI0LjI0NiAxNi4wMDAxIDI0LjEyMTJMMjIuNzI3MyAxNy4xNDg5QzIzLjE5MDkgMTYuNjc1MiAyMy40NTQ1IDE2LjA1MTYgMjMuNDU0NSAxNS40MDI5VjExLjM2ODZDMjMuNDU0NSAxMC42OTUxIDIzLjA0NTUgMTAuMDk2IDIyLjQzNjQgOS44OTQxOUMyMC44NzI3IDkuMzQ1MzQgMTguNjkwOSA4Ljc5NjQ5IDE2LjAwMDEgOC43OTY0OUMxMy4zMDkxIDguNzk2NDkgMTEuMTI3MyA5LjM0NTM0IDkuNTYzNjcgOS44OTQxOUM4Ljk1NDU4IDEwLjA5NiA4LjU0NTQ5IDEwLjY5NTEgOC41NDU0OSAxMS4zNjg2VjE1LjQwMjlDOC41NDU0OSAxNi4wNTE2IDguODA5MTIgMTYuNjc1MiA5LjI3Mjc2IDE3LjE0ODlMMTYuMDAwMSAyNC4xMjEyQzE2LjE0NTUgMjQuMjQ2IDE2LjI5MDkgMjQuNDIyNyAxNi4zNjM2IDI0LjYyNDVDMTYuNDM2NCAyNC44MjYzIDE2LjQzNjQgMjUuMDUyOSAxNi4zNjM2IDI1LjI1NDdDMTYuMTA5MSAyNi4wODIyIDE1LjE1NDUgMjYuMzg0MSAxNC41NDU1IDI1Ljc2MDRMNy4yOTA5NCAxOC4yNzg5QzYuNDYzNjcgMTcuNDI2MSA2LjAwMDEgMTYuMjc1NCA2LjAwMDEgMTUuMDc1NFYxMS4zNjg2QzYuMDAwMSA5LjU5NDc4IDYuODAyNzYgNy44OTYzNSA4LjQ1NDU4IDcuMjk3MjVDMTAuMzIzNyA2LjYyMzc2IDEyLjkyNzMgNiAxNi4wMDAxIDZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        description: 'Connect to your Trust Wallet',
        isInstalled: () => typeof window.trustWallet !== 'undefined',
        connect: this.connectTrustWallet.bind(this)
      }
    ];
  }

  /**
   * Initialize the wallet modal
   * @param {Object} options - Configuration options
   * @param {Function} options.onConnect - Callback when wallet is connected
   * @param {Function} options.onError - Callback when error occurs
   */
  init(options = {}) {
    if (this.isInitialized) return;

    this.onConnectCallback = options.onConnect || (() => {});
    this.onErrorCallback = options.onError || ((error) => console.error('Wallet connection error:', error));

    this.createModal();
    this.attachEventListeners();

    this.isInitialized = true;
    console.log('Wallet modal initialized');
  }

  /**
   * Create the modal HTML structure
   */
  createModal() {
    // Create modal container
    this.modalContainer = document.createElement('div');
    this.modalContainer.className = 'wallet-modal-container';
    this.modalContainer.style.display = 'none';

    // Create modal content
    const modalContent = `
      <div class="wallet-modal-overlay"></div>
      <div class="wallet-modal">
        <div class="wallet-modal-header">
          <h3>Connect Wallet</h3>
          <button class="wallet-modal-close">&times;</button>
        </div>
        <div class="wallet-modal-body">
          <p>Please select a wallet to connect to this dApp:</p>
          <div class="wallet-list">
            ${this.wallets.map(wallet => `
              <div class="wallet-option" data-wallet-id="${wallet.id}">
                <img src="${wallet.logo}" alt="${wallet.name}" class="wallet-logo">
                <div class="wallet-info">
                  <h4>${wallet.name}</h4>
                  <p>${wallet.description}</p>
                </div>
                ${wallet.isInstalled() ?
                  '<span class="wallet-badge wallet-installed">Installed</span>' :
                  '<span class="wallet-badge wallet-not-installed">Not Installed</span>'}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="wallet-modal-footer">
          <p class="wallet-modal-footer-text">
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    `;

    this.modalContainer.innerHTML = modalContent;
    document.body.appendChild(this.modalContainer);

    // Add styles
    this.addStyles();
  }

  /**
   * Add CSS styles for the modal
   */
  addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .wallet-modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .wallet-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
      }

      .wallet-modal {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 450px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .wallet-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #eee;
      }

      .wallet-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .wallet-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
      }

      .wallet-modal-body {
        padding: 20px;
      }

      .wallet-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;
      }

      .wallet-option {
        display: flex;
        align-items: center;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #eee;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
      }

      .wallet-option:hover {
        border-color: #3396FF;
        background-color: rgba(51, 150, 255, 0.05);
      }

      .wallet-logo {
        width: 32px;
        height: 32px;
        margin-right: 16px;
        object-fit: contain;
      }

      .wallet-info {
        flex: 1;
      }

      .wallet-info h4 {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 500;
      }

      .wallet-info p {
        margin: 0;
        font-size: 14px;
        color: #666;
      }

      .wallet-badge {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .wallet-installed {
        background-color: #e6f7ee;
        color: #00aa6c;
      }

      .wallet-not-installed {
        background-color: #f8f9fa;
        color: #6c757d;
      }

      .wallet-modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #eee;
      }

      .wallet-modal-footer-text {
        margin: 0;
        font-size: 12px;
        color: #999;
        text-align: center;
      }

      @media (max-width: 480px) {
        .wallet-modal {
          width: 95%;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Attach event listeners to modal elements
   */
  attachEventListeners() {
    // Close button
    const closeButton = this.modalContainer.querySelector('.wallet-modal-close');
    closeButton.addEventListener('click', () => this.close());

    // Overlay click to close
    const overlay = this.modalContainer.querySelector('.wallet-modal-overlay');
    overlay.addEventListener('click', () => this.close());

    // Wallet options
    const walletOptions = this.modalContainer.querySelectorAll('.wallet-option');
    walletOptions.forEach(option => {
      option.addEventListener('click', () => {
        const walletId = option.getAttribute('data-wallet-id');
        this.connectWallet(walletId);
      });
    });
  }

  /**
   * Open the wallet modal
   */
  open() {
    if (!this.isInitialized) {
      this.init();
    }

    this.modalContainer.style.display = 'block';
    this.isOpen = true;
  }

  /**
   * Close the wallet modal
   */
  close() {
    this.modalContainer.style.display = 'none';
    this.isOpen = false;
  }

  /**
   * Connect to the selected wallet
   * @param {string} walletId - ID of the wallet to connect
   */
  async connectWallet(walletId) {
    const wallet = this.wallets.find(w => w.id === walletId);

    if (!wallet) {
      this.handleError(new Error(`Wallet ${walletId} not found`));
      return;
    }

    try {
      this.selectedWallet = wallet;
      await wallet.connect();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
      window.open('https://metamask.io/download.html', '_blank');
      this.handleError(new Error('MetaMask is not installed'));
      return;
    }

    try {
      this.provider = window.ethereum;

      // Request accounts
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      this.accounts = accounts;

      // Get chain ID
      this.chainId = await this.provider.request({ method: 'eth_chainId' });

      // Create Web3 instance
      this.web3 = new Web3(this.provider);

      // Setup event listeners
      this.setupProviderEvents();

      // Close modal and call success callback
      this.close();
      this.onConnectCallback({
        provider: this.provider,
        web3: this.web3,
        accounts: this.accounts,
        chainId: this.chainId,
        wallet: 'metamask'
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Connect to WalletConnect
   */
  async connectWalletConnect() {
    try {
      // Check if WalletConnect is available
      if (typeof window.WalletConnectProvider === 'undefined') {
        // Load WalletConnect script dynamically
        await this.loadScript('https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js');
      }

      // Initialize WalletConnect Provider with project-specific settings
      this.provider = new window.WalletConnectProvider({
        infuraId: "9aa3d95b3bc440fa88ea12eaa4456161", // Public Infura ID
        qrcode: true,
        chainId: 11155111, // Sepolia testnet
        rpc: {
          1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
          11155111: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        }
      });

      // Enable session (triggers QR Code modal)
      await this.provider.enable();

      // Get accounts
      this.accounts = this.provider.accounts;

      // Get chain ID
      this.chainId = this.provider.chainId;

      // Create Web3 instance
      this.web3 = new Web3(this.provider);

      // Setup event listeners
      this.setupProviderEvents();

      // Close modal and call success callback
      this.close();
      this.onConnectCallback({
        provider: this.provider,
        web3: this.web3,
        accounts: this.accounts,
        chainId: this.chainId,
        wallet: 'walletconnect'
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Connect to Coinbase Wallet
   */
  async connectCoinbaseWallet() {
    try {
      // Check if Coinbase Wallet SDK is available
      if (typeof window.CoinbaseWalletSDK === 'undefined') {
        // Load Coinbase Wallet SDK script dynamically
        await this.loadScript('https://unpkg.com/@coinbase/wallet-sdk@3.6.0/dist/index.min.js');
      }

      // Initialize Coinbase Wallet SDK
      const CoinbaseWalletSDK = window.CoinbaseWalletSDK || {};
      const coinbaseWallet = new CoinbaseWalletSDK({
        appName: 'Jackpot Game',
        appLogoUrl: 'https://jackpt.com/logo.png',
        darkMode: true,
        overrideIsMetaMask: false
      });

      // Initialize provider with Sepolia support
      this.provider = coinbaseWallet.makeWeb3Provider(
        "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
        11155111 // Sepolia testnet
      );

      // Request accounts
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      this.accounts = accounts;

      // Get chain ID
      this.chainId = await this.provider.request({ method: 'eth_chainId' });

      // Create Web3 instance
      this.web3 = new Web3(this.provider);

      // Setup event listeners
      this.setupProviderEvents();

      // Close modal and call success callback
      this.close();
      this.onConnectCallback({
        provider: this.provider,
        web3: this.web3,
        accounts: this.accounts,
        chainId: this.chainId,
        wallet: 'coinbase'
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Connect to Trust Wallet
   */
  async connectTrustWallet() {
    // Check if Trust Wallet is installed
    const isTrustWalletInstalled = typeof window.ethereum !== 'undefined' &&
                                  window.ethereum.isTrust;

    if (!isTrustWalletInstalled) {
      // If on mobile, try to deep link to Trust Wallet
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.open('https://link.trustwallet.com/open_url?url=' + encodeURIComponent(window.location.href), '_blank');
      } else {
        // Otherwise, direct to the Trust Wallet website
        window.open('https://trustwallet.com/browser-extension', '_blank');
      }
      this.handleError(new Error('Trust Wallet is not installed. Please install Trust Wallet and try again.'));
      return;
    }

    try {
      // Use the ethereum provider from Trust Wallet
      this.provider = window.ethereum;

      // Request accounts
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      this.accounts = accounts;

      // Get chain ID
      this.chainId = await this.provider.request({ method: 'eth_chainId' });

      // Create Web3 instance
      this.web3 = new Web3(this.provider);

      // Setup event listeners
      this.setupProviderEvents();

      // Close modal and call success callback
      this.close();
      this.onConnectCallback({
        provider: this.provider,
        web3: this.web3,
        accounts: this.accounts,
        chainId: this.chainId,
        wallet: 'trustwallet'
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Setup event listeners for the provider
   */
  setupProviderEvents() {
    if (!this.provider) return;

    // Account changes
    this.provider.on('accountsChanged', (accounts) => {
      this.accounts = accounts;
      console.log('Accounts changed:', accounts);

      // If no accounts, user has disconnected
      if (accounts.length === 0) {
        this.handleDisconnect();
      }
    });

    // Chain changes
    this.provider.on('chainChanged', (chainId) => {
      this.chainId = chainId;
      console.log('Chain changed:', chainId);

      // Reload the page as recommended by MetaMask
      window.location.reload();
    });

    // Disconnect
    this.provider.on('disconnect', () => {
      this.handleDisconnect();
    });
  }

  /**
   * Handle wallet disconnection
   */
  handleDisconnect() {
    this.provider = null;
    this.web3 = null;
    this.accounts = [];
    this.chainId = null;
    this.selectedWallet = null;

    console.log('Wallet disconnected');
  }

  /**
   * Handle connection errors
   * @param {Error} error - The error object
   */
  handleError(error) {
    console.error('Wallet connection error:', error);

    // Call error callback if provided
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  /**
   * Load a script dynamically
   * @param {string} src - Script URL
   * @returns {Promise} - Resolves when script is loaded
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

// Export the WalletModal class
window.WalletModal = WalletModal;
