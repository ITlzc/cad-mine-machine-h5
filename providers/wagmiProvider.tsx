'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
// import { useRouter } from 'next/router';
import { RainbowKitProvider, type Locale, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';
import { Bsc } from '../app/utils/bsc_config';


const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    // const { locale } = useRouter() as { locale: Locale };
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient} >
                <RainbowKitProvider initialChain={Bsc} locale={'en'}>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
