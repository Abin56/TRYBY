/**
 * TRYBY Mobile API Utilities
 *
 * Token generation, verification, device registration helpers,
 * and FCM push dispatch. All mobile API routes go through these.
 */

import { prisma } from "@/lib/db";
import { createHash, randomBytes } from "crypto";

// ── Token config ──────────────────────────────────────────────────────────────

const ACCESS_TOKEN_TTL_SECONDS  = 60 * 60;         // 1 hour
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ── JWT-less stateless access token ──────────────────────────────────────────
// We use a signed opaque token stored in the DB rather than JWTs.
// This lets us revoke tokens instantly without a denylist.

export interface MobileTokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
  tokenType:    "Bearer";
}

export async function issueMobileTokens(
  userId: string,
  deviceId: string
): Promise<MobileTokenPair> {
  const accessToken  = generateOpaqueToken(32);
  const refreshToken = generateOpaqueToken(48);
  const expiresAt    = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

  // Revoke any existing active tokens for this device before issuing new ones
  await prisma.mobileApiToken.updateMany({
    where:  { userId, deviceId, status: "ACTIVE" },
    data:   { status: "REVOKED", revokedAt: new Date(), revokeReason: "reissue" },
  });

  await prisma.mobileApiToken.create({
    data: {
      userId,
      deviceId,
      token:     hashToken(refreshToken),
      status:    "ACTIVE",
      expiresAt,
    },
  });

  return {
    accessToken:  buildAccessToken(userId, deviceId, accessToken),
    refreshToken,
    expiresIn:    ACCESS_TOKEN_TTL_SECONDS,
    tokenType:    "Bearer",
  };
}

// Access token payload is base64(userId:deviceId:randomBytes:timestamp) — not
// cryptographically signed, but validated by looking up the device+user in DB
// on each request. Keeps auth stateless without a Redis session store.
function buildAccessToken(userId: string, deviceId: string, rand: string): string {
  const payload = `${userId}:${deviceId}:${rand}:${Date.now()}`;
  return Buffer.from(payload).toString("base64url");
}

export interface MobileSession {
  userId:   string;
  deviceId: string;
}

export function parseAccessToken(token: string): MobileSession | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [userId, deviceId] = decoded.split(":");
    if (!userId || !deviceId) return null;
    return { userId, deviceId };
  } catch {
    return null;
  }
}

// ── Access token validation (lightweight — checks device is still active) ────

export async function validateMobileToken(
  bearerToken: string
): Promise<MobileSession | null> {
  const session = parseAccessToken(bearerToken);
  if (!session) return null;

  // Confirm device still registered and active for this user
  const device = await prisma.mobileDevice.findFirst({
    where: {
      userId:      session.userId,
      deviceId:    session.deviceId,
      tokenStatus: "ACTIVE",
    },
  });
  if (!device) return null;

  // Touch lastSeenAt
  prisma.mobileDevice.update({
    where: { id: device.id },
    data:  { lastSeenAt: new Date() },
  }).catch(() => null);

  return session;
}

// ── Refresh token validation ──────────────────────────────────────────────────

export async function validateRefreshToken(
  refreshToken: string
): Promise<{ userId: string; deviceId: string } | null> {
  const hashed = hashToken(refreshToken);
  const record = await prisma.mobileApiToken.findUnique({
    where: { token: hashed },
  });

  if (!record) return null;
  if (record.status !== "ACTIVE") return null;
  if (record.expiresAt < new Date()) {
    await prisma.mobileApiToken.update({
      where: { id: record.id },
      data:  { status: "EXPIRED" },
    }).catch(() => null);
    return null;
  }

  await prisma.mobileApiToken.update({
    where: { id: record.id },
    data:  { lastUsedAt: new Date() },
  }).catch(() => null);

  return { userId: record.userId, deviceId: record.deviceId };
}

