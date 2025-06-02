// Import the game logic and wallet integration
import { appKit } from '../config/appKit';
import { store } from '../store/appkitStore';
import { updateTheme, updateButtonVisibility } from '../utils/dom';
import { setupWalletIntegration, handlePlayButtonClick, checkWalletAndOpenUp } from './wallet-integration.js';

// Initialize the wallet integration when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing wallet integration...');
  setupWalletIntegration();

  // Play button is handled by wallet-integration.js - don't add duplicate listeners

  // Set up the open button click handler with secure validation
  const openButton = document.getElementById('openButton');
  if (openButton) {
    console.log('✅ Open button found, attaching event listener');
    openButton.addEventListener('click', () => {
      console.log('🔥 Open button clicked - calling checkWalletAndOpenUp');
      checkWalletAndOpenUp();
    });
  } else {
    console.error('❌ Open button not found with ID: openButton');
  }

  // Set up the connect wallet button handler
  const connectWalletBtn = document.getElementById('open-connect-modal');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      console.log('Connect wallet button clicked');
      appKit.open();
    });
  }

  // Initial check for wallet connection
  updateButtonVisibility(appKit.getIsConnectedState());

  // Set initial theme
  updateTheme(store.themeState.themeMode);
});

// Make wallet functions available globally
window.handlePlayButtonClick = handlePlayButtonClick;
window.checkWalletAndOpenUp = checkWalletAndOpenUp;