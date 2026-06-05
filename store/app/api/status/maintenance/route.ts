/**
 * Public endpoint — returns maintenance status.
 * Called by proxy.ts with a 60s cache TTL so every request doesn't hit the DB.
 * No auth required — intentionally public and cheap.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 60; // ISR: 60 second cache

export async function GET() {
  try {
    const row = await prisma.maintenanceWindow.findFirst({
      orderBy: { createdAt: "desc" },
      select:  { enabled: true, title: true, message: true, estimatedEnd: true, allowedIps: true },
    });

    return NextResponse.json(
      row ?? { enabled: false, title: "", message: "", estimatedEnd: null, allowedIps: [] },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } }
    );
  } catch {
    // DB error → not in maintenance (fail open)
    return NextResponse.json({ enabled: false });
  }
}
