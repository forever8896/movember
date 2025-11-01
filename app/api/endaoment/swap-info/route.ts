import { NextRequest, NextResponse } from "next/server";
import { ENDAOMENT_API_URL } from "@/lib/endaoment-constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const {
    inputTokenId,
    chainId,
    recipientEntityId,
    recipientEntityType,
    amountIn,
  } = Object.fromEntries(searchParams.entries());

  if (
    !inputTokenId ||
    !chainId ||
    !recipientEntityId ||
    !recipientEntityType ||
    !amountIn
  ) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Build the URL
  const url = new URL(`${ENDAOMENT_API_URL}/v1/tokens/swap-info`);
  url.searchParams.set("inputTokenId", inputTokenId);
  url.searchParams.set("chainId", chainId);
  url.searchParams.set("recipientEntityId", recipientEntityId);
  url.searchParams.set("recipientEntityType", recipientEntityType);
  url.searchParams.set("amountIn", amountIn);

  try {
    const response = await fetch(url);
    const swapInfo = await response.json();
    return NextResponse.json(swapInfo);
  } catch (error) {
    console.error("Error fetching swap info:", error);
    return NextResponse.json(
      { error: "Failed to fetch swap info" },
      { status: 500 }
    );
  }
}
