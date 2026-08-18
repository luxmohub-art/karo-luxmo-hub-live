import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(String(a), "hex");
    const right = Buffer.from(String(b), "hex");

    return (
      left.length === right.length &&
      crypto.timingSafeEqual(left, right)
    );
  } catch {
    return false;
  }
}

function cleanDocId(value) {
  return String(value || "")
    .trim()
    .replace(/\//g, "_")
    .slice(0, 120);
}

async function razorpayGet(path, keyId, keySecret) {
  const auth = Buffer.from(
    `${keyId}:${keySecret}`
  ).toString("base64");

  const response = await fetch(
    `https://api.razorpay.com/v1${path}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.description ||
        data?.error?.code ||
        `Razorpay API request failed (${response.status})`
    );
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const body = req.body || {};

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order: orderPayload,
      orderData,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing payment verification details",
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        success: false,
        error: "Razorpay server configuration missing",
      });
    }

    // STEP 1 — Server-side Razorpay signature verification
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (
      !safeEqualHex(
        generatedSignature,
        razorpay_signature
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    // STEP 2 — Verify actual Razorpay order
    const razorpayOrder = await razorpayGet(
      `/orders/${encodeURIComponent(
        razorpay_order_id
      )}`,
      keyId,
      keySecret
    );

    // STEP 3 — Verify actual Razorpay payment
    const razorpayPayment = await razorpayGet(
      `/payments/${encodeURIComponent(
        razorpay_payment_id
      )}`,
      keyId,
      keySecret
    );

    if (
      razorpayPayment.order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Payment does not belong to this Razorpay order",
      });
    }

    if (
      razorpayPayment.status !== "captured" &&
      razorpayPayment.captured !== true
    ) {
      return res.status(400).json({
        success: false,
        error: `Payment is not captured yet (status: ${
          razorpayPayment.status || "unknown"
        })`,
      });
    }

    const clientOrder =
      orderPayload &&
      typeof orderPayload === "object"
        ? orderPayload
        : orderData &&
          typeof orderData === "object"
        ? orderData
        : {};

    // STEP 4 — Verify website amount against Razorpay amount
    const expectedAmountPaise = Math.round(
      Number(clientOrder.total || 0) * 100
    );

    if (
      !expectedAmountPaise ||
      expectedAmountPaise !==
        Number(razorpayOrder.amount)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Payment amount does not match the website order amount",
      });
    }

    if (
      Number(razorpayPayment.amount) !==
      Number(razorpayOrder.amount)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Captured payment amount does not match the Razorpay order amount",
      });
    }

    // STEP 5 — Save verified order to Firebase
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);

    const websiteOrderId = String(
      clientOrder.id || ""
    ).trim();

    const documentId = cleanDocId(
      websiteOrderId ||
        `rzp_${razorpay_order_id}`
    );

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Website order ID is required",
      });
    }

    const orderRef = db
      .collection("orders")
      .doc(documentId);

    const existingSnapshot =
      await orderRef.get();

    const existing = existingSnapshot.exists
      ? existingSnapshot.data()
      : null;

    // Duplicate payment protection
    if (
      existing?.paymentVerified === true &&
      existing?.razorpayPaymentId ===
        razorpay_payment_id
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        websiteOrderId:
          existing?.websiteOrderId ||
          websiteOrderId ||
          documentId,
        databaseSaved: true,
        alreadyProcessed: true,
      });
    }

    const now =
      new Date().toISOString();

    const firestoreOrder = {
      ...clientOrder,

      id:
        websiteOrderId ||
        documentId,

      websiteOrderId:
        websiteOrderId ||
        documentId,

      razorpayOrderId:
        razorpay_order_id,

      razorpayPaymentId:
        razorpay_payment_id,

      razorpaySignatureVerified:
        true,

      paymentStatus:
        "Paid",

      paymentVerified:
        true,

      paymentCaptured:
        true,

      status:
        "Payment Confirmed - Shipment Pending",

      shipmentStatus:
        existing?.shipmentStatus ||
        "Pending",

      shipmentError:
        "",

      amount:
        Number(razorpayOrder.amount) /
        100,

      currency:
        razorpayOrder.currency ||
        "INR",

      razorpayOrderStatus:
        razorpayOrder.status ||
        "paid",

      verifiedAt:
        now,

      updatedAt:
        now,

      createdAt:
        clientOrder.createdAt ||
        existing?.createdAt ||
        now,

      source:
        "luxmo-website",
    };

    await orderRef.set(
      firestoreOrder,
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and order saved successfully",

      paymentId:
        razorpay_payment_id,

      orderId:
        razorpay_order_id,

      websiteOrderId:
        firestoreOrder.websiteOrderId,

      databaseSaved:
        true,

      alreadyProcessed:
        false,
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Internal server error",
    });
  }
}
