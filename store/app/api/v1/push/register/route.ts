import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";
import { z } from "zod";

const schema = z.object({
  deviceId: z.string().min(1),
  fcmToken: z.string().min(1),
  apnsToken: z.string().optional(),
});

// POST — Register or update FCM/APNs push token for this device
export async function POST(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", details: body.error.flatten() }, { status: 400 });
  }

  const { deviceId, fcmToken, apnsToken } = body.data;

  if (session.deviceId !== deviceId) {
    return NextResponse.json({ error: "Device mismatch" }, { status: 403 });
  }

  await prisma.mobileDevice.updateMany({
    where: { userId: session.userId, deviceId },
    data:  { fcmToken, ...(apnsToken ? { apnsToken } : {}), lastSeenAt: new Date() },
  });

  // Enable push notifications in user preferences
  await prisma.notificationPreference.upsert({
    where:  { userId: session.userId },
    update: { pushEnabled: true, pushToken: fcmToken },
    create: { userId: session.userId, pushEnabled: true, pushToken: fcmToken },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — Unregister push token (user disabled notifications)
export async function DELETE(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deviceId = req.nextUrl.searchParams.get("deviceId") ?? session.deviceId;

  await prisma.mobileDevice.updateMany({
    where: { userId: session.userId, deviceId },
    data:  { fcmToken: null, apnsToken: null },
  });

  await prisma.notificationPreference.upsert({
    where:  { userId: session.userId },
    update: { pushEnabled: false, pushToken: null },
    create: { userId: session.userId, pushEnabled: false },
  });

  return NextResponse.json({ ok: true });
}
