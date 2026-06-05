import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/login-protection";

const schema = z.object({
  name:     z.string().min(2).max(60),
  email:    z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, "/api/auth/register", RATE_LIMITS.register);
  if (!rl.allowed) {
    await logSecurityEvent({ type: "RATE_LIMIT_HIT", ip: rl.ip, route: "/api/auth/register" });
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl, RATE_LIMITS.register.limit) }
    );
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, password } = body.data;
  const normalEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalEmail } });
  if (existing) {
    return NextResponse.json({ error: { email: ["Email already registered"] } }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalEmail,
      accounts: {
        create: {
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: normalEmail,
          access_token:      hash,
        },
      },
    },
  });

  await logSecurityEvent({ type: "REGISTRATION", ip: rl.ip, email: normalEmail });

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name },
    { status: 201, headers: rateLimitHeaders(rl, RATE_LIMITS.register.limit) }
  );
}
