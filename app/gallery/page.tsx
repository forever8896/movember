"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import Image from "next/image";
import Link from "next/link";
import { getMovemberStatus } from "../../lib/movember";
import Loading from "../../components/Loading";
import styles from "./gallery.module.css";

interface DailyPhoto {
  id: number;
  day: number;
  image_url: string;
  cast_hash?: string;
  created_at: string;
}

interface ProgressData {
  progress: DailyPhoto[];
  daysCompleted: number;
  currentStreak: number;
  longestStreak: number;
  isEarlyBird: boolean;
}

export default function Gallery() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const movemberStatus = getMovemberStatus();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    const fetchProgress = async () => {
      const userFid = context?.user?.fid;

      if (!userFid) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/progress?fid=${userFid}`);
        const data = await response.json();
        setProgressData(data);
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [context]);

  const handleShareProgress = async () => {
    if (!context?.user?.fid) return;

    setSharing(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_URL || "https://movember-lime.vercel.app";
      const journeyUrl = `${appUrl}/journey/${context.user.fid}`;
      const daysCompleted = progressData?.daysCompleted || 0;
      const streak = progressData?.currentStreak || 0;

      const shareText = `Day ${daysCompleted}/30 of my Movember journey! 🥸\n${streak > 1 ? `🔥 ${streak} day streak!` : ''}\n\nSupporting men's health with @basedmovember`;

      await sdk.actions.composeCast({
        text: shareText,
        embeds: [journeyUrl],
      });
    } catch (error) {
      console.error("Failed to share progress:", error);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Loading message="Loading your gallery..." />
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <Link href="/" className={styles.backButton}>
              ← Back to Home
            </Link>
            <Image
              src="/logo.png"
              alt="Based Movember"
              width={100}
              height={100}
              className={styles.logo}
            />
            <h1 className={styles.title}>Gallery</h1>
          </div>
          <div className={styles.error}>
            {!context?.user?.fid
              ? "Authentication required. Please open this in the Farcaster app."
              : "Failed to load gallery. Please try again."}
          </div>
        </div>
      </div>
    );
  }

  const daysCompleted = progressData.daysCompleted;
  const progressPercentage = (daysCompleted / 30) * 100;
  const isComplete = daysCompleted === 30;

  // Create a map for quick photo lookup
  const photoMap = new Map(progressData.progress.map(p => [p.day, p]));

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
            💙 Donate
          </Link>
        </div>

        {/* Middle Section - Stats & Title */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0.5rem",
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
            fontSize: "clamp(1.25rem, 5vw, 1.75rem)",
            fontWeight: "800",
            background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
            letterSpacing: "-0.02em",
            textAlign: "center"
          }}>
            {context?.user?.displayName || "Your"} Journey
          </h1>

          {progressData.isEarlyBird && (
            <div className={styles.earlyBirdBadge}>🐦 Early Bird</div>
          )}

          <div className={styles.statsContainer} style={{ width: "100%" }}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{daysCompleted}/30</div>
              <div className={styles.statLabel}>Days</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>🔥 {progressData.currentStreak}</div>
              <div className={styles.statLabel}>Streak</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>⭐ {progressData.longestStreak}</div>
              <div className={styles.statLabel}>Best</div>
            </div>
          </div>

          <div className={styles.progressBar} style={{ width: "100%" }}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className={styles.progressText} style={{ margin: 0 }}>
            {progressPercentage.toFixed(0)}% Complete
          </p>
        </div>

        {/* Bottom Section - Scrollable Calendar */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          marginTop: "0.5rem"
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
            {isComplete && (
              <div style={{
                background: "linear-gradient(135deg, var(--base-green) 0%, var(--base-lime) 100%)",
                color: "white",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                fontSize: "0.85rem",
                fontWeight: "700",
                marginBottom: "0.75rem",
                textAlign: "center",
                flexShrink: 0
              }}>
                🎉 Completed all 30 days! 🎉
              </div>
            )}

            <div style={{
              overflowY: "auto",
              overflowX: "hidden",
              flex: 1,
              minHeight: 0,
              paddingRight: "0.25rem"
            }}>
              <div className={styles.calendar}>
                {Array.from({ length: 30 }, (_, i) => {
                  const day = i + 1;
                  const photo = photoMap.get(day);
                  const isCompleted = !!photo;
                  const isCurrent = movemberStatus.currentDay === day && movemberStatus.isActive;
                  const isPast = movemberStatus.isActive && movemberStatus.currentDay !== null && movemberStatus.currentDay > day;

                  return (
                    <div
                      key={day}
                      className={`${styles.dayCard} ${
                        isCompleted ? styles.completed :
                        isCurrent ? styles.current :
                        isPast ? styles.missed :
                        styles.future
                      }`}
                      style={{ cursor: isCompleted && photo ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (isCompleted && photo) {
                          setFullscreenImage(photo.image_url);
                        }
                      }}
                    >
                      <div className={styles.dayNumber}>Day {day}</div>

                      {isCompleted && photo ? (
                        <div className={styles.dayContent}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.image_url}
                            alt={`Day ${day}`}
                            className={styles.dayImage}
                          />
                        </div>
                      ) : isCurrent ? (
                        <div className={styles.dayPlaceholder}>
                          <Link href="/" className={styles.postNow}>
                            📸 Post
                          </Link>
                        </div>
                      ) : isPast ? (
                        <div className={styles.dayMissed}>
                          <span>❌</span>
                        </div>
                      ) : (
                        <div className={styles.dayLocked}>
                          <span>🔒</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              marginTop: "0.75rem",
              flexShrink: 0
            }}>
              <button
                onClick={handleShareProgress}
                disabled={sharing}
                style={{
                  padding: "0.75rem",
                  background: sharing ? "var(--gray-30)" : "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 12px rgba(0, 0, 255, 0.4)",
                  cursor: sharing ? "not-allowed" : "pointer"
                }}
              >
                {sharing ? "Sharing..." : "📤 Share"}
              </button>
              <Link href="/leaderboard" style={{
                display: "block",
                padding: "0.75rem",
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                textDecoration: "none",
                borderRadius: "0.5rem",
                fontWeight: "700",
                fontSize: "0.85rem",
                textAlign: "center",
                transition: "all 0.2s"
              }}>
                🏆 Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
          onClick={() => setFullscreenImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />
          <button
            onClick={() => setFullscreenImage(null)}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "white",
              border: "none",
              borderRadius: "50%",
              width: "3rem",
              height: "3rem",
              fontSize: "1.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
