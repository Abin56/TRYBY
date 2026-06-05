import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { issueMobileTokens } from "@/lib/mobile";
import { sendWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name:        z.string().min(1).max(100),
  email:       z.string().email(),
  password:    z.string().min(8).max(100),
  phone:       z.string().optional(),
  deviceId:    z.string().min(1),
  platform:    z.enum(["ANDROID", "IOS", "UNKNOWN"]).default("UNKNOWN"),
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

  const { name, email, password, phone, deviceId, platform, deviceModel, osVersion, appVersion, fcmToken } = body.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email:    email.toLowerCase(),
      phone:    phone ?? null,
      role:     "CUSTOMER",
      accounts: {
        create: {
          type:             "credentials",
          provider:         "credentials",
          providerAccountId: email.toLowerCase(),
          access_token:     passwordHash,
        },
      },
    },
  });

  // Device registration
  await prisma.mobileDevice.create({
    data: { userId: user.id, deviceId, platform, deviceModel, osVersion, appVersion, fcmToken },
  });

  const tokens = await issueMobileTokens(user.id, deviceId);

  sendWelcomeEmail(user.email!, { name: user.name! }).catch(() => null);

  return NextResponse.json({
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
    ...tokens,
  }, { status: 201 });
}
