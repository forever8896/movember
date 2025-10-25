# Based Movember - Development Roadmap

## Project Overview

**Based Movember** is a Base mini app that gamifies Movember participation through daily mustache photos, AI-powered art transformation, NFT rewards, and charitable donations to men's health research.

### Core Features

1. **Early Bird Commitments** (Pre-November)
   - Users commit before November starts
   - Optional friend tagging
   - Early Bird NFT badge reward

2. **Daily Mustache Tracking** (November 1-30)
   - Photo capture and upload
   - AI transformation to hand-drawn art (Gemini API)
   - IPFS storage for images and metadata (Pinata)
   - Daily NFT minting on Base
   - Social sharing to Farcaster

3. **User Gallery & Progress**
   - Personal 30-day mustache journey
   - Calendar view with all submissions
   - NFT collection display
   - Progress tracking toward completion NFT

4. **Donation Integration**
   - Base-native ETH donations
   - Donation pool smart contract
   - Batch bridging to Ethereum mainnet
   - Forward to Movember Foundation
   - Community donation statistics

5. **NFT Rewards**
   - Daily NFTs (Days 1-30)
   - Early Bird NFT (pre-November commitment)
   - Completion NFT (legendary 30/30 days)

---

## Architecture Overview

### Technology Stack

**Frontend:**
- Next.js 15.3.4 (App Router)
- React with TypeScript
- OnchainKit / MiniKit (Coinbase SDK)
- Farcaster Mini App SDK

**Backend:**
- Next.js API Routes
- Vercel Postgres (or similar for persistence)
- Vercel Cron (for daily notifications)

**Blockchain:**
- Base Mainnet (Chain ID: 8453)
- Smart Contracts (Solidity)
- OnchainKit Transaction components

**AI & Storage:**
- Google Gemini 2.5 Flash Image API
- Pinata SDK v2.5.1 (IPFS)

