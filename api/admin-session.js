// api/admin-session.js
// LUXMO HUB - Admin Session Verification + Logout API

import crypto from "crypto";

const COOKIE_NAME = "luxmo_admin_session";

/* =========================================================
   COOKIE
========================================================= */

function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie || "";

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const index = cookie.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = cookie
      .slice(0, index)
      .trim();

    const value = cookie
      .slice(index + 1)
      .trim();

    if (key === name) {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

/* =========================================================
   BASE64URL
========================================================= */

function base64UrlDecode(value) {
  if (!value) {
    return null;
  }

  try {
    return Buffer.from(
      value,
      "base64url"
    ).toString("utf8");
  } catch (error) {
    console.error(
      "Session payload decode failed:",
      error
    );

    return null;
  }
}

/* =========================================================
   SAFE STRING COMPARISON
========================================================= */

function safeEqual(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string"
  ) {
    return false;
  }

  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      left,
      right
    );
  } catch {
    return false;
  }
}

/* =========================================================
   VERIFY ADMIN TOKEN
========================================================= */

function verifySessionToken(
  token,
  secret
) {
  if (
    !token ||
    !secret
  ) {
    return null;
  }

  const parts =
    String(token).split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [
    encodedPayload,
    expiresAtText,
    signature,
  ] = parts;

  if (
    !encodedPayload ||
    !expiresAtText ||
    !signature
  ) {
    return null;
  }

  /* -------------------------------------------------------
     SIGNATURE
  ------------------------------------------------------- */

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        `${encodedPayload}.${expiresAtText}`
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

  /* -------------------------------------------------------
     EXPIRY
  ------------------------------------------------------- */

  const expiresAt =
    Number(expiresAtText);

  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= 0
  ) {
    return null;
  }

  if (Date.now() >= expiresAt) {
    return null;
  }

  /* -------------------------------------------------------
     PAYLOAD
  ------------------------------------------------------- */

  const payloadText =
    base64UrlDecode(
      encodedPayload
    );

  if (!payloadText) {
    return null;
  }

  try {
    const payload =
      JSON.parse(payloadText);

    if (
      !payload ||
      payload.role !== "admin"
    ) {
      return null;
    }

    return {
      payload,
      expiresAt,
    };
  } catch (error) {
    console.error(
      "Admin session JSON parse failed:",
      error
    );

    return null;
  }
}

/* =========================================================
   JSON RESPONSE
========================================================= */

function sendJson(
  res,
  status,
  data
) {
  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  return res
    .status(status)
    .json(data);
}

/* =========================================================
   LOGOUT
========================================================= */

function logoutAdmin(res) {
  res.setHeader(
    "Set-Cookie",
    [
      `${COOKIE_NAME}=`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Max-Age=0",
    ].join("; ")
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

/* =========================================================
   MAIN HANDLER
========================================================= */

export default function handler(
  req,
  res
) {
  /* -------------------------------------------------------
     LOGOUT
     
     Supports:
     /api/admin-session?logout=1
  ------------------------------------------------------- */

  const logout =
    String(
      req.query?.logout || ""
    ).trim() === "1";

  if (logout) {
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
          authenticated: false,
          error:
            "Method not allowed.",
        }
      );
    }

    return logoutAdmin(res);
  }

  /* -------------------------------------------------------
     SESSION CHECK
     
     Only GET allowed
  ------------------------------------------------------- */

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
        authenticated: false,
        error:
          "Method not allowed.",
      }
    );
  }

  /* -------------------------------------------------------
     SECRET
  ------------------------------------------------------- */

  const secret =
    String(
      process.env.ADMIN_SESSION_SECRET || ""
    ).trim();

  if (!secret) {
    console.error(
      "ADMIN_SESSION_SECRET is missing."
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        authenticated: false,
        error:
          "ADMIN_SESSION_SECRET is not configured on the server.",
      }
    );
  }

  /* -------------------------------------------------------
     COOKIE
  ------------------------------------------------------- */

  const token =
    getCookie(
      req,
      COOKIE_NAME
    );

  if (!token) {
    return sendJson(
      res,
      401,
      {
        success: false,
        authenticated: false,
        error:
          "Admin session cookie not found.",
      }
    );
  }

  /* -------------------------------------------------------
     VERIFY
  ------------------------------------------------------- */

  const verified =
    verifySessionToken(
      token,
      secret
    );

  if (!verified) {
    return sendJson(
      res,
      401,
      {
        success: false,
        authenticated: false,
        error:
          "Invalid or expired admin session.",
      }
    );
  }

  /* -------------------------------------------------------
     SUCCESS
  ------------------------------------------------------- */

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
        verified.expiresAt,
    }
  );
}
