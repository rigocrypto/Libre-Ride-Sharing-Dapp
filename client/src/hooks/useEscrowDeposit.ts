import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getAddress, isAddress, type Hex } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { erc20Abi, rideEscrowAbi } from "@shared/escrow";
import { escrowClientConfig, libreChain } from "@/lib/web3/config";

export type DepositStatus =
  | "WALLET_NOT_CONNECTED"
  | "READY_TO_DEPOSIT"
  | "AWAITING_APPROVAL_SIGNATURE"
  | "APPROVAL_PENDING"
  | "APPROVAL_CONFIRMED"
  | "AWAITING_DEPOSIT_SIGNATURE"
  | "TRANSACTION_PENDING"
  | "VERIFYING_ESCROW"
  | "DEPOSIT_CONFIRMED"
  | "DEPOSIT_FAILED"
  | "APPROVAL_FAILED";

interface DepositError {
  type:
    | "wallet_required"
    | "wrong_network"
    | "missing_config"
    | "approval_failed"
    | "deposit_failed"
    | "user_rejected"
    | "network_error"
    | "server_error"
    | "unknown";
  message: string;
  code?: string;
}

interface PreparedEscrowDeposit {
  rideId: string;
  rideIdHash: Hex;
  chainId: number;
  contractAddress: `0x${string}` | null;
  tokenAddress: `0x${string}` | null;
  driverAddress: `0x${string}`;
  amountUnits: string;
  platformFeeBps: number;
  verifierMode: "mock" | "viem";
}

const statusLabels: Record<DepositStatus, string> = {
  WALLET_NOT_CONNECTED: "Connect wallet to pay",
  READY_TO_DEPOSIT: "Ready to deposit USDC",
  AWAITING_APPROVAL_SIGNATURE: "Approve USDC spending in your wallet",
  APPROVAL_PENDING: "Waiting for USDC approval confirmation",
  APPROVAL_CONFIRMED: "USDC approval confirmed",
  AWAITING_DEPOSIT_SIGNATURE: "Sign escrow deposit in your wallet",
  TRANSACTION_PENDING: "Waiting for escrow transaction confirmation",
  VERIFYING_ESCROW: "Verifying escrow on backend",
  DEPOSIT_CONFIRMED: "Escrow deposit confirmed",
  DEPOSIT_FAILED: "Escrow deposit failed",
  APPROVAL_FAILED: "USDC approval failed",
};

function getFirebaseToken() {
  return localStorage.getItem("firebaseToken");
}

function normalizeError(error: unknown): DepositError {
  if (typeof error === "object" && error && "type" in error && "message" in error) {
    return error as DepositError;
  }

  const message = error instanceof Error ? error.message : "Escrow deposit failed";
  const lowered = message.toLowerCase();

  if (lowered.includes("user rejected") || lowered.includes("rejected")) {
    return { type: "user_rejected", message: "Wallet signature was rejected" };
  }

  if (lowered.includes("wallet")) {
    return { type: "wallet_required", message };
  }

  if (lowered.includes("network") || lowered.includes("chain")) {
    return { type: "wrong_network", message };
  }

  return { type: "unknown", message };
}

