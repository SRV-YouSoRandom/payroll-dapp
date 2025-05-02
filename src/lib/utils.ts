// src/lib/utils.ts
import { type Address, formatUnits, parseUnits, isAddress, getAddress as viemGetAddress, zeroAddress } from 'viem'; // Use viem utilities
import { DEFAULT_TOKEN_DECIMALS, NATIVE_CURRENCY_SYMBOL } from './constants'; // Assuming ETH_ADDRESS_ZERO is also updated/removed in constants

// Format address to shorter version (e.g., 0x123...abcd)
export const formatAddress = (address: string | undefined | null): string => {
    if (!address) return '';
    // Use viem's zeroAddress constant for comparison
    if (address.toLowerCase() === zeroAddress.toLowerCase()) return NATIVE_CURRENCY_SYMBOL; // Show native symbol for zero address
    // Use viem's isAddress for validation if needed within formatting (though usually checked before calling)
    // Ensure address is checksummed if possible using viemGetAddress
    try {
        const checksummed = viemGetAddress(address as Address);
         return `${checksummed.substring(0, 6)}...${checksummed.substring(checksummed.length - 4)}`;
    } catch {
        // Handle invalid address if necessary, or assume valid input
        return 'Invalid Address';
    }
};

// Format BigInt timestamp (seconds) to readable date/time string
export const formatTimestamp = (timestamp: bigint | undefined | null): string => {
    if (timestamp === undefined || timestamp === null || timestamp === BigInt(0)) return 'Not Set';
    try {
        // Convert bigint to number for Date constructor. Beware of precision loss for *extremely* large numbers (not an issue for timestamps).
        const date = new Date(Number(timestamp) * 1000);
        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
        return date.toLocaleString();
    } catch (error) {
        console.error("Error formatting timestamp:", timestamp, error);
        return "Invalid Date";
    }
};

// Format bigint balance to readable string (handles decimals)
export const formatBalance = (balance: bigint | undefined | null, decimals: number = DEFAULT_TOKEN_DECIMALS): string => {
    if (balance === undefined || balance === null) return '0.0';
    try {
        return formatUnits(balance, decimals); // Use viem's formatUnits
    } catch (error) {
        console.error("Error formatting balance:", balance, error);
        return "Error";
    }
};

// Parse readable amount string to bigint (handles decimals)
export const parseAmount = (amount: string | undefined | null, decimals: number = DEFAULT_TOKEN_DECIMALS): bigint => {
    if (!amount || amount.trim() === '') return BigInt(0);
    try {
        return parseUnits(amount, decimals); // Use viem's parseUnits
    } catch (error) {
        console.error("Error parsing amount:", amount, error);
        return BigInt(0);
    }
};

// Convert YYYY-MM-DDTHH:mm string to UNIX timestamp (seconds)
export const datetimeLocalToTimestamp = (dateTimeString: string): number | null => {
    // This function doesn't use ethers/viem, so it remains the same
    if (!dateTimeString) return null;
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            return null;
        }
        return Math.floor(date.getTime() / 1000);
    } catch (error) {
        console.error("Error converting datetime-local:", error);
        return null;
    }
};

// Check if an address is valid using viem
export const isValidAddress = (address: string): boolean => {
    if (!address) return false;
    return isAddress(address); // Use viem's isAddress
};

// Get a specific token address, defaulting to ETH zero address if blank/invalid
export const getTokenAddress = (input: string | undefined | null): Address => {
    const trimmedInput = input?.trim();
    if (!trimmedInput || trimmedInput === '' || trimmedInput.toLowerCase() === 'eth') {
        return zeroAddress; // Use viem's zeroAddress
    }
    if (isAddress(trimmedInput)) { // Use viem's isAddress
        return viemGetAddress(trimmedInput); // Return checksummed address using viem
    }
    console.warn(`Invalid token address input "${input}", defaulting to Zero Address.`);
    return zeroAddress; // Use viem's zeroAddress
}