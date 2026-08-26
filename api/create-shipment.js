// api/create-shipment.js
// LUXMO HUB — verified payment -> selected courier -> shipment -> AWB -> documents

import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

function clean(v) {
  return String(v ?? "").trim();
}

function first(...values) {
  for (const v of values) {
    const s = clean(v);
    if (s) return s;
  }
  return "";
}

function normalizeProvider(v) {
  const p = clean(v).toLowerCase();

  if (
    p === "ithink" ||
    p === "i-think" ||
    p === "i think" ||
    p === "ithink logistics"
  ) {
    return "ithink";
  }

  return "shiprocket";
}

function send(res, status, data) {
  return res.status(status).json(data);
}

async function parseResponse(response) {
  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      message: text.slice(0, 5000),
    };
  }

  return data;
}

function getBaseUrl(req) {
  const configured = clean(
    process.env.NEXT_PUBLIC_SITE_URL
  );

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const production = clean(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  );

  if (production) {
    return `https://${production.replace(
      /^https?:\/\//,
      ""
    )}`;
  }

  const host = clean(
    req.headers?.["x-forwarded-host"] ||
    req.headers?.host
  );

  if (!host) {
    throw new Error(
      "Unable to determine application URL."
    );
  }

  const proto =
    clean(
      String(
        req.headers?.["x-forwarded-proto"] || ""
      ).split(",")[0]
    ) ||
    (host.includes("localhost")
      ? "http"
      : "https");

  return `${proto}://${host}`;
}

async function findOrder(
  db,
  suppliedOrderId,
  razorpayOrderId
) {
  const orders = db.collection("orders");

  if (suppliedOrderId) {
    const directRef = orders.doc(
      suppliedOrderId
    );

    const directSnap =
      await directRef.get();

    if (directSnap.exists) {
      return {
        ref: directRef,
        data: directSnap.data() || {},
      };
    }
  }

  if (razorpayOrderId) {
    const query =
      await orders
        .where(
          "razorpayOrderId",
          "==",
          razorpayOrderId
        )
        .limit(1)
        .get();

    if (!query.empty) {
      const doc = query.docs[0];

      return {
        ref: doc.ref,
        data: doc.data() || {},
      };
    }
  }

  return null;
}

