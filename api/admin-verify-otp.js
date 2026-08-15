import crypto from "crypto";

const COOKIE_NAME = "luxmo_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

// Shared in-memory OTP store.
// admin-send-otp.js must use the same global store.
const otpStore =
  globalThis.__LUXMO_ADMIN_OTP_STORE__ ||
  (globalThis.__LUXMO_ADMIN_OTP_STORE__ = new Map());

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function createSessionToken(secret) {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;

  const payload = {
    role: "admin",
    expiresAt,
  };

  const encodedPayload = base64UrlEncode(
    JSON.stringify(payload)
  );

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedPayload}.${expiresAt}`)
    .digest("base64url");

  return `${encodedPayload}.${expiresAt}.${signature}`;
}

function getRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return sendJson(res, 405, {
      success: false,
      error: "Method not allowed",
    });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    console.error(
      "ADMIN_SESSION_SECRET is not configured"
    );

    return sendJson(res, 500, {
      success: false,
      error: "Server configuration error",
    });
  }

  try {
    const body = getRequestBody(req);

    const otp = String(body.otp || "").trim();

    const requestId = String(
      body.requestId ||
      body.email ||
      body.identifier ||
      "admin"
    ).trim();

    if (!/^\d{6}$/.test(otp)) {
      return sendJson(res, 400, {
        success: false,
        error: "Please enter a valid 6-digit OTP.",
      });
    }

    const record = otpStore.get(requestId);

    if (!record) {
      return sendJson(res, 401, {
        success: false,
        error:
          "OTP expired or not found. Please request a new OTP.",
      });
    }

    if (
      !record.expiresAt ||
      Date.now() > record.expiresAt
    ) {
      otpStore.delete(requestId);

      return sendJson(res, 401, {
        success: false,
        error:
          "OTP has expired. Please request a new OTP.",
      });
    }

    if (
      typeof record.attempts === "number" &&
      record.attempts >= MAX_ATTEMPTS
    ) {
      otpStore.delete(requestId);

      return sendJson(res, 429, {
        success: false,
        error:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    record.attempts =
      (record.attempts || 0) + 1;

    const suppliedOtp = Buffer.from(otp);
    const storedOtp = Buffer.from(
      String(record.otp || "")
    );

    const sameLength =
      suppliedOtp.length === storedOtp.length;

    const valid =
      sameLength &&
      crypto.timingSafeEqual(
        suppliedOtp,
        storedOtp
      );

    if (!valid) {
      if (record.attempts >= MAX_ATTEMPTS) {
        otpStore.delete(requestId);

        return sendJson(res, 429, {
          success: false,
          error:
            "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      return sendJson(res, 401, {
        success: false,
        error: "Incorrect OTP.",
        attemptsRemaining:
          MAX_ATTEMPTS - record.attempts,
      });
    }

    // OTP is single-use.
    otpStore.delete(requestId);

    const sessionToken =
      createSessionToken
