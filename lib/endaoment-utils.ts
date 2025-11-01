import { Address, stringToHex } from "viem";

// Determine how many units of ETH are needed to donate a specific amount of USD
export const priceToEthAmount = (dollars: number, price: number) => {
  return dollars / price;
};

export const isEin = (einOrId: string): boolean => {
  const clean = einOrId.replace(/[^0-9]/g, "");
  return clean.length === 9;
};

export const getOnchainOrgId = (einOrId: string): Address =>
  isEin(einOrId)
    ? stringToHex(normalizeEin(einOrId), { size: 32 })
    : encodeUuidForContracts(einOrId);

const encodeUuidForContracts = (id: string): Address =>
  `0x${id.replace(/-/g, "").padEnd(64, "0")}`;

export const normalizeEin = (ein = ""): string => ein.replace(/\D/gi, "");
