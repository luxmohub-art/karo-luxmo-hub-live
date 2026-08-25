// api/admin-session.js
// LUXMO HUB - Admin Session Check + Logout API
// Compatible with api/admin-verify-otp.js

import crypto from "crypto";

const COOKIE_NAME = "luxmo_admin_session";

/* =========================================================
   SEND JSON
========================================================= */

function sendJson(res, status, data) {
  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  res.setHeader(
    "Pragma",
    "no-cache"
  );

  res.setHeader(
    "Expires",
    "0"
  );

  return res.status(status).json(data);
}

/* =========================================================
   READ COOKIE
========================================================= */

function getCookie(req, name) {
  const header = String(
    req.headers?.cookie || ""
  );

  if (!header) {
    return null;
  }

  const cookies = header.split(";");

  for (const item of cookies) {
    const separator = item.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = item
      .slice(0, separator)
      .trim();

    if (key !== name) {
      continue;
    }

    const rawValue = item
      .slice(separator + 1)
      .trim();

    if (!rawValue) {
      return null;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

/* =========================================================
   BASE64URL DECODE
========================================================= */

function decodeBase64Url(value) {
  if (!value) {
    return null;
  }

  try {
    return Buffer
      .from(value, "base64url")
      .toString("utf8");
  } catch (error) {
    console.error(
      "Admin session payload decode error:",
      error
    );

    return null;
  }
}

/* =========================================================
   CONSTANT-TIME STRING COMPARISON
========================================================= */

function safeEqual(leftValue, rightValue) {
  if (
    typeof leftValue !== "string" ||
    typeof rightValue !== "string"
  ) {
    return false;
  }

  const left = Buffer.from(
    leftValue,
    "utf8"
  );

  const right = Buffer.from(
    rightValue,
    "utf8"
  );

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
   VERIFY SESSION TOKEN
========================================================= */

function verifySessionToken(token, secret) {
  if (!token || !secret) {
    return null;
  }

  const parts = String(token).split(".");

  /*
    Expected format:

    base64Payload.expiresAt.signature
  */

  if (parts.length !== 3) {
    return null;
  }

  const [
    encodedPayload,
    expiresAtText,
    signature
  ] = parts;

  if (
    !encodedPayload ||
    !expiresAtText ||
    !signature
  ) {
    return null;
  }

  /* -------------------------------------------------------
     VERIFY SIGNATURE
  ------------------------------------------------------- */

  const signingData =
    `${encodedPayload}.${expiresAtText}`;

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(signingData)
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
     VERIFY EXPIRATION
  ------------------------------------------------------- */

  const expiresAt =
    Number(expiresAtText);

  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= 0
  ) {
    return null;
  }

  if (
    Date.now() >= expiresAt
  ) {
    return null;
  }

  /* -------------------------------------------------------
     DECODE PAYLOAD
  ------------------------------------------------------- */

  const payloadText =
    decodeBase64Url(
      encodedPayload
    );

  if (!payloadText) {
    return null;
  }

  /* -------------------------------------------------------
     PARSE PAYLOAD
  ------------------------------------------------------- */

  let payload;

  try {
    payload = JSON.parse(
      payloadText
    );
  } catch (error) {
    console.error(
      "Admin session JSON parse error:",
      error
    );

    return null;
  }

  /* -------------------------------------------------------
     VERIFY ADMIN ROLE
  ------------------------------------------------------- */

  if (
    !payload ||
    payload.role !== "admin"
  ) {
    return null;
  }

  /* -------------------------------------------------------
     SUCCESS
  ------------------------------------------------------- */

  return {
    payload,
    expiresAt
  };
}

/* =========================================================
   CLEAR ADMIN COOKIE
========================================================= */

function clearAdminCookie(res) {
  /*
    Must match the login cookie attributes:

    Path=/
    HttpOnly
    Secure
    SameSite=Lax
  */

  const cookie =
    `${COOKIE_NAME}=; ` +
    `Path=/; ` +
    `HttpOnly; ` +
    `Secure; ` +
    `SameSite=Lax; ` +
    `Max-Age=0`;

  res.setHeader(
    "Set-Cookie",
    cookie
  );
}

/* =========================================================
   LOGOUT
========================================================= */

function logoutAdmin(res) {
  clearAdminCookie(res);

  return sendJson(
    res,
    200,
    {
      success: true,
      authenticated: false,
      loggedOut: true,
      message:
        "Admin logged out successfully."
    }
  );
}

/* =========================================================
   UNAUTHENTICATED RESPONSE
========================================================= */

function notAuthenticated(res, reason) {
  /*
    IMPORTANT:

    Return HTTP 200 instead of HTTP 401 for the
    normal "not logged in" session check.

    This prevents the browser console from showing
    an unnecessary red 401 when the public site checks
    whether an admin session exists.

    Security is NOT bypassed:
    authenticated remains false.
  */

  return sendJson(
    res,
    200,
    {
      success: false,
      authenticated: false,
      user: null,
      error: reason
    }
  );
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {
  try {
    /* =====================================================
       LOGOUT
       /api/admin-session?logout=1
    ===================================================== */

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
              "Method not allowed."
          }
        );
      }

      return logoutAdmin(res);
    }

    /* =====================================================
       SESSION CHECK
       GET ONLY
    ===================================================== */

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
            "Method not allowed."
        }
      );
    }

    /* =====================================================
       SESSION SECRET
    ===================================================== */

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
            "Admin session configuration error."
        }
      );
    }

    /* =====================================================
       READ ADMIN COOKIE
    ===================================================== */

    const token =
      getCookie(
        req,
        COOKIE_NAME
      );

    /*
      No cookie simply means:
      user is not logged in.

      Do NOT treat this as an authenticated request.
    */

    if (!token) {
      return notAuthenticated(
        res,
        "Admin session cookie not found."
      );
    }

    /* =====================================================
       VERIFY TOKEN
    ===================================================== */

    const verified =
      verifySessionToken(
        token,
        secret
      );

    /* =====================================================
       INVALID / EXPIRED SESSION
    ===================================================== */

    if (!verified) {
      /*
        Clear bad cookie so browser doesn't keep
        sending an expired/invalid session forever.
      */

      clearAdminCookie(res);

      return notAuthenticated(
        res,
        "Invalid or expired admin session."
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return sendJson(
      res,
      200,
      {
        success: true,
        authenticated: true,

        user: {
          role: "admin"
        },

        expiresAt:
          verified.expiresAt
      }
    );

  } catch (error) {
    console.error(
      "Admin session API error:",
      error
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        authenticated: false,
        error:
          "Internal server error."
      }
    );
  }
}
