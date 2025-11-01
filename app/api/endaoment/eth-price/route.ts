import { NextResponse } from "next/server";
import { mainnet } from "viem/chains";
import { ENDAOMENT_API_URL, ETH_PER_CHAIN } from "@/lib/endaoment-constants";

export async function GET() {
  const url = `${ENDAOMENT_API_URL}/v1/tokens/price?id=${
    ETH_PER_CHAIN[mainnet.id].tokenId
  }`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    return NextResponse.json(
      { error: "Failed to fetch ETH price" },
      { status: 500 }
    );
  }
}
