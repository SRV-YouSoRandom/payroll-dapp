// src/components/ConnectButton.tsx
'use client';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

export function ConnectButton() {
  return <RainbowConnectButton
      accountStatus="address" // Options: 'full', 'address', 'avatar'
      chainStatus="icon" // Options: 'full', 'icon', 'name', 'none'
      showBalance={false} // Optional: show native balance
  />;
}