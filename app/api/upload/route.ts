import { NextRequest, NextResponse } from "next/server";

/**
 * Upload endpoint for mustache photos
 *
 * For production, this should upload to:
 * - Vercel Blob Storage
 * - IPFS (Pinata/NFT.Storage)
 * - AWS S3/Cloudinary
 *
 * For now, we'll simulate an upload and return a placeholder URL
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const day = formData.get("day") as string;
    const fid = formData.get("fid") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be less than 5MB" },
        { status: 400 }
      );
    }

    // TODO: Implement actual file upload to storage service
    // For now, we'll return a placeholder URL
    // In production, you would:
    // 1. Upload to Vercel Blob: https://vercel.com/docs/storage/vercel-blob
    // 2. Or upload to IPFS for decentralized storage
    // 3. Return the public URL

    console.log(`Upload request - Day: ${day}, FID: ${fid}, File: ${file.name}`);

    // Placeholder URL - replace with actual upload logic
    const placeholderUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/uploads/mo-day-${day}-${fid}.jpg`;

    return NextResponse.json({
      url: placeholderUrl,
      success: true,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