export function useEscrowDeposit(rideId: string) {
  const account = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: libreChain.id });
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DepositStatus>(
    account.isConnected ? "READY_TO_DEPOSIT" : "WALLET_NOT_CONNECTED"
  );
  const [success, setSuccess] = useState(false);
  const [approvalHash, setApprovalHash] = useState<Hex | null>(null);
  const [depositHash, setDepositHash] = useState<Hex | null>(null);

  const isWalletReady = !!account.address && account.isConnected;

  const mutation = useMutation({
    mutationFn: async () => {
      const token = getFirebaseToken();
      if (!token) throw new Error("Not authenticated");

      if (!account.address || !walletClient || !publicClient) {
        setStatus("WALLET_NOT_CONNECTED");
        throw { type: "wallet_required", message: "Connect a wallet to pay with USDC" } satisfies DepositError;
      }

      if (chainId !== libreChain.id) {
        setStatus("AWAITING_DEPOSIT_SIGNATURE");
        await switchChainAsync({ chainId: libreChain.id });
      }

      const initiateRes = await fetch("/api/escrow/deposit/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rideId }),
      });

      if (!initiateRes.ok) {
        const err = await initiateRes.json();
        throw {
          type: "server_error",
          message: err.error || "Failed to initiate escrow deposit",
          code: err.code,
        } satisfies DepositError;
      }

      const { data } = (await initiateRes.json()) as { data: PreparedEscrowDeposit };
      const contractAddress = data.contractAddress ?? escrowClientConfig.escrowContractAddress;
      const tokenAddress = data.tokenAddress ?? escrowClientConfig.usdcTokenAddress;

      if (!contractAddress || !tokenAddress || !isAddress(contractAddress) || !isAddress(tokenAddress)) {
        throw {
          type: "missing_config",
          message: "Escrow contract and USDC token addresses must be configured for wallet payment",
          code: "ESCROW_CONFIG_MISSING",
        } satisfies DepositError;
      }

      const riderAddress = getAddress(account.address);
      const escrowAddress = getAddress(contractAddress);
      const usdcAddress = getAddress(tokenAddress);
      const amount = BigInt(data.amountUnits);

      const allowance = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [riderAddress, escrowAddress],
      });

      if (allowance < amount) {
        setStatus("AWAITING_APPROVAL_SIGNATURE");
        const nextApprovalHash = await walletClient.writeContract({
          account: riderAddress,
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [escrowAddress, amount],
          chain: libreChain,
        });
        setApprovalHash(nextApprovalHash);

        setStatus("APPROVAL_PENDING");
        const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: nextApprovalHash });
        if (approvalReceipt.status !== "success") {
          throw {
            type: "approval_failed",
            message: "USDC approval transaction did not succeed",
            code: "APPROVAL_TX_FAILED",
          } satisfies DepositError;
        }
      }

      setStatus("APPROVAL_CONFIRMED");
      setStatus("AWAITING_DEPOSIT_SIGNATURE");
      const txHash = await walletClient.writeContract({
        account: riderAddress,
        address: escrowAddress,
        abi: rideEscrowAbi,
        functionName: "deposit",
        args: [data.rideIdHash, data.driverAddress, amount, BigInt(data.platformFeeBps), usdcAddress],
        chain: libreChain,
      });
      setDepositHash(txHash);

      setStatus("TRANSACTION_PENDING");
      const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (depositReceipt.status !== "success") {
        throw {
          type: "deposit_failed",
          message: "Escrow deposit transaction did not succeed",
          code: "DEPOSIT_TX_FAILED",
        } satisfies DepositError;
      }

      setStatus("VERIFYING_ESCROW");
      const confirmRes = await fetch("/api/escrow/deposit/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rideId, txHash, chainId: libreChain.id, senderWallet: riderAddress }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        throw {
          type: "server_error",
          message: err.error || "Backend could not verify escrow deposit",
          code: err.code,
        } satisfies DepositError;
      }

      setSuccess(true);
      setStatus("DEPOSIT_CONFIRMED");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["escrow", rideId] }),
        queryClient.invalidateQueries({ queryKey: ["rider-ride", rideId] }),
      ]);
      return txHash;
    },
    onError: (error) => {
      setSuccess(false);
      const normalized = normalizeError(error);
      setStatus(normalized.type === "approval_failed" ? "APPROVAL_FAILED" : "DEPOSIT_FAILED");
    },
  });

  useEffect(() => {
    if (!mutation.isPending && !success && !mutation.error) {
      setStatus(isWalletReady ? "READY_TO_DEPOSIT" : "WALLET_NOT_CONNECTED");
    }
  }, [isWalletReady, mutation.error, mutation.isPending, success]);

  const error = useMemo(() => {
    if (!mutation.error) return null;
    if (typeof mutation.error === "object" && mutation.error && "type" in mutation.error) {
      return mutation.error as DepositError;
    }
    return normalizeError(mutation.error);
  }, [mutation.error]);

  return {
    deposit: () => mutation.mutate(),
    isLoading: mutation.isPending,
    error,
    success,
    status,
    statusLabel: statusLabels[status],
    walletAddress: account.address,
    isWalletReady,
    approvalHash,
    depositHash,
  };
}
