import { sepolia } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'

const projectId = import.meta.env.VITE_PROJECT_ID || "ed3488dca46e90854aad49512f12974f" // this is a public projectId only to use on localhost
if (!projectId) {
  throw new Error('VITE_PROJECT_ID is not set')
}

export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [sepolia], // Only show Sepolia testnet
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FF9800',
    '--w3m-background-color': '#1F1F1F',
    '--w3m-text-color': '#FFFFFF',
    '--w3m-border-radius-master': '8px',
    '--w3m-button-border-radius': '8px',
    '--w3m-wallet-icon-border-radius': '8px',
    '--w3m-wallet-icon-large-border-radius': '12px',
    '--w3m-wallet-icon-small-border-radius': '6px',
    '--w3m-input-border-radius': '8px',
    '--w3m-notification-border-radius': '8px',
    '--w3m-secondary-button-border-radius': '8px',
  },
  features: {
    analytics: true,
    walletConnect: true, // Enable WalletConnect
    mobileWallets: true, // Enable mobile wallet deep linking
    desktopWallets: true, // Enable desktop wallet deep linking
    qrcodeModal: true, // Enable QR code modal for WalletConnect
  },
  metadata: {
    name: 'Jackpot Game',
    description: 'Connect your wallet to play the Jackpot Game',
    url: window.location.origin,
    icons: [window.location.origin + '/favicon.ico']
  }
})
