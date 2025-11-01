"use client";

import { Suspense } from 'react';
import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { minikitConfig } from "../../minikit.config";
import styles from "./page.module.css";

function SuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type'); // 'donation' or other
  const amount = searchParams.get('amount');
  const hash = searchParams.get('hash');

  const { composeCastAsync } = useComposeCast();

  const handleShare = async () => {
    try {
      let text = "";

      if (type === 'donation' && amount) {
        text = `I just donated $${amount} to Movember USA for men's health! 💙\n\nJoin me in supporting prostate cancer, testicular cancer, and mental health awareness.`;
      } else {
        text = `Just joined ${minikitConfig.miniapp.name}! Growing a Mo, Saving a Bro 💙`;
      }

      const result = await composeCastAsync({
        text: text,
        embeds: [process.env.NEXT_PUBLIC_URL || ""]
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
    }
  };

  const isDonation = type === 'donation';

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.successMessage}>
          <div className={styles.checkmark}>
            <div className={styles.checkmarkCircle}>
              <div className={styles.checkmarkStem}></div>
              <div className={styles.checkmarkKick}></div>
            </div>
          </div>

          <h1 className={styles.title}>
            {isDonation ? '💙 Thank You!' : `Welcome to ${minikitConfig.miniapp.name}!`}
          </h1>

          <p className={styles.subtitle}>
            {isDonation ? (
              <>
                Your ${amount} donation is making a real difference in men&apos;s health!<br />
                {hash && <span className={styles.hashText}>Transaction: {hash.slice(0, 10)}...</span>}
              </>
            ) : (
              <>
                You&apos;re in! Get ready to grow a Mo and save a Bro.<br />
                Snap daily photos and support men&apos;s health.
              </>
            )}
          </p>

          <button onClick={handleShare} className={styles.shareButton}>
            SHARE
          </button>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isDonation && (
              <Link href="/leaderboard" className={styles.secondaryLink}>
                🏆 View Leaderboard
              </Link>
            )}
            <Link href="/" className={styles.secondaryLink}>
              🏠 Go Home
            </Link>
            <Link href="/gallery" className={styles.secondaryLink}>
              📸 View Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.successMessage}>
            <p className={styles.subtitle}>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
