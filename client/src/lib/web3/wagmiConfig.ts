import { getDefaultConfig } from "@rainbow-me/rainbowkit";

import { libreChain } from "./chains";

if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID && import.meta.env.DEV) {
  console.warn(
    "[LIBRE] VITE_WALLETCONNECT_PROJECT_ID not set. " +
      "WalletConnect features will not work. " +
      "Add a real project ID from https://cloud.reown.com",
  );
}

const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "libre-local-dev";

export const wagmiConfig = getDefaultConfig({
  appName: "LIBRE RideShare",
  projectId: walletConnectProjectId,
  chains: [libreChain],
  ssr: false,
});
