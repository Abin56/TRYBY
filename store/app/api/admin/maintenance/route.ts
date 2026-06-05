import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { getMaintenanceState, setMaintenanceState } from "@/lib/maintenance";
import { logAudit, getAdminProfileId } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!canAccess(session, "settings:read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getMaintenanceState());
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!canAccess(session, "settings:write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const updatedBy = session!.user.id;
  const state = await setMaintenanceState(body, updatedBy);

  const adminId = await getAdminProfileId(updatedBy);
  if (adminId) {
    logAudit({
      adminId,
      action:       state.enabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
      resourceType: "system",
      resourceName: "maintenance",
      newValue:     state,
      req,
    });
  }

  return NextResponse.json(state);
}
