import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
  name: z.string().min(2).max(60),
});

const emailSchema = z.object({
  email:           z.string().email(),
  currentPassword: z.string().min(1),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, "Password must be at least 8 characters"),
});

// GET — return current user profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  return NextResponse.json(user);
}

// PATCH — update name, email, or password
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, ...data } = await req.json().catch(() => ({}));

  // ── Update display name ──────────────────────────────────────────────────────
  if (action === "update_name") {
    const body = profileSchema.safeParse(data);
    if (!body.success) return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });

    const user = await prisma.user.update({
      where:  { id: session.user.id },
      data:   { name: body.data.name.trim() },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(user);
  }

  // ── Update email ─────────────────────────────────────────────────────────────
  if (action === "update_email") {
    const body = emailSchema.safeParse(data);
    if (!body.success) return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });

    // Verify current password before allowing email change
    const user = await prisma.user.findUnique({
      where:   { id: session.user.id },
      include: { accounts: { where: { provider: "credentials" } } },
    });

    const credAccount = user?.accounts?.[0];
    if (!credAccount?.access_token) {
      return NextResponse.json({ error: "Email change is not available for Google sign-in accounts" }, { status: 422 });
    }

    const valid = await bcrypt.compare(body.data.currentPassword, credAccount.access_token);
    if (!valid) return NextResponse.json({ error: { currentPassword: ["Incorrect password"] } }, { status: 400 });

    const newEmail = body.data.email.toLowerCase().trim();

    // Check new email not already taken
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: { email: ["Email is already in use"] } }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data:  { email: newEmail },
      }),
      prisma.account.update({
        where: { id: credAccount.id },
        data:  { providerAccountId: newEmail },
      }),
    ]);

    return NextResponse.json({ ok: true });
  }

  // ── Change password ──────────────────────────────────────────────────────────
  if (action === "change_password") {
    const body = passwordSchema.safeParse(data);
    if (!body.success) return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });

    const user = await prisma.user.findUnique({
      where:   { id: session.user.id },
      include: { accounts: { where: { provider: "credentials" } } },
    });

    const credAccount = user?.accounts?.[0];
    if (!credAccount?.access_token) {
      return NextResponse.json({ error: "Password change is not available for Google sign-in accounts" }, { status: 422 });
    }

    const valid = await bcrypt.compare(body.data.currentPassword, credAccount.access_token);
    if (!valid) return NextResponse.json({ error: { currentPassword: ["Incorrect current password"] } }, { status: 400 });

    if (body.data.currentPassword === body.data.newPassword) {
      return NextResponse.json({ error: { newPassword: ["New password must be different from current password"] } }, { status: 400 });
    }

    const hash = await bcrypt.hash(body.data.newPassword, 12);
    await prisma.account.update({
      where: { id: credAccount.id },
      data:  { access_token: hash },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
