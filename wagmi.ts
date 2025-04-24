import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { Bsc } from './app/utils/bsc_config';


export const config = getDefaultConfig({
  appName: 'cad-mine-machine',
  projectId: 'd43e2f36c80cb43c87b4a38b44e2036b', //https://cloud.reown.com/ 获取
  wallets: [{
    groupName: 'Recommended',
    wallets: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' ? [injectedWallet, metaMaskWallet, walletConnectWallet] : [walletConnectWallet]
  }],
  chains: [
    Bsc,
  ],
  ssr: true,
});
