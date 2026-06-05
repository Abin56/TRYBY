import { NextRequest, NextResponse } from "next/server";
import { validateMobileToken, generateBiometricChallenge, storeBiometricChallenge } from "@/lib/mobile";

// GET — Issue a biometric challenge nonce for the authenticated user.
// The mobile app signs this with the device's biometric key and sends it back.
export async function GET(req: NextRequest) {
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateMobileToken(bearer);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const challenge = generateBiometricChallenge();
  storeBiometricChallenge(challenge, session.userId);

  return NextResponse.json({ challenge, expiresIn: 60 });
}
