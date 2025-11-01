import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donate to Movember | Base Movember",
  description: "Support men's health by donating to Movember USA. Fight prostate cancer, testicular cancer, and mental health issues. Donate with USDC or ETH on-chain via Endaoment.",
  openGraph: {
    title: "Donate to Movember | Base Movember",
    description: "Support men's health by donating to Movember USA through Base Movember",
    images: [`${process.env.NEXT_PUBLIC_URL}/blue-hero.png`],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${process.env.NEXT_PUBLIC_URL}/blue-hero.png`,
      button: {
        title: "Donate Now",
        action: {
          type: "launch_frame",
          name: "Base Movember",
          url: `${process.env.NEXT_PUBLIC_URL}/donate`,
          splashImageUrl: `${process.env.NEXT_PUBLIC_URL}/logo.png`,
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
};

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
