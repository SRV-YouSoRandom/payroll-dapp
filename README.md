# 🚀 Multi-Org Payroll DApp 💸🔗

Manage payroll for multiple organizations seamlessly on the blockchain.

This open-source DApp offers a user-friendly interface built with **Next.js**, **Wagmi**, and **RainbowKit**, allowing organization owners to manage employees, set pay schedules, fund organizations with ETH or ERC20 tokens, and distribute salaries directly to wallets.

Built for **transparency, automation**, and the **future of compensation**. ✨

> 💡 **Pro Tip:** Add a screenshot or GIF of the DApp in action here!
>
> ![Screenshot or GIF Placeholder](#)

---

## ✨ Features

- **Organization Management:** Create and manage organizations. The creator becomes the owner.
- **Employee Management:** Add/remove employees, define salary amounts and payment currency (ETH or specific ERC20).
- **Payroll Scheduling:** Set the next payment timestamp.
- **Funding:** Fund organizations in ETH (ERC20 support possible).
- **Salary Payments:** Execute payroll runs to distribute salaries.
- **Status Tracking:** Track employee payment statuses.
- **Withdrawals:** Owners can withdraw excess funds.
- **Multi-Wallet Support:** Compatible with MetaMask, WalletConnect, Coinbase Wallet, and others.
- **Network Awareness:** Displays current wallet, address, network, and warns on wrong chains.
- **Customizable Chains:** Easily support Mainnet, Polygon, Sepolia, Arbitrum, or custom L2s.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **Web3:** Wagmi, Viem, Ethers.js v6, RainbowKit
- **Styling:** CSS Modules
- **Smart Contracts:** Solidity (contract code provided separately)

---

## 📋 Prerequisites

Ensure you have the following installed:

- **Node.js** v18.x or later
- **npm** or **yarn**
- **Git**
- **Web3 Wallet:** MetaMask or WalletConnect-compatible wallet
- **WalletConnect Cloud Project ID:** [Get one here](https://cloud.walletconnect.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/SRV-YouSoRandom/smart-payroll-dapp.git
cd YOUR_REPO_NAME
````

> Replace `YOUR_REPO_NAME` with the actual repository name.

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="YOUR_WALLETCONNECT_PROJECT_ID"
```

> Replace with your actual WalletConnect Project ID.

### 4. Deploy the Smart Contract

Deploy `MultiOrgPayroll.sol` to your desired network (e.g., Sepolia testnet).

* Smart contract source: `/smart-contract` (or update if in a separate repo).
* Use tools like **Hardhat** or **Foundry** for deployment.
* Note down:

  * The deployed contract address
  * The target Chain ID (e.g., Sepolia = `11155111`)

### 5. Configure Frontend Constants

Edit `src/lib/constants.ts`:

```ts
export const multiOrgPayrollContractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';

import { sepolia } from 'wagmi/chains';
export const TARGET_CHAIN_ID = sepolia.id;
export const TARGET_CHAIN_NAME = sepolia.name;
export const NATIVE_CURRENCY_SYMBOL = sepolia.nativeCurrency.symbol;

import MultiOrgPayrollABI from './abi/MultiOrgPayroll.json';
export const multiOrgPayrollABI = MultiOrgPayrollABI;
```

> Ensure the chain matches your deployment network.

### 6. (Optional) Add Custom Chains

Edit `src/contexts/Web3Provider.tsx` to include new chains by importing from `wagmi/chains` or defining custom chain objects.

### 7. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🖥️ Usage

* **Connect Wallet:** Use the RainbowKit "Connect Wallet" button.
* **Switch Network:** Ensure wallet matches `TARGET_CHAIN_ID`.
* **Create Organization:** First-time users can create a new one; your wallet becomes the owner.
* **Manage Organizations:** Select your organization and perform owner actions (Add/Remove Employees, Set Pay Date, Pay Salaries, Withdraw).
* **Fund:** Anyone can send ETH to an organization from the UI.

---

## 🤝 Contributing

We welcome contributions!

1. Fork this repo.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit changes with meaningful messages.
4. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request to the `main` branch.

> Follow coding conventions and add tests where appropriate. Open an issue to discuss ideas before major changes.

---

## 📜 License

Licensed under the [MIT License](LICENSE).

---

## ⚠️ Security Notice

This project is provided **as-is** without a formal security audit.

> **Do NOT** use with real funds on mainnet without proper auditing. Use testnets or small amounts at your own risk.