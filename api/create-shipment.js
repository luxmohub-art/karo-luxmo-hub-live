// api/create-shipment.js
// LUXMO HUB — COD + PREPAID shipment creation
// Finds Firebase order by document ID, websiteOrderId, orderId, id,
// or Razorpay order ID.
// COD orders do not require Razorpay verification.

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

/**
 * Find order in Firebase.
 *
 * Search order:
 * 1. Firestore document ID
 * 2. websiteOrderId
 * 3. orderId
 * 4. id
 * 5. Razorpay order ID
 */
async function findOrder(
  db,
  suppliedOrderId,
  razorpayOrderId
) {
  const orders = db.collection("orders");

  const ids = [
    suppliedOrderId,
  ]
    .map(clean)
    .filter(Boolean);

  // ---------------------------------------------------------
  // 1. Direct Firestore document ID
  // ---------------------------------------------------------
  for (const id of ids) {
    const directRef = orders.doc(id);
    const directSnap = await directRef.get();

    if (directSnap.exists) {
      return {
        ref: directRef,
        data: directSnap.data() || {},
      };
    }
  }

  // ---------------------------------------------------------
  // 2. Search by websiteOrderId / orderId / id
  // ---------------------------------------------------------
  for (const field of [
    "websiteOrderId",
    "orderId",
    "id",
  ]) {
    for (const id of ids) {
      const query = await orders
        .where(field, "==", id)
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
  }

  // ---------------------------------------------------------
  // 3. Search by Razorpay Order ID
  // ---------------------------------------------------------
  if (razorpayOrderId) {
    const query = await orders
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

    // -------------------------------------------------------
    // Read order object from request
    // -------------------------------------------------------
    const suppliedOrder =
      body?.order &&
      typeof body.order === "object"
        ? body.order
        : body?.orderData &&
          typeof body.orderData === "object"
          ? body.orderData
          : {};

    // -------------------------------------------------------
    // Read Razorpay IDs if present
    // COD does not need them.
    // -------------------------------------------------------
    const razorpayOrderId =
      first(
        body.razorpay_order_id,
        body.razorpayOrderId,
        suppliedOrder.razorpayOrderId
      );

    const razorpayPaymentId =
      first(
        body.razorpay_payment_id,
        body.razorpayPaymentId,
        suppliedOrder.razorpayPaymentId
      );

    // -------------------------------------------------------
    // Determine payment method
    // -------------------------------------------------------
    const paymentMethod = first(
      body.paymentMethod,
      body.payment_method,
      body.paymentMode,
      body.payment_method_name,
      suppliedOrder.paymentMethod,
      suppliedOrder.payment_method,
      suppliedOrder.paymentMode,
      suppliedOrder.payment_method_name
    ).toLowerCase();

    const isCOD =
      paymentMethod === "cod" ||
      paymentMethod === "cash on delivery" ||
      paymentMethod === "cash_on_delivery" ||
      paymentMethod === "cash-on-delivery" ||
      suppliedOrder.isCOD === true ||
      suppliedOrder.isCod === true ||
      body.isCOD === true ||
      body.isCod === true;

    // -------------------------------------------------------
    // IMPORTANT:
    // COD orders do NOT require Razorpay IDs.
    // Prepaid orders still require both IDs.
    // -------------------------------------------------------
    if (
      !isCOD &&
      (!razorpayOrderId ||
        !razorpayPaymentId)
    ) {
      return send(
        res,
        400,
        {
          success: false,
          error:
            "Verified Razorpay order ID and payment ID are required for prepaid orders.",
        }
      );
    }

    // -------------------------------------------------------
    // Firebase
    // -------------------------------------------------------
    const db =
      getFirestore(
        getFirebaseAdmin()
      );

    // -------------------------------------------------------
    // Get website order ID from all possible locations
    // -------------------------------------------------------
    const suppliedOrderId =
      first(
        suppliedOrder.websiteOrderId,
        suppliedOrder.orderId,
        suppliedOrder.id,
        body.websiteOrderId,
        body.orderId,
        body.id
      );

    // -------------------------------------------------------
    // Find Firebase order
    // -------------------------------------------------------
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
            "Order record was not found in Firebase.",
          searchedOrderId:
            suppliedOrderId || null,
          razorpayOrderId:
            razorpayOrderId || null,
          paymentMethod:
            isCOD ? "COD" : "PREPAID",
        }
      );
    }

    const order =
      found.data || {};

    // -------------------------------------------------------
    // Determine actual payment method from Firebase order too
    // -------------------------------------------------------
    const actualPaymentMethod = first(
      order.paymentMethod,
      order.payment_method,
      order.paymentMode,
      order.payment_method_name,
      paymentMethod
    ).toLowerCase();

    const actualCOD =
      isCOD ||
      actualPaymentMethod === "cod" ||
      actualPaymentMethod === "cash on delivery" ||
      actualPaymentMethod === "cash_on_delivery" ||
      actualPaymentMethod === "cash-on-delivery" ||
      order.isCOD === true ||
      order.isCod === true;

    // -------------------------------------------------------
    // PREPAID VERIFICATION
    // -------------------------------------------------------
    if (!actualCOD) {
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
        !razorpayOrderId
      ) {
        return send(
          res,
          400,
          {
            success: false,
            error:
              "Razorpay order ID is required for prepaid shipment.",
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
    }

    // -------------------------------------------------------
    // PROVIDER
    // -------------------------------------------------------
    const provider =
      normalizeProvider(
        body.provider ||
          order.provider ||
          order.courierProvider ||
          process.env
            .DEFAULT_LOGISTICS_PROVIDER ||
          "shiprocket"
      );

    // -------------------------------------------------------
    // Prevent duplicate shipment creation
    // -------------------------------------------------------
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

    // -------------------------------------------------------
    // Build trusted order for courier provider
    // -------------------------------------------------------
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

      provider,

      courierProvider:
        provider,

      // -----------------------------------------------------
      // COD
      // -----------------------------------------------------
      ...(actualCOD
        ? {
            paymentMethod: "COD",

            paymentStatus:
              order.paymentStatus ||
              "COD",

            paymentVerified:
              false,
          }
        : {
            // -------------------------------------------------
            // PREPAID
            // -------------------------------------------------
            razorpayOrderId,

            razorpayPaymentId,

            paymentMethod:
              order.paymentMethod ||
              "Razorpay",

            paymentStatus:
              "Paid",

            paymentVerified:
              true,
          }),
    };

    // -------------------------------------------------------
    // Provider endpoint
    // -------------------------------------------------------
    const endpoint =
      provider === "ithink"
        ? "/api/ithink"
        : "/api/shiprocket";

    // -------------------------------------------------------
    // Create shipment
    // -------------------------------------------------------
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
                actualCOD
                  ? ""
                  : razorpayPaymentId,

              provider,

              paymentMethod:
                actualCOD
                  ? "COD"
                  : trustedOrder.paymentMethod,

              isCOD:
                actualCOD,
            }),
        }
      );

    // -------------------------------------------------------
    // Provider response
    // -------------------------------------------------------
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

          error:
            message,

          details:
            providerData || null,
        }
      );
    }

    // -------------------------------------------------------
    // Extract provider response
    // -------------------------------------------------------
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
        providerData.combinedLabelInvoiceUrl,
        providerData.combined_label_invoice_url
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

    // -------------------------------------------------------
    // Provider must return shipment ID
    // -------------------------------------------------------
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

          retryable:
            true,

          error:
            `${provider} did not return a shipment ID.`,

          details:
            providerData,
        }
      );
    }

    // -------------------------------------------------------
    // Successful shipment
    // -------------------------------------------------------
    const now =
      new Date().toISOString();

    const finalStatus =
      awb
        ? "AWB Assigned"
        : "Shipment Created";

    // -------------------------------------------------------
    // Save shipment to Firebase
    // -------------------------------------------------------
    await found.ref.set(
      {
        ...(actualCOD
          ? {
              paymentMethod:
                "COD",

              paymentStatus:
                order.paymentStatus ||
                "COD",

              paymentVerified:
                false,
            }
          : {
              paymentStatus:
                "Paid",

              paymentVerified:
                true,
            }),

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

    // -------------------------------------------------------
    // Final response
    // -------------------------------------------------------
    return send(
      res,
      200,
      {
        success:
          true,

        alreadyProcessed:
          false,

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

        paymentMethod:
          actualCOD
            ? "COD"
            : trustedOrder.paymentMethod,

        paymentStatus:
          actualCOD
            ? order.paymentStatus ||
              "COD"
            : "Paid",

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
