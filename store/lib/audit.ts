import { prisma } from "@/lib/db";
import { AuditAction, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

export type { AuditAction };

interface AuditPayload {
  adminId:       string;
  action:        AuditAction;
  resourceType?: string;
  resourceId?:   string;
  resourceName?: string;
  oldValue?:     unknown;
  newValue?:     unknown;
  metadata?:     Record<string, unknown>;
  req?:          NextRequest;
}

// Fire-and-forget — never throws. Audit failures must not break the main flow.
export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId:      payload.adminId,
        action:       payload.action,
        resourceType: payload.resourceType ?? null,
        resourceId:   payload.resourceId   ?? null,
        resourceName: payload.resourceName ?? null,
        oldValue:     payload.oldValue != null
          ? payload.oldValue as Prisma.InputJsonValue
          : Prisma.JsonNull,
        newValue:     payload.newValue != null
          ? payload.newValue as Prisma.InputJsonValue
          : Prisma.JsonNull,
        metadata:     payload.metadata != null
          ? payload.metadata as Prisma.InputJsonValue
          : undefined,
        ipAddress:    payload.req?.headers.get("x-forwarded-for")?.split(",")[0].trim()
                      ?? payload.req?.headers.get("x-real-ip")
                      ?? null,
        userAgent:    payload.req?.headers.get("user-agent") ?? null,
      },
    });
  } catch {
    // Never propagate — audit is observational
  }
}

export async function getAdminProfileId(userId: string): Promise<string | null> {
  const profile = await prisma.adminProfile.findUnique({
    where:  { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

/**
 * Resolve an AdminProfile.id to use as the actor for system-generated audit events
 * (webhooks, crons). Prefers SUPER_ADMIN; falls back to any non-disabled admin.
 * Returns null when no admin exists yet (e.g. fresh install) — callers must guard.
 */
export async function getSystemAdminProfileId(): Promise<string | null> {
  const profile = await prisma.adminProfile.findFirst({
    where:  { isDisabled: false },
    orderBy: [{ adminRole: "asc" }, { createdAt: "asc" }], // SUPER_ADMIN sorts first alphabetically
    select: { id: true },
  });
  return profile?.id ?? null;
}

/**
 * Log an audit entry for a system-driven action (webhook, cron, internal route).
 * Uses the first available super-admin as the actor.
 * Fire-and-forget — never throws.
 */
export async function logSystemAudit(
  payload: Omit<AuditPayload, "adminId" | "req">
): Promise<void> {
  const adminId = await getSystemAdminProfileId();
  if (!adminId) return; // no admin yet — skip silently
  await logAudit({ ...payload, adminId });
}
