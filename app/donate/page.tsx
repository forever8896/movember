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
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            ← Back
          </Link>

          <Image
            src="/logo.png"
            alt="Based Movember"
            width={35}
            height={35}
            className={styles.logo}
          />

          <h1 className={styles.title}>💙 Donate</h1>
        </div>

        <div className={styles.donationSection}>
          <div style={{
            background: "var(--surface-elevated)",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <DonationSwapper org={org} onSuccess={handleDonationSuccess} />
          </div>

          <div className={styles.footer}>
            <p style={{
              fontSize: "0.7rem",
              color: "var(--text-tertiary)",
              marginBottom: "0.5rem",
              textAlign: "center"
            }}>
              Powered by <a href="https://endaoment.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--base-blue)", textDecoration: "none" }}>Endaoment</a>
            </p>
            <Link href="/leaderboard" style={{
              display: "inline-block",
              padding: "0.5rem 0.75rem",
              background: "rgba(0, 0, 255, 0.1)",
              color: "#0000ff",
              border: "1px solid rgba(0, 0, 255, 0.3)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.2s"
            }}>
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
