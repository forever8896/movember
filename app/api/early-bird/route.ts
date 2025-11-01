/**
 * Early Bird API Route
 * Handles early commitment to Movember before November starts
 * Simplified: No NFTs, just database tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, saveEarlyBird, getEarlyBird } from "../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    const { fid, castHash, taggedFriend, displayName, username } =
      await request.json();

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    // Check if user already has an early bird commitment
    const existing = await getEarlyBird(fid);
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: "You've already committed! Early bird status confirmed.",
          commitment: existing,
        },
        { status: 200 }
      );
    }

    // Ensure user exists
    await getOrCreateUser(fid, displayName, username);

    // Save early bird commitment
    const commitment = await saveEarlyBird(fid, castHash, taggedFriend);

    return NextResponse.json({
      success: true,
      message: "Early bird commitment recorded! 🐦",
      commitment,
    });
  } catch (error) {
    console.error("Early bird API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process early bird commitment",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const commitment = await getEarlyBird(fid);

    if (!commitment) {
      return NextResponse.json({ hasCommitment: false }, { status: 200 });
    }

    return NextResponse.json({
      hasCommitment: true,
      commitment,
    });
  } catch (error) {
    console.error("Early bird GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch early bird status",
      },
      { status: 500 }
    );
  }
}
