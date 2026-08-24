// api/orders.js
// LUXMO HUB — Customer My Orders + Admin Orders

import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

const COOKIE_NAME = "luxmo_admin_session";
const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;

/* =========================
   COOKIE
========================= */

function getCookie(req, name) {
  const header = String(req.headers?.cookie || "");

  if (!header) return null;

  for (const cookie of header.split(";")) {
    const parts = cookie.trim().split("=");
    const key = parts.shift();

    if (key === name) {
      return decodeURIComponent(parts.join("="));
    }
  }

  return null;
}

/* =========================
   SAFE COMPARE
========================= */

function safeEqual(a, b) {
  try {
    const left = Buffer.from(String(a || ""));
    const right = Buffer.from(String(b || ""));

    if (!left.length || left.length !== right.length) {
      return false;
    }

    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

/* =========================
   PHONE NORMALIZATION
========================= */

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  return "";
}

/* =========================
   ADMIN SESSION
========================= */

function verifyAdminSession(token, secret) {
  if (!token || !secret) {
    return false;
  }

  const parts = String(token).split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [
    encodedPayload,
    expiresAt,
    signature
  ] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedPayload}.${expiresAt}`)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  const expiry = Number(expiresAt);

  if (!Number.isFinite(expiry)) {
    return false;
  }

  if (Date.now() >= expiry) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(
        encodedPayload,
        "base64url"
      ).toString("utf8")
    );

    return payload?.role === "admin";
  } catch {
    return false;
  }
}

/* =========================
   CUSTOMER ACCESS TOKEN
========================= */

function createCustomerAccessToken(
  orderId,
  phone,
  secret
) {
  const expiresAt =
    Date.now() + ACCESS_TOKEN_TTL_MS;

  const payload = Buffer.from(
    JSON.stringify({
      role: "customer",
      orderId: String(orderId),
      phone: normalizePhone(phone)
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${payload}.${expiresAt}`)
    .digest("base64url");

  return `${payload}.${expiresAt}.${signature}`;
}

/* =========================
   VERIFY CUSTOMER TOKEN
========================= */

