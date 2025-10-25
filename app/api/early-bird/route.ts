/**
 * Early Bird API Route
 * Handles early commitment to Movember before November starts
 */

import { NextRequest, NextResponse } from "next/server";
import {
  uploadMetadataToIPFS,
  createEarlyBirdNFTMetadata,
} from "../../../lib/pinata";

interface EarlyBirdCommitment {
  fid: string;
  castHash: string;
  taggedFriend?: string;
  timestamp: number;
  nftMetadataUrl?: string;
}

// In-memory storage for early bird commitments
// In production, this should use a database
const earlyBirdCommitments = new Map<string, EarlyBirdCommitment>();

export async function POST(request: NextRequest) {
  try {
    const { fid, castHash, taggedFriend } = await request.json();

    if (!fid || !castHash) {
      return NextResponse.json(
        { error: "FID and cast hash are required" },
        { status: 400 }
      );
    }

    // Check if user already has an early bird commitment
    if (earlyBirdCommitments.has(fid)) {
      return NextResponse.json(
        {
          success: true,
          message: "You've already committed! Early bird NFT is ready.",
          nftMetadataUrl: earlyBirdCommitments.get(fid)?.nftMetadataUrl,
        },
        { status: 200 }
      );
    }

    // Create early bird badge image (using a placeholder for now)
    // In production, you might generate a custom badge image
    const earlyBirdImageUrl = `${process.env.NEXT_PUBLIC_URL}/logo.png`;

    // Create and upload NFT metadata to IPFS
    const metadata = createEarlyBirdNFTMetadata(earlyBirdImageUrl, fid);
    const metadataUrl = await uploadMetadataToIPFS(metadata);

    // Store the commitment
    const commitment: EarlyBirdCommitment = {
      fid,
      castHash,
      taggedFriend,
      timestamp: Date.now(),
      nftMetadataUrl: metadataUrl,
    };

    earlyBirdCommitments.set(fid, commitment);

    return NextResponse.json({
      success: true,
      message: "Early bird commitment recorded! NFT metadata created.",
      nftMetadataUrl: metadataUrl,
      commitment: {
        fid,
        castHash,
        taggedFriend,
        timestamp: commitment.timestamp,
      },
    });
  } catch (error) {
    console.error("Early bird API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process early bird commitment",
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
      return NextResponse.json(
        { error: "FID is required" },
        { status: 400 }
      );
    }

    const commitment = earlyBirdCommitments.get(fid);

    if (!commitment) {
      return NextResponse.json(
        { hasCommitment: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      hasCommitment: true,
      commitment: {
        fid: commitment.fid,
        castHash: commitment.castHash,
        taggedFriend: commitment.taggedFriend,
        timestamp: commitment.timestamp,
        nftMetadataUrl: commitment.nftMetadataUrl,
      },
    });
  } catch (error) {
    console.error("Early bird GET error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch early bird status",
      },
      { status: 500 }
    );
  }
}