**Design:**
- Light theme with Base blue (#0000ff)
- CSS animations (fadeIn, slideUp, scaleIn, pulse, float)
- Responsive, mobile-first

---

## Phase 1: Smart Contract Development

### 1.1 Donation Pool Contract

**Purpose:** Collect ETH donations on Base, batch bridge to Ethereum mainnet for Movember Foundation

**Contract:** `contracts/MovemberDonationPool.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MovemberDonationPool is Ownable, ReentrancyGuard {
    // State variables
    uint256 public totalDonated;
    uint256 public totalBridged;
    address public movemberRecipient; // Mainnet address (to be confirmed)

    // Track individual donations
    mapping(address => uint256) public donations;
    address[] public donors;

    // Events
    event DonationReceived(address indexed donor, uint256 amount, uint256 timestamp);
    event FundsBridged(uint256 amount, uint256 timestamp, bytes32 bridgeTxHash);
    event RecipientUpdated(address indexed newRecipient);

    constructor(address _movemberRecipient) {
        movemberRecipient = _movemberRecipient;
    }

    /**
     * @notice Donate ETH to Movember Foundation
     */
    function donate() external payable nonReentrant {
        require(msg.value > 0, "Donation must be greater than 0");

        // Track first-time donors
        if (donations[msg.sender] == 0) {
            donors.push(msg.sender);
        }

        donations[msg.sender] += msg.value;
        totalDonated += msg.value;

        emit DonationReceived(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Get total amount available for bridging
     */
    function getAvailableBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get number of unique donors
     */
    function getDonorCount() external view returns (uint256) {
        return donors.length;
    }

    /**
     * @notice Get donation amount for specific donor
     */
    function getDonorTotal(address donor) external view returns (uint256) {
        return donations[donor];
    }

    /**
     * @notice Bridge funds to Ethereum mainnet (admin only)
     * @dev Integrate with Superbridge or Brid.gg API
     */
    function bridgeToMovember(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        require(movemberRecipient != address(0), "Recipient not set");

        totalBridged += amount;

        // TODO: Integrate with bridge contract
        // For now, transfer to owner for manual bridging
        payable(owner()).transfer(amount);

        emit FundsBridged(amount, block.timestamp, bytes32(0));
    }

    /**
     * @notice Update Movember recipient address
     */
    function updateRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        movemberRecipient = newRecipient;
        emit RecipientUpdated(newRecipient);
    }
}
```

**Deployment Steps:**
1. Install Hardhat/Foundry for smart contract development
2. Deploy to Base Sepolia testnet first
3. Test donation flow thoroughly
4. Audit contract (consider OpenZeppelin Defender)
5. Deploy to Base Mainnet
6. Verify contract on BaseScan

**Integration:**
- Use OnchainKit `<Transaction>` component for donations
- Track donations in database after successful transaction
- Display community stats (total donated, donor count)

---

### 1.2 Movember NFT Contract

**Purpose:** Mint ERC-721 NFTs for daily progress, early bird badges, and completion rewards

**Contract:** `contracts/MovemberNFT.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MovemberNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // NFT Types
    enum NFTType { DAILY, EARLY_BIRD, COMPLETION }

    // NFT metadata
    struct NFTMetadata {
        NFTType nftType;
        uint256 day; // 1-30 for daily, 0 for early bird/completion
        address participant;
        uint256 mintedAt;
        string metadataURI;
    }

    // Mappings
    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(address => mapping(uint256 => uint256)) public dailyNFTs; // user => day => tokenId
    mapping(address => uint256) public earlyBirdNFTs; // user => tokenId
    mapping(address => uint256) public completionNFTs; // user => tokenId
    mapping(address => uint256) public userProgress; // user => days completed

    // Events
    event DailyNFTMinted(address indexed participant, uint256 indexed day, uint256 tokenId);
    event EarlyBirdNFTMinted(address indexed participant, uint256 tokenId);
    event CompletionNFTMinted(address indexed participant, uint256 tokenId);

    constructor() ERC721("Based Movember 2025", "MOVEMBER") {}

    /**
     * @notice Mint daily NFT for a specific day
     */
    function mintDailyNFT(
        address participant,
        uint256 day,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(day >= 1 && day <= 30, "Invalid day");
        require(dailyNFTs[participant][day] == 0, "Day already minted");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(participant, tokenId);
        _setTokenURI(tokenId, metadataURI);

        nftMetadata[tokenId] = NFTMetadata({
            nftType: NFTType.DAILY,
            day: day,
            participant: participant,
            mintedAt: block.timestamp,
            metadataURI: metadataURI
        });

        dailyNFTs[participant][day] = tokenId;
        userProgress[participant]++;

        emit DailyNFTMinted(participant, day, tokenId);
        return tokenId;
    }

    /**
     * @notice Mint early bird NFT
     */
    function mintEarlyBirdNFT(
        address participant,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(earlyBirdNFTs[participant] == 0, "Early bird already minted");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(participant, tokenId);
        _setTokenURI(tokenId, metadataURI);

        nftMetadata[tokenId] = NFTMetadata({
            nftType: NFTType.EARLY_BIRD,
            day: 0,
            participant: participant,
            mintedAt: block.timestamp,
            metadataURI: metadataURI
        });

        earlyBirdNFTs[participant] = tokenId;

        emit EarlyBirdNFTMinted(participant, tokenId);
        return tokenId;
    }

    /**
     * @notice Mint completion NFT (30 days)
     */
    function mintCompletionNFT(
        address participant,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(userProgress[participant] == 30, "Must complete all 30 days");
        require(completionNFTs[participant] == 0, "Completion already minted");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(participant, tokenId);
        _setTokenURI(tokenId, metadataURI);

        nftMetadata[tokenId] = NFTMetadata({
            nftType: NFTType.COMPLETION,
            day: 0,
            participant: participant,
            mintedAt: block.timestamp,
            metadataURI: metadataURI
        });

        completionNFTs[participant] = tokenId;

        emit CompletionNFTMinted(participant, tokenId);
        return tokenId;
    }

    /**
     * @notice Check if user has minted a specific day
     */
    function hasCompletedDay(address participant, uint256 day)
        external
        view
        returns (bool)
    {
        return dailyNFTs[participant][day] != 0;
    }

    /**
     * @notice Get user's progress (days completed)
     */
    function getUserProgress(address participant)
        external
        view
        returns (uint256)
    {
        return userProgress[participant];
    }

    /**
     * @notice Get all NFT token IDs for a user
     */
    function getUserNFTs(address participant)
        external
        view
        returns (uint256[] memory)
    {
        uint256 balance = balanceOf(participant);
        uint256[] memory tokenIds = new uint256[](balance);

        uint256 index = 0;
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == participant) {
                tokenIds[index] = i;
                index++;
            }
        }

        return tokenIds;
    }

    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

**Deployment Steps:**
1. Deploy to Base Sepolia testnet
2. Test minting flow for all NFT types
3. Verify metadata displays correctly on OpenSea testnet
4. Deploy to Base Mainnet
5. Verify contract on BaseScan
6. Update frontend with contract address

---

## Phase 2: Database Schema

### 2.1 Database Setup

**Technology:** Vercel Postgres (recommended) or Supabase

**Schema:**

```sql
-- Users table
CREATE TABLE users (
  fid VARCHAR(255) PRIMARY KEY,
  display_name VARCHAR(255),
  username VARCHAR(255),
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  has_early_bird BOOLEAN DEFAULT FALSE,
  days_completed INTEGER DEFAULT 0,
  total_donated DECIMAL(18, 8) DEFAULT 0
);

-- User progress table
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  fid VARCHAR(255) REFERENCES users(fid),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 30),
  original_image_url TEXT NOT NULL,
  transformed_image_url TEXT NOT NULL,
  nft_metadata_url TEXT NOT NULL,
  nft_token_id INTEGER,
  cast_hash VARCHAR(255),
  donated BOOLEAN DEFAULT FALSE,
  donation_amount DECIMAL(18, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(fid, day)
);

