import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getFarcasterMiniappMetadata } from "@/lib/farcaster";
import { getUserPhotos } from "@/lib/db";
import { notFound } from "next/navigation";

type SharePageParams = {
  fid: string;
  day: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<SharePageParams>;
}): Promise<Metadata> {
  const { fid, day } = await params;
  const dayNum = parseInt(day, 10);

  // Get the photo for this specific day
  const photos = await getUserPhotos(fid);
  const photo = photos.find((p) => p.day === dayNum);

  const imageUrl = photo?.image_url || `${process.env.NEXT_PUBLIC_URL}/blue-hero.png`;
  const title = `Day ${day} - Based Movember`;
  const description = `Check out this Movember progress and support men's health!`;
  const donateUrl = `${process.env.NEXT_PUBLIC_URL}/donate`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
    },
    other: {
      "fc:frame": JSON.stringify(
        getFarcasterMiniappMetadata({
          imageUrl,
          buttonTitle: "Donate Now",
          url: donateUrl,
        })
      ),
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<SharePageParams>;
}) {
  const { fid, day } = await params;
  const dayNum = parseInt(day, 10);

  // Get the photo for this specific day
  const photos = await getUserPhotos(fid);
  const photo = photos.find((p) => p.day === dayNum);

  if (!photo) {
    notFound();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      backgroundColor: "#000000",
      color: "#ffffff"
    }}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        textAlign: "center"
      }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          background: "linear-gradient(135deg, #0000ff 0%, #0052ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Day {day} - Based Movember
        </h1>

        <p style={{
          fontSize: "1.125rem",
          marginBottom: "2rem",
          color: "#a0a0a0"
        }}>
          Growing a mustache for men&apos;s health 💙
        </p>

        <div style={{
          borderRadius: "1rem",
          overflow: "hidden",
          marginBottom: "2rem",
          border: "2px solid #0000ff",
          boxShadow: "0 0 30px rgba(0, 0, 255, 0.3)"
        }}>
          <Image
            src={photo.image_url}
            alt={`Day ${day} mustache progress`}
            width={600}
            height={600}
            style={{
              width: "100%",
              height: "auto",
              display: "block"
            }}
            priority
          />
        </div>

        <div style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <Link
            href="/donate"
            style={{
              padding: "1rem 2rem",
              backgroundColor: "#0000ff",
              color: "white",
              borderRadius: "0.5rem",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.2s",
              border: "2px solid #0000ff"
            }}
          >
            💙 Donate Now
          </Link>

          <Link
            href="/"
            style={{
              padding: "1rem 2rem",
              backgroundColor: "transparent",
              color: "#0000ff",
              borderRadius: "0.5rem",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.2s",
              border: "2px solid #0000ff"
            }}
          >
            Join Challenge
          </Link>
        </div>

        <p style={{
          marginTop: "2rem",
          fontSize: "0.875rem",
          color: "#666"
        }}>
          Help fight prostate cancer, testicular cancer, and mental health issues
        </p>
      </div>
    </div>
  );
}
