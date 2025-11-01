import { NextResponse } from "next/server";
import { ENDAOMENT_API_URL, MOVEMBER_EIN } from "@/lib/endaoment-constants";

export async function GET() {
  const url = `${ENDAOMENT_API_URL}/v1/orgs/ein/${MOVEMBER_EIN}`;

  try {
    console.log("Fetching Movember org from:", url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("API error response:", text);
      return NextResponse.json(
        { error: `API returned ${response.status}`, details: text },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Successfully fetched org data");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Movember org:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization", details: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
