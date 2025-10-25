"use client";
import { useState, useEffect, useRef } from "react";
import { useQuickAuth, useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import { getMovemberStatus, getShareText, getMovemberDonationLink } from "../lib/movember";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const movemberStatus = getMovemberStatus();

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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError("");
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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
    setUploadStatus("Transforming your photo with AI...");

    try {
      // Upload image and transform with Gemini
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("day", movemberStatus.currentDay.toString());
      formData.append("fid", authData?.user?.fid.toString() || "");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      setUploadStatus("Uploading to IPFS...");

      const {
        url,
        originalUrl,
        transformedUrl,
        metadataUrl,
      } = await uploadResponse.json();

      // Compose cast with AI-transformed image and donation link
      const shareText = getShareText(movemberStatus.currentDay);
      const donationLink = getMovemberDonationLink();

      const result = await sdk.actions.composeCast({
        text: `${shareText}\n\nAI art powered by Gemini | Support mens health: ${donationLink}`,
        embeds: [url],
      });

      if (result?.cast) {
        setSuccess(`Day ${movemberStatus.currentDay} posted! Your AI art is on-chain.`);

        // Track the post with all metadata
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: authData?.user?.fid,
            day: movemberStatus.currentDay,
            castHash: result.cast.hash,
            originalUrl,
            transformedUrl,
            metadataUrl,
          }),
        });

        // Reset form
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

  // Not November yet
  if (!movemberStatus.isNovember) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.waitlistForm}>
            <h1 className={styles.title}>BASE MOVEMBER</h1>
            <p className={styles.subtitle}>
              Hey {context?.user?.displayName || "there"}!
            </p>
            <p className={styles.subtitle}>
              Movember starts November 1st. Come back then to snap your mustache,
              share daily, and earn NFTs for mens health!
            </p>
            <div className={styles.countdown}>
              <p>Movember begins in November</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.waitlistForm}>
          <h1 className={styles.title}>BASE MOVEMBER</h1>
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
              className={styles.joinButton}
            >
              {uploading ? uploadStatus || "Processing..." : "Share to Feed"}
            </button>

            <p className={styles.helperText}>
              Your photo will be transformed into hand-drawn art with AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
