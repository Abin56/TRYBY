import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateRefreshToken, issueMobileTokens } from "@/lib/mobile";
import { z } from "zod";

const schema = z.object({
  refreshToken: z.string().min(1),
  deviceId:     z.string().min(1),
  appVersion:   z.string().optional(),
  fcmToken:     z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { refreshToken, deviceId, appVersion, fcmToken } = body.data;

  const session = await validateRefreshToken(refreshToken);
  if (!session || session.deviceId !== deviceId) {
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }

  // Update device metadata if provided
  const deviceUpdates: Record<string, unknown> = { lastSeenAt: new Date() };
  if (appVersion) deviceUpdates.appVersion = appVersion;
  if (fcmToken)   deviceUpdates.fcmToken   = fcmToken;

  await prisma.mobileDevice.updateMany({
    where: { userId: session.userId, deviceId },
    data:  deviceUpdates,
  });

  const tokens = await issueMobileTokens(session.userId, deviceId);

  return NextResponse.json(tokens);
}
