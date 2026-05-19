export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const rideEscrowAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "rideId", type: "bytes32" },
      { name: "driver", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "platformFeeBps", type: "uint256" },
      { name: "token", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "rideId", type: "bytes32", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "rider", type: "address", indexed: true },
      { name: "driver", type: "address", indexed: false },
    ],
    anonymous: false,
  },
] as const;
