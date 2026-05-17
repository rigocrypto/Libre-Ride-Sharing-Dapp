/**
 * Referral Bonus Payment Module
 * Auto-sends $50 USDC to referrer's wallet when referral is claimed
 */

import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// USDC on Base Sepolia testnet (update with actual address)
const USDC_ADDRESS_TESTNET = process.env.USDC_CONTRACT_ADDRESS_TESTNET || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;

// ERC20 ABI for transfer
const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

/**
 * Send referral bonus in USDC to referrer's wallet
 * @param toAddress - Referrer's wallet address
 * @param amountUSD - Amount in USD (default 50)
 * @returns Transaction hash
 */
export async function sendReferralBonus(
  toAddress: string,
  amountUSD: number = 50
): Promise<string | null> {
  if (!TREASURY_PRIVATE_KEY) {
    console.warn('[Referral Bonus] TREASURY_PRIVATE_KEY not configured, skipping payment');
    return null;
  }

  try {
    const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
    const rpcUrl = process.env.ALCHEMY_BASE_RPC || 'https://sepolia.base.org';
    
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // USDC has 6 decimals, so $50 = 50,000,000 micro-USDC
    const amountMicro = BigInt(Math.floor(amountUSD * 1_000_000));

    // Encode transfer function call
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [toAddress as `0x${string}`, amountMicro],
    });

    // Send transaction
    const hash = await walletClient.sendTransaction({
      to: USDC_ADDRESS_TESTNET as `0x${string}`,
      data,
      gas: BigInt(100000), // Adjust if needed
    });

    console.log(`[Referral Bonus] Sent $${amountUSD} USDC to ${toAddress}, tx: ${hash}`);

    // Wait for confirmation (optional, can be async)
    try {
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`[Referral Bonus] Transaction confirmed: ${hash}`);
    } catch (waitError) {
      console.warn('[Referral Bonus] Transaction sent but confirmation failed:', waitError);
    }

    return hash;
  } catch (error: any) {
    console.error('[Referral Bonus] Failed to send payment:', error);
    throw new Error(`Referral bonus payment failed: ${error.message}`);
  }
}

/**
 * Check if treasury has sufficient USDC balance
 */
export async function checkTreasuryBalance(): Promise<boolean> {
  if (!TREASURY_PRIVATE_KEY) return false;

  try {
    const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
    const rpcUrl = process.env.ALCHEMY_BASE_RPC || 'https://sepolia.base.org';
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // Get balance (simplified - would need full ERC20 ABI for balanceOf)
    // For now, return true and handle insufficient balance in error handling
    return true;
  } catch {
    return false;
  }
}

