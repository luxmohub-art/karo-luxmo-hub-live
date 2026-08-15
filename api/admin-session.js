// api/admin-session.js
// LUXMO HUB - Admin Session Verification API

import crypto from "crypto";

const COOKIE_NAME = "luxmo_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie || "";
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function base64UrlDecode(value) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function safeEqual(a, b) {
  try {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    if (aBuffer.length !== bBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}

function verifySessionToken(token, secret) {
  if (!token || !secret) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [encodedPayload, expiresAt, signature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedPayload}.${expiresAt}`)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const expiry = Number(expiresAt);

  if (!Number.isFinite(expiry)) {
    return null;
  }

  if (Date.now() >= expiry) {
    return null;
  }

  try {
    const payloadText = base64UrlDecode(encodedPayload);

    if (!payloadText) {
      return null;
    }

    const payload = JSON.parse(payloadText);

    if (!payload || payload.role !== "admin") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function sendJson(res, status, data) {
  res.status(status).json(data);
}

export default function handler(req, res) {
  // Only allow GET for checking the current admin session.
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, {
      success: false,
      error: "Method not allowed",
    });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    console.error("ADMIN_SESSION_SECRET is not configured.");

    return sendJson(res, 500, {
      success: false,
      authenticated: false,
      error: "Server configuration error",
    });
  }

  const token = getCookie(req, COOKIE_NAME);
  const session = verifySessionToken(token, secret);

  if (!session) {
    return sendJson(res, 401, {
      success: false,
      authenticated: false,
    });
  }

  return sendJson(res, 200, {
    success: true,
    authenticated: true,
    user: {
      role: "admin",
    },
    expiresAt: session.exp,
  });
}
