import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { getAllFlags, setFlag, invalidateCache, DEFAULT_FLAGS } from "@/lib/feature-flags";
import { logAudit, getAdminProfileId } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  key:         z.string().min(1),
  enabled:     z.boolean(),
  name:        z.string().optional(),
  description: z.string().optional(),
  rolloutPct:  z.number().int().min(0).max(100).optional(),
  metadata:    z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!canAccess(session, "settings:read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [flags, defaults] = await Promise.all([
    getAllFlags(),
    Promise.resolve(DEFAULT_FLAGS),
  ]);

  // Merge DB flags with defaults to show all known flags even if not yet in DB
  const dbKeys = new Set(flags.map(f => f.key));
  const merged = [
    ...flags,
    ...defaults.filter(d => !dbKeys.has(d.key)).map(d => ({ ...d, id: "", updatedBy: null, rolloutPct: 100, allowedRoles: [], metadata: null, createdAt: new Date(), updatedAt: new Date() })),
  ];

  return NextResponse.json(merged);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "settings:write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { key, enabled, metadata } = body.data;
  const updatedBy = session!.user.id;

  await setFlag(key, enabled, updatedBy, metadata);
  invalidateCache(key);

  const adminId = await getAdminProfileId(updatedBy);
  if (adminId) {
    logAudit({ adminId, action: "FEATURE_FLAG_UPDATED", resourceType: "feature_flag", resourceId: key,
      resourceName: key, newValue: { enabled }, req });
  }

  return NextResponse.json({ ok: true, key, enabled });
}

// Bulk update
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "settings:write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action } = await req.json().catch(() => ({}));

  if (action === "seed") {
    const { seedDefaultFlags } = await import("@/lib/feature-flags");
    await seedDefaultFlags();
    invalidateCache();
    return NextResponse.json({ ok: true, seeded: DEFAULT_FLAGS.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
