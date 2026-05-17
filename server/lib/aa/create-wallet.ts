/**
 * ZeroDev Account Abstraction Wallet Creation
 * Server-side wallet creation for email-first signup
 */

import crypto from 'node:crypto';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * Create an AA wallet using ZeroDev
 * This generates a deterministic private key from email for consistency
 */
export async function createAAWalletWithZeroDev(email: string): Promise<string> {
  const projectId = process.env.ZERO_DEV_PROJECT_ID;
  
  if (!projectId) {
    console.warn('[AA] ZERO_DEV_PROJECT_ID not configured, using placeholder');
    // Fallback to deterministic address if ZeroDev not configured
    return generateDeterministicAddress(email);
  }

  try {
    // Lazy import ZeroDev SDK to avoid blocking server startup if not configured
    const { createKernelAccount } = await import('@zerodev/sdk');
    const { createPublicClient, http } = await import('viem');
    
    // Generate a deterministic private key from email hash
    // This ensures the same email always gets the same wallet
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const privateKey = `0x${emailHash.slice(0, 64)}` as `0x${string}`;
    const owner = privateKeyToAccount(privateKey);

    // Create public client for ZeroDev
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Create ZeroDev Kernel account (v5 API)
    const account = await createKernelAccount(publicClient, {
      address: owner.address,
    } as any);

    return account.address;
  } catch (error: any) {
    console.error('[AA] ZeroDev wallet creation failed:', error);
    // Fallback to deterministic address
    return generateDeterministicAddress(email);
  }
}


/**
 * Generate deterministic address from email (fallback)
 */
function generateDeterministicAddress(email: string): string {
  const hash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  return `0x${hash.slice(0, 40)}` as any;
}

