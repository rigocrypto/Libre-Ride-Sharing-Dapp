import { base, baseSepolia } from "wagmi/chains";

export const libreChainId = Number(import.meta.env.VITE_CHAIN_ID || baseSepolia.id);
export const libreChain = libreChainId === base.id ? base : baseSepolia;

export const escrowClientConfig = {
  chainId: libreChain.id,
  escrowContractAddress: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS as `0x${string}` | undefined,
  usdcTokenAddress: import.meta.env.VITE_USDC_TOKEN_ADDRESS as `0x${string}` | undefined,
  rpcUrl: import.meta.env.VITE_RPC_URL_BASE_SEPOLIA as string | undefined,
};
