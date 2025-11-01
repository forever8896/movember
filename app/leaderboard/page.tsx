"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Link from "next/link";
import Image from "next/image";
import Loading from "@/components/Loading";
import styles from "./leaderboard.module.css";

interface Donor {
  fid: string;
  display_name?: string;
  username?: string;
  total_donated: string;
  donation_count: string;
  last_donation: string;
}

interface LeaderboardData {
  topDonors: Donor[];
  stats: {
    total_donations: string;
    unique_donors: string;
    total_raised: string;
  };
}

export default function LeaderboardPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          return;
        }
        setData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading leaderboard:", err);
        setError("Failed to load leaderboard");
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Loading message="Loading leaderboard..." />
        </div>
      </div>
    );
  }

  if (error || !data || !data.stats || !data.topDonors) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || "Failed to load leaderboard"}</p>
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

          <h1 className={styles.title}>Donation Leaderboard</h1>

          <p className={styles.subtitle}>
            Thank you to our incredible donors supporting men&apos;s health! 💙
          </p>
        </div>

        {/* Community Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${parseFloat(data.stats.total_raised).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className={styles.statLabel}>Total Raised</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.stats.unique_donors}</div>
            <div className={styles.statLabel}>Unique Donors</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.stats.total_donations}</div>
            <div className={styles.statLabel}>Total Donations</div>
          </div>
        </div>

        {/* Top Donors List */}
        <div className={styles.leaderboardSection}>
          <h2 className={styles.sectionTitle}>Top Donors</h2>

          {data.topDonors.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No donations yet. Be the first to donate!</p>
              <Link href="/donate" className={styles.donateButton}>
                Donate Now
              </Link>
            </div>
          ) : (
            <div className={styles.donorsList}>
              {data.topDonors.map((donor, index) => (
                <div key={donor.fid} className={styles.donorCard}>
                  <div className={styles.donorRank}>
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div className={styles.donorInfo}>
                    <div className={styles.donorName}>
                      {donor.display_name || donor.username || `User ${donor.fid.slice(0, 6)}`}
                    </div>
                    <div className={styles.donorStats}>
                      {donor.donation_count} {parseInt(donor.donation_count) === 1 ? "donation" : "donations"}
                    </div>
                  </div>
                  <div className={styles.donorAmount}>
                    ${parseFloat(donor.total_donated).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className={styles.ctaSection}>
          <Link href="/donate" className={styles.donateButtonLarge}>
            💙 Support Men&apos;s Health
          </Link>
        </div>
      </div>
    </div>
  );
}
