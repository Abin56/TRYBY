import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getProvider } from "@/lib/shipping";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

// GET /api/admin/shipping/label?awb=XXX&provider=SHIPROCKET  — single label
// GET /api/admin/shipping/label?awbs=XX,YY,ZZ&provider=SHIPROCKET — bulk labels

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const awb          = searchParams.get("awb");
  const awbsParam    = searchParams.get("awbs");
  const providerName = searchParams.get("provider") ?? "SHIPROCKET";

  const provider = getProvider(providerName);
  if (!provider) return NextResponse.json({ error: `Provider ${providerName} not found` }, { status: 404 });

  if (awb) {
    const result = await provider.generateLabel(awb);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 502 });

    // If the provider returns a URL, redirect to it
    if (result.url) return NextResponse.redirect(result.url);
    if (result.base64) {
      const buf = Buffer.from(result.base64, "base64");
      return new NextResponse(buf, {
        headers: {
          "Content-Type":        "application/pdf",
          "Content-Disposition": `attachment; filename="label-${awb}.pdf"`,
        },
      });
    }
    return NextResponse.json({ error: "No label data returned" }, { status: 502 });
  }

  if (awbsParam) {
    const awbs = awbsParam.split(",").map(a => a.trim()).filter(Boolean);
    if (!awbs.length) return NextResponse.json({ error: "awbs required" }, { status: 400 });

    const result = await provider.generateBulkLabel(awbs);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 502 });
    if (result.url) return NextResponse.redirect(result.url);
    return NextResponse.json({ error: "No bulk label data returned" }, { status: 502 });
  }

  return NextResponse.json({ error: "awb or awbs parameter required" }, { status: 400 });
}

// POST — generate labels for all shipments in a given order IDs list
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const orderIds: string[] = body.orderIds ?? [];
  if (!orderIds.length) return NextResponse.json({ error: "orderIds required" }, { status: 400 });

  const shipments = await prisma.shipment.findMany({
    where: {
      orderId: { in: orderIds },
      awbCode: { not: null },
    },
    select: { awbCode: true, courier: true },
  });

  if (!shipments.length) return NextResponse.json({ error: "No shipments with AWB codes found" }, { status: 404 });

  // Group by provider
  const byProvider: Record<string, string[]> = {};
  for (const s of shipments) {
    const p = s.courier ?? "SHIPROCKET";
    if (!byProvider[p]) byProvider[p] = [];
    if (s.awbCode) byProvider[p].push(s.awbCode);
  }

  const results: { provider: string; awbs: string[]; url?: string; error?: string }[] = [];
  for (const [provName, awbs] of Object.entries(byProvider)) {
    const provider = getProvider(provName);
    if (!provider) { results.push({ provider: provName, awbs, error: "Provider not configured" }); continue; }
    const r = await provider.generateBulkLabel(awbs);
    results.push({ provider: provName, awbs, url: r.url, error: r.error });
  }

  return NextResponse.json({ results });
}
