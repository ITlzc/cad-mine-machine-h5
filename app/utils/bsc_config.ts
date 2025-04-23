import { defineChain } from 'viem';

export const Bsc = defineChain({
    id: 56, // BSC 的链 ID
    name: 'BNB Smart Chain',
    rpcUrls: { default: { http: ['https://bsc-dataseed.binance.org'] } }, // 替换为你自己的 RPC URL
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://bscscan.com' }, // 可选：配置区块浏览器
    },
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
    },
  });