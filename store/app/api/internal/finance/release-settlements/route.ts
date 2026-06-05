/**
 * Internal: called by a cron job (every hour) to release matured settlements.
 * Moves netAmount from pendingBalance → availableBalance.
 */

import { NextRequest, NextResponse } from "next/server";
import { releaseMaturedSettlements } from "@/lib/finance";
import { guardInternalRoute } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  const denied = guardInternalRoute(req);
  if (denied) return denied;

  const released = await releaseMaturedSettlements();
  return NextResponse.json({ ok: true, released });
}

// Also support GET for cron services that prefer GET
export async function GET(req: NextRequest) {
  return POST(req);
}
