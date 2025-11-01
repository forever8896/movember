import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donation Leaderboard | Base Movember",
  description: "See the top donors supporting men's health through Base Movember. Join the leaderboard by donating to Movember USA.",
  openGraph: {
    title: "Donation Leaderboard | Base Movember",
    description: "Top donors supporting men's health through Base Movember",
    images: [`${process.env.NEXT_PUBLIC_URL}/blue-hero.png`],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${process.env.NEXT_PUBLIC_URL}/blue-hero.png`,
      button: {
        title: "Join Challenge",
        action: {
          type: "launch_frame",
          name: "Base Movember",
          url: process.env.NEXT_PUBLIC_URL || "https://movember-lime.vercel.app",
          splashImageUrl: `${process.env.NEXT_PUBLIC_URL}/logo.png`,
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
