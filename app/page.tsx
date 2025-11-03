"use client";
import { useState, useEffect, useRef } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import Image from "next/image";
import Link from "next/link";
import {
  getMovemberStatus,
  getShareText,
  isEarlyBird,
  getDaysUntilMovember,
  getEarlyBirdShareText,
} from "../lib/movember";
import styles from "./page.module.css";

interface DailyPhoto {
  id: number;
  day: number;
  image_url: string;
  cast_hash?: string;
  created_at: string;
}

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [taggedFriend, setTaggedFriend] = useState("");
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const movemberStatus = getMovemberStatus();
  const earlyBird = isEarlyBird();
  const daysUntil = getDaysUntilMovember();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Check if user has already posted today
  useEffect(() => {
    const checkTodayStatus = async () => {
      if (!context?.user?.fid || !movemberStatus.currentDay || !movemberStatus.isActive) {
        setCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`/api/progress?fid=${context.user.fid}`);
        const data = await response.json();

        if (data.progress) {
          const todayPhoto = data.progress.find((p: DailyPhoto) => p.day === movemberStatus.currentDay);
          setHasPostedToday(!!todayPhoto);
        }
      } catch (error) {
        console.error("Failed to check today's status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkTodayStatus();
  }, [context?.user?.fid, movemberStatus.currentDay, movemberStatus.isActive]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError("");
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEarlyBirdCommitment = async () => {
    setUploading(true);
    setError("");

    try {
      if (!context?.user?.fid) {
        throw new Error("Authentication required. Please reload the app.");
      }

      const shareText = getEarlyBirdShareText(taggedFriend);
      const appUrl = process.env.NEXT_PUBLIC_URL || "https://movember-lime.vercel.app";

      const result = await sdk.actions.composeCast({
        text: shareText,
        embeds: [appUrl],
      });

      if (result?.cast) {
        setSuccess("Commitment posted! You're an early bird 🐦");

        // Save early bird commitment
        await fetch("/api/early-bird", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: context.user.fid,
            castHash: result.cast.hash,
            taggedFriend,
            displayName: context?.user?.displayName,
            username: context?.user?.username,
          }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post commitment");
      console.error("Early bird error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async () => {
    if (!imageFile) {
      setError("Please select a photo first");
      return;
    }

    if (!movemberStatus.currentDay) {
      setError("Movember is not active right now");
      return;
    }

    setUploading(true);
    setError("");
    setUploadStatus("Uploading your photo...");

    try {
      // Validate we have required data
      if (!movemberStatus.currentDay) {
        throw new Error("Movember is not currently active");
      }

      if (!context?.user?.fid) {
        throw new Error("Authentication required. Please reload the app.");
      }

      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("day", movemberStatus.currentDay.toString());
      formData.append("fid", context.user.fid.toString());
      formData.append("displayName", context?.user?.displayName || "");
      formData.append("username", context?.user?.username || "");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const { imageUrl } = await uploadResponse.json();

      setUploadStatus("Sharing...");

      const shareText = getShareText(movemberStatus.currentDay);
      const appUrl = process.env.NEXT_PUBLIC_URL || "https://movember-lime.vercel.app";
      const sharePageUrl = `${appUrl}/share/${context.user.fid}/${movemberStatus.currentDay}`;

      const result = await sdk.actions.composeCast({
        text: shareText,
        embeds: [sharePageUrl],
      });

      if (result?.cast) {
        setSuccess(`Day ${movemberStatus.currentDay} posted! View your gallery to see progress.`);

        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: context.user.fid,
            day: movemberStatus.currentDay,
            castHash: result.cast.hash,
            imageUrl,
          }),
        });

        // Update state to show "Already Posted" message
        setHasPostedToday(true);
        setSelectedImage(null);
        setImageFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share post");
      console.error("Share error:", err);
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  // Early Bird Mode
  if (earlyBird) {
    return (
      <div className={styles.container} style={{
        minHeight: "100dvh",
        height: "auto",
        overflow: "auto",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{
          minHeight: "100%",
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
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "0.5rem",
            flexShrink: 0
          }}>
            <button
              onClick={() => setShowAbout(true)}
              style={{
                padding: "0.4rem 0.8rem",
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0
              }}
            >
              About
            </button>
          </div>

          {/* Top Section - Logo & Title */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0.5rem",
            flexShrink: 0
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
              fontSize: "clamp(1.75rem, 6vw, 2.5rem)",
              fontWeight: "800",
              background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginTop: "0.5rem",
              marginBottom: "0.25rem",
              letterSpacing: "-0.02em",
              textAlign: "center"
            }}>
              Based Movember
            </h1>
            <div className={styles.badge}>Early Bird 🐦</div>
          </div>

          {/* Middle Section - Info & Countdown */}
          <div style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem 0.5rem",
            minHeight: 0,
            gap: "1rem"
          }}>
            <div className={styles.countdown}>
              <div className={styles.countdownNumber}>{daysUntil}</div>
              <div className={styles.countdownLabel}>Days Until Movember</div>
            </div>

            <div style={{
              background: "var(--surface-elevated)",
              borderRadius: "0.75rem",
              padding: "1rem",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              textAlign: "center",
              maxWidth: "100%"
            }}>
              <p style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: "1.5",
                margin: 0
              }}>
                Join the movement early! Commit to growing a mustache for Movember and raise awareness for men&apos;s health.
              </p>
            </div>
          </div>

          {/* Bottom Section - Actions */}
          <div style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            paddingBottom: "0.5rem"
          }}>
            <div style={{
              background: "var(--surface-elevated)",
              borderRadius: "0.75rem",
              padding: "0.75rem",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)"
            }}>
              <input
                type="text"
                placeholder="Tag a friend (optional)"
                value={taggedFriend}
                onChange={(e) => setTaggedFriend(e.target.value)}
                className={styles.input}
                style={{ marginBottom: "0.75rem" }}
              />

              {error && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.success}>{success}</p>}

              <button
                type="button"
                onClick={handleEarlyBirdCommitment}
                disabled={uploading || !context?.user?.fid}
                className={styles.button}
                style={{ width: "100%", marginBottom: "0.75rem" }}
              >
                {uploading ? "Posting..." : "I'm In! Share Commitment"}
              </button>

              <div className={styles.buttonGroup}>
                <Link href="/gallery" className={styles.secondaryButton}>
                  📸 Gallery
                </Link>
                <Link href="/donate" className={styles.secondaryButton}>
                  💙 Donate
                </Link>
                <Link href="/leaderboard" className={styles.secondaryButton}>
                  🏆 Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* About Modal */}
        {showAbout && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem"
            }}
            onClick={() => setShowAbout(false)}
          >
            <div
              style={{
                background: "var(--surface-elevated)",
                borderRadius: "1rem",
                padding: "1.5rem",
                maxWidth: "500px",
                width: "100%",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem"
              }}>
                <h2 style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  margin: 0
                }}>
                  About Based Movember
                </h2>
                <button
                  onClick={() => setShowAbout(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    padding: "0.25rem",
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                lineHeight: "1.6"
              }}>
                <p style={{ marginTop: 0 }}>
                  Based Movember is a Farcaster mini-app that helps you participate in Movember, the global movement for men&apos;s health.
                </p>

                <p>
                  <strong>How it works:</strong>
                </p>
                <ul style={{ marginLeft: "1.25rem", marginBottom: "1rem" }}>
                  <li>Post daily selfies documenting your mustache growth</li>
                  <li>Track your 30-day journey</li>
                  <li>Compete on the leaderboard</li>
                  <li>Support men&apos;s health through donations</li>
                </ul>

                <p>
                  All donations are processed securely through{" "}
                  <a
                    href="https://endaoment.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--base-blue)",
                      textDecoration: "underline",
                      fontWeight: "600"
                    }}
                  >
                    Endaoment
                  </a>
                  , a nonprofit that enables crypto donations to charitable causes.
                </p>

                <p style={{ marginBottom: 0 }}>
                  This app is open source! Check out the code on{" "}
                  <a
                    href="https://github.com/forever8896/movember/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--base-blue)",
                      textDecoration: "underline",
                      fontWeight: "600"
                    }}
                  >
                    GitHub
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // November Mode
  return (
    <div className={styles.container} style={{
      minHeight: "100dvh",
      height: "auto",
      overflow: "auto",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        minHeight: "100%",
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
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0.5rem",
          flexShrink: 0
        }}>
          <button
            onClick={() => setShowAbout(true)}
            style={{
              padding: "0.4rem 0.8rem",
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0
            }}
          >
            About
          </button>
        </div>

        {/* Top Section - Logo & Title */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0.5rem",
          flexShrink: 0
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
            fontSize: "clamp(1.75rem, 6vw, 2.5rem)",
            fontWeight: "800",
            background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginTop: "0.5rem",
            marginBottom: "0.25rem",
            letterSpacing: "-0.02em",
            textAlign: "center"
          }}>
            Based Movember
          </h1>
          <p className={styles.dayCounter} style={{ margin: 0 }}>
            Day {movemberStatus.currentDay} of 30
          </p>
        </div>

        {/* Middle Section - Info */}
        <div style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.5rem",
          minHeight: 0
        }}>
          <div style={{
            background: "var(--surface-elevated)",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            textAlign: "center",
            maxWidth: "100%"
          }}>
            <p style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              lineHeight: "1.4",
              margin: 0
            }}>
              Document your mustache growth daily, compete on the leaderboard, and support men&apos;s health.
            </p>
          </div>
        </div>

        {/* Bottom Section - Actions */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          paddingBottom: "0.5rem"
        }}>
          <div style={{
            background: "var(--surface-elevated)",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)"
          }}>
            {checkingStatus ? (
              <div style={{
                textAlign: "center",
                padding: "2rem",
                color: "var(--text-secondary)"
              }}>
                Checking status...
              </div>
            ) : hasPostedToday ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "1rem",
                marginBottom: "0.75rem"
              }}>
                <span style={{ fontSize: "1.5rem" }}>✅</span>
                <h3 style={{
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  color: "var(--base-green)",
                  margin: 0
                }}>
                  Day {movemberStatus.currentDay ?? 0} Complete!
                </h3>
              </div>
            ) : (
              <>
                {selectedImage ? (
                  <div className={styles.imagePreview} style={{ margin: "0 0 0.75rem 0" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedImage} alt="Selected mustache" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImageFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className={styles.uploadArea} style={{ margin: "0 0 0.75rem 0" }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleImageSelect}
                      className={styles.fileInput}
                      id="photo-input"
                    />
                    <label htmlFor="photo-input" className={styles.uploadLabel}>
                      <span>📸</span>
                      <span>Snap Today&apos;s Photo</span>
                    </label>
                  </div>
                )}

                {error && <p className={styles.error}>{error}</p>}
                {success && <p className={styles.success}>{success}</p>}
                {uploadStatus && <p className={styles.status}>{uploadStatus}</p>}

                <button
                  type="button"
                  onClick={handleShare}
                  disabled={!imageFile || uploading || !context?.user?.fid}
                  className={styles.button}
                  style={{ width: "100%", marginBottom: "0.75rem" }}
                >
                  {uploading ? uploadStatus || "Processing..." : "Share to Feed"}
                </button>
              </>
            )}

            <div className={styles.buttonGroup}>
              <Link href="/gallery" className={styles.secondaryButton}>
                📸 Gallery
              </Link>
              <Link href="/donate" className={styles.secondaryButton}>
                💙 Donate
              </Link>
              <Link href="/leaderboard" className={styles.secondaryButton}>
                🏆 Leaderboard
              </Link>
            </div>
          </div>
        </div>

        {/* About Modal */}
        {showAbout && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem"
            }}
            onClick={() => setShowAbout(false)}
          >
            <div
              style={{
                background: "var(--surface-elevated)",
                borderRadius: "1rem",
                padding: "1.5rem",
                maxWidth: "500px",
                width: "100%",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem"
              }}>
                <h2 style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  margin: 0
                }}>
                  About Based Movember
                </h2>
                <button
                  onClick={() => setShowAbout(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    padding: "0.25rem",
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                lineHeight: "1.6"
              }}>
                <p style={{ marginTop: 0 }}>
                  Based Movember is a Farcaster mini-app that helps you participate in Movember, the global movement for men&apos;s health.
                </p>

                <p>
                  <strong>How it works:</strong>
                </p>
                <ul style={{ marginLeft: "1.25rem", marginBottom: "1rem" }}>
                  <li>Post daily selfies documenting your mustache growth</li>
                  <li>Track your 30-day journey</li>
                  <li>Compete on the leaderboard</li>
                  <li>Support men&apos;s health through donations</li>
                </ul>

                <p>
                  All donations are processed securely through{" "}
                  <a
                    href="https://endaoment.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--base-blue)",
                      textDecoration: "underline",
                      fontWeight: "600"
                    }}
                  >
                    Endaoment
                  </a>
                  , a nonprofit that enables crypto donations to charitable causes.
                </p>

                <p style={{ marginBottom: 0 }}>
                  This app is open source! Check out the code on{" "}
                  <a
                    href="https://github.com/forever8896/movember/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--base-blue)",
                      textDecoration: "underline",
                      fontWeight: "600"
                    }}
                  >
                    GitHub
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
