import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Gallery | Base Movember",
  description: "View your 30-day Movember journey. Track your mustache progress, streaks, and support for men's health.",
  openGraph: {
    title: "My Gallery | Base Movember",
    description: "Track your Movember journey and support men's health",
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

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
