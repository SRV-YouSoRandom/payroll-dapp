// src/lib/constants.ts
import MultiOrgPayrollABI from './abi/MultiOrgPayroll.json';

export const multiOrgPayrollContractAddress = '0xE06359e64cC9265FAC05cb7F6e78e873Ce980AD1'; // Keep this
export const multiOrgPayrollABI = MultiOrgPayrollABI;

// --- Network Configuration (Primarily for reference/validation now) ---
export const TARGET_CHAIN_ID = 101003;
export const TARGET_CHAIN_NAME = 'Socotra'; // e.g., 'Sepolia', 'Ethereum Mainnet'
export const TARGET_CHAIN_RPC_URL = 'rpc.socotra-testnet.network/ext/bc/JUNE/rpc'; // Find a reliable public RPC or use your own
export const TARGET_CHAIN_EXPLORER = 'https://socotra.juneoscan.io/'; // e.g., 'https://sepolia.etherscan.io', 'https://etherscan.io'
export const NATIVE_CURRENCY_SYMBOL = 'JUNE'; // e.g., 'ETH', 'MATIC'

// --- Constants ---
export const ETH_ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const DEFAULT_TOKEN_DECIMALS = 18;