-- Early bird table
CREATE TABLE early_birds (
  id SERIAL PRIMARY KEY,
  fid VARCHAR(255) REFERENCES users(fid) UNIQUE,
  tagged_friend VARCHAR(255),
  cast_hash VARCHAR(255),
  nft_metadata_url TEXT,
  nft_token_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Donations table
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  fid VARCHAR(255) REFERENCES users(fid),
  amount DECIMAL(18, 8) NOT NULL,
  transaction_hash VARCHAR(255) UNIQUE NOT NULL,
  block_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Completion NFTs table
CREATE TABLE completion_nfts (
  id SERIAL PRIMARY KEY,
  fid VARCHAR(255) REFERENCES users(fid) UNIQUE,
  nft_metadata_url TEXT NOT NULL,
  nft_token_id INTEGER,
  claimed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_progress_fid ON user_progress(fid);
CREATE INDEX idx_user_progress_day ON user_progress(day);
CREATE INDEX idx_donations_fid ON donations(fid);
CREATE INDEX idx_donations_created_at ON donations(created_at);
```

### 2.2 Database Functions

**File:** `lib/db.ts`

```typescript
import { sql } from '@vercel/postgres';

export interface User {
  fid: string;
  displayName?: string;
  username?: string;
  hasEarlyBird: boolean;
  daysCompleted: number;
  totalDonated: string;
}

export interface DayProgress {
  fid: string;
  day: number;
  originalImageUrl: string;
  transformedImageUrl: string;
  nftMetadataUrl: string;
  nftTokenId?: number;
  castHash?: string;
  donated: boolean;
  donationAmount?: string;
  createdAt: Date;
}

// Get or create user
export async function getOrCreateUser(fid: string, displayName?: string): Promise<User> {
  const result = await sql`
    INSERT INTO users (fid, display_name, last_active_at)
    VALUES (${fid}, ${displayName}, NOW())
    ON CONFLICT (fid)
    DO UPDATE SET last_active_at = NOW(), display_name = ${displayName}
    RETURNING *
  `;
  return result.rows[0];
}

// Record daily progress
export async function recordDayProgress(data: DayProgress): Promise<void> {
  await sql`
    INSERT INTO user_progress (
      fid, day, original_image_url, transformed_image_url,
      nft_metadata_url, nft_token_id, cast_hash
    )
    VALUES (
      ${data.fid}, ${data.day}, ${data.originalImageUrl},
      ${data.transformedImageUrl}, ${data.nftMetadataUrl},
      ${data.nftTokenId}, ${data.castHash}
    )
    ON CONFLICT (fid, day) DO NOTHING
  `;

  // Update user days completed
  await sql`
    UPDATE users
    SET days_completed = (
      SELECT COUNT(*) FROM user_progress WHERE fid = ${data.fid}
    )
    WHERE fid = ${data.fid}
  `;
}

// Get user's complete progress
export async function getUserProgress(fid: string): Promise<DayProgress[]> {
  const result = await sql`
    SELECT * FROM user_progress
    WHERE fid = ${fid}
    ORDER BY day ASC
  `;
  return result.rows;
}

// Check if user completed a specific day
export async function hasCompletedDay(fid: string, day: number): Promise<boolean> {
  const result = await sql`
    SELECT EXISTS(
      SELECT 1 FROM user_progress
      WHERE fid = ${fid} AND day = ${day}
    ) as exists
  `;
  return result.rows[0].exists;
}

// Record donation
export async function recordDonation(
  fid: string,
  amount: string,
  txHash: string
): Promise<void> {
  await sql`
    INSERT INTO donations (fid, amount, transaction_hash)
    VALUES (${fid}, ${amount}, ${txHash})
  `;

  await sql`
    UPDATE users
    SET total_donated = total_donated + ${amount}
    WHERE fid = ${fid}
  `;
}

// Get donation stats
export async function getDonationStats() {
  const result = await sql`
    SELECT
      COUNT(DISTINCT fid) as unique_donors,
      SUM(amount) as total_donated,
      COUNT(*) as total_donations
    FROM donations
  `;
  return result.rows[0];
}
```

---

## Phase 3: Frontend Development

### 3.1 User Gallery Page

**File:** `app/gallery/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useQuickAuth } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import Link from "next/link";
import { getMovemberStatus } from "../../lib/movember";
import styles from "./gallery.module.css";

interface DayProgress {
  day: number;
  originalImageUrl: string;
  transformedImageUrl: string;
  nftMetadataUrl: string;
  nftTokenId?: number;
  castHash?: string;
}

export default function Gallery() {
  const { data: authData } = useQuickAuth<{ user: { fid: number } }>(
    "/api/auth",
    { method: "GET" }
  );
  const [progress, setProgress] = useState<DayProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [canClaimCompletion, setCanClaimCompletion] = useState(false);

  const movemberStatus = getMovemberStatus();

  useEffect(() => {
    if (authData?.user?.fid) {
      fetchProgress();
    }
  }, [authData]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress?fid=${authData.user.fid}`);
      const data = await response.json();
      setProgress(data.progress || []);
      setCanClaimCompletion(data.daysCompleted === 30 && !data.hasCompletionNFT);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCompletion = async () => {
    try {
      const response = await fetch("/api/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: authData.user.fid }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Congratulations! Completion NFT claimed! 🎉");
        fetchProgress();
      }
    } catch (error) {
      console.error("Failed to claim completion:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading your gallery...</div>;
  }

  const daysCompleted = progress.length;
  const progressPercentage = (daysCompleted / 30) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Image src="/logo.png" alt="Based Movember" width={60} height={60} />
        <h1>Your Movember Journey</h1>

        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className={styles.progressText}>
          {daysCompleted} / 30 days complete ({progressPercentage.toFixed(0)}%)
        </p>

        {canClaimCompletion && (
          <button
            onClick={handleClaimCompletion}
            className={styles.claimButton}
          >
            🏆 Claim Legendary Completion NFT
          </button>
        )}
      </div>

      <div className={styles.calendar}>
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          const dayProgress = progress.find(p => p.day === day);
          const isCompleted = !!dayProgress;
          const isCurrent = movemberStatus.currentDay === day;
          const isPast = movemberStatus.currentDay > day;
          const isFuture = movemberStatus.currentDay < day;

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

              {isCompleted && dayProgress ? (
                <div className={styles.dayContent}>
                  <img
                    src={dayProgress.transformedImageUrl}
                    alt={`Day ${day}`}
                    className={styles.dayImage}
                  />
                  <div className={styles.dayActions}>
                    <a
                      href={dayProgress.nftMetadataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.viewMetadata}
                    >
                      View NFT
                    </a>
                    {dayProgress.castHash && (
                      <a
                        href={`https://warpcast.com/~/conversations/${dayProgress.castHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewCast}
                      >
                        View Cast
                      </a>
                    )}
                  </div>
                </div>
              ) : isCurrent ? (
                <div className={styles.dayPlaceholder}>
                  <Link href="/" className={styles.postNow}>
                    📸 Post Now
                  </Link>
                </div>
              ) : isPast ? (
                <div className={styles.dayMissed}>Missed</div>
              ) : (
                <div className={styles.dayLocked}>🔒</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**File:** `app/gallery/gallery.module.css`

```css
.container {
  min-height: 100vh;
  padding: 2rem;
  background: var(--background);
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  color: var(--text-primary);
  margin: 1rem 0;
}

.progressBar {
  width: 100%;
  max-width: 600px;
  height: 12px;
  background: var(--surface);
  border-radius: 6px;
  margin: 1.5rem auto;
  overflow: hidden;
  border: 1px solid var(--border);
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, var(--base-blue), var(--base-cerulean));
  transition: width 0.5s ease;
  border-radius: 6px;
}

.progressText {
  font-size: 1.2rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.claimButton {
  margin-top: 1.5rem;
  padding: 1rem 2rem;
  background: var(--base-green);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 200, 0, 0.3);
}

.claimButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 200, 0, 0.4);
}

.calendar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dayCard {
  background: var(--surface-elevated);
  border: 2px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.dayCard.completed {
  border-color: var(--base-green);
}

.dayCard.current {
  border-color: var(--base-blue);
  box-shadow: 0 0 20px rgba(0, 0, 255, 0.2);
}

.dayCard.missed {
  border-color: var(--base-red);
  opacity: 0.6;
}

.dayCard.future {
  opacity: 0.5;
}

.dayNumber {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.dayImage {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.dayActions {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.viewMetadata,
.viewCast {
  flex: 1;
  text-align: center;
  padding: 0.5rem;
  background: var(--surface);
  border-radius: 6px;
  color: var(--base-blue);
  text-decoration: none;
  transition: all 0.2s ease;
}

.viewMetadata:hover,
.viewCast:hover {
  background: var(--base-blue);
  color: white;
}

.postNow {
  display: block;
  text-align: center;
  padding: 1rem;
  background: var(--base-blue);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
}

.dayMissed,
.dayLocked {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 2rem;
  color: var(--text-tertiary);
}
```

### 3.2 API Routes Updates

**File:** `app/api/progress/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getUserProgress, getOrCreateUser } from "../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const user = await getOrCreateUser(fid);
    const progress = await getUserProgress(fid);

    return NextResponse.json({
      success: true,
      progress,
      daysCompleted: user.daysCompleted,
      hasCompletionNFT: !!user.completionNftTokenId,
    });
  } catch (error) {
    console.error("Progress GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fid, day, castHash, originalUrl, transformedUrl, metadataUrl, nftTokenId } =
      await request.json();

    await recordDayProgress({
      fid,
      day,
      originalImageUrl: originalUrl,
      transformedImageUrl: transformedUrl,
      nftMetadataUrl: metadataUrl,
      nftTokenId,
      castHash,
      donated: false,
    });

    const user = await getOrCreateUser(fid);
    const isComplete = user.daysCompleted === 30;

    return NextResponse.json({
      success: true,
      daysCompleted: user.daysCompleted,
      isComplete,
      message: isComplete
        ? "30 days complete! Claim your legendary NFT!"
        : `Day ${day} recorded! ${30 - user.daysCompleted} days remaining.`,
    });
  } catch (error) {
    console.error("Progress POST error:", error);
    return NextResponse.json(
      { error: "Failed to record progress" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/completion/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "../../../lib/db";
import { uploadImageToIPFS, uploadMetadataToIPFS, createCompletionNFTMetadata } from "../../../lib/pinata";

export async function POST(request: NextRequest) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const user = await getOrCreateUser(fid);

    if (user.daysCompleted < 30) {
      return NextResponse.json(
        { error: "Must complete all 30 days first" },
        { status: 400 }
      );
    }

    // Use logo as completion badge (or generate custom image)
    const completionImageUrl = `${process.env.NEXT_PUBLIC_URL}/completion-badge.png`;

    // Create and upload metadata
    const metadata = createCompletionNFTMetadata(completionImageUrl, fid);
    const metadataUrl = await uploadMetadataToIPFS(metadata);

    // TODO: Mint completion NFT via smart contract
    // const tokenId = await mintCompletionNFT(fid, metadataUrl);

    return NextResponse.json({
      success: true,
      message: "Completion NFT claimed!",
      metadataUrl,
      // tokenId,
    });
  } catch (error) {
    console.error("Completion error:", error);
    return NextResponse.json(
      { error: "Failed to claim completion NFT" },
      { status: 500 }
    );
  }
}
```

---

## Phase 4: Daily Notifications

### 4.1 Notification System

**File:** `app/api/cron/daily-reminder/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getMovemberStatus } from "../../../../lib/movember";
import { sql } from "@vercel/postgres";

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const movemberStatus = getMovemberStatus();

  if (!movemberStatus.isActive) {
    return NextResponse.json({
      message: "Movember is not active"
    });
  }

  try {
    // Get all users who haven't posted today
    const result = await sql`
      SELECT u.fid, u.display_name
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_progress p
        WHERE p.fid = u.fid
        AND p.day = ${movemberStatus.currentDay}
      )
      AND u.last_active_at > NOW() - INTERVAL '7 days'
    `;

    const usersToNotify = result.rows;

    // TODO: Send push notifications via Farcaster
    // For now, log the users
    console.log(`Sending reminders to ${usersToNotify.length} users for Day ${movemberStatus.currentDay}`);

    return NextResponse.json({
      success: true,
      notificationsSent: usersToNotify.length,
      currentDay: movemberStatus.currentDay,
    });
  } catch (error) {
    console.error("Daily reminder error:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
```