function verifyCustomerAccessToken(
  token,
  orderId,
  phone,
  secret
) {
  if (!token || !secret) {
    return false;
  }

  const parts = String(token).split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [
    payloadEncoded,
    expiresAt,
    signature
  ] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${payloadEncoded}.${expiresAt}`)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  if (Date.now() >= Number(expiresAt)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(
        payloadEncoded,
        "base64url"
      ).toString("utf8")
    );

    return (
      payload?.role === "customer" &&
      String(payload.orderId) === String(orderId) &&
      normalizePhone(payload.phone) ===
        normalizePhone(phone)
    );
  } catch {
    return false;
  }
}

/* =========================
   CREATED AT
========================= */

function getCreatedAtValue(order) {
  const value = order?.createdAt;

  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return (
      value.seconds * 1000 +
      Math.floor(
        (value.nanoseconds || 0) / 1000000
      )
    );
  }

  const numeric = Number(value);

  if (
    Number.isFinite(numeric) &&
    numeric > 0
  ) {
    return numeric;
  }

  const parsed = Date.parse(String(value));

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

/* =========================
   CUSTOMER DATA SANITIZER
========================= */

function sanitizeCustomerOrder(order) {
  const copy = {
    ...order
  };

  delete copy.internalNotes;
  delete copy.adminNotes;
  delete copy.shiprocketCredentials;
  delete copy.paymentVerificationSecret;

  return copy;
}

/* =========================
   MAIN HANDLER
========================= */

export default async function handler(
  req,
  res
) {
  const accessSecret = String(
    process.env.ORDER_ACCESS_SECRET ||
      process.env.ADMIN_SESSION_SECRET ||
      ""
  ).trim();

  if (!accessSecret) {
    return res.status(500).json({
      success: false,
      error:
        "Order access configuration missing."
    });
  }

  let db;

  try {
    db = getFirestore(
      getFirebaseAdmin()
    );
  } catch (error) {
    console.error(
      "Firebase initialization error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Firebase Admin initialization failed."
    });
  }

  /* =====================================================
     CUSTOMER — REQUEST ORDER ACCESS
     
     POST /api/orders
     
     body:
     {
       action: "request-access",
       orderId: "...",
       phone: "..."
     }
  ===================================================== */

  if (req.method === "POST") {
    const body = req.body || {};

    if (body.action !== "request-access") {
      return res.status(400).json({
        success: false,
        error:
          "Unsupported order action."
      });
    }

    const orderId = String(
      body.orderId || ""
    ).trim();

    const phone = normalizePhone(
      body.phone
    );

    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        error:
          "Order ID and valid mobile number are required."
      });
    }

    try {
      const orderRef =
        db.collection("orders").doc(orderId);

      const snapshot =
        await orderRef.get();

      if (!snapshot.exists) {
        return res.status(404).json({
          success: false,
          error: "Order not found."
        });
      }

      const order = snapshot.data() || {};

      const storedPhone =
        normalizePhone(
          order?.customer?.phone ||
            order?.shippingAddress?.phone ||
            order?.address?.phone ||
            order?.phone
        );

      if (
        !storedPhone ||
        !safeEqual(
          storedPhone,
          phone
        )
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Order ID and mobile number do not match."
        });
      }

      const accessToken =
        createCustomerAccessToken(
          orderId,
          phone,
          accessSecret
        );

      return res.status(200).json({
        success: true,
        accessToken,
        expiresIn:
          ACCESS_TOKEN_TTL_MS,
        order:
          sanitizeCustomerOrder({
            id: snapshot.id,
            ...order
          })
      });
    } catch (error) {
      console.error(
        "Customer order access error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Unable to verify order access."
      });
    }
  }

  /* =====================================================
     ONLY GET AFTER THIS
  ===================================================== */

  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      "GET, POST"
    );

    return res.status(405).json({
      success: false,
      error: "Method not allowed."
    });
  }

  const requestedOrderId =
    String(
      req.query?.orderId || ""
    ).trim();

  const authorization =
    String(
      req.headers?.authorization || ""
    );

  const bearer =
    authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

  /* =====================================================
     CUSTOMER — FETCH SINGLE ORDER
     
     GET /api/orders?orderId=XXXX
     
     Authorization:
     Bearer CUSTOMER_ACCESS_TOKEN
  ===================================================== */

  if (
    requestedOrderId &&
    bearer
  ) {
    try {
      const orderRef =
        db
          .collection("orders")
          .doc(requestedOrderId);

      const snapshot =
        await orderRef.get();

      if (!snapshot.exists) {
        return res.status(404).json({
          success: false,
          error: "Order not found."
        });
      }

      const order = {
        id: snapshot.id,
        ...snapshot.data()
      };

      const phone =
        order?.customer?.phone ||
          order?.shippingAddress?.phone ||
          order?.address?.phone ||
          order?.phone ||
          "";

      const valid =
        verifyCustomerAccessToken(
          bearer,
          requestedOrderId,
          phone,
          accessSecret
        );

      if (!valid) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error:
            "Order access token is invalid or expired."
        });
      }

      return res.status(200).json({
        success: true,
        authenticated: true,
        order:
          sanitizeCustomerOrder(order)
      });
    } catch (error) {
      console.error(
        "Customer order fetch error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Unable to retrieve order."
      });
    }
  }

  /* =====================================================
     ADMIN — EXISTING ORDER CENTER
  ===================================================== */

  const adminSecret =
    String(
      process.env.ADMIN_SESSION_SECRET ||
        ""
    ).trim();

  if (!adminSecret) {
    return res.status(500).json({
      success: false,
      error:
        "Admin session configuration missing."
    });
  }

  const adminToken =
    getCookie(
      req,
      COOKIE_NAME
    );

  if (
    !verifyAdminSession(
      adminToken,
      adminSecret
    )
  ) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      error:
        "Admin authentication required."
    });
  }

  try {
    const snapshot =
      await db
        .collection("orders")
        .limit(200)
        .get();

    const orders =
      snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data()
        })
      );

    orders.sort(
      (a, b) =>
        getCreatedAtValue(b) -
        getCreatedAtValue(a)
    );

    return res.status(200).json({
      success: true,
      authenticated: true,
      count: orders.length,
      orders
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
        "Unable to load orders."
    });
  }
}
