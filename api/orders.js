// api/orders.js
// LUXMO HUB - Secure Admin Orders API

import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

const COOKIE_NAME = "luxmo_admin_session";

/* =========================================================
   COOKIE
========================================================= */

function getCookie(req, name) {
  const header = String(
    req.headers?.cookie || ""
  );

  if (!header) {
    return null;
  }

  const cookies = header.split(";");

  for (const cookie of cookies) {
    const parts = cookie.trim().split("=");

    const key = parts.shift();

    if (key === name) {
      return decodeURIComponent(
        parts.join("=")
      );
    }
  }

  return null;
}

/* =========================================================
   BASE64 URL DECODE
========================================================= */

function base64UrlDecode(value) {
  try {
    if (!value) {
      return null;
    }

    return Buffer.from(
      value,
      "base64url"
    ).toString("utf8");
  } catch {
    return null;
  }
}

/* =========================================================
   SAFE STRING COMPARISON
========================================================= */

function safeEqual(a, b) {
  try {
    const left = Buffer.from(
      String(a || "")
    );

    const right = Buffer.from(
      String(b || "")
    );

    if (
      left.length === 0 ||
      right.length === 0
    ) {
      return false;
    }

    if (
      left.length !==
      right.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      left,
      right
    );
  } catch {
    return false;
  }
}

/* =========================================================
   ADMIN SESSION VERIFICATION
========================================================= */

function verifyAdminSession(
  token,
  secret
) {
  if (!token || !secret) {
    return false;
  }

  const parts =
    String(token).split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [
    encodedPayload,
    expiresAt,
    signature,
  ] = parts;

  if (
    !encodedPayload ||
    !expiresAt ||
    !signature
  ) {
    return false;
  }

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
    return false;
  }

  const expiry =
    Number(expiresAt);

  if (
    !Number.isFinite(expiry)
  ) {
    return false;
  }

  if (
    Date.now() >= expiry
  ) {
    return false;
  }

  try {
    const payloadText =
      base64UrlDecode(
        encodedPayload
      );

    if (!payloadText) {
      return false;
    }

    const payload =
      JSON.parse(
        payloadText
      );

    if (
      !payload ||
      payload.role !== "admin"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   CREATED AT SORT HELPER
========================================================= */

function getCreatedAtValue(order) {
  const value =
    order?.createdAt;

  if (!value) {
    return 0;
  }

  // Firestore Timestamp
  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  // Firestore Timestamp object
  if (
    typeof value === "object" &&
    typeof value.seconds ===
      "number"
  ) {
    return (
      value.seconds * 1000 +
      Math.floor(
        (value.nanoseconds || 0) /
          1000000
      )
    );
  }

  // Date/string/number
  const numeric =
    Number(value);

  if (
    Number.isFinite(numeric) &&
    numeric > 0
  ) {
    return numeric;
  }

  const parsed =
    Date.parse(
      String(value)
    );

  if (
    Number.isFinite(parsed)
  ) {
    return parsed;
  }

  return 0;
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {
  /* =======================================================
     METHOD
  ======================================================= */

  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      "GET"
    );

    return res.status(405).json({
      success: false,
      error:
        "Method not allowed.",
    });
  }

  /* =======================================================
     ADMIN SECRET
  ======================================================= */

  const sessionSecret =
    String(
      process.env
        .ADMIN_SESSION_SECRET ||
        ""
    ).trim();

  if (!sessionSecret) {
    console.error(
      "ADMIN_SESSION_SECRET is not configured."
    );

    return res.status(500).json({
      success: false,
      error:
        "Admin session configuration missing.",
    });
  }

  /* =======================================================
     SESSION COOKIE
  ======================================================= */

  const token =
    getCookie(
      req,
      COOKIE_NAME
    );

  if (
    !verifyAdminSession(
      token,
      sessionSecret
    )
  ) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      error:
        "Admin authentication required.",
    });
  }

  /* =======================================================
     FIREBASE
  ======================================================= */

  try {
    const firebaseAdmin =
      getFirebaseAdmin();

    if (!firebaseAdmin) {
      throw new Error(
        "Firebase Admin initialization failed."
      );
    }

    const db =
      getFirestore(
        firebaseAdmin
      );

    /* =====================================================
       LOAD ORDERS
       
       IMPORTANT:
       Do NOT use Firestore orderBy(createdAt) here.
       Some old orders may not contain createdAt and
       Firestore may also require an index.
    ===================================================== */

    const snapshot =
      await db
        .collection("orders")
        .limit(200)
        .get();

    /* =====================================================
       CONVERT FIRESTORE DOCUMENTS
    ===================================================== */

    const orders =
      snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

    /* =====================================================
       SORT NEWEST FIRST
    ===================================================== */

    orders.sort(
      (a, b) =>
        getCreatedAtValue(b) -
        getCreatedAtValue(a)
    );

    /* =====================================================
       RETURN
    ===================================================== */

    return res.status(200).json({
      success: true,
      authenticated: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Load orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      authenticated: true,
      error:
        error?.message ||
        "Unable to load orders.",
    });
  }
}
