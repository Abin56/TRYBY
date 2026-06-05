import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  await prisma.newsletterSubscriber.upsert({
    where: { email: body.data.email },
    update: { isActive: true, unsubscribedAt: null },
    create: {
      email: body.data.email,
      userId: session?.user.id,
      source: body.data.source ?? "homepage",
    },
  });

  return NextResponse.json({ ok: true });
}
