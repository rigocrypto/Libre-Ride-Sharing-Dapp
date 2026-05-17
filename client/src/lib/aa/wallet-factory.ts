/**
 * Account Abstraction (AA) Wallet Factory
 * Creates smart contract wallets for users via ZeroDev
 * Supports email-first signup without requiring MetaMask
 */

import { Address } from 'viem';

export interface AAWallet {
  address: Address;
  email: string;
  isDeployed: boolean;
}

/**
 * Creates an AA wallet for a user via email signup
 * This is called server-side for security
 */
export async function createAAWallet(email: string): Promise<AAWallet> {
  // Server-side implementation - this will be called from the backend
  // For now, return a placeholder that will be replaced with ZeroDev SDK
  throw new Error('AA wallet creation must be done server-side. Use /api/auth/aa-signup endpoint.');
}

/**
 * Client-side helper to check if an address is an AA wallet
 */
export function isAAWallet(address: Address): boolean {
  // AA wallets typically have a specific pattern or can be checked via contract
  // For now, we'll assume any address starting with 0x is valid
  return address.startsWith('0x') && address.length === 42;
}

/**
 * Get AA wallet address from email (if already created)
 */
export async function getAAWalletByEmail(email: string): Promise<Address | null> {
  try {
    const res = await fetch(`/api/auth/aa-wallet?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      return data.address || null;
    }
    return null;
  } catch {
    return null;
  }
}

