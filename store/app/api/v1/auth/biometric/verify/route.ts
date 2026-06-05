import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { consumeBiometricChallenge, issueMobileTokens } from "@/lib/mobile";
import { z } from "zod";

const schema = z.object({
  challenge:  z.string().min(1),
  signature:  z.string().min(1), // Base64-encoded signature from device biometric key
  deviceId:   z.string().min(1),
  appVersion: z.string().optional(),
  fcmToken:   z.string().optional(),
});

// POST — Verify a biometric challenge response and issue new tokens.
// The mobile app signs the challenge with the stored biometric key pair.
// We verify the signature against the stored public key.
export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { challenge, signature, deviceId, appVersion, fcmToken } = body.data;

  // Consume the challenge (one-time use)
  const userId = consumeBiometricChallenge(challenge);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 401 });
  }

  const device = await prisma.mobileDevice.findFirst({
    where: { userId, deviceId, tokenStatus: "ACTIVE" },
  });

  if (!device) {
    return NextResponse.json({ error: "Device not registered" }, { status: 401 });
  }

  if (!device.biometricKey) {
    return NextResponse.json({ error: "Biometric auth not set up for this device" }, { status: 400 });
  }

  // Verify ECDSA/RSA signature using the stored public key
  const verified = await verifyBiometricSignature(device.biometricKey, challenge, signature);
  if (!verified) {
    return NextResponse.json({ error: "Biometric verification failed" }, { status: 401 });
  }

  // Update device metadata
  const deviceUpdates: Record<string, unknown> = { lastSeenAt: new Date() };
  if (appVersion) deviceUpdates.appVersion = appVersion;
  if (fcmToken)   deviceUpdates.fcmToken   = fcmToken;

  await prisma.mobileDevice.update({
    where: { id: device.id },
    data:  deviceUpdates,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const tokens = await issueMobileTokens(userId, deviceId);

  return NextResponse.json({ user, ...tokens });
}

async function verifyBiometricSignature(
  publicKeyPem: string,
  challenge: string,
  signatureB64: string
): Promise<boolean> {
  try {
    const keyData = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/, "")
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\n/g, "");
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "spki",
      keyBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    const sigBuffer  = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const msgBuffer  = new TextEncoder().encode(challenge);

    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      sigBuffer,
      msgBuffer
    );
  } catch {
    return false;
  }
}