**Vercel Cron Configuration:**

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminder",
      "schedule": "0 9 * 11 *"
    }
  ]
}
```

This runs daily at 9 AM UTC during November (month 11).

---

## Phase 5: OnchainKit Payment Integration

### 5.1 Donation Component

**File:** `components/DonationWidget.tsx`

```typescript
"use client";

import { useState } from "react";
import { Transaction, TransactionButton } from "@coinbase/onchainkit/transaction";
import { useQuickAuth } from "@coinbase/onchainkit/minikit";
import styles from "./DonationWidget.module.css";

const DONATION_POOL_ADDRESS = process.env.NEXT_PUBLIC_DONATION_POOL_ADDRESS!;
const donationPoolABI = [
  {
    inputs: [],
    name: "donate",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

interface DonationStats {
  totalDonated: string;
  uniqueDonors: number;
}

export function DonationWidget() {
  const [amount, setAmount] = useState("0.01");
  const [stats, setStats] = useState<DonationStats | null>(null);
  const { data: authData } = useQuickAuth<{ user: { fid: number } }>(
    "/api/auth",
    { method: "GET" }
  );

  const contracts = [
    {
      address: DONATION_POOL_ADDRESS as `0x${string}`,
      abi: donationPoolABI,
      functionName: "donate",
      args: [],
      value: BigInt(Math.floor(parseFloat(amount) * 1e18)),
    },
  ];

  const handleSuccess = async (response: any) => {
    console.log("Donation successful:", response);

    // Record donation in database
    await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fid: authData?.user?.fid,
        amount,
        transactionHash: response.transactionReceipt.transactionHash,
      }),
    });

    // Refresh stats
    fetchStats();
    alert(`Thank you for donating ${amount} ETH to men's health! 💙`);
  };

  const fetchStats = async () => {
    const response = await fetch("/api/donations/stats");
    const data = await response.json();
    setStats(data);
  };

  useState(() => {
    fetchStats();
  }, []);

  return (
    <div className={styles.widget}>
      <h2 className={styles.title}>Support Men's Health</h2>

      {stats && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.totalDonated} ETH</div>
            <div className={styles.statLabel}>Total Raised</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.uniqueDonors}</div>
            <div className={styles.statLabel}>Contributors</div>
          </div>
        </div>
      )}

      <div className={styles.form}>
        <input
          type="number"
          step="0.01"
          min="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={styles.input}
          placeholder="Amount in ETH"
        />

        <Transaction
          contracts={contracts}
          onSuccess={handleSuccess}
        >
          <TransactionButton text={`Donate ${amount} ETH`} />
        </Transaction>

        <p className={styles.helperText}>
          Donations are pooled and bridged to Ethereum mainnet for Movember Foundation
        </p>
      </div>
    </div>
  );
}
```

### 5.2 Donation API Routes

**File:** `app/api/donations/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { recordDonation } from "../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    const { fid, amount, transactionHash } = await request.json();

    if (!fid || !amount || !transactionHash) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await recordDonation(fid, amount, transactionHash);

    return NextResponse.json({
      success: true,
      message: "Donation recorded successfully",
    });
  } catch (error) {
    console.error("Donation recording error:", error);
    return NextResponse.json(
      { error: "Failed to record donation" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/donations/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDonationStats } from "../../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const stats = await getDonationStats();

    return NextResponse.json({
      totalDonated: stats.total_donated || "0",
      uniqueDonors: parseInt(stats.unique_donors) || 0,
      totalDonations: parseInt(stats.total_donations) || 0,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
```

---

## Phase 6: NFT Minting Integration

### 6.1 Smart Contract Integration

**File:** `lib/contracts.ts`

```typescript
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS! as `0x${string}`;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY! as `0x${string}`;

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

const nftABI = [
  {
    inputs: [
      { name: "participant", type: "address" },
      { name: "day", type: "uint256" },
      { name: "metadataURI", type: "string" },
    ],
    name: "mintDailyNFT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "participant", type: "address" },
      { name: "metadataURI", type: "string" },
    ],
    name: "mintEarlyBirdNFT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "participant", type: "address" },
      { name: "metadataURI", type: "string" },
    ],
    name: "mintCompletionNFT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export async function mintDailyNFT(
  participantAddress: string,
  day: number,
  metadataURI: string
): Promise<number> {
  const { request } = await publicClient.simulateContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftABI,
    functionName: "mintDailyNFT",
    args: [participantAddress as `0x${string}`, BigInt(day), metadataURI],
    account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Extract tokenId from event logs
  // TODO: Parse logs properly
  return 0; // Placeholder
}

export async function mintEarlyBirdNFT(
  participantAddress: string,
  metadataURI: string
): Promise<number> {
  const { request } = await publicClient.simulateContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftABI,
    functionName: "mintEarlyBirdNFT",
    args: [participantAddress as `0x${string}`, metadataURI],
    account,
  });

  const hash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });

  return 0; // Placeholder
}

