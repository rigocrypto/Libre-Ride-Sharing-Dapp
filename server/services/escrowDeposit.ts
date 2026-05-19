import { getAddress, isAddress, keccak256, stringToBytes, type Address, type Hex } from "viem";
import { assertEscrowTransition } from "@shared/escrow";
import type { RideWithDetails } from "@shared/schema";
import type { IStorage } from "../storage";
import {
  getEscrowChainConfig,
  toUsdcUnits,
  type EscrowChainConfig,
} from "../config/escrow";
import {
  createEscrowVerifier,
  EscrowVerificationError,
  type ChainEscrowVerifier,
} from "./escrowVerifier";

export class EscrowDepositError extends Error {
  constructor(
    public readonly code:
      | "RIDE_NOT_FOUND"
      | "NOT_AUTHORIZED"
      | "NO_DRIVER"
      | "DRIVER_WALLET_MISSING"
      | "ESCROW_NOT_CONFIGURED"
      | "DUPLICATE_TX"
      | "INVALID_WALLET"
      | "VERIFICATION_FAILED",
    message: string
  ) {
    super(message);
    this.name = "EscrowDepositError";
  }
}

export interface PreparedEscrowDeposit {
  rideId: string;
  rideIdHash: Hex;
  chainId: number;
  contractAddress: Address | null;
  tokenAddress: Address | null;
  driverAddress: Address;
  riderAddress: Address;
  amount: number;
  amountUnits: string;
  platformFeeBps: number;
  verifierMode: "mock" | "viem";
}

function getRideIdHash(rideId: string): Hex {
  return keccak256(stringToBytes(rideId));
}

function getRiderWallet(userWallet: string | undefined | null): Address {
  if (!userWallet || !isAddress(userWallet)) {
    throw new EscrowDepositError("INVALID_WALLET", "Rider wallet is missing or invalid");
  }

  return getAddress(userWallet);
}

async function ensureRideForRider(
  storage: IStorage,
  rideId: string,
  riderUserId: string
): Promise<RideWithDetails> {
  const ride = await storage.getRide(rideId);
  if (!ride) {
    throw new EscrowDepositError("RIDE_NOT_FOUND", "Ride not found");
  }

  if (ride.riderId !== riderUserId) {
    throw new EscrowDepositError("NOT_AUTHORIZED", "Not authorized for this ride");
  }

  return ride;
}

async function ensureDriverWallet(storage: IStorage, ride: RideWithDetails): Promise<Address> {
  if (!ride.driverId) {
    throw new EscrowDepositError("NO_DRIVER", "Driver has not accepted this ride yet");
  }

  const driver = await storage.getUser(ride.driverId);
  if (!driver?.walletAddress || !isAddress(driver.walletAddress)) {
    throw new EscrowDepositError("DRIVER_WALLET_MISSING", "Driver wallet is missing or invalid");
  }

  return getAddress(driver.walletAddress);
}

export async function prepareEscrowDeposit(params: {
  storage: IStorage;
  rideId: string;
  riderUserId: string;
  riderWallet: string;
  config?: EscrowChainConfig;
}): Promise<PreparedEscrowDeposit> {
  const config = params.config ?? getEscrowChainConfig();
  const ride = await ensureRideForRider(params.storage, params.rideId, params.riderUserId);
  const riderAddress = getRiderWallet(params.riderWallet);
  const driverAddress = await ensureDriverWallet(params.storage, ride);
  const amount = Number((ride as any).estimatedPrice || 0);
  const amountUnits = toUsdcUnits(amount);

  assertEscrowTransition("NO_DEPOSIT", "DEPOSIT_INITIATED");
  assertEscrowTransition("DEPOSIT_INITIATED", "DEPOSIT_PENDING_ONCHAIN");

  await params.storage.updateRide(params.rideId, {
    escrowId: getRideIdHash(params.rideId) as any,
    escrowAddress: config.escrowContractAddress as any,
    escrowStatus: "pending" as any,
    escrowAmount: amount as any,
  });

  return {
    rideId: params.rideId,
    rideIdHash: getRideIdHash(params.rideId),
    chainId: config.chainId,
    contractAddress: config.escrowContractAddress,
    tokenAddress: config.usdcTokenAddress,
    driverAddress,
    riderAddress,
    amount,
    amountUnits: amountUnits.toString(),
    platformFeeBps: config.platformFeeBps,
    verifierMode: config.verifierMode,
  };
}

export async function confirmEscrowDeposit(params: {
  storage: IStorage;
  rideId: string;
  txHash: Hex;
  riderUserId: string;
  riderWallet: string;
  config?: EscrowChainConfig;
  verifier?: ChainEscrowVerifier;
}) {
  const config = params.config ?? getEscrowChainConfig();
  const ride = await ensureRideForRider(params.storage, params.rideId, params.riderUserId);
  const riderAddress = getRiderWallet(params.riderWallet);

  if (!config.escrowContractAddress || !config.usdcTokenAddress) {
    if (config.verifierMode !== "mock") {
      throw new EscrowDepositError("ESCROW_NOT_CONFIGURED", "Escrow contract or USDC token is not configured");
    }
  }

  const allRides = await params.storage.getAllRides();
  const duplicate = allRides.find(
    (candidate) =>
      candidate.id !== params.rideId &&
      (candidate as any).escrowTxHash?.toLowerCase() === params.txHash.toLowerCase()
  );

  if (duplicate) {
    throw new EscrowDepositError("DUPLICATE_TX", "Transaction hash is already tied to another ride");
  }

  const rideIdHash = getRideIdHash(params.rideId);
  const expectedAmountUnits = toUsdcUnits(Number((ride as any).estimatedPrice || 0));
  const verifier = params.verifier ?? createEscrowVerifier(config);

  try {
    assertEscrowTransition("DEPOSIT_PENDING_ONCHAIN", "DEPOSIT_CONFIRMED");

    await verifier.verifyDeposit({
      rideId: params.rideId,
      rideIdHash,
      txHash: params.txHash,
      chainId: config.chainId,
      escrowContractAddress:
        config.escrowContractAddress ?? "0x0000000000000000000000000000000000000001",
      usdcTokenAddress:
        config.usdcTokenAddress ?? "0x0000000000000000000000000000000000000002",
      riderWallet: riderAddress,
      expectedAmountUnits,
    });
  } catch (error) {
    if (error instanceof EscrowVerificationError) {
      throw new EscrowDepositError("VERIFICATION_FAILED", error.message);
    }
    throw error;
  }

  const updated = await params.storage.updateRide(params.rideId, {
    escrowId: rideIdHash as any,
    escrowAddress: config.escrowContractAddress as any,
    escrowTxHash: params.txHash as any,
    escrowStatus: "locked" as any,
    escrowAmount: Number((ride as any).estimatedPrice || 0) as any,
  });

  return {
    ride: updated,
    escrowStatus: "locked" as const,
    txHash: params.txHash,
    rideIdHash,
  };
}
