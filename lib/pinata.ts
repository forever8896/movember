/**
 * Pinata IPFS upload service
 * Uploads images and NFT metadata to IPFS
 */

import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Build IPFS gateway URL with optional gateway key
 */
function buildGatewayUrl(cid: string): string {
  const gateway = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
  const gatewayKey = process.env.PINATA_GATEWAY_KEY;

  const baseUrl = `https://${gateway}/ipfs/${cid}`;

  // Add gateway key as query parameter if configured
  if (gatewayKey) {
    return `${baseUrl}?pinataGatewayToken=${gatewayKey}`;
  }

  return baseUrl;
}

/**
 * Upload an image to IPFS via Pinata
 */
export async function uploadImageToIPFS(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    const file = new File([imageBuffer], filename, { type: "image/png" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upload = await (pinata.upload as any).file(file);

    // Return the IPFS gateway URL with auth
    return buildGatewayUrl(upload.cid);
  } catch (error) {
    console.error("Pinata image upload error:", error);
    throw new Error("Failed to upload image to IPFS");
  }
}

/**
 * Upload NFT metadata to IPFS via Pinata
 */
export async function uploadMetadataToIPFS(
  metadata: NFTMetadata
): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upload = await (pinata.upload as any).json(metadata);

    // Return the IPFS gateway URL with auth
    return buildGatewayUrl(upload.cid);
  } catch (error) {
    console.error("Pinata metadata upload error:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
}

/**
 * Create NFT metadata for a Movember day
 */
export function createNFTMetadata(
  day: number,
  imageUrl: string,
  fid: string
): NFTMetadata {
  return {
    name: `Movember Day ${day} - 2025`,
    description: `Participated in Base Movember on Day ${day}. Growing a mustache and supporting men's health research through the Movember Foundation.`,
    image: imageUrl,
    external_url: `https://movember.com`,
    attributes: [
      {
        trait_type: "Day",
        value: day,
      },
      {
        trait_type: "Month",
        value: "November",
      },
      {
        trait_type: "Year",
        value: 2025,
      },
      {
        trait_type: "Campaign",
        value: "Base Movember",
      },
      {
        trait_type: "Participant FID",
        value: fid,
      },
      {
        trait_type: "Style",
        value: "Hand-Drawn AI Art",
      },
    ],
  };
}

/**
 * Create completion NFT metadata for finishing all 30 days
 */
export function createCompletionNFTMetadata(
  imageUrl: string,
  fid: string
): NFTMetadata {
  return {
    name: "Movember 2025 - 30 Day Completion",
    description: "Completed the full 30-day Base Movember challenge! Posted daily mustache photos and supported men's health throughout November 2025. This exclusive NFT commemorates dedication to the cause.",
    image: imageUrl,
    external_url: "https://movember.com",
    attributes: [
      {
        trait_type: "Achievement",
        value: "30 Day Completion",
      },
      {
        trait_type: "Year",
        value: 2025,
      },
      {
        trait_type: "Campaign",
        value: "Base Movember",
      },
      {
        trait_type: "Participant FID",
        value: fid,
      },
      {
        trait_type: "Rarity",
        value: "Legendary",
      },
    ],
  };
}
