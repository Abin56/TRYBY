import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateMobileToken } from "@/lib/mobile";

// GET — Return current user profile for mobile session
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.userId },
    select: {
      id:             true,
      name:           true,
      email:          true,
      image:          true,
      role:           true,
      phone:          true,
      phoneVerified:  true,
      createdAt:      true,
      loyaltyPoints:  {
        select: { points: true, type: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      notificationPrefs: {
        select: { pushEnabled: true, inApp: true, globalUnsubscribe: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const totalPoints = await prisma.loyaltyPoint.aggregate({
    where:  { userId: session.userId },
    _sum:   { points: true },
  });

  return NextResponse.json({
    ...user,
    loyaltyBalance: totalPoints._sum.points ?? 0,
  });
}
