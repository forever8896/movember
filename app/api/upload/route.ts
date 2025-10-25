import { NextRequest, NextResponse } from "next/server";
import { transformToHandDrawn } from "../../../lib/gemini";
import {
  uploadImageToIPFS,
  uploadMetadataToIPFS,
  createNFTMetadata,
} from "../../../lib/pinata";

/**
 * Upload endpoint for mustache photos
 * Flow:
 * 1. Receive user photo
 * 2. Transform with Gemini AI to hand-drawn style
 * 3. Upload both images to IPFS
 * 4. Create and upload NFT metadata
 * 5. Return metadata URI and image URLs
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

    console.log(`Processing upload - Day: ${day}, FID: ${fid}`);

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    console.log("Transforming image with Gemini AI...");

    // Transform the image with Gemini AI
    const transformedBase64 = await transformToHandDrawn(base64Image);
    const transformedBuffer = Buffer.from(transformedBase64, "base64");

    console.log("Uploading images to IPFS...");

    // Upload both images to IPFS
    const [originalUrl, transformedUrl] = await Promise.all([
      uploadImageToIPFS(
        Buffer.from(arrayBuffer),
        `movember-day-${day}-${fid}-original.png`
      ),
      uploadImageToIPFS(
        transformedBuffer,
        `movember-day-${day}-${fid}-art.png`
      ),
    ]);

    console.log("Creating NFT metadata...");

    // Create NFT metadata using the transformed image
    const metadata = createNFTMetadata(parseInt(day), transformedUrl, fid);

    console.log("Uploading metadata to IPFS...");

    // Upload metadata to IPFS
    const metadataUrl = await uploadMetadataToIPFS(metadata);

    console.log("Upload complete!");

    return NextResponse.json({
      success: true,
      originalUrl,
      transformedUrl,
      metadataUrl,
      url: transformedUrl, // Return transformed URL for display
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
