const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "Base Movember",
    subtitle: "Grow a Mo, Save a Bro",
    description: "Join Base Movember - snap your mustache daily, share with friends, earn NFTs, and donate to men's health. Complete all 30 days to earn the exclusive Movember 2025 NFT.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["movember", "charity", "nft", "health", "community", "mustache"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Snap, Share, Support - Earn NFTs for Men's Health",
    ogTitle: "Base Movember - Grow a Mo, Save a Bro",
    ogDescription: "Join the movement: snap your mustache daily, earn NFTs, and support men's health with Base Movember",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;

