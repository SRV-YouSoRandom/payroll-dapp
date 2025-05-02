// src/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/Home.module.css';
import { ConnectButton } from '@/components/ConnectButton'; // Use RainbowKit button component
import { OrganizationCreator } from '@/components/OrganizationCreator';
import { OrganizationManager } from '@/components/OrganizationManager';
import { useAccount } from 'wagmi'; // Use wagmi hook
import { TARGET_CHAIN_ID, TARGET_CHAIN_NAME } from '@/lib/constants';

export default function Home() {
  const { isConnected, chainId } = useAccount(); // Use wagmi's account hook
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Callback for OrganizationCreator - Wagmi handles data refresh via QueryClient/hooks mostly
  const handleOrgCreated = useCallback(() => {
    console.log("Organization creation initiated/confirmed, OrganizationManager will refetch lists.");
    // No need to force refresh with key usually, wagmi hooks + QueryClient manage cache invalidation/refetch.
    // If list doesn't update reliably, can manually trigger refetchOrgIds() inside OrganizationManager after success.
  }, []);

  const showWrongNetworkWarning = isClient && isConnected && chainId !== TARGET_CHAIN_ID;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Multi-Org Payroll</h1>
        {isClient && <ConnectButton />} {/* Renders RainbowKit button */}
      </header>

      {showWrongNetworkWarning && (
        <p className={styles.message} style={{ backgroundColor: '#ffecb3', borderColor: '#ffc107', color: '#664d03' }}>
          ⚠️ Warning: Connected to wrong network (Chain ID: {chainId}).
          Please switch to {TARGET_CHAIN_NAME} (Chain ID: {TARGET_CHAIN_ID}) to interact.
        </p>
      )}

      {isClient && !isConnected && (
         <p className={styles.card}>Please connect your wallet to manage organizations.</p>
      )}

      {/* Render content only if connected to the correct chain */}
       {isClient && isConnected && !showWrongNetworkWarning && (
         <>
            <OrganizationCreator onOrganizationCreated={handleOrgCreated} />
            <OrganizationManager />
         </>
       )}
         {/* Optionally show a message if connected but on wrong chain */}
        {isClient && isConnected && showWrongNetworkWarning && (
             <p className={styles.card}>Please switch your wallet to the {TARGET_CHAIN_NAME} network to proceed.</p>
         )}

    </main>
  );
}