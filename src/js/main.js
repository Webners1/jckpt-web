// Import the game logic and wallet integration
import './game.js';
import { appKit } from '../config/appKit';
import { store } from '../store/appkitStore';
import { updateTheme, updateButtonVisibility } from '../utils/dom';
import { setupWalletIntegration, handlePlayButtonClick } from './wallet-integration.js';

// Initialize the wallet integration when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing wallet integration...');
  setupWalletIntegration();

  // Set up the play button click handler
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.addEventListener('click', handlePlayButtonClick);
  }

  // Set up the open button click handler
  const openButton = document.getElementById('openButton');
  if (openButton) {
    openButton.addEventListener('click', window.checkWalletAndOpenUp);
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
