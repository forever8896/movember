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
            background: "var(--surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.2s",
            flexShrink: 0
          }}>
            ← Back
          </Link>

          <Link href="/donate" style={{
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
            💙 Donate Now
          </Link>
        </div>

        {/* Middle Section - Logo, Title, and Stats */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
          gap: "0.5rem"
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
            fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
            fontWeight: "800",
            background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginTop: "0.5rem",
            marginBottom: "0",
            letterSpacing: "-0.02em",
            textAlign: "center"
          }}>
            🏆 Leaderboard
          </h1>

          {/* Community Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.5rem",
            width: "100%",
            marginTop: "0.5rem"
          }}>
            <div style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              padding: "0.5rem",
              textAlign: "center",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{
                fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
                fontWeight: "700",
                color: "var(--base-blue)",
                marginBottom: "0.15rem"
              }}>
                ${parseFloat(data.stats.total_raised).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div style={{
                fontSize: "0.6rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Total Raised
              </div>
            </div>
            <div style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              padding: "0.5rem",
              textAlign: "center",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{
                fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
                fontWeight: "700",
                color: "var(--base-blue)",
                marginBottom: "0.15rem"
              }}>
                {data.stats.unique_donors}
              </div>
              <div style={{
                fontSize: "0.6rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Donors
              </div>
            </div>
            <div style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              padding: "0.5rem",
              textAlign: "center",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{
                fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
                fontWeight: "700",
                color: "var(--base-blue)",
                marginBottom: "0.15rem"
              }}>
                {data.stats.total_donations}
              </div>
              <div style={{
                fontSize: "0.6rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Donations
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Donor List (Scrollable) */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          height: "40%",
          minHeight: 0
        }}>
          <div style={{
            background: "var(--surface-elevated)",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            boxShadow: "var(--shadow-sm)"
          }}>
            <h2 style={{
              fontSize: "0.9rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
              marginTop: "0",
              color: "var(--text-primary)",
              textAlign: "center",
              flexShrink: 0
            }}>
              Top Donors
            </h2>

            {data.topDonors.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "2rem 1rem",
                color: "var(--text-secondary)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <p style={{ marginBottom: "1rem" }}>No donations yet. Be the first to donate!</p>
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                overflowY: "auto",
                overflowX: "hidden",
                flex: 1,
                minHeight: 0,
                paddingRight: "0.25rem"
              }}>
                {data.topDonors.map((donor, index) => (
                  <div key={donor.fid} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    padding: "0.5rem 0.65rem",
                    flexShrink: 0,
                    transition: "all 0.2s"
                  }}>
                    <div style={{
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      minWidth: "2rem",
                      textAlign: "center"
                    }}>
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                      {index > 2 && `#${index + 1}`}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        color: "var(--text-primary)",
                        marginBottom: "0.1rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {donor.display_name || donor.username || `User ${donor.fid.slice(0, 6)}`}
                      </div>
                      <div style={{
                        fontSize: "0.7rem",
                        color: "var(--text-secondary)"
                      }}>
                        {donor.donation_count} {parseInt(donor.donation_count) === 1 ? "donation" : "donations"}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "1rem",
                      fontWeight: "700",
                      color: "var(--base-blue)",
                      flexShrink: 0
                    }}>
                      ${parseFloat(donor.total_donated).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Button */}
            <Link href="/donate" style={{
              display: "block",
              padding: "0.75rem",
              background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "700",
              fontSize: "0.9rem",
              textAlign: "center",
              transition: "all 0.2s",
              boxShadow: "0 2px 12px rgba(0, 0, 255, 0.4)",
              marginTop: "0.75rem",
              flexShrink: 0
            }}>
              💙 Support Men&apos;s Health
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
