/**
 * Upload endpoint for mustache photos
 * Simplified flow:
 * 1. Receive user photo
 * 2. Upload to Vercel Blob
 * 3. Save metadata to Postgres
 * 4. Return image URL
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadPhoto } from "../../../lib/storage";
import { getOrCreateUser, saveDailyPhoto } from "../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const day = formData.get("day") as string;
    const fid = formData.get("fid") as string;
    const displayName = formData.get("displayName") as string | undefined;
    const username = formData.get("username") as string | undefined;

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!day || !fid) {
      return NextResponse.json(
        { error: "Missing required fields (day, fid)" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max for Vercel Blob free tier)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be less than 5MB" },
        { status: 400 }
      );
    }

    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json(
        { error: "Day must be between 1 and 30" },
        { status: 400 }
      );
    }

    console.log(`Processing upload - Day: ${day}, FID: ${fid}`);

    // Ensure user exists in database
    await getOrCreateUser(fid, displayName, username);

    console.log("Uploading photo to Vercel Blob...");

    // Upload to Vercel Blob
    const imageUrl = await uploadPhoto(file, fid, dayNumber);

    console.log("Saving to database...");

    // Save to database
    const photo = await saveDailyPhoto(fid, dayNumber, imageUrl);

    console.log("Upload complete!");

    return NextResponse.json({
      success: true,
      imageUrl,
      photo: {
        id: photo.id,
        day: photo.day,
        createdAt: photo.created_at,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
