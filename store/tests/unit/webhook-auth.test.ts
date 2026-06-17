import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  isShiprocketSecretConfigured,
  verifyShiprocketSignature,
  isDelhiveryTokenConfigured,
  verifyDelhiveryToken,
} from "../../lib/shipping/webhook-auth";

// Helper: produce the signature Shiprocket would send for a given body+secret.
function sign(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

const SECRET = "sr_test_secret_value";
const BODY = JSON.stringify({ awb: "12345", current_status: "DELIVERED" });

// ─────────────────────────────────────────────────────────────────────────────
// Shiprocket — HMAC signature
// ─────────────────────────────────────────────────────────────────────────────

describe("isShiprocketSecretConfigured", () => {
  test("returns false for null / undefined / empty (fail closed)", () => {
    assert.equal(isShiprocketSecretConfigured(null), false);
    assert.equal(isShiprocketSecretConfigured(undefined), false);
    assert.equal(isShiprocketSecretConfigured(""), false);
  });
  test("returns true for a real secret", () => {
    assert.equal(isShiprocketSecretConfigured(SECRET), true);
  });
});

describe("verifyShiprocketSignature", () => {
  test("FAIL CLOSED: missing secret is never accepted, even with a signature", () => {
    const sig = sign(BODY, SECRET);
    assert.equal(verifyShiprocketSignature(BODY, sig, null), false);
    assert.equal(verifyShiprocketSignature(BODY, sig, undefined), false);
    assert.equal(verifyShiprocketSignature(BODY, sig, ""), false);
  });

  test("rejects when signature is missing", () => {
    assert.equal(verifyShiprocketSignature(BODY, null, SECRET), false);
    assert.equal(verifyShiprocketSignature(BODY, undefined, SECRET), false);
    assert.equal(verifyShiprocketSignature(BODY, "", SECRET), false);
  });

  test("accepts a correctly-signed body", () => {
    const sig = sign(BODY, SECRET);
    assert.equal(verifyShiprocketSignature(BODY, sig, SECRET), true);
  });

  test("rejects a tampered body (same length signature, different digest)", () => {
    const sig = sign(BODY, SECRET);
    const tamperedBody = JSON.stringify({ awb: "12345", current_status: "RTO" });
    assert.equal(verifyShiprocketSignature(tamperedBody, sig, SECRET), false);
  });

  test("rejects a signature made with the wrong secret", () => {
    const sig = sign(BODY, "attacker_secret");
    assert.equal(verifyShiprocketSignature(BODY, sig, SECRET), false);
  });

  test("rejects a wrong-length signature without throwing", () => {
    assert.equal(verifyShiprocketSignature(BODY, "deadbeef", SECRET), false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Delhivery — shared token
// ─────────────────────────────────────────────────────────────────────────────

const DL_SECRET = "dl_shared_token_value";

describe("isDelhiveryTokenConfigured", () => {
  test("returns false for null / undefined / empty / placeholder (fail closed)", () => {
    assert.equal(isDelhiveryTokenConfigured(null), false);
    assert.equal(isDelhiveryTokenConfigured(undefined), false);
    assert.equal(isDelhiveryTokenConfigured(""), false);
    assert.equal(isDelhiveryTokenConfigured("REPLACE_WITH_REAL_TOKEN"), false);
    assert.equal(isDelhiveryTokenConfigured("REPLACE"), false);
  });
  test("returns true for a real token", () => {
    assert.equal(isDelhiveryTokenConfigured(DL_SECRET), true);
  });
});

describe("verifyDelhiveryToken", () => {
  test("FAIL CLOSED: missing/placeholder secret is never accepted", () => {
    assert.equal(verifyDelhiveryToken(DL_SECRET, null), false);
    assert.equal(verifyDelhiveryToken(DL_SECRET, undefined), false);
    assert.equal(verifyDelhiveryToken(DL_SECRET, ""), false);
    assert.equal(verifyDelhiveryToken("REPLACE_ME", "REPLACE_ME"), false); // placeholder matches but is not a real secret
  });

  test("rejects when token is missing", () => {
    assert.equal(verifyDelhiveryToken(null, DL_SECRET), false);
    assert.equal(verifyDelhiveryToken(undefined, DL_SECRET), false);
    assert.equal(verifyDelhiveryToken("", DL_SECRET), false);
  });

  test("accepts a matching token", () => {
    assert.equal(verifyDelhiveryToken(DL_SECRET, DL_SECRET), true);
  });

  test("rejects a non-matching token", () => {
    assert.equal(verifyDelhiveryToken("wrong_token", DL_SECRET), false);
  });

  test("rejects a token of different length without throwing", () => {
    assert.equal(verifyDelhiveryToken("short", DL_SECRET), false);
  });
});
