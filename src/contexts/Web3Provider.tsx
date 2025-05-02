// src/contexts/Web3Provider.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
// 1. Import all the chains you want to support from wagmi/chains
import {
    sepolia,
    mainnet,
    polygon, // Example: Add Polygon
    arbitrum, // Example: Add Arbitrum
    // base, optimism, zora etc.
} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { http } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

// --- Your Target Chain Configuration ---
// This should be one of the chains included in the 'supportedChains' array below
const targetChain = sepolia; // e.g., sepolia

// --- Define ALL Chains you want your DApp to support ---
const supportedChains = [
    sepolia,
    mainnet,
    polygon,
    arbitrum,
    // Add more chains from wagmi/chains here
];

// --- Define Custom Chains (if needed) ---
// Example: Adding a hypothetical "My Custom Chain"
// Make sure to replace ALL placeholder values with your actual network details
const myCustomChain = {
    id: 101003, // ** Replace with your actual Chain ID **
    name: 'Juneo Socotra',
    nativeCurrency: { name: 'June', symbol: 'JUNE', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.socotra-testnet.network/ext/bc/JUNE/rpc'] }, // ** Replace with your RPC URL **
        // public: { http: ['https://rpc.my-custom-chain.com'] }, // Optional: if same as default
    },
    blockExplorers: {
        default: { name: 'MCN', url: 'https://socotra.juneoscan.io/' }, // ** Replace with your Explorer URL **
    },
    testnet: true, // Set to false if it's a mainnet
} as const; // Use 'as const' for type safety with Wagmi

// --- Add Custom Chains to the list ---
const allSupportedChains = [
    ...supportedChains,
    myCustomChain, // Add your custom chain here
];


// --- Wagmi / RainbowKit Configuration ---
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error("WalletConnect Project ID is not defined in .env.local");
}

// Configure transports for ALL supported chains
const transportsConfig = allSupportedChains.reduce((acc, chain) => {
  acc[chain.id] = http();
  return acc;
}, {} as Record<number, ReturnType<typeof http>>);


const config = getDefaultConfig({
  appName: 'Multi-Org Payroll DApp',
  projectId: projectId!,
  // 2. Pass the *complete list* of chains here
  chains: allSupportedChains as any, // Cast needed because of the mix of predefined and custom chains potentially
  // 3. Define transports explicitly for all chains
  transports: transportsConfig,
  ssr: true,
});

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   if (!mounted) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};