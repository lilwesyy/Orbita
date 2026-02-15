import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/dashboard";

export async function GET() {
  try {
    const stats = await getDashboardStats();

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "private, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Error fetching dashboard stats", details: message },
      { status: 500 }
    );
  }
}
