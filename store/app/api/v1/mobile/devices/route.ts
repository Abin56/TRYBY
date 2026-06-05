import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";
import { z } from "zod";

// GET — List registered devices for the user
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const devices = await prisma.mobileDevice.findMany({
    where:   { userId: session.userId },
    orderBy: { lastSeenAt: "desc" },
    select:  {
      id:          true,
      deviceId:    true,
      platform:    true,
      deviceModel: true,
      osVersion:   true,
      appVersion:  true,
      tokenStatus: true,
      lastSeenAt:  true,
      createdAt:   true,
      biometricKey: false, // never expose public key over the wire
    },
  });

  return NextResponse.json({
    devices,
    currentDeviceId: session.deviceId,
  });
}

const updateSchema = z.object({
  deviceId:    z.string().min(1),
  appVersion:  z.string().optional(),
  osVersion:   z.string().optional(),
  deviceModel: z.string().optional(),
  fcmToken:    z.string().optional(),
});

// PATCH — Update device metadata (called on app launch / update)
export async function PATCH(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { deviceId, ...updates } = body.data;
  if (session.deviceId !== deviceId) return NextResponse.json({ error: "Device mismatch" }, { status: 403 });

  await prisma.mobileDevice.updateMany({
    where: { userId: session.userId, deviceId },
    data:  { ...updates, lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — Remove a device (logout from specific device)
export async function DELETE(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });

  await prisma.mobileDevice.updateMany({
    where: { userId: session.userId, deviceId },
    data:  { tokenStatus: "REVOKED" },
  });

  await prisma.mobileApiToken.updateMany({
    where: { userId: session.userId, deviceId, status: "ACTIVE" },
    data:  { status: "REVOKED", revokedAt: new Date(), revokeReason: "device_removed" },
  });

  return NextResponse.json({ ok: true });
}
