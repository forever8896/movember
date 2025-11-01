"use client";

import { useState, useEffect } from "react";
import { useAuthenticate, useMiniKit } from "@coinbase/onchainkit/minikit";
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

  const movemberStatus = getMovemberStatus();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const { user } = useAuthenticate();

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.fid) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/progress?fid=${user.fid}`);
        const data = await response.json();
        setProgressData(data);
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

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
              width={60}
              height={60}
              className={styles.logo}
            />
            <h1 className={styles.title}>Gallery</h1>
          </div>
          <div className={styles.error}>
            {!user
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
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            ← Back to Home
          </Link>

          <Image
            src="/logo.png"
            alt="Based Movember"
            width={60}
            height={60}
            className={styles.logo}
          />

          <h1 className={styles.title}>
            {context?.user?.displayName || "Your"} Movember Journey
          </h1>

          {progressData.isEarlyBird && (
            <div className={styles.earlyBirdBadge}>🐦 Early Bird</div>
          )}

          <div className={styles.statsContainer}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{daysCompleted}/30</div>
              <div className={styles.statLabel}>Days Complete</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>🔥 {progressData.currentStreak}</div>
              <div className={styles.statLabel}>Current Streak</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>⭐ {progressData.longestStreak}</div>
              <div className={styles.statLabel}>Longest Streak</div>
            </div>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className={styles.progressText}>
            {progressPercentage.toFixed(0)}% Complete
          </p>

          {isComplete && (
            <div className={styles.completionBanner}>
              🎉 Congratulations! You completed all 30 days of Movember! 🎉
            </div>
          )}
        </div>

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
                    <div className={styles.dayDate}>
                      {new Date(photo.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    {photo.cast_hash && (
                      <a
                        href={`https://warpcast.com/~/conversations/${photo.cast_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewCast}
                      >
                        View Cast
                      </a>
                    )}
                  </div>
                ) : isCurrent ? (
                  <div className={styles.dayPlaceholder}>
                    <Link href="/" className={styles.postNow}>
                      📸 Post Now
                    </Link>
                  </div>
                ) : isPast ? (
                  <div className={styles.dayMissed}>
                    <span>❌</span>
                    <span>Missed</span>
                  </div>
                ) : (
                  <div className={styles.dayLocked}>
                    <span>🔒</span>
                    <span>Locked</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {daysCompleted >= 2 && (
          <div className={styles.comparisonSection}>
            <h2>Your Evolution</h2>
            <div className={styles.comparison}>
              <div className={styles.comparisonItem}>
                <h3>Day 1</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoMap.get(1)?.image_url}
                  alt="Day 1"
                  className={styles.comparisonImage}
                />
              </div>
              <div className={styles.comparisonArrow}>→</div>
              <div className={styles.comparisonItem}>
                <h3>Day {daysCompleted}</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoMap.get(daysCompleted)?.image_url}
                  alt={`Day ${daysCompleted}`}
                  className={styles.comparisonImage}
                />
              </div>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <Link href="/donate" className={styles.donateButton}>
            💙 Support Men&apos;s Health
          </Link>
        </div>
      </div>
    </div>
  );
}
