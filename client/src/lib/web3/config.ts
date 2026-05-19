import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, base } from "wagmi/chains";

const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "libre-local-dev";

export const libreChainId = Number(import.meta.env.VITE_CHAIN_ID || baseSepolia.id);
export const libreChain = libreChainId === base.id ? base : baseSepolia;

export const wagmiConfig = getDefaultConfig({
  appName: "LIBRE RideShare",
  projectId: walletConnectProjectId,
  chains: [libreChain],
  ssr: false,
});

export const escrowClientConfig = {
  chainId: libreChain.id,
  escrowContractAddress: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS as `0x${string}` | undefined,
  usdcTokenAddress: import.meta.env.VITE_USDC_TOKEN_ADDRESS as `0x${string}` | undefined,
  rpcUrl: import.meta.env.VITE_RPC_URL_BASE_SEPOLIA as string | undefined,
};
