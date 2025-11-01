"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DonationSwapper } from "@/components/DonationSwapper";
import { getMovemberOrg } from "@/lib/endaoment-requests";
import { NdaoApiOrg } from "@/lib/endaoment-constants";
import styles from "./donate.module.css";

export default function DonatePage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
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
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading donation page...</p>
            </div>
          </div>
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
            width={60}
            height={60}
            className={styles.logo}
          />

          <h1 className={styles.title}>Support Men&apos;s Health</h1>

          <p className={styles.subtitle}>
            Hey {context?.user?.displayName || "there"}! Your donation goes
            directly to Movember Foundation through Endaoment.
          </p>

          <div className={styles.infoBox}>
            <div className={styles.infoItem}>
              <span className={styles.icon}>🏥</span>
              <div>
                <strong>Prostate Cancer</strong>
                <p>Funding research and support</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.icon}>🧠</span>
              <div>
                <strong>Mental Health</strong>
                <p>Breaking the silence</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.icon}>💙</span>
              <div>
                <strong>Testicular Cancer</strong>
                <p>Early detection saves lives</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.donationSection}>
          <div style={{
            background: "var(--surface-elevated)",
            borderRadius: "1rem",
            padding: "2rem",
            border: "2px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              Choose Your Donation Amount
            </h2>
            <DonationSwapper org={org} onSuccess={handleDonationSuccess} />
          </div>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              🔒 Secured by{" "}
              <a
                href="https://endaoment.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Endaoment
              </a>
            </p>
            <p className={styles.footerText}>
              Donations are made on-chain via smart contracts
            </p>
            <p style={{
              fontSize: "0.875rem",
              color: "var(--text-tertiary)",
              marginTop: "0.75rem",
              textAlign: "center",
              lineHeight: "1.6"
            }}>
              💡 You can donate with USDC or ETH. If Movember hasn&apos;t been deployed on your chain yet, it will be automatically deployed with your first donation.
            </p>
            <div style={{
              marginTop: "1.5rem",
              textAlign: "center"
            }}>
              <Link href="/leaderboard" style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                background: "rgba(0, 0, 255, 0.1)",
                color: "#0000ff",
                border: "2px solid rgba(0, 0, 255, 0.3)",
                borderRadius: "0.75rem",
                fontWeight: "600",
                textDecoration: "none",
                transition: "all 0.2s"
              }}>
                🏆 View Donation Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
