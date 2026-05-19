import { getAddress, isAddress, type Address } from "viem";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_USDC_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

export interface EscrowChainConfig {
  chainId: number;
  escrowContractAddress: Address | null;
  usdcTokenAddress: Address | null;
  rpcUrl: string | null;
  platformFeeBps: number;
  verifierMode: "mock" | "viem";
}

function optionalAddress(value: string | undefined): Address | null {
  if (!value) return null;
  if (!isAddress(value)) return null;
  return getAddress(value);
}

export function getEscrowChainConfig(): EscrowChainConfig {
  const chainId = Number(process.env.CHAIN_ID || process.env.VITE_CHAIN_ID || BASE_SEPOLIA_CHAIN_ID);
  const escrowContractAddress = optionalAddress(process.env.ESCROW_CONTRACT_ADDRESS);
  const usdcTokenAddress = optionalAddress(
    process.env.USDC_TOKEN_ADDRESS || BASE_SEPOLIA_USDC_ADDRESS
  );
  const rpcUrl = process.env.RPC_URL_BASE_SEPOLIA || null;
  const platformFeeBps = Number(process.env.PLATFORM_FEE_BPS || 300);
  const requestedMode = process.env.ESCROW_VERIFIER_MODE;
  const verifierMode =
    requestedMode === "viem" && escrowContractAddress && usdcTokenAddress && rpcUrl
      ? "viem"
      : "mock";

  return {
    chainId,
    escrowContractAddress,
    usdcTokenAddress,
    rpcUrl,
    platformFeeBps,
    verifierMode,
  };
}

export function toUsdcUnits(amountUsd: number): bigint {
  return BigInt(Math.round(amountUsd * 1_000_000));
}
