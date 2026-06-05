import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email:    z.string().email(),
  token:    z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email, token, password } = body.data;
  const normalEmail = email.toLowerCase().trim();

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: normalEmail, token },
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: normalEmail } });
    return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalEmail },
    include: {
      accounts:     { where: { provider: "credentials" } },
      adminProfile: { select: { id: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  // Update password in the correct location depending on role
  if (user.adminProfile) {
    await prisma.adminProfile.update({
      where: { id: user.adminProfile.id },
      data:  { passwordHash: hash },
    });
  } else if (user.accounts[0]) {
    await prisma.account.update({
      where: { id: user.accounts[0].id },
      data:  { access_token: hash },
    });
  } else {
    return NextResponse.json({ error: "No password account found." }, { status: 400 });
  }

  // Invalidate the token
  await prisma.verificationToken.deleteMany({ where: { identifier: normalEmail } });

  return NextResponse.json({ ok: true });
}
