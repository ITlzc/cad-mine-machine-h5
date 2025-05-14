import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { Bsc } from './app/utils/bsc_config';
import { BscTest } from './app/utils/bsc_test_config';
import { CAD_CHAIN } from './app/utils/cad_config';
import { sepolia, mainnet } from 'viem/chains';
import { defineChain } from 'viem';



export const config = getDefaultConfig({
  appName: 'cad-mine-machine',
  projectId: 'd43e2f36c80cb43c87b4a38b44e2036b', //https://cloud.reown.com/ 获取
  wallets: [{
    groupName: 'Recommended',
    wallets: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' ? [injectedWallet, metaMaskWallet, walletConnectWallet] : [walletConnectWallet]
  }],
  chains: [
    Bsc,
    sepolia,
    mainnet,
    CAD_CHAIN,
    BscTest,
  ],
  ssr: true,
});
