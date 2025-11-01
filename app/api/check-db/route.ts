/**
 * Database Check Route
 * Check if tables exist and show their structure
 * GET /api/check-db
 */

import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    // Check if donations table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'donations'
      ) as exists;
    `;

    const donationsTableExists = tableCheck.rows[0]?.exists || false;

    // If table exists, get its columns
    let columns = [];
    if (donationsTableExists) {
      const columnQuery = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'donations'
        ORDER BY ordinal_position;
      `;
      columns = columnQuery.rows;
    }

    // Count donations
    let donationCount = 0;
    if (donationsTableExists) {
      const countQuery = await sql`SELECT COUNT(*) as count FROM donations`;
      donationCount = parseInt(countQuery.rows[0]?.count || '0');
    }

    // Check all tables
    const allTablesQuery = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    return NextResponse.json({
      success: true,
      donations_table_exists: donationsTableExists,
      donation_count: donationCount,
      columns: columns,
      all_tables: allTablesQuery.rows.map(r => r.table_name),
    });
  } catch (error) {
    console.error("Database check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
