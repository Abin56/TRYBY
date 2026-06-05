import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";
import { z } from "zod";

const schema = z.object({
  deviceId:   z.string().min(1),
  publicKey:  z.string().min(1), // PEM or base64-encoded SPKI public key from device
});

// POST — Register biometric public key for a device.
// Called after the user enables biometric login in-app.
export async function POST(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", details: body.error.flatten() }, { status: 400 });
  }

  const { deviceId, publicKey } = body.data;

  if (session.deviceId !== deviceId) {
    return NextResponse.json({ error: "Device mismatch" }, { status: 403 });
  }

  await prisma.mobileDevice.updateMany({
    where: { userId: session.userId, deviceId },
    data:  { biometricKey: publicKey },
  });

  return NextResponse.json({ ok: true, message: "Biometric key registered successfully" });
}

// DELETE — Remove biometric key (disable biometric login for device)
export async function DELETE(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deviceId = req.nextUrl.searchParams.get("deviceId") ?? session.deviceId;

  await prisma.mobileDevice.updateMany({
    where: { userId: session.userId, deviceId },
    data:  { biometricKey: null },
  });

  return NextResponse.json({ ok: true });
}
