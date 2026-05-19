import {
  createPublicClient,
  decodeEventLog,
  getAddress,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { baseSepolia } from "viem/chains";
import { rideEscrowAbi } from "@shared/escrow";
import type { EscrowChainConfig } from "../config/escrow";

export type EscrowVerificationCode =
  | "TX_NOT_FOUND"
  | "TX_REVERTED"
  | "WRONG_CHAIN"
  | "WRONG_CONTRACT"
  | "WRONG_RIDER"
  | "WRONG_RIDE_ID"
  | "WRONG_TOKEN"
  | "WRONG_AMOUNT"
  | "MISSING_DEPOSIT_EVENT";

export class EscrowVerificationError extends Error {
  constructor(
    public readonly code: EscrowVerificationCode,
    message: string
  ) {
    super(message);
    this.name = "EscrowVerificationError";
  }
}

export interface EscrowVerificationRequest {
  rideId: string;
  rideIdHash: Hex;
  txHash: Hex;
  chainId: number;
  escrowContractAddress: Address;
  usdcTokenAddress: Address;
  riderWallet: Address;
  expectedAmountUnits: bigint;
}

export interface EscrowVerificationResult {
  txHash: Hex;
  chainId: number;
  blockNumber?: bigint;
  riderWallet: Address;
  rideIdHash: Hex;
  amountUnits: bigint;
}

export interface ChainEscrowVerifier {
  verifyDeposit(request: EscrowVerificationRequest): Promise<EscrowVerificationResult>;
}

export class MockEscrowVerifier implements ChainEscrowVerifier {
  constructor(
    private readonly override: Partial<EscrowVerificationResult> & {
      status?: "success" | "reverted";
      tokenAddress?: Address;
    } = {}
  ) {}

  async verifyDeposit(request: EscrowVerificationRequest): Promise<EscrowVerificationResult> {
    if (this.override.status === "reverted") {
      throw new EscrowVerificationError("TX_REVERTED", "Mock transaction reverted");
    }

    const rideIdHash = this.override.rideIdHash ?? request.rideIdHash;
    const riderWallet = this.override.riderWallet ?? request.riderWallet;
    const amountUnits = this.override.amountUnits ?? request.expectedAmountUnits;

    if (rideIdHash.toLowerCase() !== request.rideIdHash.toLowerCase()) {
      throw new EscrowVerificationError("WRONG_RIDE_ID", "Deposit event ride ID does not match");
    }

    if (riderWallet.toLowerCase() !== request.riderWallet.toLowerCase()) {
      throw new EscrowVerificationError("WRONG_RIDER", "Deposit sender does not match rider wallet");
    }

    if (amountUnits !== request.expectedAmountUnits) {
      throw new EscrowVerificationError("WRONG_AMOUNT", "Deposit amount does not match ride fare");
    }

    if (this.override.chainId && this.override.chainId !== request.chainId) {
      throw new EscrowVerificationError("WRONG_CHAIN", "Transaction was confirmed on the wrong chain");
    }

    return {
      txHash: request.txHash,
      chainId: request.chainId,
      blockNumber: this.override.blockNumber ?? BigInt(1),
      riderWallet,
      rideIdHash,
      amountUnits,
    };
  }
}

export class ViemEscrowVerifier implements ChainEscrowVerifier {
  private readonly client;

  constructor(private readonly config: EscrowChainConfig) {
    if (!config.rpcUrl) {
      throw new Error("RPC_URL_BASE_SEPOLIA is required for Viem escrow verification");
    }

    this.client = createPublicClient({
      chain: config.chainId === baseSepolia.id ? baseSepolia : undefined,
      transport: http(config.rpcUrl),
    });
  }

  async verifyDeposit(request: EscrowVerificationRequest): Promise<EscrowVerificationResult> {
    if (request.chainId !== this.config.chainId) {
      throw new EscrowVerificationError("WRONG_CHAIN", "Request chain does not match escrow config");
    }

    const [receipt, tx] = await Promise.all([
      this.client.getTransactionReceipt({ hash: request.txHash }),
      this.client.getTransaction({ hash: request.txHash }),
    ]);

    if (!receipt || !tx) {
      throw new EscrowVerificationError("TX_NOT_FOUND", "Transaction was not found");
    }

    if (receipt.status !== "success") {
      throw new EscrowVerificationError("TX_REVERTED", "Transaction did not succeed");
    }

    if (!tx.to || getAddress(tx.to) !== request.escrowContractAddress) {
      throw new EscrowVerificationError("WRONG_CONTRACT", "Transaction target is not the escrow contract");
    }

    if (getAddress(tx.from) !== request.riderWallet) {
      throw new EscrowVerificationError("WRONG_RIDER", "Transaction sender is not the rider wallet");
    }

    for (const log of receipt.logs) {
      if (!isAddress(log.address) || getAddress(log.address) !== request.escrowContractAddress) {
        continue;
      }

      try {
        const decoded = decodeEventLog({
          abi: rideEscrowAbi,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName !== "Deposited") continue;

        const args = decoded.args;
        const token = getAddress(args.token);
        const rider = getAddress(args.rider);

        if (args.rideId.toLowerCase() !== request.rideIdHash.toLowerCase()) {
          throw new EscrowVerificationError("WRONG_RIDE_ID", "Deposit event ride ID does not match");
        }

        if (rider !== request.riderWallet) {
          throw new EscrowVerificationError("WRONG_RIDER", "Deposit event rider does not match");
        }

        if (token !== request.usdcTokenAddress) {
          throw new EscrowVerificationError("WRONG_TOKEN", "Deposit token does not match configured USDC");
        }

        if (args.amount !== request.expectedAmountUnits) {
          throw new EscrowVerificationError("WRONG_AMOUNT", "Deposit amount does not match ride fare");
        }

        return {
          txHash: request.txHash,
          chainId: request.chainId,
          blockNumber: receipt.blockNumber,
          riderWallet: rider,
          rideIdHash: args.rideId,
          amountUnits: args.amount,
        };
      } catch (error) {
        if (error instanceof EscrowVerificationError) throw error;
      }
    }

    throw new EscrowVerificationError("MISSING_DEPOSIT_EVENT", "No valid escrow deposit event found");
  }
}

export function createEscrowVerifier(config: EscrowChainConfig): ChainEscrowVerifier {
  return config.verifierMode === "viem"
    ? new ViemEscrowVerifier(config)
    : new MockEscrowVerifier();
}
