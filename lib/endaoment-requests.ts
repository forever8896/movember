import { NdaoApiOrg, NdaoApiSwapInfo } from "./endaoment-constants";

// Use relative URLs in browser, absolute in server
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return ''; // Browser: use relative URLs
  }
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }
  return 'http://localhost:3000'; // Dev fallback
};

export const getEthPrice = async (): Promise<number> => {
  const url = `${getBaseUrl()}/api/endaoment/eth-price`;
  return fetch(url, { cache: "no-store" }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
};

export const getMovemberOrg = async (): Promise<NdaoApiOrg> => {
  const url = `${getBaseUrl()}/api/endaoment/org`;
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
};

export const getSwapAndDonateInfo = async ({
  recipientEntityId,
  recipientEntityType,
  inputTokenId,
  chainId,
  amountIn,
}: {
  recipientEntityId: string;
  recipientEntityType: "org" | "fund";
  inputTokenId: number;
  chainId: number;
  amountIn: bigint;
}): Promise<NdaoApiSwapInfo> => {
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}/api/endaoment/swap-info`, baseUrl || window.location.origin);
  url.searchParams.set("recipientEntityId", recipientEntityId);
  url.searchParams.set("recipientEntityType", recipientEntityType);
  url.searchParams.set("inputTokenId", inputTokenId.toString());
  url.searchParams.set("chainId", chainId.toString());
  url.searchParams.set("amountIn", amountIn.toString());
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
};

export const processDonation = async ({
  fid,
  displayName,
  username,
  amount,
  token,
  donorName,
  donationTransactionHash,
  chainId,
}: {
  fid?: string;
  displayName?: string;
  username?: string;
  amount?: number;
  token?: string;
  donorName?: string;
  donationTransactionHash: string;
  chainId: number;
}) => {
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}/api/endaoment/donation`, baseUrl || window.location.origin);

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fid,
      displayName,
      username,
      amount,
      token,
      donorName,
      donationTransactionHash,
      chainId,
    }),
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
};
