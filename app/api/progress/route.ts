/**
 * Progress tracking endpoint
 * Returns user's complete Movember progress
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser, getUserPhotos, saveDailyPhoto } from "../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    // Get user data
    const user = await getUser(fid);
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          progress: [],
          daysCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          isEarlyBird: false,
        },
        { status: 200 }
      );
    }

    // Get all photos
    const photos = await getUserPhotos(fid);

    return NextResponse.json({
      success: true,
      progress: photos,
      daysCompleted: user.days_completed,
      currentStreak: user.current_streak,
      longestStreak: user.longest_streak,
      isEarlyBird: user.is_early_bird,
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
    const { fid, day, castHash, imageUrl } = await request.json();

    if (!fid || !day || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields (fid, day, imageUrl)" },
        { status: 400 }
      );
    }

    // Save photo progress
    await saveDailyPhoto(fid, parseInt(day), imageUrl, castHash);

    // Get updated user data
    const user = await getUser(fid);

    return NextResponse.json({
      success: true,
      daysCompleted: user?.days_completed || 0,
      currentStreak: user?.current_streak || 0,
      message:
        user?.days_completed === 30
          ? "🎉 Congratulations! You completed all 30 days!"
          : `Day ${day} recorded! ${30 - (user?.days_completed || 0)} days remaining.`,
    });
  } catch (error) {
    console.error("Progress POST error:", error);
    return NextResponse.json(
      { error: "Failed to record progress" },
      { status: 500 }
    );
  }
}
