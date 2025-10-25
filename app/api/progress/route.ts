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
 * - Image URLs
 * - NFT claim status
 */

// In-memory storage for demo (use a real database in production)
const userProgress = new Map<string, Set<number>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, day, castHash, imageUrl: _imageUrl } = body;

    if (!fid || !day) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create user progress
    if (!userProgress.has(fid.toString())) {
      userProgress.set(fid.toString(), new Set());
    }

    const progress = userProgress.get(fid.toString())!;
    progress.add(day);

    console.log(`Progress updated - FID: ${fid}, Day: ${day}, Cast: ${castHash}`);

    // TODO: Store in database with cast hash and image URL
    // TODO: Trigger NFT mint if eligible

    const daysCompleted = progress.size;
    const isComplete = daysCompleted === 30;

    return NextResponse.json({
      success: true,
      daysCompleted,
      isComplete,
      message: isComplete
        ? "Congratulations! You completed all 30 days!"
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

    const progress = userProgress.get(fid) || new Set();
    const daysCompleted = Array.from(progress).sort((a, b) => a - b);

    return NextResponse.json({
      fid,
      daysCompleted,
      totalDays: daysCompleted.length,
      isComplete: daysCompleted.length === 30,
    });

  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json(
      { error: "Failed to get progress" },
      { status: 500 }
    );
  }
}