export default async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    res.setHeader(
      "Allow",
      "POST"
    );

    return send(
      res,
      405,
      {
        success: false,
        error: "Method not allowed.",
      }
    );
  }

  try {
    const body = req.body || {};

    const suppliedOrder =
      body?.order &&
      typeof body.order === "object"
        ? body.order
        : body?.orderData &&
          typeof body.orderData === "object"
          ? body.orderData
          : {};

    const razorpayOrderId =
      first(
        body.razorpay_order_id,
        suppliedOrder.razorpayOrderId
      );

    const razorpayPaymentId =
      first(
        body.razorpay_payment_id,
        suppliedOrder.razorpayPaymentId
      );

    if (
      !razorpayOrderId ||
      !razorpayPaymentId
    ) {
      return send(
        res,
        400,
        {
          success: false,
          error:
            "Verified Razorpay order ID and payment ID are required.",
        }
      );
    }

    const db =
      getFirestore(
        getFirebaseAdmin()
      );

    const suppliedOrderId =
      first(
        suppliedOrder.websiteOrderId,
        suppliedOrder.orderId,
        suppliedOrder.id,
        body.orderId
      );

    const found =
      await findOrder(
        db,
        suppliedOrderId,
        razorpayOrderId
      );

    if (!found) {
      return send(
        res,
        404,
        {
          success: false,
          error:
            "Verified payment order was not found in Firebase.",
        }
      );
    }

    const order =
      found.data || {};

    if (
      order.paymentVerified !== true
    ) {
      return send(
        res,
        403,
        {
          success: false,
          error:
            "Payment is not verified. Shipment creation is blocked.",
        }
      );
    }

    if (
      clean(
        order.paymentStatus
      ).toLowerCase() !== "paid"
    ) {
      return send(
        res,
        403,
        {
          success: false,
          error:
            "Order payment status is not Paid.",
        }
      );
    }

    if (
      clean(
        order.razorpayOrderId
      ) !== razorpayOrderId
    ) {
      return send(
        res,
        403,
        {
          success: false,
          error:
            "Razorpay order ID does not match the verified Firebase order.",
        }
      );
    }

    if (
      clean(
        order.razorpayPaymentId
      ) &&
      clean(
        order.razorpayPaymentId
      ) !== razorpayPaymentId
    ) {
      return send(
        res,
        403,
        {
          success: false,
          error:
            "Razorpay payment ID does not match the verified Firebase order.",
        }
      );
    }

    const provider =
      normalizeProvider(
        body.provider ||
        order.provider ||
        order.courierProvider ||
        process.env
          .DEFAULT_LOGISTICS_PROVIDER ||
        "shiprocket"
      );

    // Prevent duplicate shipment creation.
    const existingShipmentId =
      first(
        order.shipmentId
      );

    if (existingShipmentId) {
      return send(
        res,
        200,
        {
          success: true,
          alreadyProcessed: true,
          provider,
          orderId:
            first(
              order.websiteOrderId,
              order.orderId,
              order.id,
              suppliedOrderId
            ),
          shipmentId:
            existingShipmentId,
          logisticsOrderId:
            first(
              order.logisticsOrderId,
              order.shiprocketOrderId
            ) || null,
          awb:
            first(
              order.awb
            ) || null,
          courier:
            first(
              order.courier
            ) || null,
          trackingUrl:
            first(
              order.trackingUrl
            ) || null,
          pickupStatus:
            first(
              order.pickupStatus
            ) || "Pending",
          pickupToken:
            first(
              order.pickupToken
            ) || "",
          labelUrl:
            first(
              order.labelUrl
            ) || null,
          invoiceUrl:
            first(
              order.invoiceUrl
            ) || null,
          combinedLabelInvoiceUrl:
            first(
              order.combinedLabelInvoiceUrl
            ) || null,
          documentError:
            first(
              order.documentError
            ) || "",
          message:
            "Shipment already exists. Existing shipment was not duplicated.",
        }
      );
    }

    const trustedOrder = {
      ...order,

      id:
        first(
          order.websiteOrderId,
          order.orderId,
          order.id,
          suppliedOrderId
        ),

      orderId:
        first(
          order.websiteOrderId,
          order.orderId,
          order.id,
          suppliedOrderId
        ),

      websiteOrderId:
        first(
          order.websiteOrderId,
          order.orderId,
          order.id,
          suppliedOrderId
        ),

      razorpayOrderId,
      razorpayPaymentId,

      paymentMethod:
        order.paymentMethod ||
        "Razorpay",

      paymentStatus:
        "Paid",

      paymentVerified:
        true,

      provider,

      courierProvider:
        provider,
    };

    const endpoint =
      provider === "ithink"
        ? "/api/ithink"
        : "/api/shiprocket";

    const providerResponse =
      await fetch(
        `${getBaseUrl(req)}${endpoint}`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              order:
                trustedOrder,

              orderId:
                trustedOrder.orderId,

              paymentId:
                razorpayPaymentId,

              provider,
            }),
        }
      );

    const providerData =
      await parseResponse(
        providerResponse
      );

    if (
      !providerResponse.ok ||
      providerData?.success === false
    ) {
      const message =
        first(
          providerData?.error,
          providerData?.message
        ) ||
        `${provider} shipment creation failed.`;

      await found.ref.set(
        {
          shipmentStatus:
            "Pending",

          shipmentError:
            message,

          courierProvider:
            provider,

          provider,

          updatedAt:
            new Date().toISOString(),
        },
        {
          merge: true,
        }
      );

      return send(
        res,
        providerResponse.status >= 400
          ? providerResponse.status
          : 502,
        {
          success: false,
          provider,
          error: message,
          details:
            providerData || null,
        }
      );
    }

    const shipmentId =
      first(
        providerData.shipmentId,
        providerData.shipment_id
      );

    const logisticsOrderId =
      first(
        providerData.logisticsOrderId,
        providerData.shiprocketOrderId,
        providerData.orderId
      );

    const awb =
      first(
        providerData.awb,
        providerData.awbCode
      );

    const courier =
      first(
        providerData.courier,
        providerData.courier_name
      );

    const trackingUrl =
      first(
        providerData.trackingUrl,
        providerData.tracking_url
      );

    const labelUrl =
      first(
        providerData.labelUrl,
        providerData.label_url
      );

    const invoiceUrl =
      first(
        providerData.invoiceUrl,
        providerData.invoice_url
      );

    const combinedLabelInvoiceUrl =
      first(
        providerData.combinedLabelInvoiceUrl
      );

    const pickupStatus =
      first(
        providerData.pickupStatus,
        "Pending"
      );

    const pickupToken =
      first(
        providerData.pickupToken
      );

    const documentError =
      first(
        providerData.documentError
      );

    if (!shipmentId) {
      await found.ref.set(
        {
          shipmentStatus:
            "Pending",

          shipmentError:
            `${provider} did not return a shipment ID.`,

          courierProvider:
            provider,

          provider,

          updatedAt:
            new Date().toISOString(),
        },
        {
          merge: true,
        }
      );

      return send(
        res,
        502,
        {
          success: false,
          provider,
          stage:
            "shipment_creation",
          retryable: true,
          error:
            `${provider} did not return a shipment ID.`,
          details:
            providerData,
        }
      );
    }

    const now =
      new Date().toISOString();

    const finalStatus =
      awb
        ? "AWB Assigned"
        : "Shipment Created";

    await found.ref.set(
      {
        paymentStatus:
          "Paid",

        paymentVerified:
          true,

        shipmentStatus:
          finalStatus,

        status:
          finalStatus,

        courierProvider:
          provider,

        provider,

        courier:
          courier || null,

        shipmentId,

        logisticsOrderId:
          logisticsOrderId || null,

        awb:
          awb || null,

        trackingUrl:
          trackingUrl || null,

        pickupStatus:
          pickupStatus ||
          "Pending",

        pickupToken:
          pickupToken || "",

        labelUrl:
          labelUrl || "",

        invoiceUrl:
          invoiceUrl || "",

        combinedLabelInvoiceUrl:
          combinedLabelInvoiceUrl || "",

        documentError:
          documentError || "",

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

    return send(
      res,
      200,
      {
        success: true,
        alreadyProcessed: false,
        provider,

        orderId:
          trustedOrder.orderId,

        shipmentId,

        logisticsOrderId:
          logisticsOrderId || null,

        awb:
          awb || null,

        courier:
          courier || null,

        trackingUrl:
          trackingUrl || null,

        pickupStatus:
          pickupStatus ||
          "Pending",

        pickupToken:
          pickupToken || "",

        labelUrl:
          labelUrl || null,

        invoiceUrl:
          invoiceUrl || null,

        combinedLabelInvoiceUrl:
          combinedLabelInvoiceUrl ||
          null,

        documentError:
          documentError || "",

        paymentStatus:
          "Paid",

        shipmentStatus:
          finalStatus,

        message:
          providerData.message ||
          `${provider} shipment created successfully.`,
      }
    );
  } catch (error) {
    console.error(
      "LUXMO HUB create-shipment error:",
      error
    );

    return send(
      res,
      Number(error?.status) >= 400
        ? Number(error.status)
        : 500,
      {
        success: false,
        error:
          error?.message ||
          "Internal server error while creating shipment.",

        details:
          error?.data || null,
      }
    );
  }
}
