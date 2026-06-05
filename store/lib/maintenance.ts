/**
 * Maintenance mode — read/write helpers.
 * The check is intentionally simple: one row in MaintenanceWindow.
 * proxy.ts (Edge) calls the public API endpoint; server components use this directly.
 */

import { prisma } from "@/lib/db";

export interface MaintenanceState {
  enabled:      boolean;
  title:        string;
  message:      string;
  estimatedEnd: Date | null;
  allowedIps:   string[];
}

const DEFAULTS: MaintenanceState = {
  enabled:      false,
  title:        "We'll be right back",
  message:      "TRYBY is undergoing scheduled maintenance. We'll be back shortly — usually within 30 minutes.",
  estimatedEnd: null,
  allowedIps:   [],
};

/** Get current maintenance state (or defaults if no row exists). */
export async function getMaintenanceState(): Promise<MaintenanceState> {
  try {
    const row = await prisma.maintenanceWindow.findFirst({ orderBy: { createdAt: "desc" } });
    if (!row) return DEFAULTS;
    return {
      enabled:      row.enabled,
      title:        row.title,
      message:      row.message,
      estimatedEnd: row.estimatedEnd,
      allowedIps:   row.allowedIps,
    };
  } catch {
    return DEFAULTS; // fail open — DB error never blocks admins
  }
}

/** Enable or disable maintenance mode. Creates the row if needed. */
export async function setMaintenanceState(
  state: Partial<MaintenanceState>,
  updatedBy: string
): Promise<MaintenanceState> {
  const existing = await prisma.maintenanceWindow.findFirst({ orderBy: { createdAt: "desc" } });

  const data = {
    enabled:      state.enabled      ?? existing?.enabled      ?? false,
    title:        state.title        ?? existing?.title        ?? DEFAULTS.title,
    message:      state.message      ?? existing?.message      ?? DEFAULTS.message,
    estimatedEnd: state.estimatedEnd ?? existing?.estimatedEnd ?? null,
    allowedIps:   state.allowedIps   ?? existing?.allowedIps   ?? [],
    updatedBy,
  };

  if (existing) {
    await prisma.maintenanceWindow.update({ where: { id: existing.id }, data });
  } else {
    await prisma.maintenanceWindow.create({ data });
  }

  return {
    enabled:      data.enabled,
    title:        data.title,
    message:      data.message,
    estimatedEnd: data.estimatedEnd,
    allowedIps:   data.allowedIps,
  };
}

/** Check if an IP is in the bypass whitelist. */
export function isIpWhitelisted(ip: string, allowedIps: string[]): boolean {
  if (!allowedIps.length) return false;
  return allowedIps.some(allowed => {
    const clean = allowed.trim();
    return clean === ip || clean === "*";
  });
}
