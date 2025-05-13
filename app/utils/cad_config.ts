import { defineChain } from 'viem';

export const CAD_CHAIN = defineChain({
  id: 512513, // BSC 的链 ID
  name: 'Cad',
  rpcUrls: { default: { http: ['https://pegasus.rpc.caduceus.foundation'] } },
  nativeCurrency: {
    name: 'Cad',
    symbol: 'CAD',
    decimals: 18,
  },
});