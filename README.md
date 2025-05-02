🚀 Multi-Org Payroll DApp 💸🔗

Manage payroll for multiple organizations seamlessly on the blockchain!

This open-source DApp provides a user-friendly interface built with Next.js, Wagmi, and RainbowKit to interact with the MultiOrgPayroll smart contract. It allows organization owners to manage employees, set pay schedules, fund their organizations with ETH or ERC20 tokens, and distribute salaries directly to employee wallets.

Built for transparency, automation, and the future of compensation! ✨

(It's highly recommended to replace this line with a screenshot or GIF of the DApp in action!)
[Insert Screenshot/GIF Here]

✨ Features

Organization Management: Create new organizations where the creator becomes the owner.

Employee Management: Add/Remove employees, define their salary amount and currency (ETH or specific ERC20 token).

Payroll Scheduling: Set the next payment timestamp for an organization.

Funding: Easily fund organization treasuries within the contract using ETH (support for funding via ERC20 tokens can be added).

Salary Payments: Execute payroll runs to distribute salaries to all eligible employees in their designated currency.

Status Tracking: View employee payment status for the current cycle.

Withdrawals: Owners can withdraw excess funds (ETH or Tokens) from their organization's contract balance.

Multi-Wallet Support: Connect using various wallets like MetaMask, Coinbase Wallet, WalletConnect compatible mobile wallets, etc., powered by RainbowKit.

Network Awareness: Clear UI indicators for connected wallet, address, and network, including warnings for wrong networks.

Customizable Chains: Easily configure support for various EVM chains (Mainnet, Polygon, Sepolia, Arbitrum, custom L2s, etc.).

🛠️ Tech Stack

Frontend: Next.js (App Router), React, TypeScript

Web3: Wagmi (React Hooks for Ethereum), Viem (Ethereum Interface), Ethers.js (v6 - Utilities), RainbowKit (Wallet Connection UI)

Styling: CSS Modules

Smart Contract: Solidity (Contract code provided separately)

##📋 Prerequisites

Before you begin, ensure you have the following installed and set up:

Node.js: Version 18.x or later (Check with node -v).

Package Manager: npm (usually comes with Node.js) or yarn.

Git: For cloning the repository.

Web3 Wallet: A browser extension (like MetaMask) or mobile wallet compatible with WalletConnect for testing interactions.

WalletConnect Cloud Account: You need a Project ID from WalletConnect Cloud to enable mobile wallet connections. It's free!

🚀 Getting Started

Follow these steps to set up and run the project locally:

Clone the Repository:

git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME


(Replace YOUR_USERNAME/YOUR_REPO_NAME with the actual path)

Install Dependencies:

npm install
# or
yarn install
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END

Set Up Environment Variables:

Create a file named .env.local in the root of the project.

Add your WalletConnect Project ID to this file:

NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="YOUR_WALLETCONNECT_PROJECT_ID"
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
.env.local
IGNORE_WHEN_COPYING_END

Replace "YOUR_WALLETCONNECT_PROJECT_ID" with the actual ID you obtained from WalletConnect Cloud. This is required for RainbowKit's WalletConnect connector.

Deploy the Smart Contract:

This frontend requires the MultiOrgPayroll smart contract to be deployed on your target blockchain network (e.g., Sepolia testnet, Polygon mainnet, your custom chain).

The Solidity smart contract code is located in the /smart-contract directory (<- Adjust this path if needed) or in a separate repository (<- Link here if separate).

Follow the instructions in the contract's own README (or use tools like Hardhat or Foundry) to compile and deploy the MultiOrgPayroll.sol contract.

Crucially, note down:

The Deployed Contract Address.

The Chain ID of the network you deployed to (e.g., Sepolia is 11155111).

Configure Frontend Constants:

Open the configuration file: src/lib/constants.ts.

Update the following values to match your deployed contract:

// src/lib/constants.ts

// V V V --- UPDATE THESE --- V V V
export const multiOrgPayrollContractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS'; // Replace with your contract address
// Example using Sepolia (update targetChain if needed)
import { sepolia } from 'wagmi/chains'; // Import your target chain
export const TARGET_CHAIN_ID = sepolia.id; // Use chain ID from wagmi/chains (e.g., 11155111 for Sepolia)
export const TARGET_CHAIN_NAME = sepolia.name;
export const NATIVE_CURRENCY_SYMBOL = sepolia.nativeCurrency.symbol;
// ^ ^ ^ --- UPDATE THESE --- ^ ^ ^

// ABI should be correct if MultiOrgPayroll.json is up-to-date
import MultiOrgPayrollABI from './abi/MultiOrgPayroll.json';
export const multiOrgPayrollABI = MultiOrgPayrollABI;

// ... other constants ...
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Ensure the targetChain imported from wagmi/chains (e.g., sepolia) matches the network where you deployed the contract.

(Optional) Configure Supported Chains:

If you want to support chains other than the default ones (Mainnet, Sepolia) or add custom networks, edit the src/contexts/Web3Provider.tsx file.

Follow the comments in that file to import chain definitions from wagmi/chains or define custom chain objects and add them to the allSupportedChains array.

Run the Development Server:

npm run dev
# or
yarn dev
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END

Open the DApp:
Navigate to http://localhost:3000 in your browser.

🖥️ Usage

Connect Wallet: Click the "Connect Wallet" button (provided by RainbowKit) and choose your preferred wallet.

Switch Network: Ensure your connected wallet is on the same network you configured in constants.ts (the TARGET_CHAIN_ID). RainbowKit will show the current network and allow switching if configured.

Create Organization: If you don't own an organization yet, use the "Create New Organization" form. Your connected wallet address will become the Organization ID and owner.

Select Organization: Choose an organization from the dropdown list to manage it.

Manage: If you are the owner of the selected organization, owner-specific actions (Add/Remove Employee, Set Pay Date, Pay Salaries, Withdraw) will become available.

Fund: Anyone can use the "Fund Organization" section to send the native currency (e.g., ETH) to the selected organization's contract balance.

🤝 Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

Fork the repository on GitHub.

Create a new branch for your feature or bug fix (git checkout -b feature/your-feature-name).

Make your changes and commit them with clear messages.

Push your branch to your fork (git push origin feature/your-feature-name).

Open a Pull Request to the main repository's main branch.

Please ensure your code follows the project's coding style and includes tests where applicable. Feel free to open an issue first to discuss potential changes.

📜 License

This project is licensed under the MIT License. See the LICENSE file for details.

⚠️ Important Note on Security

This is an open-source project provided as-is. While developed with care, it has not undergone a formal security audit. DO NOT use this DApp or the associated smart contract with significant real funds on mainnet without conducting a thorough independent security audit. Use it on testnets or with small amounts at your own risk.