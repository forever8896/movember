import { NextRequest, NextResponse } from "next/server";
import { ENDAOMENT_API_URL } from "@/lib/endaoment-constants";
import { saveDonation, getOrCreateUser } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    fid,
    displayName,
    username,
    amount,
    token,
    donorName,
    donationTransactionHash,
    chainId,
  }: {
    fid?: string;
    displayName?: string;
    username?: string;
    amount?: number;
    token?: string;
    donorName?: string;
    donationTransactionHash: string;
    chainId: number;
  } = body;

  if (!donationTransactionHash || !chainId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const url = `${ENDAOMENT_API_URL}/v1/donations`;

  try {
    // Save to local database if we have the data
    if (fid && amount && token) {
      try {
        // Ensure user exists
        await getOrCreateUser(fid, displayName, username);

        // Save donation
        await saveDonation(
          fid,
          displayName,
          username,
          amount,
          donationTransactionHash,
          chainId,
          token
        );
      } catch (dbError) {
        console.error("Error saving donation to database:", dbError);
        // Don't fail the request if DB save fails
      }
    }

    // Forward to Endaoment API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        donorName: donorName || username,
        donationTransactionHash,
        chainId,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing donation:", error);
    return NextResponse.json(
      { error: "Failed to process donation" },
      { status: 500 }
    );
  }
}
