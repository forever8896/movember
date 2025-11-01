/**
 * Farcaster Mini App embed utilities
 * Creates rich embed cards for Farcaster posts
 */

export interface FarcasterMiniappMetadata {
  version: "next";
  imageUrl: string;
  button: {
    title: string;
    action: {
      type: "launch_frame";
      name: string;
      url: string;
      splashImageUrl: string;
      splashBackgroundColor: string;
    };
  };
}

/**
 * Generate Farcaster Mini App metadata for embeds
 * This creates the "button" on embedded links in Farcaster
 */
export function getFarcasterMiniappMetadata({
  imageUrl,
  buttonTitle,
  url,
}: {
  imageUrl: string;
  buttonTitle: string;
  url: string;
}): FarcasterMiniappMetadata {
  return {
    version: "next",
    imageUrl,
    button: {
      title: buttonTitle,
      action: {
        type: "launch_frame",
        name: process.env.NEXT_PUBLIC_PROJECT_NAME || "Based Movember",
        url,
        splashImageUrl: `${process.env.NEXT_PUBLIC_URL}/logo.png`,
        splashBackgroundColor: "#ffffff",
      },
    },
  };
}