export async function mintCompletionNFT(
  participantAddress: string,
  metadataURI: string
): Promise<number> {
  const { request } = await publicClient.simulateContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftABI,
    functionName: "mintCompletionNFT",
    args: [participantAddress as `0x${string}`, metadataURI],
    account,
  });

  const hash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });

  return 0; // Placeholder
}
```

### 6.2 Update Upload API to Mint NFTs

**Update:** `app/api/upload/route.ts`

```typescript
import { mintDailyNFT } from "../../../lib/contracts";

export async function POST(request: NextRequest) {
  // ... existing code for image transformation and IPFS upload ...

  // Mint NFT on Base
  const participantAddress = "0x..."; // Get from user's wallet
  const tokenId = await mintDailyNFT(participantAddress, parseInt(day), metadataUrl);

  return NextResponse.json({
    success: true,
    originalUrl,
    transformedUrl,
    metadataUrl,
    tokenId,
    url: transformedUrl,
  });
}
```

---

## Implementation Timeline

### Week 1: Smart Contracts
- [ ] Set up Hardhat/Foundry environment
- [ ] Develop and test MovemberDonationPool contract
- [ ] Develop and test MovemberNFT contract
- [ ] Deploy to Base Sepolia testnet
- [ ] Test end-to-end flows
- [ ] Deploy to Base Mainnet
- [ ] Verify contracts on BaseScan

### Week 2: Database & Backend
- [ ] Set up Vercel Postgres
- [ ] Create database schema and migrations
- [ ] Implement database functions (lib/db.ts)
- [ ] Update API routes for progress tracking
- [ ] Create completion NFT endpoint
- [ ] Set up contract integration (lib/contracts.ts)

### Week 3: Gallery & UI
- [ ] Build gallery page with calendar view
- [ ] Implement progress tracking UI
- [ ] Add completion NFT claim button
- [ ] Create donation widget component
- [ ] Integrate OnchainKit Transaction component
- [ ] Add donation stats display

### Week 4: Notifications & Polish
- [ ] Set up Vercel Cron job
- [ ] Implement daily reminder system
- [ ] Test notification flow
- [ ] Add navigation between home and gallery
- [ ] Final UI polish and animations
- [ ] Cross-browser testing

### Week 5: Testing & Launch
- [ ] End-to-end testing on testnet
- [ ] Security audit of smart contracts
- [ ] Load testing
- [ ] Deploy to production
- [ ] Monitor and fix bugs
- [ ] Launch marketing campaign

---

## Environment Variables Required

```bash
# Existing
NEXT_PUBLIC_URL=https://movember-lime.vercel.app
GEMINI_API_KEY=your_gemini_api_key
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=your_gateway_url
PINATA_GATEWAY_KEY=your_gateway_key

