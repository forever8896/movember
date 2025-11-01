"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DonationSwapper } from "@/components/DonationSwapper";
import { getMovemberOrg } from "@/lib/endaoment-requests";
import { NdaoApiOrg } from "@/lib/endaoment-constants";
import Loading from "@/components/Loading";
import styles from "./donate.module.css";

export default function DonatePage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const router = useRouter();
  const [org, setOrg] = useState<NdaoApiOrg | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Fetch Movember org data
  useEffect(() => {
    getMovemberOrg()
      .then((data) => {
        setOrg(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading org:", err);
        setError("Failed to load organization data");
        setIsLoading(false);
      });
  }, []);

  const handleDonationSuccess = (hash: string, amount: number, chainId: number) => {
    // Redirect to success page with donation details
    router.push(
      `/success?type=donation&amount=${amount}&hash=${hash}&chainId=${chainId}`
    );
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Loading message="Loading donation page..." />
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || "Failed to load organization"}</p>
              <Link href="/" className="text-blue-600 underline">
                Go back home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{
      height: "100dvh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "0.5rem",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%"
      }}>
        {/* Top Navigation Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem",
          flexShrink: 0,
          gap: "1rem"
        }}>
          <Link href="/" style={{
            padding: "0.4rem 0.6rem",
            background: "rgba(0, 0, 255, 0.1)",
            color: "#0000ff",
            border: "1px solid rgba(0, 0, 255, 0.3)",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.2s",
            flexShrink: 0
          }}>
            ← Back
          </Link>

          <Link href="/leaderboard" style={{
            padding: "0.4rem 0.8rem",
            background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
            fontWeight: "700",
            textDecoration: "none",
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(0, 0, 255, 0.25)",
            flexShrink: 0
          }}>
            🏆 Leaderboard
          </Link>
        </div>

        {/* Logo Section - takes up middle space */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0
        }}>
          <Image
            src="/logo.png"
            alt="Based Movember"
            width={100}
            height={100}
            priority
            style={{ maxHeight: "15vh", width: "auto", height: "auto" }}
          />
          <h1 style={{
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            fontWeight: "800",
            background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginTop: "1rem",
            marginBottom: "0",
            letterSpacing: "-0.02em"
          }}>
            Donate
          </h1>
        </div>

        {/* Donation Section - bottom third */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          paddingBottom: "0.5rem"
        }}>
          <div style={{
            background: "var(--surface-elevated)",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)"
          }}>
            <DonationSwapper org={org} onSuccess={handleDonationSuccess} />
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center",
            marginTop: "0.5rem"
          }}>
            <a
              href="https://endaoment.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Image
                src="/endaoment-powered-by--horizontal.svg"
                alt="Powered by Endaoment"
                width={180}
                height={32}
                style={{ opacity: 0.8 }}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
