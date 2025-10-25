import type { MiniAppManifest } from '@coinbase/onchainkit/minikit';

const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * Extended MiniApp manifest type that includes Base Builder configuration
 */
export type ExtendedMiniAppManifest = MiniAppManifest & {
  baseBuilder?: {
    ownerAddress: string;
  };
};

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig: ExtendedMiniAppManifest = {
  accountAssociation: {
    header: "eyJmaWQiOjE0MDMzMDksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg1NmQwYTE1QkI3N0RmOTFiMzI1MTU2MDM0NzE4Zjk3QzljZmExMDUyIn0",
    payload: "eyJkb21haW4iOiJtb3ZlbWJlci1saW1lLnZlcmNlbC5hcHAifQ",
    signature: "2/EcuBN2OAT0GACyhLPAjn9KcwlrlZMndNEryKuC9Q97afJNQ1JSBqx8k5/r4xvMP53MkgXV/rrNmpV5x1kD9Bs="
  },
  miniapp: {
    version: "1",
    name: "Base Movember",
    subtitle: "Grow a Mo, Save a Bro",
    description: "Snap your mustache daily, share with friends, and earn NFTs for mens health. Complete all 30 days to earn the exclusive Movember 2025 NFT.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["movember", "charity", "nft", "health", "community"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Grow a Mo, Save a Bro",
    ogTitle: "Base Movember",
    ogDescription: "Join the movement: snap your mustache daily, earn NFTs, and support men's health with Base Movember",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
  baseBuilder: {
    ownerAddress: "0xa3B28D256550c0a512F77a5f8CD4527CC3538408"
  }
};

