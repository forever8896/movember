"use client";
import { useState, useEffect, useRef } from "react";
import { useQuickAuth, useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import Image from "next/image";
import Link from "next/link";
import {
  getMovemberStatus,
  getShareText,
  getMovemberDonationLink,
  isEarlyBird,
  getDaysUntilMovember,
  getEarlyBirdShareText,
} from "../lib/movember";
import styles from "./page.module.css";

interface AuthResponse {
  success: boolean;
  user?: {
    fid: number;
    issuedAt?: number;
    expiresAt?: number;
  };
  message?: string;
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

  const { data: authData, isLoading: isAuthLoading } = useQuickAuth<AuthResponse>(
    "/api/auth",
    { method: "GET" }
  );

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
      if (!authData?.user?.fid) {
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
            fid: authData.user.fid,
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

      if (!authData?.user?.fid) {
        throw new Error("Authentication required. Please reload the app.");
      }

      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("day", movemberStatus.currentDay.toString());
      formData.append("fid", authData.user.fid.toString());
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

      setUploadStatus("Sharing to Farcaster...");

      const shareText = getShareText(movemberStatus.currentDay);
      const donationLink = getMovemberDonationLink();

      const result = await sdk.actions.composeCast({
        text: `${shareText}\n\nSupport men's health: ${donationLink}`,
        embeds: [imageUrl],
      });

      if (result?.cast) {
        setSuccess(`Day ${movemberStatus.currentDay} posted! View your gallery to see progress.`);

        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: authData?.user?.fid,
            day: movemberStatus.currentDay,
            castHash: result.cast.hash,
            imageUrl,
          }),
        });

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
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.card}>
            <Image
              src="/logo.png"
              alt="Based Movember"
              width={80}
              height={80}
              className={styles.logo}
            />

            <h1 className={styles.title}>Based Movember</h1>

            <div className={styles.badge}>Early Bird</div>

            <p className={styles.subtitle}>
              Hey {context?.user?.displayName || "there"}!
            </p>

            <div className={styles.countdown}>
              <div className={styles.countdownNumber}>{daysUntil}</div>
              <div className={styles.countdownLabel}>Days Until Movember</div>
            </div>

            <p className={styles.subtitle}>
              Commit early and earn your exclusive Early Bird NFT
            </p>

            <div className={styles.form}>
              <input
                type="text"
                placeholder="Tag a friend (optional)"
                value={taggedFriend}
                onChange={(e) => setTaggedFriend(e.target.value)}
                className={styles.input}
              />

              {error && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.success}>{success}</p>}

              <button
                type="button"
                onClick={handleEarlyBirdCommitment}
                disabled={uploading || isAuthLoading}
                className={styles.button}
              >
                {uploading ? "Posting..." : "I'm In! Share Commitment"}
              </button>

              <div className={styles.buttonGroup}>
                <Link href="/gallery" className={styles.secondaryButton}>
                  📸 View Gallery
                </Link>
                <Link href="/donate" className={styles.secondaryButton}>
                  💙 Donate
                </Link>
              </div>

              <p className={styles.helperText}>
                Share your commitment and be recognized as an Early Bird
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // November Mode
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <Image
            src="/logo.png"
            alt="Based Movember"
            width={80}
            height={80}
            className={styles.logo}
          />

          <h1 className={styles.title}>Based Movember</h1>

          <p className={styles.subtitle}>
            Hey {context?.user?.displayName || "there"}!
          </p>

          <p className={styles.dayCounter}>
            Day {movemberStatus.currentDay} of 30
          </p>

          <p className={styles.subtitle}>
            Snap your mustache and share to support mens health
          </p>

          <div className={styles.form}>
            {selectedImage ? (
              <div className={styles.imagePreview}>
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
              <div className={styles.uploadArea}>
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
                  <span>Snap or Upload Photo</span>
                </label>
              </div>
            )}

            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
            {uploadStatus && <p className={styles.status}>{uploadStatus}</p>}

            <button
              type="button"
              onClick={handleShare}
              disabled={!imageFile || uploading || isAuthLoading}
              className={styles.button}
            >
              {uploading ? uploadStatus || "Processing..." : "Share to Feed"}
            </button>

            <div className={styles.buttonGroup}>
              <Link href="/gallery" className={styles.secondaryButton}>
                📸 View Gallery
              </Link>
              <Link href="/donate" className={styles.secondaryButton}>
                💙 Donate
              </Link>
            </div>

            <p className={styles.helperText}>
              Your photo will be shared to Farcaster and saved to your gallery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
