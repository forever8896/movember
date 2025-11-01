"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMovemberStatus } from "@/lib/movember";

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
  displayName?: string;
  username?: string;
}

export default function JourneyPage({ params }: { params: Promise<{ fid: string }> }) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fid, setFid] = useState<string | null>(null);

  const movemberStatus = getMovemberStatus();

  useEffect(() => {
    params.then((resolvedParams) => {
      setFid(resolvedParams.fid);
    });
  }, [params]);

  useEffect(() => {
    if (!fid) return;

    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/progress?fid=${fid}`);
        const data = await response.json();
        setProgressData(data);
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [fid]);

  if (loading) {
    return (
      <div style={{
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)"
      }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading journey...</p>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        padding: "2rem"
      }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Journey not found</p>
        <Link href="/" style={{
          padding: "0.75rem 1.5rem",
          background: "var(--base-blue)",
          color: "white",
          textDecoration: "none",
          borderRadius: "0.5rem",
          fontWeight: "600"
        }}>
          Go Home
        </Link>
      </div>
    );
  }

  const daysCompleted = progressData.daysCompleted;
  const progressPercentage = (daysCompleted / 30) * 100;
  const photoMap = new Map(progressData.progress.map(p => [p.day, p]));

  return (
    <>
      <div style={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)"
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
              ← Home
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
              {progressData.displayName || progressData.username || "User"}&apos;s Journey
            </h1>

            {progressData.isEarlyBird && (
              <div style={{
                display: "inline-block",
                padding: "0.25rem 0.5rem",
                background: "rgba(60, 138, 255, 0.1)",
                border: "1px solid var(--base-cerulean)",
                borderRadius: "12px",
                color: "var(--base-cerulean)",
                fontWeight: "600",
                fontSize: "0.65rem"
              }}>
                🐦 Early Bird
              </div>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.35rem",
              width: "100%"
            }}>
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.5rem 0.35rem",
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "var(--base-blue)",
                  marginBottom: "0"
                }}>
                  {daysCompleted}/30
                </div>
                <div style={{
                  fontSize: "0.6rem",
                  color: "var(--text-secondary)"
                }}>
                  Days
                </div>
              </div>
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.5rem 0.35rem",
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "var(--base-blue)",
                  marginBottom: "0"
                }}>
                  🔥 {progressData.currentStreak}
                </div>
                <div style={{
                  fontSize: "0.6rem",
                  color: "var(--text-secondary)"
                }}>
                  Streak
                </div>
              </div>
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.5rem 0.35rem",
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "var(--base-blue)",
                  marginBottom: "0"
                }}>
                  ⭐ {progressData.longestStreak}
                </div>
                <div style={{
                  fontSize: "0.6rem",
                  color: "var(--text-secondary)"
                }}>
                  Best
                </div>
              </div>
            </div>

            <div style={{
              width: "100%",
              height: "6px",
              background: "var(--surface)",
              borderRadius: "3px",
              marginTop: "0.5rem",
              overflow: "hidden",
              border: "1px solid var(--border)"
            }}>
              <div style={{
                height: "100%",
                background: "linear-gradient(90deg, var(--base-blue), var(--base-cerulean))",
                width: `${progressPercentage}%`,
                transition: "width 0.5s ease",
                borderRadius: "3px"
              }} />
            </div>
            <p style={{
              fontSize: "0.7rem",
              color: "var(--text-secondary)",
              fontWeight: "600",
              margin: 0
            }}>
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
              {daysCompleted === 30 && (
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
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "0.4rem"
                }}>
                  {Array.from({ length: 30 }, (_, i) => {
                    const day = i + 1;
                    const photo = photoMap.get(day);
                    const isCompleted = !!photo;
                    const isCurrent = movemberStatus.currentDay === day && movemberStatus.isActive;
                    const isPast = movemberStatus.isActive && movemberStatus.currentDay !== null && movemberStatus.currentDay > day;

                    return (
                      <div
                        key={day}
                        style={{
                          background: "var(--surface-elevated)",
                          border: `1px solid ${isCompleted ? 'var(--base-green)' : isCurrent ? 'var(--base-blue)' : isPast ? 'var(--base-red)' : 'var(--border)'}`,
                          borderRadius: "8px",
                          padding: "0.3rem",
                          aspectRatio: "1",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          overflow: "hidden",
                          opacity: !isCompleted && !isCurrent && !isPast ? 0.5 : 1,
                          cursor: isCompleted && photo ? "pointer" : "default"
                        }}
                        onClick={() => {
                          if (isCompleted && photo) {
                            setFullscreenImage(photo.image_url);
                          }
                        }}
                      >
                        <div style={{
                          fontSize: "0.55rem",
                          fontWeight: "600",
                          color: "var(--text-secondary)",
                          marginBottom: "0.15rem"
                        }}>
                          Day {day}
                        </div>

                        {isCompleted && photo ? (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.image_url}
                              alt={`Day ${day}`}
                              style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: "8px",
                                objectFit: "cover",
                                flex: 1
                              }}
                            />
                          </div>
                        ) : isCurrent ? (
                          <div style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem"
                          }}>
                            📸
                          </div>
                        ) : isPast ? (
                          <div style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem"
                          }}>
                            <span>❌</span>
                          </div>
                        ) : (
                          <div style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem"
                          }}>
                            <span>🔒</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link href="/" style={{
                display: "block",
                padding: "0.75rem",
                background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
                color: "white",
                textDecoration: "none",
                borderRadius: "0.5rem",
                fontWeight: "700",
                fontSize: "0.85rem",
                textAlign: "center",
                transition: "all 0.2s",
                boxShadow: "0 2px 12px rgba(0, 0, 255, 0.4)",
                marginTop: "0.75rem",
                flexShrink: 0
              }}>
                Start Your Journey
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
    </>
  );
}
