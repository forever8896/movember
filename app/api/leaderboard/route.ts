import { NextResponse } from "next/server";
import { getTopDonors, getDonationStats } from "@/lib/db";

export async function GET() {
  try {
    const [topDonors, stats] = await Promise.all([
      getTopDonors(10),
      getDonationStats(),
    ]);

    return NextResponse.json({
      topDonors,
      stats,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
