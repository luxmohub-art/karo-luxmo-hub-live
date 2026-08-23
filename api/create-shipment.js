// api/create-shipment.js
// LUXMO HUB - Secure Shipment Creation API

import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

/* =========================================================
   HELPERS
========================================================= */

function cleanDocId(value) {
  return String(value || "")
    .trim()
    .replace(/\//g, "_")
    .slice(0, 120);
}

function getBaseUrl(req) {
  const configured = String(
    process.env.NEXT_PUBLIC_SITE_URL || ""
  ).trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const productionUrl = String(
    process.env.VERCEL_PROJECT_PRODUCTION_URL || ""
  ).trim();

  if (productionUrl) {
    return `https://${productionUrl.replace(
      /^https?:\/\//,
      ""
    )}`;
  }

  const host = String(
    req.headers?.["x-forwarded-host"] ||
      req.headers?.host ||
      ""
  ).trim();

  if (!host) {
    throw new Error(
      "Unable to determine application URL."
    );
  }

  const forwardedProto = String(
    req.headers?.["x-forwarded-proto"] || ""
  )
    .split(",")[0]
    .trim();

  const protocol =
    forwardedProto ||
    (host.includes("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

function normalizeProvider(value) {
  const provider = String(value || "")
    .trim()
    .toLowerCase();

  if (
    provider === "ithink" ||
    provider === "i-think" ||
    provider === "i think" ||
    provider === "ithink logistics"
  ) {
    return "ithink";
  }

  return "shiprocket";
}

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

async function parseResponse(response) {
  const contentType = String(
    response.headers.get("content-type") || ""
  ).toLowerCase();

  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => "");

  if (!text) {
    return {};
  }

  return {
    message: text.slice(0, 2000),
  };
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return sendJson(res, 405, {
      success: false,
      error: "Method not allowed.",
    });
  }

  try {
    const body = req.body || {};

    const {
      provider,
      order,
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
    } = body;

    /* =====================================================
       PROVIDER
    ===================================================== */

    const selectedProvider = normalizeProvider(
      provider ||
        order?.provider ||
        order?.courierProvider ||
        process.env.DEFAULT_LOGISTICS_PROVIDER ||
        "shiprocket"
    );

    /* =====================================================
       PAYMENT VALIDATION
    ===================================================== */

    const razorpayOrderId = String(
      razorpay_order_id || ""
    ).trim();

    const razorpayPaymentId = String(
      razorpay_payment_id || ""
    ).trim();

    if (!razorpayOrderId || !razorpayPaymentId) {
      return sendJson(res, 400, {
        success: false,
        error:
          "Verified Razorpay order and payment IDs are required.",
      });
    }

    /* =====================================================
       FIREBASE
    ===================================================== */

    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
      throw new Error(
        "Firebase Admin initialization failed."
      );
    }

    const db = getFirestore(firebaseAdmin);

    const ordersCollection =
      db.collection("orders");

    let orderSnapshot = null;

    /* =====================================================
       WEBSITE ORDER ID
    ===================================================== */

    const suppliedWebsiteOrderId = String(
      order?.id ||
        order?.websiteOrderId ||
        orderId ||
        ""
    ).trim();

    if (suppliedWebsiteOrderId) {
      const docId = cleanDocId(
        suppliedWebsiteOrderId
      );

      if (docId) {
        const ref =
          ordersCollection.doc(docId);

        const snapshot =
          await ref.get();

        if (snapshot.exists) {
          orderSnapshot = {
            ref,
            data: snapshot.data() || {},
          };
        }
      }
    }

    /* =====================================================
       FALLBACK - RAZORPAY ORDER ID
    ===================================================== */

    if (!orderSnapshot) {
      const querySnapshot =
        await ordersCollection
          .where(
            "razorpayOrderId",
            "==",
            razorpayOrderId
          )
          .limit(1)
          .get();

      if (!querySnapshot.empty) {
        const doc =
          querySnapshot.docs[0];

        orderSnapshot = {
          ref: doc.ref,
          data: doc.data() || {},
        };
      }
    }

    /* =====================================================
       ORDER NOT FOUND
    ===================================================== */

    if (!orderSnapshot) {
      return sendJson(res, 409, {
        success: false,
        error:
          "Verified payment order was not found in Firebase.",
      });
    }

    const dbOrder =
      orderSnapshot.data || {};

    /* =====================================================
       PAYMENT SECURITY CHECK
    ===================================================== */

    const storedRazorpayOrderId =
      String(
        dbOrder.razorpayOrderId || ""
      ).trim();

    const storedRazorpayPaymentId =
      String(
        dbOrder.razorpayPaymentId || ""
      ).trim();

    const paymentVerified =
      dbOrder.paymentVerified === true;

    const paymentStatus =
      String(
        dbOrder.paymentStatus || ""
      ).trim();

    if (
      !paymentVerified ||
      paymentStatus !== "Paid" ||
      storedRazorpayOrderId !==
        razorpayOrderId ||
      storedRazorpayPaymentId !==
        razorpayPaymentId
    ) {
      return sendJson(res, 403, {
        success: false,
        error:
          "Payment is not verified for this order. Shipment creation blocked.",
      });
    }

    /* =====================================================
       DUPLICATE SHIPMENT PROTECTION
    ===================================================== */

    if (
      dbOrder.shipmentStatus === "Created" ||
      dbOrder.shipmentStatus === "Shipped"
    ) {
      return sendJson(res, 200, {
        success: true,

        provider:
          dbOrder.courierProvider ||
          selectedProvider,

        shipmentId:
          dbOrder.shipmentId || null,

        awb:
          dbOrder.awb || null,

        courier:
          dbOrder.courier || null,

        trackingUrl:
          dbOrder.trackingUrl || null,

        orderId:
          dbOrder.websiteOrderId ||
          dbOrder.id ||
          suppliedWebsiteOrderId ||
          razorpayOrderId,

        message:
          "Shipment already created for this order.",

        alreadyProcessed: true,
      });
    }

    /* =====================================================
       TRUSTED ORDER DATA
    ===================================================== */

    const originalOrder =
      dbOrder.order &&
      typeof dbOrder.order === "object"
        ? dbOrder.order
        : dbOrder;

    const trustedOrder = {
      ...originalOrder,

      id:
        dbOrder.websiteOrderId ||
        dbOrder.id ||
        suppliedWebsiteOrderId ||
        razorpayOrderId,

      orderId:
        dbOrder.websiteOrderId ||
        dbOrder.id ||
        suppliedWebsiteOrderId ||
        razorpayOrderId,

      websiteOrderId:
        dbOrder.websiteOrderId ||
        dbOrder.id ||
        suppliedWebsiteOrderId ||
        "",

      razorpayOrderId:
        razorpayOrderId,

      razorpayPaymentId:
        razorpayPaymentId,

      paymentMethod:
        "razorpay",

      paymentStatus:
        "Paid",

      paymentVerified:
        true,

      provider:
        selectedProvider,

      courierProvider:
        selectedProvider,
    };

    /* =====================================================
       PROVIDER ENDPOINT
    ===================================================== */

    const endpoint =
      selectedProvider === "ithink"
        ? "/api/ithink"
        : "/api/shiprocket";

    const baseUrl =
      getBaseUrl(req);

    const providerUrl =
      `${baseUrl}${endpoint}`;

    /* =====================================================
       CREATE SHIPMENT
    ===================================================== */

    const response = await fetch(
      providerUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body: JSON.stringify({
          order: trustedOrder,

          orderId:
            trustedOrder.orderId,

          paymentId:
            razorpayPaymentId,

          provider:
            selectedProvider,
        }),
      }
    );

    const data =
      await parseResponse(response);

    /* =====================================================
       PROVIDER ERROR
    ===================================================== */

    if (
      !response.ok ||
      data?.success === false
    ) {
      const errorMessage =
        data?.error ||
        data?.message ||
        `${selectedProvider} shipment creation failed.`;

      await orderSnapshot.ref.set(
        {
          shipmentStatus:
            "Pending",

          shipmentError:
            errorMessage,

          courierProvider:
            selectedProvider,

          updatedAt:
            new Date().toISOString(),
        },
        {
          merge: true,
        }
      );

      return sendJson(
        res,
        response.status >= 400
          ? response.status
          : 500,
        {
          success: false,

          provider:
            selectedProvider,

          error:
            errorMessage,

          details:
            data || null,
        }
      );
    }

    /* =====================================================
       NORMALIZE PROVIDER RESPONSE
    ===================================================== */

    const shipmentId =
      data?.shipmentId ||
      data?.shipment_id ||
      data?.referenceNumber ||
      data?.refnum ||
      data?.orderId ||
      data?.order_id ||
      null;

    const awb =
      data?.awb ||
      data?.awbCode ||
      data?.awb_code ||
      data?.waybill ||
      null;

    const courier =
      data?.courier ||
      data?.courier_name ||
      data?.logistic_name ||
      null;

    const trackingUrl =
      data?.trackingUrl ||
      data?.tracking_url ||
      null;

    const now =
      new Date().toISOString();

    /* =====================================================
       SAVE SHIPMENT TO SAME ORDER
    ===================================================== */

    await orderSnapshot.ref.set(
      {
        paymentStatus:
          "Paid",

        paymentVerified:
          true,

        shipmentStatus:
          "Created",

        status:
          "Shipped",

        courierProvider:
          selectedProvider,

        courier:
          courier,

        shipmentId:
          shipmentId,

        awb:
          awb,

        trackingUrl:
          trackingUrl,

        shipmentError:
          "",

        shippedAt:
          now,

        updatedAt:
          now,
      },
      {
        merge: true,
      }
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return sendJson(res, 200, {
      success: true,

      provider:
        selectedProvider,

      shipmentId:

        shipmentId,

      orderId:
        trustedOrder.orderId,

      awb:
        awb,

      courier:
        courier,

      trackingUrl:
        trackingUrl,

      message:
        data?.message ||
        `${selectedProvider} shipment created successfully.`,

      alreadyProcessed:
        false,
    });
  } catch (error) {
    console.error(
      "Create shipment error:",
      error
    );

    return sendJson(res, 500, {
      success: false,

      error:
        error?.message ||
        "Internal server error.",

      details:
        process.env.NODE_ENV ===
        "development"
          ? String(error?.stack || "")
          : undefined,
    });
  }
}