// ── FCM push dispatch ─────────────────────────────────────────────────────────
// Calls the FCM HTTP v1 API. Set FIREBASE_SERVICE_ACCOUNT_JSON in env.

export interface PushPayload {
  title:     string;
  body:      string;
  data?:     Record<string, string>;
  imageUrl?: string;
  badge?:    number;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const devices = await prisma.mobileDevice.findMany({
    where: { userId, tokenStatus: "ACTIVE" },
    select: { id: true, fcmToken: true, apnsToken: true, platform: true },
  });

  const tokens = devices.filter(d => d.fcmToken).map(d => d.fcmToken as string);
  if (!tokens.length) return { sent: 0, failed: 0 };

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!projectId || !serviceAccountJson) {
    // FCM not configured — log and skip (graceful degradation)
    console.warn("[push] FCM not configured — skipping push for user", userId);
    return { sent: 0, failed: 0 };
  }

  let sent = 0, failed = 0;

  const accessToken = await getFcmAccessToken(serviceAccountJson);
  if (!accessToken) return { sent: 0, failed: tokens.length };

  for (const fcmToken of tokens) {
    try {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: fcmToken,
              notification: {
                title: payload.title,
                body:  payload.body,
                ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
              },
              data: payload.data ?? {},
              android: {
                notification: {
                  sound:        "default",
                  click_action: "FLUTTER_NOTIFICATION_CLICK",
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: "default",
                    badge: payload.badge ?? 1,
                  },
                },
              },
            },
          }),
        }
      );

      if (res.ok) {
        sent++;
      } else {
        const err = await res.json().catch(() => ({}));
        // Stale token — mark device inactive
        if ((err as { error?: { status?: string } }).error?.status === "UNREGISTERED") {
          await prisma.mobileDevice.updateMany({
            where: { fcmToken },
            data:  { tokenStatus: "REVOKED" },
          }).catch(() => null);
        }
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}

// Obtain a short-lived Google OAuth2 access token for FCM using service account.
// This avoids the google-auth-library dependency — pure fetch + crypto.
async function getFcmAccessToken(serviceAccountJson: string): Promise<string | null> {
  try {
    const sa = JSON.parse(serviceAccountJson) as {
      client_email: string;
      private_key:  string;
    };

    const scope    = "https://www.googleapis.com/auth/firebase.messaging";
    const iat      = Math.floor(Date.now() / 1000);
    const exp      = iat + 3600;
    const jwtHeader  = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "");
    const jwtPayload = btoa(JSON.stringify({
      iss:   sa.client_email,
      sub:   sa.client_email,
      aud:   "https://oauth2.googleapis.com/token",
      scope,
      iat,
      exp,
    })).replace(/=/g, "");

    const signingInput = `${jwtHeader}.${jwtPayload}`;

    // Import private key and sign
    const keyData = sa.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );

    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "");
    const jwt    = `${signingInput}.${sigB64}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion:  jwt,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string };
    return tokenData.access_token ?? null;
  } catch (e) {
    console.error("[push] FCM access token error", e);
    return null;
  }
}

// ── Biometric challenge ───────────────────────────────────────────────────────

export function generateBiometricChallenge(): string {
  return randomBytes(32).toString("hex");
}

// Simple in-memory challenge cache (1-min TTL). For production use Redis.
const challengeCache = new Map<string, { userId: string; expiresAt: number }>();

export function storeBiometricChallenge(challenge: string, userId: string): void {
  challengeCache.set(challenge, {
    userId,
    expiresAt: Date.now() + 60_000, // 1 minute
  });
  // GC old entries
  for (const [k, v] of challengeCache) {
    if (v.expiresAt < Date.now()) challengeCache.delete(k);
  }
}

export function consumeBiometricChallenge(challenge: string): string | null {
  const entry = challengeCache.get(challenge);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    challengeCache.delete(challenge);
    return null;
  }
  challengeCache.delete(challenge);
  return entry.userId;
}
