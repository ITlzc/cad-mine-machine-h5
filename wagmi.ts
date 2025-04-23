import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { Bsc } from './app/utils/bsc_config';

export const config = getDefaultConfig({
  appName: 'CAD Mine Machine',
  projectId: 'CADUCEUS',
  wallets: [{
    groupName: 'Recommended',
    wallets: [injectedWallet, metaMaskWallet]
  }],
  chains: [
    Bsc,
  ],
  ssr: true,
});
