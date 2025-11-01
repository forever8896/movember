/**
 * Database Initialization Route
 * Call this once to set up the database schema
 * GET /api/init-db
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    // Simple security check - only allow in development or with secret
    const authHeader = request.headers.get("authorization");
    const secret = process.env.INIT_DB_SECRET;

    if (
      process.env.NODE_ENV === "production" &&
      (!secret || authHeader !== `Bearer ${secret}`)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initializeDatabase();

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      tables: ["users", "daily_photos", "early_birds"],
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
