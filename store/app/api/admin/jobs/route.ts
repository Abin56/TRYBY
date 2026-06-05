import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logAudit, getAdminProfileId } from "@/lib/audit";
import { JobStatus, Prisma } from "@prisma/client";

const actionSchema = z.object({
  jobId:  z.string(),
  action: z.enum(["retry", "cancel", "trigger"]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "settings:read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as JobStatus | null;
  const type   = searchParams.get("type");
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = 50;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type)   where.type   = type;

  const [jobs, total, stats] = await Promise.all([
    prisma.systemJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.systemJob.count({ where }),
    prisma.systemJob.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(stats.map(s => [s.status, s._count.id]));

  return NextResponse.json({ jobs, total, page, pages: Math.ceil(total / limit), statusCounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "settings:write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = actionSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { jobId, action } = body.data;
  const job = await prisma.systemJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let updated;
  if (action === "cancel") {
    updated = await prisma.systemJob.update({ where: { id: jobId }, data: { status: "CANCELLED" } });
  } else if (action === "retry") {
    if (job.attempts >= job.maxAttempts) {
      return NextResponse.json({ error: "Max retry attempts reached" }, { status: 409 });
    }
    updated = await prisma.systemJob.update({
      where: { id: jobId },
      data: { status: "PENDING", error: null, attempts: job.attempts + 1, startedAt: null, completedAt: null },
    });
  } else if (action === "trigger") {
    // Manual trigger — create a new job of the same type
    updated = await prisma.systemJob.create({
      data: {
        type: job.type, name: `${job.name} (manual)`,
        status: "PENDING", payload: job.payload ?? Prisma.DbNull,
        triggeredBy: session!.user.id,
      },
    });
  }

  const adminId = await getAdminProfileId(session!.user.id);
  if (adminId) {
    logAudit({ adminId, action: "JOB_TRIGGERED", resourceType: "system_job", resourceId: jobId,
      resourceName: job.name, newValue: { action }, req });
  }

  return NextResponse.json({ ok: true, job: updated });
}
