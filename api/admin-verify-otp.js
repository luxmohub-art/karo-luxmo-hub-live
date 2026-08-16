// api/admin-verify-otp.js
// LUXMO HUB - Google Authenticator Admin Login
// Server-side TOTP verification + secure HTTP-only admin session

import crypto from "crypto";

const COOKIE_NAME = "luxmo_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const TOTP_PERIOD = 30; // Google Authenticator default
const TOTP_DIGITS = 6;

// ---------------------------------------------------------
// JSON RESPONSE
// ---------------------------------------------------------

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

// ---------------------------------------------------------
// BASE64URL
// ---------------------------------------------------------

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

// ---------------------------------------------------------
// CONSTANT-TIME COMPARISON
// ---------------------------------------------------------

function safeEqual(a, b) {
  try {
    const aBuffer = Buffer.from(String(a));
    const bBuffer = Buffer.from(String(b));

    if (aBuffer.length !== bBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      aBuffer,
      bBuffer
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------
// BASE32 DECODER
// Google Authenticator secrets normally use Base32.
// ---------------------------------------------------------

function base32Decode(input) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  const value = String(input || "")
    .toUpperCase()
    .replace(/[\s=-]/g, "");

  if (!value) {
    return null;
  }

  let bits = "";
  const bytes = [];

  for (const character of value) {
    const index =
      alphabet.indexOf(character);

    if (index === -1) {
      return null;
    }

    bits += index
      .toString(2)
      .padStart(5, "0");
  }

  for (
    let i = 0;
    i + 8 <= bits.length;
    i += 8
  ) {
    bytes.push(
      parseInt(
        bits.slice(i, i + 8),
        2
      )
    );
  }

  if (!bytes.length) {
    return null;
  }

  return Buffer.from(bytes);
}

// ---------------------------------------------------------
// GENERATE TOTP
// RFC 6238 / Google Authenticator compatible
// ---------------------------------------------------------

function generateTotp(secret, counter) {
  const key = base32Decode(secret);

  if (!key) {
    return null;
  }

  const counterBuffer =
    Buffer.alloc(8);

  const high =
    Math.floor(
      counter / 0x100000000
    );

  const low =
    counter >>> 0;

  counterBuffer.writeUInt32BE(
    high,
    0
  );

  counterBuffer.writeUInt32BE(
    low,
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

  return String(
    binary % 1000000
  ).padStart(6, "0");
}

// ---------------------------------------------------------
// VERIFY GOOGLE AUTHENTICATOR CODE
// Accept previous/current/next 30-second window.
// ---------------------------------------------------------

function verifyTotp(otp, secret) {
  if (!/^\d{6}$/.test(otp)) {
    return false;
  }

  if (!secret) {
    return false;
  }

  const currentCounter =
    Math.floor(
      Date.now() / 1000 / TOTP_PERIOD
    );

  for (
    let window = -1;
    window <= 1;
    window++
  ) {
    const expected =
      generateTotp(
        secret,
        currentCounter + window
      );

    if (
      expected &&
      safeEqual(
        otp,
        expected
      )
    ) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------
// CREATE SIGNED ADMIN SESSION
// ---------------------------------------------------------

function createSessionToken(
  sessionSecret
) {
  const expiresAt =
    Date.now() +
    SESSION_MAX_AGE * 1000;

  const payload = {
    role: "admin",
    authenticated: true,
    expiresAt,
  };

  const encodedPayload =
    base64UrlEncode(
      JSON.stringify(payload)
    );

  const signingData =
    `${encodedPayload}.${expiresAt}`;

  const signature =
    crypto
      .createHmac(
        "sha256",
        sessionSecret
      )
      .update(signingData)
      .digest("base64url");

  return (
    `${encodedPayload}.${expiresAt}.${signature}`
  );
}

// ---------------------------------------------------------
// REQUEST BODY
// ---------------------------------------------------------

function getRequestBody(req) {
  if (
    req.body &&
    typeof req.body === "object"
  ) {
    return req.body;
  }

  return {};
}

// ---------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------

export default async function handler(
  req,
  res
) {
  // -------------------------------------------------------
  // POST ONLY
  // -------------------------------------------------------

  if (req.method !== "POST") {
    res.setHeader(
      "Allow",
      "POST"
    );

    return sendJson(
      res,
      405,
      {
        success: false,
        error: "Method not allowed",
      }
    );
  }

  // -------------------------------------------------------
  // SERVER ENVIRONMENT VARIABLES
  // -------------------------------------------------------

  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  const totpSecret =
    process.env.ADMIN_TOTP_SECRET;

  // -------------------------------------------------------
  // SESSION SECRET CHECK
  // -------------------------------------------------------

  if (!sessionSecret) {
    console.error(
      "ADMIN_SESSION_SECRET is not configured."
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        error:
          "Admin session configuration error.",
      }
    );
  }

  // -------------------------------------------------------
  // TOTP SECRET CHECK
  // -------------------------------------------------------

  if (!totpSecret) {
    console.error(
      "ADMIN_TOTP_SECRET is not configured."
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        error:
          "Google Authenticator is not configured.",
      }
    );
  }

  try {
    // -----------------------------------------------------
    // READ REQUEST
    // -----------------------------------------------------

    const body =
      getRequestBody(req);

    const otp =
      String(
        body.otp || ""
      ).trim();

    // -----------------------------------------------------
    // VALIDATE OTP FORMAT
    // -----------------------------------------------------

    if (!/^\d{6}$/.test(otp)) {
      return sendJson(
        res,
        400,
        {
          success: false,
          authenticated: false,
          error:
            "Please enter the current 6-digit Google Authenticator code.",
        }
      );
    }

    // -----------------------------------------------------
    // VERIFY GOOGLE AUTHENTICATOR
    // -----------------------------------------------------

    const valid =
      verifyTotp(
        otp,
        totpSecret
      );

    if (!valid) {
      return sendJson(
        res,
        401,
        {
          success: false,
          authenticated: false,
          error:
            "Incorrect or expired Google Authenticator code.",
        }
      );
    }

    // -----------------------------------------------------
    // CREATE ADMIN SESSION
    // -----------------------------------------------------

    const sessionToken =
      createSessionToken(
        sessionSecret
      );

    // -----------------------------------------------------
    // SECURE HTTP-ONLY COOKIE
    // -----------------------------------------------------

    const cookie =
      `${COOKIE_NAME}=${encodeURIComponent(
        sessionToken
      )}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;

    res.setHeader(
      "Set-Cookie",
      cookie
    );

    // -----------------------------------------------------
    // SUCCESS
    // -----------------------------------------------------

    return sendJson(
      res,
      200,
      {
        success: true,
        authenticated: true,
        user: {
          role: "admin",
        },
        expiresIn:
          SESSION_MAX_AGE,
      }
    );
  } catch (error) {
    console.error(
      "Admin Google Authenticator verification error:",
      error
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        authenticated: false,
        error:
          "Internal server error.",
      }
    );
  }
}
