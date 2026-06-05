import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { issueMobileTokens } from "@/lib/mobile";
import { checkAccountLock, recordFailedLogin, recordSuccessfulLogin } from "@/lib/login-protection";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email:      z.string().email(),
  password:   z.string().min(1),
  deviceId:   z.string().min(1),
  platform:   z.enum(["ANDROID", "IOS", "UNKNOWN"]).default("UNKNOWN"),
  deviceModel: z.string().optional(),
  osVersion:   z.string().optional(),
  appVersion:  z.string().optional(),
  fcmToken:    z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", details: body.error.flatten() }, { status: 400 });
  }

  const { email, password, deviceId, platform, deviceModel, osVersion, appVersion, fcmToken } = body.data;

  const locked = await checkAccountLock(email.toLowerCase());
  if (locked) {
    return NextResponse.json(
      { error: "Account temporarily locked. Try again later." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      accounts: { where: { provider: "credentials" } },
    },
  });

  const fail = async (reason: string) => {
    await recordFailedLogin(email.toLowerCase(), null, reason);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  };

  if (!user || !user.isActive) return fail("user_not_found");
  if (user.role === "ADMIN") return fail("admin_not_allowed");

  const credAccount = user.accounts[0];
  if (!credAccount?.access_token) return fail("no_credentials");

  const valid = await bcrypt.compare(password, credAccount.access_token);
  if (!valid) return fail("invalid_password");

  await recordSuccessfulLogin(email.toLowerCase(), null);

  // Upsert mobile device record
  await prisma.mobileDevice.upsert({
    where:  { userId_deviceId: { userId: user.id, deviceId } },
    update: { platform, deviceModel, osVersion, appVersion, fcmToken, tokenStatus: "ACTIVE", lastSeenAt: new Date() },
    create: { userId: user.id, deviceId, platform, deviceModel, osVersion, appVersion, fcmToken },
  });

  const tokens = await issueMobileTokens(user.id, deviceId);

  return NextResponse.json({
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      image: user.image,
      role:  user.role,
    },
    ...tokens,
  });
}
