import { defineChain } from 'viem';

export const BscTest = defineChain({
    id: 97, // BSC 的链 ID
    name: 'BNB Smart Testnet',
    rpcUrls: { default: { http: ['https://bsc-testnet-rpc.publicnode.com'] } }, // 替换为你自己的 RPC URL
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://testnet.bscscan.com' }, // 可选：配置区块浏览器
    },
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
    },
  });