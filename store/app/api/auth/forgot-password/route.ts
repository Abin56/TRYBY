import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/login-protection";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, "/api/auth/forgot-password", RATE_LIMITS.forgotPassword);
  if (!rl.allowed) {
    await logSecurityEvent({ type: "RATE_LIMIT_HIT", ip: rl.ip, route: "/api/auth/forgot-password" });
    return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl, RATE_LIMITS.forgotPassword.limit) });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ ok: true }); // silent fail to prevent enumeration

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Delete any existing token for this email before creating a new one,
    // because the composite unique key is (identifier, token) — we can't
    // upsert on identifier alone without knowing the old token value.
    await prisma.verificationToken.deleteMany({ where: { identifier: user.email! } });
    await prisma.verificationToken.create({
      data: { identifier: user.email!, token, expires },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email!)}`;

    // Send via Resend if configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && !resendKey.startsWith("REPLACE")) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? "orders@tryby.in",
          to: user.email,
          subject: "Reset your TRYBY password",
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="font-size:24px;font-weight:900;color:#0D0D0D;margin-bottom:8px">Reset your password</h2>
              <p style="color:#555;font-size:14px;margin-bottom:24px">Hi ${user.name ?? "there"},<br/>Click the button below to reset your TRYBY password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="display:inline-block;background:#F5C518;color:#0D0D0D;font-weight:900;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px">
                Reset Password
              </a>
              <p style="color:#AAA;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
            </div>
          `,
        }),
      });
    }
  }

  return NextResponse.json({ ok: true }); // always 200 — don't reveal whether email exists
}
