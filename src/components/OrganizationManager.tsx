// src/components/OrganizationManager.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { type Address, parseUnits } from 'viem';
import {
    multiOrgPayrollABI,
    multiOrgPayrollContractAddress,
    TARGET_CHAIN_ID,
    ETH_ADDRESS_ZERO,
    DEFAULT_TOKEN_DECIMALS,
    NATIVE_CURRENCY_SYMBOL
} from '@/lib/constants';
import {
    formatAddress,
    formatTimestamp,
    formatBalance, // Make sure this is imported
    datetimeLocalToTimestamp,
    isValidAddress,
    getTokenAddress as formatInputTokenAddress
} from '@/lib/utils';
import styles from '@/styles/Home.module.css';

// --- Type Definitions ---
type OrgInfoTuple = readonly [owner: Address, name: string, nextPayTimestamp: bigint, employeeCount: bigint];
type OrgMappingTuple = readonly [owner: Address, name: string, nextPayTimestamp: bigint, exists: boolean];

interface OrganizationInfo {
    owner: Address;
    name: string;
    nextPayTimestamp: bigint;
    employeeCount: bigint;
    exists: boolean;
}
interface EmployeeInfo {
    salary: bigint;
    token: Address;
    paid: boolean;
}

export function OrganizationManager() {
    const { address: connectedAddress, isConnected, chainId } = useAccount();

    // --- State ---
    const [selectedOrgId, setSelectedOrgId] = useState<Address | null>(null);
    const [employees, setEmployees] = useState<Address[]>([]);
    const [employeeDetails, setEmployeeDetails] = useState<Record<Address, EmployeeInfo>>({});
    const [tokenBalanceAddress, setTokenBalanceAddress] = useState<string>('');
    const [messages, setMessages] = useState<Record<string, string>>({});

    // --- Wagmi Hooks for Data Fetching ---
    const { data: orgIdsData, isLoading: isLoadingOrgs, refetch: refetchOrgIds } = useReadContract({
        address: multiOrgPayrollContractAddress,
        abi: multiOrgPayrollABI,
        functionName: 'getAllOrganizations',
        chainId: TARGET_CHAIN_ID,
    });
    const orgIds: Address[] = useMemo(() => (orgIdsData as Address[] | undefined) ?? [], [orgIdsData]);

    const { data: orgInfoData, isLoading: isLoadingOrgInfo, refetch: refetchOrgInfo } = useReadContract({
        address: multiOrgPayrollContractAddress,
        abi: multiOrgPayrollABI,
        functionName: 'getOrganizationInfo',
        args: [selectedOrgId!],
        chainId: TARGET_CHAIN_ID,
        query: { enabled: !!selectedOrgId },
    });
    const { data: orgMappingData, refetch: refetchOrgMapping } = useReadContract({
        address: multiOrgPayrollContractAddress,
        abi: multiOrgPayrollABI,
        functionName: 'organizations',
        args: [selectedOrgId!],
        chainId: TARGET_CHAIN_ID,
        query: { enabled: !!selectedOrgId },
    });

    const orgDetails: OrganizationInfo | null = useMemo(() => {
        if (!orgInfoData || !orgMappingData) return null;
        const info = orgInfoData as OrgInfoTuple;
        const mapping = orgMappingData as OrgMappingTuple;
        return {
            owner: info[0],
            name: info[1],
            nextPayTimestamp: info[2],
            employeeCount: info[3],
            exists: mapping[3]
        };
    }, [orgInfoData, orgMappingData]);

    const { data: employeesData, refetch: refetchEmployees } = useReadContract({
        address: multiOrgPayrollContractAddress,
        abi: multiOrgPayrollABI,
        functionName: 'getAllEmployees',
        args: [selectedOrgId!],
        chainId: TARGET_CHAIN_ID,
        query: { enabled: !!selectedOrgId && !!orgDetails && orgDetails.employeeCount > BigInt(0) },
    });

    const { data: nativeBalanceData } = useBalance({
        address: multiOrgPayrollContractAddress,
        chainId: TARGET_CHAIN_ID,
    });
    const { data: tokenBalanceData } = useBalance({
        address: multiOrgPayrollContractAddress,
        token: isValidAddress(tokenBalanceAddress) ? tokenBalanceAddress as Address : undefined,
        chainId: TARGET_CHAIN_ID,
        query: { enabled: isValidAddress(tokenBalanceAddress) && tokenBalanceAddress !== ETH_ADDRESS_ZERO },
    });

    // --- Wagmi Hooks for Actions ---
    const { data: writeHash, writeContract, isPending: isWritePending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ hash: writeHash });

    const isOwnerConnected = useMemo(() => {
        return isConnected && orgDetails?.owner && connectedAddress?.toLowerCase() === orgDetails.owner.toLowerCase();
    }, [isConnected, connectedAddress, orgDetails]);

    // --- Effects ---
    useEffect(() => { // Employee Details Fetch Logic
        if (employeesData) {
           const empList = employeesData as Address[];
            setEmployees(empList);
            // Set placeholder details initially
            const details: Record<Address, EmployeeInfo> = {};
            for (const empAddress of empList) {
                details[empAddress] = { salary: BigInt(0), token: ETH_ADDRESS_ZERO as Address, paid: false };
            }
            setEmployeeDetails(details);
            // TODO: Implement actual fetching of details per employee if needed immediately
        } else {
            setEmployees([]);
            setEmployeeDetails({});
        }
    }, [selectedOrgId, employeesData]);

    useEffect(() => { // Transaction Status Update Logic
        const area = 'txStatus';
        if (isWritePending) {
            setMessages(prev => ({ ...prev, [area]: 'Sending transaction...' }));
        } else if (isConfirming) {
            setMessages(prev => ({ ...prev, [area]: `Waiting for confirmation (Tx: ${formatAddress(writeHash)})...` }));
        } else if (isConfirmed) {
            setMessages(prev => ({ ...prev, [area]: `Transaction confirmed! (Tx: ${formatAddress(writeHash)})` }));
            // Trigger relevant data refreshes after confirmation
            refetchOrgInfo();
            refetchEmployees();
            refetchOrgMapping();
        } else if (writeError) {
            setMessages(prev => ({ ...prev, [area]: `Transaction Error: ${writeError.message}` }));
        } else if (receiptError) {
             setMessages(prev => ({ ...prev, [area]: `Confirmation Error: ${receiptError.message}` }));
        }
    }, [isWritePending, isConfirming, isConfirmed, writeHash, writeError, receiptError, refetchOrgInfo, refetchEmployees, refetchOrgMapping]);

    // --- Action Handlers ---
    const executeWrite = async (
        functionName: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: any[],
        successAreaMessage: string, // Note: success message isn't explicitly used here anymore, handled by useEffect
        area: string = 'txStatus',
        value?: bigint
    ) => {
        if (!isConnected || !connectedAddress) {
            setMessages(prev => ({ ...prev, [area]: 'Please connect wallet.' }));
            return;
        }
        if (chainId !== TARGET_CHAIN_ID) {
            setMessages(prev => ({ ...prev, [area]: `Switch to network ID ${TARGET_CHAIN_ID}.` }));
            return;
        }
        if (!selectedOrgId) {
             setMessages(prev => ({ ...prev, [area]: 'Please select an organization.' }));
             return;
        }

        // Clear previous specific area message before starting new action
        setMessages(prev => ({ ...prev, txStatus: 'Preparing transaction...', [area]: 'Processing...' }));

        writeContract({
            address: multiOrgPayrollContractAddress,
            abi: multiOrgPayrollABI,
            functionName,
            args,
            value,
            chainId: TARGET_CHAIN_ID,
        }, {
            onSuccess: (hash) => {
                setMessages(prev => ({ ...prev, txStatus: `Transaction sent (Tx: ${formatAddress(hash)}). Waiting for confirmation...`, [area]: 'Waiting...' }));
            },
            onError: (error) => {
                 console.error(`WriteContract Error (${functionName}):`, error); // Log specific error context
                 setMessages(prev => ({ ...prev, txStatus: `Send Error: ${error.message}`, [area]: `Failed: ${error.message}` }));
            }
        });
    };

    const handleAddEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const area = 'addEmp';
        const formData = new FormData(event.currentTarget);
        const empAddress = formData.get('empAddress') as string;
        const salaryStr = formData.get('salary') as string;
        const tokenInput = formData.get('tokenAddress') as string;

        if (!isValidAddress(empAddress)) {
             setMessages(prev => ({ ...prev, [area]: 'Invalid employee address.'}));
             return;
        }
        const tokenAddress = formatInputTokenAddress(tokenInput) as Address;
        let salaryWei: bigint;
        try {
            salaryWei = parseUnits(salaryStr, DEFAULT_TOKEN_DECIMALS);
            if (salaryWei < BigInt(0)) throw new Error("Salary cannot be negative");
        } catch (error) {
            console.error("Salary parsing error:", error);
            setMessages(prev => ({ ...prev, [area]: 'Invalid salary amount.'}));
            return;
        }

        await executeWrite(
            'addEmployee',
            [selectedOrgId, empAddress, salaryWei, tokenAddress],
            `Employee added request sent.`,
            area
        );
         if (!writeError) (event.target as HTMLFormElement).reset();
    };

    const handleRemoveEmployee = async (empAddress: Address) => {
        if (!selectedOrgId || !empAddress) return;
        const area = `empAction_${empAddress}`;
        if (!confirm(`Remove employee ${formatAddress(empAddress)}?`)) return;
        await executeWrite(
            'removeEmployee',
            [selectedOrgId, empAddress],
            `Remove employee request sent.`,
            area
        );
    };

    const handleSetPayDate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const area = 'payDate';
        const formData = new FormData(event.currentTarget);
        const dateTimeStr = formData.get('payDateTime') as string;
        const timestamp = datetimeLocalToTimestamp(dateTimeStr);

        if (!timestamp || timestamp <= Math.floor(Date.now() / 1000)) {
            setMessages(prev => ({ ...prev, [area]: 'Please select a valid future date/time.'}));
            return;
        }

        await executeWrite(
            'setNextPayDate',
            [selectedOrgId, BigInt(timestamp)],
            `Set pay date request sent.`,
            area
        );
    };

    const handlePaySalaries = async () => {
        const area = 'payRun';
        if (!selectedOrgId || !orgDetails) return;
        if (!orgDetails.nextPayTimestamp || orgDetails.nextPayTimestamp === BigInt(0)) {
            setMessages(prev => ({ ...prev, [area]: 'Next pay date not set.'}));
            return;
        }
        if (orgDetails.nextPayTimestamp > BigInt(Math.floor(Date.now() / 1000))) {
            setMessages(prev => ({ ...prev, [area]: `Not time to pay yet.`}));
            return;
        }
        if (employees.length === 0) {
             setMessages(prev => ({ ...prev, [area]: 'No employees.'}));
             return;
        }
        if (!confirm('Initiate salary payment process?')) return;

        await executeWrite(
            'paySalaries',
            [selectedOrgId],
            `Pay salaries request sent.`,
            area
        );
    };

    const handleResetStatus = async () => {
        const area = 'resetStatus';
        if (!selectedOrgId) return;
        if (employees.length === 0) {
             setMessages(prev => ({ ...prev, [area]: 'No employees.'}));
             return;
        }
        if (!confirm('Reset "paid" status for all employees?')) return;

        await executeWrite(
            'resetPaymentStatus',
            [selectedOrgId],
            `Reset payment status request sent.`,
            area
        );
    };

    const handleFund = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const area = 'fund';
        const formData = new FormData(event.currentTarget);
        const amountStr = formData.get('fundAmount') as string;
        let valueWei: bigint;
        try {
            valueWei = parseUnits(amountStr, 18); // ETH decimals
            if (valueWei <= BigInt(0)) throw new Error("Amount must be positive");
        } catch (error) {
            console.error("Funding amount parsing error:", error);
            setMessages(prev => ({ ...prev, [area]: 'Invalid ETH amount.'}));
            return;
        }

        await executeWrite(
            'fundOrganization',
            [selectedOrgId],
            `Fund request sent.`,
            area,
            valueWei // Pass ETH value here
        );
        if (!writeError) (event.target as HTMLFormElement).reset();
    };

    const handleWithdraw = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const area = 'withdraw';
        const formData = new FormData(event.currentTarget);
        const amountStr = formData.get('withdrawAmount') as string;
        const tokenInput = formData.get('withdrawTokenAddress') as string;
        const tokenAddress = formatInputTokenAddress(tokenInput) as Address;
        const decimals = (tokenAddress === ETH_ADDRESS_ZERO) ? 18 : DEFAULT_TOKEN_DECIMALS;
        let amountWei: bigint;

        try {
            amountWei = parseUnits(amountStr, decimals);
            if (amountWei <= BigInt(0)) throw new Error("Amount must be positive");
        } catch (error) {
            console.error("Withdraw amount parsing error:", error);
            setMessages(prev => ({ ...prev, [area]: 'Invalid amount.'}));
             return;
        }

        await executeWrite(
            'withdraw',
            [selectedOrgId, tokenAddress, amountWei],
            `Withdraw request sent.`,
            area
        );
        if (!writeError) (event.target as HTMLFormElement).reset();
    };

    // --- Render Logic ---
    const isLoading = isWritePending || isConfirming;

    return (
        <div>
            {/* Org Selection */}
            <div className={styles.card}>
                <h2>Select Organization</h2>
                 <button onClick={() => refetchOrgIds()} disabled={isLoadingOrgs} className={`${styles.buttonSecondary} ${styles.smallButton} ${styles.floatRight}`}>
                    {isLoadingOrgs ? 'Refreshing...' : 'Refresh List'}
                 </button>
                {isLoadingOrgs && !orgIds.length && <p>Loading organizations...</p>}
                {messages.list && <p className={styles.message}>{messages.list}</p>}
                {orgIds.length > 0 ? (
                    <select
                        onChange={(e) => setSelectedOrgId(e.target.value ? e.target.value as Address : null)}
                        value={selectedOrgId || ''}
                        className={styles.select}
                        disabled={isLoadingOrgs || isLoadingOrgInfo}
                    >
                        <option value="" disabled>-- Select an Organization --</option>
                        {orgIds.map(id => (
                            <option key={id} value={id}>{orgDetails?.name && id === selectedOrgId ? `${orgDetails.name} (${formatAddress(id)})` : formatAddress(id)}</option>
                        ))}
                    </select>
                ) : (
                     !isLoadingOrgs && <p>No organizations found.</p>
                )}
            </div>

             {/* Contract Balance Display */}
             <div className={styles.card}>
                <h3>Contract Balances</h3>
                <p>
                    <strong>{NATIVE_CURRENCY_SYMBOL}: </strong>
                    {nativeBalanceData ? `${nativeBalanceData.formatted} ${nativeBalanceData.symbol}` : 'Loading...'}
                </p>
                <div className={styles.inlineForm}>
                    <input
                        type="text"
                        value={tokenBalanceAddress}
                        onChange={(e) => setTokenBalanceAddress(e.target.value)}
                        placeholder="ERC20 Token Address (0x...)"
                        className={`${styles.input} ${styles.inlineInput}`}
                    />
                    <span>
                        <strong>Token: </strong>
                        {isValidAddress(tokenBalanceAddress) && tokenBalanceAddress !== ETH_ADDRESS_ZERO
                            ? tokenBalanceData ? `${tokenBalanceData.formatted} ${tokenBalanceData.symbol || 'Tokens'}` : 'Loading...'
                            : '(Enter Address)'
                        }
                    </span>
                </div>
                 {messages.balance && <p className={`${styles.message} ${styles.compactMessage}`}>{messages.balance}</p>}
             </div>

            {/* Transaction Status */}
            {messages.txStatus && <p className={`${styles.message} ${styles.card}`}>{messages.txStatus}</p>}


            {/* Org Details & Actions */}
            {isLoadingOrgInfo && selectedOrgId && <p className={styles.card}>Loading organization details...</p>}
             {messages.details && <p className={`${styles.message} ${styles.card}`}>{messages.details}</p>}

            {selectedOrgId && orgDetails && orgDetails.exists && (
                <div className={styles.card}>
                    <h2>{orgDetails.name}</h2>
                     <p><strong>Org ID:</strong> {formatAddress(selectedOrgId)}</p>
                     <p><strong>Owner:</strong> {formatAddress(orgDetails.owner)} {isOwnerConnected && "(You)"}</p>
                     <p><strong>Next Pay Date:</strong> {formatTimestamp(orgDetails.nextPayTimestamp)}</p>
                     <p><strong>Employee Count:</strong> {orgDetails.employeeCount.toString()}</p>

                    {/* Employee List */}
                    <div className={styles.section}>
                        <h4>Employees ({employees.length})</h4>
                        {employees.length > 0 ? (
                            <ul className={styles.employeeList}>
                                {employees.map(emp => {
                                    // Get details object for the current employee from state
                                    const details = employeeDetails[emp];
                                    return (
                                        <li key={emp}>
                                             <div className={styles.employeeInfo}>
                                                 <span><strong>{formatAddress(emp)}</strong></span>
                                                 {/* Use the details object */}
                                                 {details ? (
                                                     <>
                                                         {/* Use formatBalance utility */}
                                                         <span>Salary: {formatBalance(details.salary, DEFAULT_TOKEN_DECIMALS)} {formatAddress(details.token)}</span>
                                                         <span>Paid: {details.paid ? 'Yes' : 'No'}</span>
                                                     </>
                                                 ) : (
                                                     // Fallback if details somehow aren't in the state object yet
                                                     <span>(Details loading or unavailable)</span>
                                                 )}
                                             </div>
                                              {isOwnerConnected && (
                                                 <div className={styles.employeeActions}>
                                                     <button
                                                         onClick={() => handleRemoveEmployee(emp)}
                                                         className={`${styles.buttonDanger} ${styles.smallButton}`}
                                                         disabled={isLoading}
                                                     >
                                                         Remove
                                                     </button>
                                                 </div>
                                              )}
                                                {messages[`empAction_${emp}`] && <p className={`${styles.message} ${styles.compactMessage}`}>{messages[`empAction_${emp}`]}</p>}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : <p>No employees found.</p>}
                    </div>


                    {/* Owner Actions */}
                     {isOwnerConnected && (
                        <div className={`${styles.section} ${styles.actionsSection}`}>
                             <h3>Owner Actions</h3>
                             {/* Add Employee */}
                             <div className={styles.actionBox}>
                                 <h5>Add Employee</h5>
                                 <form onSubmit={handleAddEmployee} className={styles.formGrid}>
                                     <input name="empAddress" placeholder="Employee Address (0x...)" required className={styles.input} disabled={isLoading}/>
                                     <input name="salary" placeholder={`Salary (e.g., 1.5)`} type="number" step="any" min="0" required className={styles.input} disabled={isLoading}/>
                                     <input name="tokenAddress" placeholder="Token Addr (blank/0x0 for ETH)" className={styles.input} disabled={isLoading}/>
                                     <button type="submit" className={styles.button} disabled={isLoading}>
                                         {isLoading ? 'Busy...' : 'Add Employee'}
                                     </button>
                                 </form>
                                  {messages.addEmp && <p className={styles.message}>{messages.addEmp}</p>}
                             </div>
                             {/* Set Pay Date */}
                             <div className={styles.actionBox}>
                                  <h5>Set Next Pay Date</h5>
                                  <form onSubmit={handleSetPayDate} className={styles.formGrid}>
                                      <input name="payDateTime" type="datetime-local" required className={styles.input} disabled={isLoading} />
                                      <button type="submit" className={styles.button} disabled={isLoading}>
                                          {isLoading ? 'Busy...' : 'Set Date'}
                                      </button>
                                  </form>
                                  {messages.payDate && <p className={styles.message}>{messages.payDate}</p>}
                             </div>
                              {/* Pay Salaries */}
                              <div className={styles.actionBox}>
                                   <h5>Run Payroll</h5>
                                   <button onClick={handlePaySalaries} className={styles.button} disabled={isLoading || employees.length === 0}>
                                         {isLoading ? 'Busy...' : 'Pay All Unpaid Salaries'}
                                   </button>
                                    <p className={styles.hint}>Requires funds and correct pay date.</p>
                                    {messages.payRun && <p className={styles.message}>{messages.payRun}</p>}
                              </div>
                              {/* Reset Status */}
                              <div className={styles.actionBox}>
                                   <h5>Reset Paid Status</h5>
                                   <button onClick={handleResetStatus} className={`${styles.buttonSecondary}`} disabled={isLoading || employees.length === 0}>
                                       {isLoading ? 'Busy...' : 'Reset All "Paid" Status'}
                                   </button>
                                    <p className={styles.hint}>Use after setting next pay date.</p>
                                    {messages.resetStatus && <p className={styles.message}>{messages.resetStatus}</p>}
                              </div>
                               {/* Withdraw Funds */}
                               <div className={styles.actionBox}>
                                    <h5>Withdraw Funds</h5>
                                    <form onSubmit={handleWithdraw} className={styles.formGrid}>
                                         <input name="withdrawAmount" type="number" step="any" min="0" placeholder="Amount" required className={styles.input} disabled={isLoading}/>
                                         <input name="withdrawTokenAddress" placeholder="Token Addr (blank/0x0 for ETH)" className={styles.input} disabled={isLoading}/>
                                         <button type="submit" className={styles.button} disabled={isLoading}>
                                              {isLoading ? 'Busy...' : 'Withdraw'}
                                         </button>
                                    </form>
                                     {messages.withdraw && <p className={styles.message}>{messages.withdraw}</p>}
                               </div>
                        </div>
                     )}


                     {/* Public Actions (Fund) */}
                    <div className={`${styles.section} ${styles.actionsSection}`}>
                         <h3>Public Actions</h3>
                          <div className={styles.actionBox}>
                             <h5>Fund Organization ({NATIVE_CURRENCY_SYMBOL})</h5>
                             <form onSubmit={handleFund} className={styles.formGrid}>
                                 <input name="fundAmount" type="number" step="any" min="0" placeholder={`Amount in ${NATIVE_CURRENCY_SYMBOL}`} required className={styles.input} disabled={isLoading}/>
                                 <button type="submit" className={styles.button} disabled={isLoading || !isConnected}>
                                     {isLoading ? 'Busy...' : `Fund Org with ${NATIVE_CURRENCY_SYMBOL}`}
                                 </button>
                             </form>
                              {messages.fund && <p className={styles.message}>{messages.fund}</p>}
                          </div>
                     </div>

                </div>
            )}

             {!selectedOrgId && !isLoadingOrgInfo && orgIds.length > 0 && (
                 <p className={styles.card}>Select an organization to view details.</p>
             )}

        </div>
    );
}