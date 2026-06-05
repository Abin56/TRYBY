import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/mobile";
import { z } from "zod";

// Internal-only endpoint for sending push from server-side triggers.
// Protected by INTERNAL_API_SECRET.

const schema = z.object({
  userId:   z.string().min(1),
  title:    z.string().min(1).max(100),
  body:     z.string().min(1).max(500),
  data:     z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().optional(),
  badge:    z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", details: body.error.flatten() }, { status: 400 });
  }

  const { userId, title, body: pushBody, data, imageUrl, badge } = body.data;

  const result = await sendPushToUser(userId, { title, body: pushBody, data, imageUrl, badge });

  return NextResponse.json(result);
}

// Admin endpoint: broadcast push to a segment of users
const broadcastSchema = z.object({
  userIds:  z.array(z.string()).min(1).max(1000),
  title:    z.string().min(1).max(100),
  body:     z.string().min(1).max(500),
  data:     z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export async function PUT(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = broadcastSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request", details: body.error.flatten() }, { status: 400 });
  }

  const { userIds, title, body: pushBody, data, imageUrl } = body.data;

  const results = await Promise.allSettled(
    userIds.map(uid => sendPushToUser(uid, { title, body: pushBody, data, imageUrl }))
  );

  const totalSent   = results.reduce((s, r) => s + (r.status === "fulfilled" ? r.value.sent   : 0), 0);
  const totalFailed = results.reduce((s, r) => s + (r.status === "fulfilled" ? r.value.failed : 0), 0);

  return NextResponse.json({ sent: totalSent, failed: totalFailed, users: userIds.length });
}
