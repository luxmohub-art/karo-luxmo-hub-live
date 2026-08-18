// api/admin-session.js
// LUXMO HUB - Admin Session Verification + Logout API

import crypto from "crypto";

const COOKIE_NAME = "luxmo_admin_session";

function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie || "";

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] =
      cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(
        valueParts.join("=")
      );
    }
  }

  return null;
}

function base64UrlDecode(value) {
  try {
    return Buffer.from(
      value,
      "base64url"
    ).toString("utf8");
  } catch {
    return null;
  }
}

function safeEqual(a, b) {
  try {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    if (
      aBuffer.length !==
      bBuffer.length
    ) {
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

function verifySessionToken(
  token,
  secret
) {
  if (!token || !secret) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [
    encodedPayload,
    expiresAt,
    signature,
  ] = parts;

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        `${encodedPayload}.${expiresAt}`
      )
      .digest("base64url");

  if (
    !safeEqual(
      signature,
      expectedSignature
    )
  ) {
    return null;
  }

  const expiry =
    Number(expiresAt);

  if (!Number.isFinite(expiry)) {
    return null;
  }

  if (Date.now() >= expiry) {
    return null;
  }

  try {
    const payloadText =
      base64UrlDecode(
        encodedPayload
      );

    if (!payloadText) {
      return null;
    }

    const payload =
      JSON.parse(payloadText);

    if (
      !payload ||
      payload.role !== "admin"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function sendJson(
  res,
  status,
  data
) {
  return res
    .status(status)
    .json(data);
}

function logoutAdmin(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );

  return sendJson(
    res,
    200,
    {
      success: true,
      authenticated: false,
      message:
        "Admin logged out successfully.",
    }
  );
}

export default function handler(
  req,
  res
) {
  /*
   * Logout compatibility:
   *
   * /api/admin-logout
   * will be rewritten to this handler
   * with ?logout=1
   */
  const isLogout =
    String(
      req.query?.logout || ""
    ) === "1";

  if (isLogout) {
    if (
      req.method !== "GET" &&
      req.method !== "POST"
    ) {
      res.setHeader(
        "Allow",
        "GET, POST"
      );

      return sendJson(
        res,
        405,
        {
          success: false,
          error:
            "Method not allowed.",
        }
      );
    }

    return logoutAdmin(res);
  }

  /*
   * Normal session verification
   * Only GET is allowed.
   */
  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      "GET"
    );

    return sendJson(
      res,
      405,
      {
        success: false,
        error:
          "Method not allowed",
      }
    );
  }

  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    console.error(
      "ADMIN_SESSION_SECRET is not configured."
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        authenticated: false,
        error:
          "Server configuration error",
      }
    );
  }

  const token =
    getCookie(
      req,
      COOKIE_NAME
    );

  const session =
    verifySessionToken(
      token,
      secret
    );

  if (!session) {
    return sendJson(
      res,
      401,
      {
        success: false,
        authenticated: false,
      }
    );
  }

  return sendJson(
    res,
    200,
    {
      success: true,
      authenticated: true,

      user: {
        role: "admin",
      },

      expiresAt:
        session.exp,
    }
  );
}
