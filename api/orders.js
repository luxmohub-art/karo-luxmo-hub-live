import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

const COOKIE_NAME =
  "luxmo_admin_session";

function getCookie(req, name) {
  const header =
    req.headers?.cookie || "";

  for (
    const part of header.split(";")
  ) {
    const [
      key,
      ...valueParts
    ] = part.trim().split("=");

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
    const left =
      Buffer.from(String(a));

    const right =
      Buffer.from(String(b));

    return (
      left.length ===
        right.length &&
      crypto.timingSafeEqual(
        left,
        right
      )
    );
  } catch {
    return false;
  }
}

function verifyAdminSession(
  token,
  secret
) {
  if (!token || !secret)
    return false;

  const parts =
    token.split(".");

  if (parts.length !== 3)
    return false;

  const [
    encodedPayload,
    expiresAt,
    signature,
  ] = parts;

  const expected =
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
      expected
    )
  ) {
    return false;
  }

  const expiry =
    Number(expiresAt);

  if (
    !Number.isFinite(
      expiry
    ) ||
    Date.now() >= expiry
  ) {
    return false;
  }

  try {
    const payload =
      JSON.parse(
        base64UrlDecode(
          encodedPayload
        ) || "{}"
      );

    return (
      payload?.role ===
      "admin"
    );
  } catch {
    return false;
  }
}

export default async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      "GET"
    );

    return res.status(405).json({
      success: false,
      error:
        "Method not allowed",
    });
  }

  const sessionSecret =
    process.env
      .ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    return res.status(500).json({
      success: false,
      error:
        "Admin session configuration missing",
    });
  }

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
      error:
        "Admin authentication required",
    });
  }

  try {
    const db =
      getFirestore(
        getFirebaseAdmin()
      );

    const snapshot =
      await db
        .collection("orders")
        .orderBy(
          "createdAt",
          "desc"
        )
        .limit(100)
        .get();

    const orders =
      snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Load orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Unable to load orders",
    });
  }
}
