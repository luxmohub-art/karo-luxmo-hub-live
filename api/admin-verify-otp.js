// api/admin-verify-otp.js
// LUXMO HUB - Google Authenticator Admin Login

import crypto from "crypto";

const COOKIE_NAME = "luxmo_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

// Constant-time string comparison
function safeEqual(a, b) {
  try {
    const aBuffer = Buffer.from(String(a));
    const bBuffer = Buffer.from(String(b));

    if (aBuffer.length !== bBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}

// Base32 decoder for Google Authenticator secret
function base32Decode(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  const value = String(input || "")
    .toUpperCase()
    .replace(/[\s=-]/g, "");

  if (!value) {
    return null;
  }

  let bits = "";
  const output = [];

  for (const char of value) {
    const index = alphabet.indexOf(char);

    if (index === -1) {
      return null;
    }

    bits += index.toString(2).padStart(5, "0");
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    output.push(
      parseInt(bits.slice(i, i + 8), 2)
    );
  }

  if (output.length === 0) {
    return null;
  }

  return Buffer.from(output);
}

// Generate 6-digit TOTP
function generateTotp(secret, counter) {
  const key = base32Decode(secret);

  if (!key) {
    return null;
  }

  const counterBuffer = Buffer.alloc(8);

  counterBuffer.writeUInt32BE(
    Math.floor(counter / 0x100000000),
    0
  );

  counterBuffer.writeUInt32BE(
    counter >>> 0,
    4
  );

  const hmac = crypto
    .createHmac("sha1", key)
    .update(counterBuffer)
    .digest();

  const offset =
    hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 1000000).padStart(6, "0");
}

// Verify Google Authenticator TOTP
function verifyTotp(otp, secret) {
  if (!/^\d{6}$/.test(otp)) {
    return false;
  }

  if (!secret) {
    return false;
  }

  const currentCounter =
    Math.floor(Date.now() / 1000 / 30);

  // Previous / current / next 30-second window
  for (let offset = -1; offset <= 1; offset++) {
    const expected = generateTotp(
      secret,
      currentCounter + offset
    );

    if (
      expected &&
      safeEqual(otp, expected)
    ) {
      return true;
    }
  }

  return false;
}

// Create secure admin session
function createSessionToken(secret) {
  const expiresAt =
    Date.now() + SESSION_MAX_AGE * 1000;

  const payload = {
    role: "admin",
    expiresAt,
  };

  const encodedPayload =
    base64UrlEncode(
      JSON.stringify(payload)
    );

  const signature = crypto
    .createHmac("sha256", secret)
    .update(
      `${encodedPayload}.${expiresAt}`
    )
    .digest("base64url");

  return `${encodedPayload}.${expiresAt}.${signature}`;
}

function getRequestBody(req) {
  if (
    req.body &&
    typeof req.body === "object"
  ) {
    return req.body;
  }

  return {};
}

export default async function handler(req, res) {
  // Only POST is allowed
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return sendJson(res, 405, {
      success: false,
      error: "Method not allowed",
    });
  }

  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  const totpSecret =
    process.env.ADMIN_TOTP_SECRET;

  // Check session secret
  if (!sessionSecret) {
    console.error(
      "ADMIN_SESSION_SECRET is not configured."
    );

    return sendJson(res, 500, {
      success: false,
      error: "Server configuration error",
    });
  }

  // Check TOTP secret
  if (!totpSecret) {
    console.error(
      "ADMIN_TOTP_SECRET is not configured."
    );

    return sendJson(res, 500, {
      success: false,
      error:
        "Google Authenticator is not configured.",
    });
  }

  try {
    const body = getRequestBody(req);

    const otp = String(
      body.otp || ""
    ).trim();

    // OTP must be exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return sendJson(res, 400, {
        success: false,
        error:
          "Please enter a valid 6-digit OTP.",
      });
    }

    // Verify TOTP
    const valid = verifyTotp(
      otp,
      totpSecret
    );

    if (!valid) {
      return sendJson(res, 401, {
        success: false,
        authenticated: false,
        error:
          "Incorrect or expired OTP.",
      });
    }

    // Create admin session
    const sessionToken =
      createSessionToken(
        sessionSecret
      );

    // Set secure HTTP-only cookie
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(
        sessionToken
      )}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
    );

    return sendJson(res, 200, {
      success: true,
      authenticated: true,
      user: {
        role: "admin",
      },
    });
  } catch (error) {
    console.error(
      "Admin OTP verification error:",
      error
    );

    return sendJson(res, 500, {
      success: false,
      error: "Internal server error.",
    });
  }
}
