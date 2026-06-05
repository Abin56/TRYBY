/* eslint-disable @typescript-eslint/no-explicit-any */
﻿import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as _prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;
import { canAccess } from "@/lib/rbac";
import { logFraudAudit } from "@/lib/fraud";
// BlacklistType/BlacklistStatus will come from @prisma/client after `prisma generate`
type BlacklistType   = "EMAIL" | "PHONE" | "IP" | "ADDRESS";
type BlacklistStatus = "ACTIVE" | "LIFTED";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = 25;
  const skip     = (page - 1) * limit;
  const type     = searchParams.get("type") as BlacklistType | null;
  const status   = searchParams.get("status") as BlacklistStatus | null;
  const search   = searchParams.get("search") ?? "";
  const exportCsv= searchParams.get("export") === "csv";

  const where: Record<string, unknown> = {};
  if (type)   where.type   = type;
  if (status) where.status = status;
  else        where.status = "ACTIVE"; // default to active
  if (search) where.value  = { contains: search, mode: "insensitive" };

  if (exportCsv) {
    const rows = await prisma.blacklist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    10_000,
    });
    const header = "id,type,value,status,reason,added_by,hit_count,expires_at,created_at";
    const csv    = [
      header,
      ...rows.map(r => [
        r.id, r.type, `"${r.value.replace(/"/g, '""')}"`,
        r.status, r.reason ?? "", r.addedBy ?? "",
        r.hitCount, r.expiresAt?.toISOString() ?? "",
        r.createdAt.toISOString(),
      ].join(",")),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="blacklist-${Date.now()}.csv"`,
      },
    });
  }

  const [data, total, counts] = await Promise.all([
    prisma.blacklist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take:    limit,
    }),
    prisma.blacklist.count({ where }),
    prisma.blacklist.groupBy({
      by:    ["type"],
      _count: { type: true },
      where: { status: "ACTIVE" },
    }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    pages:  Math.ceil(total / limit),
    counts,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, value, reason, expiresAt } = await req.json().catch(() => ({}));
  if (!type || !value) {
    return NextResponse.json({ error: "type and value required" }, { status: 400 });
  }

  const entry = await prisma.blacklist.upsert({
    where:  { type_value: { type: type as BlacklistType, value } },
    create: {
      type:     type as BlacklistType,
      value,
      reason,
      status:   "ACTIVE",
      addedBy:  session!.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    update: {
      status:   "ACTIVE",
      reason,
      addedBy:  session!.user.id,
      liftedBy: null,
      liftedAt: null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  await logFraudAudit({
    actionType:  "BLACKLIST_ADD",
    performedBy: session!.user.id,
    targetId:    entry.id,
    targetType:  "blacklist",
    reason:      `${type}:${value}`,
  });

  return NextResponse.json({ ok: true, entry }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "risk:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, liftReason } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const entry = await prisma.blacklist.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.blacklist.update({
    where: { id },
    data:  {
      status:   "LIFTED",
      liftedBy: session!.user.id,
      liftedAt: new Date(),
      liftReason,
    },
  });

  await logFraudAudit({
    actionType:  "BLACKLIST_REMOVE",
    performedBy: session!.user.id,
    targetId:    id,
    targetType:  "blacklist",
    reason:      liftReason ?? `Lifted: ${entry.type}:${entry.value}`,
  });

  return NextResponse.json({ ok: true });
}

