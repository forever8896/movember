/**
 * Database utilities for Vercel Postgres
 * Simple queries for user data, photos, and progress tracking
 */

import { sql } from "@vercel/postgres";

// ========================================
// Types
// ========================================

export interface User {
  fid: string;
  display_name?: string;
  username?: string;
  is_early_bird: boolean;
  days_completed: number;
  current_streak: number;
  longest_streak: number;
  created_at: Date;
  last_active_at: Date;
}

export interface DailyPhoto {
  id: number;
  fid: string;
  day: number;
  image_url: string;
  cast_hash?: string;
  created_at: Date;
}

export interface EarlyBird {
  id: number;
  fid: string;
  cast_hash?: string;
  tagged_friend?: string;
  created_at: Date;
}

export interface Donation {
  id: number;
  fid: string;
  display_name?: string;
  username?: string;
  amount: number; // in USD
  transaction_hash: string;
  chain_id: number;
  token: string; // 'USDC' or 'ETH'
  created_at: Date;
}

// ========================================
// Database Initialization
// ========================================

/**
 * Initialize database tables
 * Run this once to set up the schema
 */
export async function initializeDatabase() {
  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      fid VARCHAR(255) PRIMARY KEY,
      display_name VARCHAR(255),
      username VARCHAR(255),
      is_early_bird BOOLEAN DEFAULT FALSE,
      days_completed INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      last_active_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Daily photos table
  await sql`
    CREATE TABLE IF NOT EXISTS daily_photos (
      id SERIAL PRIMARY KEY,
      fid VARCHAR(255) REFERENCES users(fid) ON DELETE CASCADE,
      day INTEGER NOT NULL CHECK (day >= 1 AND day <= 30),
      image_url TEXT NOT NULL,
      cast_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(fid, day)
    )
  `;

  // Early birds table
  await sql`
    CREATE TABLE IF NOT EXISTS early_birds (
      id SERIAL PRIMARY KEY,
      fid VARCHAR(255) REFERENCES users(fid) ON DELETE CASCADE UNIQUE,
      cast_hash VARCHAR(255),
      tagged_friend VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Donations table
  await sql`
    CREATE TABLE IF NOT EXISTS donations (
      id SERIAL PRIMARY KEY,
      fid VARCHAR(255) REFERENCES users(fid) ON DELETE CASCADE,
      display_name VARCHAR(255),
      username VARCHAR(255),
      amount DECIMAL(10, 2) NOT NULL,
      transaction_hash VARCHAR(255) UNIQUE NOT NULL,
      chain_id INTEGER NOT NULL,
      token VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create indexes for performance
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_photos_fid ON daily_photos(fid)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_photos_day ON daily_photos(day)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_donations_fid ON donations(fid)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_donations_amount ON donations(amount DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC)`;
}

// ========================================
// User Operations
// ========================================

/**
 * Get or create a user
 */
export async function getOrCreateUser(
  fid: string,
  displayName?: string,
  username?: string
): Promise<User> {
  const result = await sql`
    INSERT INTO users (fid, display_name, username, last_active_at)
    VALUES (${fid}, ${displayName || null}, ${username || null}, NOW())
    ON CONFLICT (fid)
    DO UPDATE SET
      last_active_at = NOW(),
      display_name = COALESCE(${displayName}, users.display_name),
      username = COALESCE(${username}, users.username)
    RETURNING *
  `;

  return result.rows[0] as User;
}

/**
 * Get user by FID
 */
export async function getUser(fid: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE fid = ${fid}
  `;

  return (result.rows[0] as User) || null;
}

/**
 * Update user streak
 */
async function updateUserStreak(fid: string): Promise<void> {
  // Get all user's photos ordered by day
  const photosResult = await sql`
    SELECT day FROM daily_photos
    WHERE fid = ${fid}
    ORDER BY day ASC
  `;

  const days = photosResult.rows.map((r) => r.day);

  // Calculate current streak (consecutive days from most recent)
  let currentStreak = 0;
  if (days.length > 0) {
    const latestDay = days[days.length - 1];
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i] === latestDay - (days.length - 1 - i)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  await sql`
    UPDATE users
    SET
      current_streak = ${currentStreak},
      longest_streak = ${longestStreak}
    WHERE fid = ${fid}
  `;
}

// ========================================
// Daily Photo Operations
// ========================================

/**
 * Save a daily photo
 */
export async function saveDailyPhoto(
  fid: string,
  day: number,
  imageUrl: string,
  castHash?: string
): Promise<DailyPhoto> {
  const result = await sql`
    INSERT INTO daily_photos (fid, day, image_url, cast_hash)
    VALUES (${fid}, ${day}, ${imageUrl}, ${castHash || null})
    ON CONFLICT (fid, day)
    DO UPDATE SET
      image_url = ${imageUrl},
      cast_hash = COALESCE(${castHash}, daily_photos.cast_hash)
    RETURNING *
  `;

  // Update user's days completed
  await sql`
    UPDATE users
    SET days_completed = (
      SELECT COUNT(*) FROM daily_photos WHERE fid = ${fid}
    )
    WHERE fid = ${fid}
  `;

  // Update streak
  await updateUserStreak(fid);

  return result.rows[0] as DailyPhoto;
}

/**
 * Get all photos for a user
 */
export async function getUserPhotos(fid: string): Promise<DailyPhoto[]> {
  const result = await sql`
    SELECT * FROM daily_photos
    WHERE fid = ${fid}
    ORDER BY day ASC
  `;

  return result.rows as DailyPhoto[];
}

/**
 * Get a specific day's photo
 */
export async function getDayPhoto(
  fid: string,
  day: number
): Promise<DailyPhoto | null> {
  const result = await sql`
    SELECT * FROM daily_photos
    WHERE fid = ${fid} AND day = ${day}
  `;

  return (result.rows[0] as DailyPhoto) || null;
}

/**
 * Check if user has posted for a specific day
 */
export async function hasCompletedDay(
  fid: string,
  day: number
): Promise<boolean> {
  const result = await sql`
    SELECT EXISTS(
      SELECT 1 FROM daily_photos
      WHERE fid = ${fid} AND day = ${day}
    ) as exists
  `;

  return result.rows[0].exists;
}

// ========================================
// Early Bird Operations
// ========================================

/**
 * Save early bird commitment
 */
export async function saveEarlyBird(
  fid: string,
  castHash?: string,
  taggedFriend?: string
): Promise<EarlyBird> {
  const result = await sql`
    INSERT INTO early_birds (fid, cast_hash, tagged_friend)
    VALUES (${fid}, ${castHash || null}, ${taggedFriend || null})
    ON CONFLICT (fid)
    DO UPDATE SET
      cast_hash = COALESCE(${castHash}, early_birds.cast_hash),
      tagged_friend = COALESCE(${taggedFriend}, early_birds.tagged_friend)
    RETURNING *
  `;

  // Mark user as early bird
  await sql`
    UPDATE users
    SET is_early_bird = TRUE
    WHERE fid = ${fid}
  `;

  return result.rows[0] as EarlyBird;
}

/**
 * Check if user is an early bird
 */
export async function isEarlyBird(fid: string): Promise<boolean> {
  const result = await sql`
    SELECT EXISTS(
      SELECT 1 FROM early_birds WHERE fid = ${fid}
    ) as exists
  `;

  return result.rows[0].exists;
}

/**
 * Get early bird data
 */
export async function getEarlyBird(fid: string): Promise<EarlyBird | null> {
  const result = await sql`
    SELECT * FROM early_birds WHERE fid = ${fid}
  `;

  return (result.rows[0] as EarlyBird) || null;
}

// ========================================
// Community Stats
// ========================================

/**
 * Get community statistics
 */
export async function getCommunityStats() {
  const result = await sql`
    SELECT
      COUNT(DISTINCT users.fid) as total_participants,
      COUNT(daily_photos.id) as total_photos,
      COUNT(DISTINCT CASE WHEN users.days_completed = 30 THEN users.fid END) as completions,
      COUNT(early_birds.id) as early_birds
    FROM users
    LEFT JOIN daily_photos ON users.fid = daily_photos.fid
    LEFT JOIN early_birds ON users.fid = early_birds.fid
  `;

  return result.rows[0];
}

/**
 * Get leaderboard (users with most days completed)
 */
export async function getLeaderboard(limit: number = 10) {
  const result = await sql`
    SELECT
      fid,
      display_name,
      username,
      days_completed,
      current_streak,
      longest_streak
    FROM users
    WHERE days_completed > 0
    ORDER BY days_completed DESC, longest_streak DESC
    LIMIT ${limit}
  `;

  return result.rows;
}

// ========================================
// Donation Operations
// ========================================

/**
 * Save a donation transaction
 */
export async function saveDonation(
  fid: string,
  displayName: string | undefined,
  username: string | undefined,
  amount: number,
  transactionHash: string,
  chainId: number,
  token: string
): Promise<Donation> {
  const result = await sql`
    INSERT INTO donations (fid, display_name, username, amount, transaction_hash, chain_id, token)
    VALUES (${fid}, ${displayName || null}, ${username || null}, ${amount}, ${transactionHash}, ${chainId}, ${token})
    ON CONFLICT (transaction_hash)
    DO UPDATE SET
      display_name = COALESCE(${displayName}, donations.display_name),
      username = COALESCE(${username}, donations.username)
    RETURNING *
  `;

  return result.rows[0] as Donation;
}

/**
 * Get user's donations
 */
export async function getUserDonations(fid: string): Promise<Donation[]> {
  const result = await sql`
    SELECT * FROM donations
    WHERE fid = ${fid}
    ORDER BY created_at DESC
  `;

  return result.rows as Donation[];
}

/**
 * Get user's total donated amount
 */
export async function getUserTotalDonated(fid: string): Promise<number> {
  const result = await sql`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM donations
    WHERE fid = ${fid}
  `;

  return parseFloat(result.rows[0].total);
}

/**
 * Get top donors leaderboard
 */
export async function getTopDonors(limit: number = 10) {
  try {
    const result = await sql`
      SELECT
        fid,
        display_name,
        username,
        SUM(amount) as total_donated,
        COUNT(*) as donation_count,
        MAX(created_at) as last_donation
      FROM donations
      GROUP BY fid, display_name, username
      ORDER BY total_donated DESC
      LIMIT ${limit}
    `;

    return result.rows || [];
  } catch (error) {
    console.error('Error fetching top donors:', error);
    return [];
  }
}

/**
 * Get community donation stats
 */
export async function getDonationStats() {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_donations,
        COUNT(DISTINCT fid) as unique_donors,
        COALESCE(SUM(amount), 0) as total_raised
      FROM donations
    `;

    const stats = result.rows[0];

    // Ensure we always return valid stats with defaults
    return {
      total_donations: stats?.total_donations || '0',
      unique_donors: stats?.unique_donors || '0',
      total_raised: stats?.total_raised || '0',
    };
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    // Return default values on error
    return {
      total_donations: '0',
      unique_donors: '0',
      total_raised: '0',
    };
  }
}
