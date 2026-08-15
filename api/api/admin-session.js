import crypto from "crypto";

const COOKIE_NAME = "luxmo_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie || "";

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
  return Buffer.from(value, "base64url").toString("utf8");
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
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    if (payload.role !== "admin") {
      return null;
    }

    if (!payload.admin) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    console.error(
      "ADMIN_SESSION_SECRET is missing or too short."
    );

    return res.status(500).json({
      success: false,
      authenticated: false,
      message: "Admin session configuration error.",
    });
  }

  const token = getCookie(req, COOKIE_NAME);

  if (!token) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Admin session not found.",
    });
  }

  const session = verifySessionToken(token, secret);

  if (!session) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Invalid or expired admin session.",
    });
  }

  return res.status(200).json({
    success: true,
    authenticated: true,
    admin: true,
    role: "admin",
    expiresAt: Number(session.expiresAt || 0) || null,
  });
}
