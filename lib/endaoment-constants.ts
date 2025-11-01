import { Address } from "viem";
import { base, mainnet, optimism } from "viem/chains";

// Movember USA on Endaoment
export const MOVEMBER_EIN = "770714052";
export const MOVEMBER_ENDAOMENT_ID = "b6499340-8a69-4c78-8ebe-0bb6117aa544";

export const ENDAOMENT_API_URL = "https://api.endaoment.org";

export const SUPPORTED_CHAIN_IDS = [base.id, optimism.id, mainnet.id] as const;

export const ORG_FUND_FACTORY_CONTRACT_ADDRESS =
  "0x10fD9348136dCea154F752fe0B6dB45Fc298A589";

const UIP_CONTRACT_ADDRESS = "0x8d2a84300d6ce230ed3fffc23dbcdf1e6c781ff0";

export const UIP_PER_CHAIN: Record<
  (typeof SUPPORTED_CHAIN_IDS)[number],
  { id: string; address: Address }
> = {
  [base.id]: {
    id: "4104aeb1-95dd-4bfa-87a3-eb6d61dc5d9c",
    address: UIP_CONTRACT_ADDRESS,
  },
  [optimism.id]: {
    id: "ede62dca-1609-4603-9e79-644b524e7d47",
    address: UIP_CONTRACT_ADDRESS,
  },
  [mainnet.id]: {
    id: "656ddb74-e8dd-4429-a7d6-f731f367e9e6",
    address: UIP_CONTRACT_ADDRESS,
  },
};

export const ETH_PER_CHAIN: Record<
  (typeof SUPPORTED_CHAIN_IDS)[number],
  { tokenId: number; address: Address }
> = {
  [mainnet.id]: {
    tokenId: 8,
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  },
  [base.id]: {
    tokenId: 1026,
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  },
  [optimism.id]: {
    tokenId: 1033,
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  },
};

export const USDC_PER_CHAIN: Record<
  (typeof SUPPORTED_CHAIN_IDS)[number],
  { tokenId: number; address: Address }
> = {
  [mainnet.id]: {
    tokenId: 18,
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  [base.id]: {
    tokenId: 1056,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  [optimism.id]: {
    tokenId: 1034,
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
};

export const ENDAOMENT_ENTITY_ABI = [
  {
    inputs: [
      {
        internalType: "contract ISwapWrapper",
        name: "_swapWrapper",
        type: "address",
      },
      {
        internalType: "address",
        name: "_tokenIn",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountIn",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "swapAndDonate",
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "donate",
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const ENDAOMENT_ORG_FUND_FACTORY_ABI = [
  {
    type: "function",
    inputs: [
      { name: "_orgId", internalType: "bytes32", type: "bytes32" },
      { name: "_amount", internalType: "uint256", type: "uint256" },
    ],
    name: "deployOrgAndDonate",
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "_orgId", internalType: "bytes32", type: "bytes32" },
      {
        name: "_swapWrapper",
        internalType: "contract ISwapWrapper",
        type: "address",
      },
      { name: "_tokenIn", internalType: "address", type: "address" },
      { name: "_amountIn", internalType: "uint256", type: "uint256" },
      { name: "_data", internalType: "bytes", type: "bytes" },
    ],
    name: "deployOrgSwapAndDonate",
    stateMutability: "payable",
  },
];

export const DONATION_DOLLAR_TIERS = [10, 25, 50, 100];

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export type NdaoApiSwapInfo = {
  swapWrapper: Address;
  tokenIn: Address;
  amountIn: string;
  callData: string;
  chainId: number;
};

export type NdaoApiOrg = {
  id: string;
  name: string;
  ein?: string;
  contractAddress?: Address;
  description: string;
  logo: string;
  deployments: {
    chainId: number;
    contractAddress: Address;
  }[];
};