# New - Smart Contracts
NFT_CONTRACT_ADDRESS=0x... # After deployment
DONATION_POOL_ADDRESS=0x... # After deployment
DEPLOYER_PRIVATE_KEY=0x... # Server-side only, for minting

# New - Database
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...

# New - Cron
CRON_SECRET=your_random_secret_key

# Future - Movember Foundation
MOVEMBER_MAINNET_ADDRESS=0x... # After confirmation from Movember
```

---

## Security Considerations

1. **Private Key Management**
   - Store deployer private key in Vercel environment variables only
   - Never commit to Git
   - Use separate wallet for deployment vs operations

2. **Smart Contract Security**
   - Use OpenZeppelin contracts
   - Implement reentrancy guards
   - Add ownership controls
   - Consider formal audit before mainnet

3. **API Security**
   - Validate all user inputs
   - Rate limit endpoints
   - Authenticate cron jobs with secrets
   - Sanitize FID inputs

4. **Database Security**
   - Use parameterized queries (Vercel Postgres does this)
   - Implement proper indexes
   - Regular backups

---

## Monitoring & Analytics

1. **On-chain Monitoring**
   - Track contract events using BaseScan
   - Monitor donation pool balance
   - Alert on failed mints

2. **Application Monitoring**
   - Vercel Analytics for performance
   - Error tracking (Sentry)
   - User activity metrics

3. **Key Metrics**
   - Daily active users
   - Daily submissions (days 1-30)
   - Total donations
   - NFTs minted
   - Completion rate

---

## Open Questions for Movember Foundation

1. Can you provide an official ETH address on Ethereum mainnet for donations?
2. Would you be interested in setting up a Base wallet address directly?
3. Can we use "Based Movember" branding with proper attribution?
4. Can we feature your official donation link in social posts?
5. Would you like to partner officially for promotion?

---

## Next Immediate Steps

1. **Email Movember Foundation** (crypto@movember.com)
2. **Set up Hardhat project** for smart contract development
3. **Create database schema** in Vercel Postgres
4. **Deploy test contracts** to Base Sepolia
5. **Build gallery page** prototype

---

## Resources

- [Base Documentation](https://docs.base.org/)
- [OnchainKit Docs](https://onchainkit.xyz/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Farcaster Mini Apps](https://docs.base.org/wallet-app/mini-apps)
- [Movember Crypto Donations](https://us.movember.com/support-us/crypto-donations)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Status:** Planning Phase
