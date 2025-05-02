// src/components/OrganizationCreator.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { multiOrgPayrollABI, multiOrgPayrollContractAddress, TARGET_CHAIN_ID } from '@/lib/constants';
import styles from '@/styles/Home.module.css';

export function OrganizationCreator({ onOrganizationCreated }: { onOrganizationCreated: () => void }) {
    const { address, isConnected, chainId } = useAccount();
    const { data: hash, writeContract, isPending: isSending, error: writeError } = useWriteContract();

    const [orgName, setOrgName] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // Hook to check if Org exists (optional pre-check)
    const { data: orgData, refetch: refetchOrgCheck } = useReadContract({
        address: multiOrgPayrollContractAddress,
        abi: multiOrgPayrollABI,
        functionName: 'organizations',
        args: [address!], // Check for connected address
        chainId: TARGET_CHAIN_ID,
        query: { enabled: !!address }, // Only run if address is available
    });
    const orgExists = orgData ? (orgData as any[])[3] : false; // Index 3 is 'exists' boolean in struct

    // Hook to wait for transaction confirmation
    const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isSending) {
            setStatusMessage('Sending transaction...');
        } else if (isConfirming) {
            setStatusMessage('Waiting for confirmation...');
        } else if (isConfirmed) {
            setStatusMessage(`Organization "${orgName || 'New Org'}" created successfully!`);
            setOrgName('');
            onOrganizationCreated(); // Notify parent
            // Consider parsing event here if needed from receipt (more complex with wagmi v2)
        } else if (writeError) {
          setStatusMessage(`Error: ${writeError.message}`);
        } else if (receiptError) {
          setStatusMessage(`Confirmation Error: ${receiptError.message}`);
        } else if (!isSending && !isConfirming && statusMessage.startsWith('Sending') || statusMessage.startsWith('Waiting')) {
             // Clear message if process finished without success/error state change
             // setStatusMessage(''); // Or keep success message
        }
    }, [isSending, isConfirming, isConfirmed, writeError, receiptError, hash, orgName, onOrganizationCreated, statusMessage]);


    const handleCreateOrganization = async () => {
        if (!isConnected || !address) return setStatusMessage('Please connect your wallet.');
        if (chainId !== TARGET_CHAIN_ID) return setStatusMessage(`Please switch to network ID ${TARGET_CHAIN_ID}.`);
        if (!orgName.trim()) return setStatusMessage('Please enter an organization name.');

        // Re-check existence just before sending
        await refetchOrgCheck();
        if (orgExists) {
            setStatusMessage(`An organization already exists for your address (${address}).`);
            return;
        }

        setStatusMessage(''); // Clear previous errors

        writeContract({
            address: multiOrgPayrollContractAddress,
            abi: multiOrgPayrollABI,
            functionName: 'createOrganization',
            args: [orgName.trim()],
            chainId: TARGET_CHAIN_ID,
        });
    };

    const isLoading = isSending || isConfirming;

    return (
        <div className={styles.card}>
            <h2>Create New Organization</h2>
            <p>(Your connected address will be the Org ID/Owner)</p>
            <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Organization Name"
                disabled={isLoading || !isConnected}
                className={styles.input}
            />
            <button onClick={handleCreateOrganization} disabled={isLoading || !isConnected} className={styles.button}>
                {isLoading ? (isSending ? 'Sending...' : 'Confirming...') : 'Create Organization'}
            </button>
            {statusMessage && <p className={styles.message}>{statusMessage}</p>}
        </div>
    );
}