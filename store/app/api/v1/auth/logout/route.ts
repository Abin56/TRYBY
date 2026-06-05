import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken, hashToken } from "@/lib/mobile";
import { z } from "zod";

const schema = z.object({
  refreshToken: z.string().optional(),
  deviceId:     z.string().min(1),
  logoutAll:    z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => ({})));
  const { refreshToken, deviceId, logoutAll } = body.success ? body.data : { refreshToken: undefined, deviceId: session.deviceId, logoutAll: false };

  if (logoutAll) {
    // Revoke all tokens and mark all devices inactive
    await Promise.all([
      prisma.mobileApiToken.updateMany({
        where: { userId: session.userId, status: "ACTIVE" },
        data:  { status: "REVOKED", revokedAt: new Date(), revokeReason: "logout_all" },
      }),
      prisma.mobileDevice.updateMany({
        where: { userId: session.userId },
        data:  { tokenStatus: "REVOKED" },
      }),
    ]);
  } else {
    // Revoke this device only
    const updates: Promise<unknown>[] = [
      prisma.mobileDevice.updateMany({
        where: { userId: session.userId, deviceId },
        data:  { tokenStatus: "REVOKED" },
      }),
    ];

    if (refreshToken) {
      updates.push(
        prisma.mobileApiToken.updateMany({
          where: { token: hashToken(refreshToken) },
          data:  { status: "REVOKED", revokedAt: new Date(), revokeReason: "logout" },
        })
      );
    }

    await Promise.all(updates);
  }

  return NextResponse.json({ ok: true });
}
