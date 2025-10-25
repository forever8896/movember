import { NextRequest, NextResponse } from "next/server";

/**
 * Progress tracking endpoint
 *
 * In production, this should store user progress in a database:
 * - Vercel KV
 * - PostgreSQL
 * - MongoDB
 *
 * Track:
 * - User FID
 * - Days completed (1-30)
 * - Cast hashes for each day
 * - Image URLs (original and AI-transformed)
 * - NFT metadata URLs
 * - NFT claim status
 */

interface DayProgress {
  day: number;
  castHash?: string;
  originalUrl?: string;
  transformedUrl?: string;
  metadataUrl?: string;
  timestamp: number;
}

// In-memory storage for demo (use a real database in production)
const userProgress = new Map<string, Map<number, DayProgress>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fid,
      day,
      castHash,
      originalUrl,
      transformedUrl,
      metadataUrl,
    } = body;

    if (!fid || !day) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create user progress
    if (!userProgress.has(fid.toString())) {
      userProgress.set(fid.toString(), new Map());
    }

    const progress = userProgress.get(fid.toString())!;

    // Store the day's progress with all metadata
    progress.set(day, {
      day,
      castHash,
      originalUrl,
      transformedUrl,
      metadataUrl,
      timestamp: Date.now(),
    });

    console.log(`Progress updated - FID: ${fid}, Day: ${day}, Metadata: ${metadataUrl}`);

    // TODO: Store in database
    // TODO: Trigger NFT mint using metadataUrl

    const daysCompleted = progress.size;
    const isComplete = daysCompleted === 30;

    return NextResponse.json({
      success: true,
      daysCompleted,
      isComplete,
      metadataUrl,
      message: isComplete
        ? "Congratulations! You completed all 30 days! Claim your exclusive completion NFT!"
        : `Day ${day} recorded! ${30 - daysCompleted} days remaining.`,
    });

  } catch (error) {
    console.error("Progress tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track progress" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json(
        { error: "Missing FID" },
        { status: 400 }
      );
    }

    const progress = userProgress.get(fid) || new Map();
    const daysData = Array.from(progress.values()).sort((a, b) => a.day - b.day);

    return NextResponse.json({
      fid,
      days: daysData,
      totalDays: daysData.length,
      isComplete: daysData.length === 30,
    });

  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json(
      { error: "Failed to get progress" },
      { status: 500 }
    );
  }
}
