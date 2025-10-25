"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import Link from "next/link";
import styles from "./donate.module.css";

export default function DonatePage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

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
            directly to Movember Foundation through The Giving Block.
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
          <div className={styles.networkNotice}>
            <span className={styles.noticeIcon}>💡</span>
            <div>
              <strong>Network Switch Required</strong>
              <p>
                You&apos;ll be prompted to switch from Base to Ethereum mainnet to
                complete your donation. This is normal and secure.
              </p>
            </div>
          </div>

          <div className={styles.embedContainer}>
            {isLoading && (
              <div className={styles.loadingPlaceholder}>
                Loading donation form...
              </div>
            )}

            <iframe
              src="https://thegivingblock.com/donate/movember-usa/"
              title="Donate to Movember via The Giving Block"
              className={styles.donationIframe}
              onLoad={() => setIsLoading(false)}
              allow="payment"
            />
          </div>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              🔒 Secured by{" "}
              <a
                href="https://thegivingblock.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                The Giving Block
              </a>
            </p>
            <p className={styles.footerText}>
              Official donation receipts provided for tax purposes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
