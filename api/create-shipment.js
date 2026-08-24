// api/create-shipment.js
// LUXMO HUB
// VERIFIED PAYMENT -> SHIPMENT -> AWB -> TRACKING -> DOCUMENTS
//
// Providers:
//   1. Shiprocket
//   2. iThink Logistics
//
// Important:
// - Shipment is created ONLY after verified Razorpay payment.
// - Duplicate shipment creation is blocked.
// - Shiprocket label/invoice/combined document generation is supported.
// - iThink label/invoice URLs are saved when iThink returns them.
// - Notification/document failure never changes a Paid order to Failed.

import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

/* =========================================================
   BASIC HELPERS
========================================================= */

function clean(value) {
  return String(value ?? "").trim();
}

function cleanDocId(value) {
  return clean(value)
    .replace(/\//g, "_")
    .slice(0, 120);
}

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function normalizeProvider(value) {
  const provider = clean(value).toLowerCase();

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

function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function firstValue(...values) {
  for (const value of values) {
    const text = clean(value);

    if (text) {
      return text;
    }
  }

  return "";
}

async function parseResponse(response) {
  const contentType = clean(
    response.headers.get("content-type")
  ).toLowerCase();

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response
      .json()
      .catch(() => ({}));
  }

  const text = await response
    .text()
    .catch(() => "");

  return text
    ? {
        message: text.slice(0, 5000),
      }
    : {};
}

/* =========================================================
   BASE URL
========================================================= */

function getBaseUrl(req) {
  const configured = clean(
    process.env.NEXT_PUBLIC_SITE_URL
  );

  if (configured) {
    return configured.replace(
      /\/$/,
      ""
    );
  }

  const productionUrl = clean(
    process.env
      .VERCEL_PROJECT_PRODUCTION_URL
  );

  if (productionUrl) {
    return `https://${productionUrl.replace(
      /^https?:\/\//,
      ""
    )}`;
  }

  const host = clean(
    req.headers?.[
      "x-forwarded-host"
    ] ||
      req.headers?.host
  );

  if (!host) {
    throw new Error(
      "Unable to determine application URL."
    );
  }

  const forwardedProto = clean(
    String(
      req.headers?.[
        "x-forwarded-proto"
      ] || ""
    ).split(",")[0]
  );

  const protocol =
    forwardedProto ||
    (host.includes("localhost")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}

/* =========================================================
   SHIPROCKET AUTH
========================================================= */

async function getShiprocketToken() {
  const email = clean(
    process.env.SHIPROCKET_EMAIL
  );

  const password = clean(
    process.env.SHIPROCKET_PASSWORD
  );

  if (!email) {
    throw new Error(
      "SHIPROCKET_EMAIL is missing in Vercel Environment Variables."
    );
  }

  if (!password) {
    throw new Error(
      "SHIPROCKET_PASSWORD is missing in Vercel Environment Variables."
    );
  }

  const response = await fetch(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Accept:
          "application/json",
      },

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (
    !response.ok ||
    !data?.token
  ) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Shiprocket authentication failed."
    );
  }

  return data.token;
}

/* =========================================================
   SHIPROCKET REQUEST
========================================================= */

async function shiprocketPost(
  endpoint,
  token,
  body
) {
  const response =
    await fetch(
      `https://apiv2.shiprocket.in/v1/external${endpoint}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body:
          JSON.stringify(body),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    const errorText =
      data?.message ||
      data?.error ||
      (
        data?.errors
          ? JSON.stringify(
              data.errors
            )
          : ""
      ) ||
      `Shiprocket API failed (${response.status}).`;

    throw new Error(
      errorText
    );
  }

  return data;
}

/* =========================================================
   SHIPROCKET LABEL
========================================================= */

async function generateShippingLabel({
  shipmentId,
  token,
}) {
  if (!shipmentId) {
    return {
      success: false,
      url: "",
      error:
        "Shipment ID missing for label generation.",
    };
  }

  try {
    const data =
      await shiprocketPost(
        "/courier/generate/label",
        token,
        {
          shipment_id: [
            Number(shipmentId),
          ],
        }
      );

    return {
      success: true,

      url:
        firstValue(
          data?.label_url,
          data?.labelUrl,
          data?.url
        ),

      raw: data,
    };
  } catch (error) {
    return {
      success: false,

      url: "",

      error:
        error?.message ||
        "Shipping label generation failed.",
    };
  }
}

/* =========================================================
   SHIPROCKET INVOICE
========================================================= */

async function generateInvoice({
  logisticsOrderId,
  token,
}) {
  if (!logisticsOrderId) {
    return {
      success: false,

      url: "",

      error:
        "Shiprocket order ID missing for invoice generation.",
    };
  }

  try {
    const data =
      await shiprocketPost(
        "/orders/print/invoice",
        token,
        {
          ids: [
            Number(
              logisticsOrderId
            ),
          ],
        }
      );

    return {
      success: true,

      url:
        firstValue(
          data?.invoice_url,
          data?.invoiceUrl,
          data?.url
        ),

      raw: data,
    };
  } catch (error) {
    return {
      success: false,

      url: "",

      error:
        error?.message ||
        "Invoice generation failed.",
    };
  }
}

/* =========================================================
   SHIPROCKET COMBINED LABEL + INVOICE
========================================================= */

async function generateCombinedDocument({
  shipmentId,
  token,
}) {
  if (!shipmentId) {
    return {
      success: false,

      url: "",

      error:
        "Shipment ID missing for combined document.",
    };
  }

  try {
    const data =
      await shiprocketPost(
        "/courier/generate/label-invoice",
        token,
        {
          shipment_ids: [
            Number(shipmentId),
          ],
        }
      );

    return {
      success: true,

      url:
        firstValue(
          data?.file_url,
          data?.fileUrl,
          data?.url
        ),

      errorCount:
        toNumber(
          data?.error_count,
          0
        ),

      raw: data,
    };
  } catch (error) {
    return {
      success: false,

      url: "",

      error:
        error?.message ||
        "Combined label/invoice generation failed.",
    };
  }
}

/* =========================================================
   SHIPROCKET PICKUP
========================================================= */

async function requestPickup({
  shipmentId,
  token,
}) {
  if (!shipmentId) {
    return {
      success: false,

      status:
        "Pending",

      tokenNumber: "",

      error:
        "Shipment ID missing for pickup request.",
    };
  }

  try {
    const data =
      await shiprocketPost(
        "/courier/generate/pickup",
        token,
        {
          shipment_id: [
            Number(shipmentId),
          ],
        }
      );

    return {
      success: true,

      status:
        firstValue(
          data?.pickup_status,
          data?.status
        ) ||
        "Requested",

      tokenNumber:
        firstValue(
          data?.response?.data
            ?.pickup_token_number,

          data?.pickup_token_number
        ),

      raw: data,
    };
  } catch (error) {
    return {
      success: false,

      status:
        "Pending",

      tokenNumber: "",

      error:
        error?.message ||
        "Pickup request failed.",
    };
  }
}

/* =========================================================
   SHIPROCKET DOCUMENTS
========================================================= */

async function generateShiprocketDocuments({
  shipmentId,
  logisticsOrderId,
  token,
}) {
  const errors = [];

  let labelUrl = "";
  let invoiceUrl = "";
  let combinedLabelInvoiceUrl = "";

  const label =
    await generateShippingLabel({
      shipmentId,
      token,
    });

  if (label.success) {
    labelUrl =
      label.url || "";
  } else if (label.error) {
    errors.push(
      `Label: ${label.error}`
    );
  }

  const invoice =
    await generateInvoice({
      logisticsOrderId,
      token,
    });

  if (invoice.success) {
    invoiceUrl =
      invoice.url || "";
  } else if (invoice.error) {
    errors.push(
      `Invoice: ${invoice.error}`
    );
  }

  const combined =
    await generateCombinedDocument({
      shipmentId,
      token,
    });

  if (combined.success) {
    combinedLabelInvoiceUrl =
      combined.url || "";

    if (
      combined.errorCount > 0
    ) {
      errors.push(
        "Shiprocket reported an error while generating combined label/invoice."
      );
    }
  } else if (combined.error) {
    errors.push(
      `Combined document: ${combined.error}`
    );
  }

  return {
    labelUrl,

    invoiceUrl,

    combinedLabelInvoiceUrl,

    documentError:
      errors.join(" | "),
  };
}

/* =========================================================
   EXTRACT PROVIDER RESPONSE
========================================================= */

function extractProviderData(
  data
) {
  const root =
    data?.data ||
    data?.response ||
    data ||
    {};

  const shipment =
    root?.shipment ||
    {};

  const shipments =
    Array.isArray(
      root?.shipments
    )
      ? root.shipments
      : Array.isArray(
          data?.shipments
        )
      ? data.shipments
      : [];

  const first =
    shipments[0] ||
    shipment ||
    {};

  return {
    shipmentId:
      firstValue(
        data?.shipmentId,
        data?.shipment_id,
        root?.shipmentId,
        root?.shipment_id,
        first?.shipmentId,
        first?.shipment_id
      ),

    logisticsOrderId:
      firstValue(
        data?.orderId,
        data?.order_id,
        data?.shiprocketOrderId,
        data?.shiprocket_order_id,
        root?.orderId,
        root?.order_id,
        first?.orderId,
        first?.order_id
      ),

    awb:
      firstValue(
        data?.awb,
        data?.awbCode,
        data?.awb_code,
        data?.waybill,
        data?.airway_bill_no,

        root?.awb,
        root?.awbCode,
        root?.awb_code,
        root?.waybill,

        first?.awb,
        first?.awbCode,
        first?.awb_code,
        first?.waybill,
        first?.airway_bill_no
      ),

    courier:
      firstValue(
        data?.courier,
        data?.courier_name,
        data?.logistic_name,

        root?.courier,
        root?.courier_name,
        root?.logistic_name,

        first?.courier,
        first?.courier_name,
        first?.logistics
      ),

    trackingUrl:
      firstValue(
        data?.trackingUrl,
        data?.tracking_url,

        root?.trackingUrl,
        root?.tracking_url,

        first?.trackingUrl,
        first?.tracking_url
      ),

    labelUrl:
      firstValue(
        data?.labelUrl,
        data?.label_url,

        root?.labelUrl,
        root?.label_url,

        first?.labelUrl,
        first?.label_url
      ),

    invoiceUrl:
      firstValue(
        data?.invoiceUrl,
        data?.invoice_url,

        root?.invoiceUrl,
        root?.invoice_url,

        first?.invoiceUrl,
        first?.invoice_url
      ),

    status:
      firstValue(
        data?.status,
        root?.status,
        first?.status
      ),

    message:
      firstValue(
        data?.message,
        root?.message,
        first?.message
      ),
  };
}

/* =========================================================
   FIND FIREBASE ORDER
========================================================= */

async function findOrder({
  db,
  suppliedOrderId,
  razorpayOrderId,
}) {
  const ordersRef =
    db.collection("orders");

  if (suppliedOrderId) {
    const ref =
      ordersRef.doc(
        cleanDocId(
          suppliedOrderId
        )
      );

    const snapshot =
      await ref.get();

    if (snapshot.exists) {
      return {
        ref,

        data:
          snapshot.data() || {},
      };
    }
  }

  if (razorpayOrderId) {
    const query =
      await ordersRef
        .where(
          "razorpayOrderId",
          "==",
          razorpayOrderId
        )
        .limit(1)
        .get();

    if (!query.empty) {
      const doc =
        query.docs[0];

      return {
        ref: doc.ref,

        data:
          doc.data() || {},
      };
    }
  }

  return null;
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {
  if (
    req.method !== "POST"
  ) {
    res.setHeader(
      "Allow",
      "POST"
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

  try {
    const body =
      req.body || {};

    const suppliedOrder =
      body?.order &&
      typeof body.order ===
        "object"
        ? body.order
        : body?.orderData &&
          typeof body.orderData ===
            "object"
        ? body.orderData
        : {};

    /* =====================================================
       RAZORPAY IDs
    ===================================================== */

    const razorpayOrderId =
      firstValue(
        body.razorpay_order_id,

        suppliedOrder
          .razorpayOrderId
      );

    const razorpayPaymentId =
      firstValue(
        body.razorpay_payment_id,

        suppliedOrder
          .razorpayPaymentId
      );

    if (
      !razorpayOrderId ||
      !razorpayPaymentId
    ) {
      return sendJson(
        res,
        400,
        {
          success: false,

          error:
            "Verified Razorpay order ID and payment ID are required.",
        }
      );
    }

    /* =====================================================
       FIREBASE
    ===================================================== */

    const adminApp =
      getFirebaseAdmin();

    const db =
      getFirestore(
        adminApp
      );

    const suppliedOrderId =
      firstValue(
        suppliedOrder.websiteOrderId,

        suppliedOrder.orderId,

        suppliedOrder.id,

        body.orderId
      );

    const found =
      await findOrder({
        db,

        suppliedOrderId,

        razorpayOrderId,
      });

    if (!found) {
      return sendJson(
        res,
        404,
        {
          success: false,

          error:
            "Verified payment order was not found in Firebase. Shipment creation stopped.",
        }
      );
    }

    const order =
      found.data || {};

    /* =====================================================
       PAYMENT SECURITY
    ===================================================== */

    if (
      order.paymentVerified !==
      true
    ) {
      return sendJson(
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
      ).toLowerCase() !==
      "paid"
    ) {
      return sendJson(
        res,
        403,
        {
          success: false,

          error:
            "Order payment status is not Paid. Shipment creation is blocked.",
        }
      );
    }

    if (
      clean(
        order.razorpayOrderId
      ) !==
      razorpayOrderId
    ) {
      return sendJson(
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
      ) !==
      razorpayPaymentId
    ) {
      return sendJson(
        res,
        403,
        {
          success: false,

          error:
            "Razorpay payment ID does not match the verified Firebase order.",
        }
      );
    }

    /* =====================================================
       PROVIDER
    ===================================================== */

    const provider =
      normalizeProvider(
        body.provider ||

          order.provider ||

          order.courierProvider ||

          process.env
            .DEFAULT_LOGISTICS_PROVIDER ||

          "shiprocket"
      );

    /* =====================================================
       DUPLICATE SHIPMENT PROTECTION
    ===================================================== */

    const existingShipmentId =
      firstValue(
        order.shipmentId
      );

    if (
      existingShipmentId
    ) {
      let labelUrl =
        firstValue(
          order.labelUrl
        );

      let invoiceUrl =
        firstValue(
          order.invoiceUrl
        );

      let combinedLabelInvoiceUrl =
        firstValue(
          order.combinedLabelInvoiceUrl
        );

      let pickupStatus =
        firstValue(
          order.pickupStatus
        ) ||
        "Pending";

      let pickupToken =
        firstValue(
          order.pickupToken
        );

      let documentError =
        firstValue(
          order.documentError
        );

      /* ---------------------------------------------------
         SHIPROCKET BACKFILL
      --------------------------------------------------- */

      if (
        provider ===
          "shiprocket"
      ) {
        try {
          const token =
            await getShiprocketToken();

          if (
            pickupStatus ===
              "Pending" ||
            !pickupStatus
          ) {
            const pickup =
              await requestPickup({
                shipmentId:
                  existingShipmentId,

                token,
              });

            pickupStatus =
              pickup.status ||
              pickupStatus ||
              "Pending";

            pickupToken =
              pickup.tokenNumber ||
              pickupToken ||
              "";

            if (
              pickup.error
            ) {
              documentError =
                [
                  documentError,

                  `Pickup: ${pickup.error}`,
                ]
                  .filter(Boolean)
                  .join(" | ");
            }
          }

          if (
            !labelUrl ||
            !invoiceUrl ||
            !combinedLabelInvoiceUrl
          ) {
            const docs =
              await generateShiprocketDocuments(
                {
                  shipmentId:
                    existingShipmentId,

                  logisticsOrderId:
                    firstValue(
                      order.logisticsOrderId,

                      order.shiprocketOrderId
                    ),

                  token,
                }
              );

            labelUrl =
              docs.labelUrl ||
              labelUrl;

            invoiceUrl =
              docs.invoiceUrl ||
              invoiceUrl;

            combinedLabelInvoiceUrl =
              docs.combinedLabelInvoiceUrl ||
              combinedLabelInvoiceUrl;

            documentError =
              [
                documentError,

                docs.documentError,
              ]
                .filter(Boolean)
                .join(" | ");
          }

          await found.ref.set(
            {
              labelUrl,

              invoiceUrl,

              combinedLabelInvoiceUrl,

              pickupStatus,

              pickupToken,

              documentError,

              updatedAt:
                new Date().toISOString(),
            },

            {
              merge: true,
            }
          );
        } catch (error) {
          documentError =
            [
              documentError,

              error?.message ||
                "Shipment document backfill failed.",
            ]
              .filter(Boolean)
              .join(" | ");
        }
      }

      /* ---------------------------------------------------
         ALREADY PROCESSED RESPONSE
      --------------------------------------------------- */

      return sendJson(
        res,
        200,
        {
          success: true,

          alreadyProcessed:
            true,

          provider,

          orderId:
            firstValue(
              order.websiteOrderId,

              order.orderId,

              order.id,

              suppliedOrderId
            ),

          shipmentId:
            existingShipmentId,

          logisticsOrderId:
            firstValue(
              order.logisticsOrderId,

              order.shiprocketOrderId
            ) ||
            null,

          awb:
            firstValue(
              order.awb
            ) ||
            null,

          courier:
            firstValue(
              order.courier
            ) ||
            null,

          trackingUrl:
            firstValue(
              order.trackingUrl
            ) ||
            null,

          pickupStatus,

          pickupToken,

          labelUrl:
            labelUrl ||
            null,

          invoiceUrl:
            invoiceUrl ||
            null,

          combinedLabelInvoiceUrl:
            combinedLabelInvoiceUrl ||
            null,

          documentError:
            documentError || "",

          message:
            "Shipment already exists. Existing shipment was not duplicated.",
        }
      );
    }

    /* =====================================================
       TRUSTED ORDER
    ===================================================== */

    const trustedOrder = {
      ...order,

      id:
        firstValue(
          order.websiteOrderId,

          order.orderId,

          order.id,

          suppliedOrderId
        ),

      orderId:
        firstValue(
          order.websiteOrderId,

          order.orderId,

          order.id,

          suppliedOrderId
        ),

      websiteOrderId:
        firstValue(
          order.websiteOrderId,

          order.orderId,

          order.id,

          suppliedOrderId
        ),

      razorpayOrderId,

      razorpayPaymentId,

      paymentMethod:
        "Razorpay",

      paymentStatus:
        "Paid",

      paymentVerified:
        true,

      provider,

      courierProvider:
        provider,
    };

    /* =====================================================
       PROVIDER ENDPOINT
    ===================================================== */

    const baseUrl =
      getBaseUrl(req);

    const endpoint =
      provider ===
      "ithink"
        ? "/api/ithink"
        : "/api/shiprocket";

    /* =====================================================
       CREATE PROVIDER SHIPMENT
    ===================================================== */

    const providerResponse =
      await fetch(
        `${baseUrl}${endpoint}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
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
      providerData?.success ===
        false
    ) {
      const message =
        firstValue(
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

          updatedAt:
            new Date().toISOString(),
        },

        {
          merge: true,
        }
      );

      return sendJson(
        res,
        providerResponse.status >=
          400
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

    /* =====================================================
       EXTRACT SHIPMENT
    ===================================================== */

    const extracted =
      extractProviderData(
        providerData
      );

    const shipmentId =
      firstValue(
        extracted.shipmentId
      );

    const logisticsOrderId =
      firstValue(
        extracted.logisticsOrderId
      );

    const awb =
      firstValue(
        extracted.awb
      );

    const courier =
      firstValue(
        extracted.courier
      );

    const trackingUrl =
      firstValue(
        extracted.trackingUrl
      );

    let labelUrl =
      firstValue(
        extracted.labelUrl
      );

    let invoiceUrl =
      firstValue(
        extracted.invoiceUrl
      );

    let combinedLabelInvoiceUrl =
      "";

    let documentError =
      "";

    let pickupStatus =
      "Pending";

    let pickupToken =
      "";

    if (!shipmentId) {
      await found.ref.set(
        {
          shipmentStatus:
            "Pending",

          shipmentError:
            `${provider} did not return a shipment ID.`,

          updatedAt:
            new Date().toISOString(),
        },

        {
          merge: true,
        }
      );

      return sendJson(
        res,
        502,
        {
          success: false,

          provider,

          error:
            `${provider} did not return a shipment ID.`,

          details:
            providerData,
        }
      );
    }

    /* =====================================================
       SHIPROCKET DOCUMENTS + PICKUP
    ===================================================== */

    if (
      provider ===
      "shiprocket"
    ) {
      try {
        const token =
          await getShiprocketToken();

        const pickup =
          await requestPickup({
            shipmentId,

            token,
          });

        pickupStatus =
          pickup.status ||
          "Pending";

        pickupToken =
          pickup.tokenNumber ||
          "";

        if (
          pickup.error
        ) {
          documentError =
            `Pickup: ${pickup.error}`;
        }

        const docs =
          await generateShiprocketDocuments(
            {
              shipmentId,

              logisticsOrderId,

              token,
            }
          );

        labelUrl =
          docs.labelUrl ||
          labelUrl;

        invoiceUrl =
          docs.invoiceUrl ||
          invoiceUrl;

        combinedLabelInvoiceUrl =
          docs.combinedLabelInvoiceUrl ||
          "";

        documentError =
          [
            documentError,

            docs.documentError,
          ]
            .filter(Boolean)
            .join(" | ");
      } catch (error) {
        documentError =
          [
            documentError,

            error?.message ||
              "Shiprocket document generation failed.",
          ]
            .filter(Boolean)
            .join(" | ");
      }
    }

    /* =====================================================
       iTHINK DOCUMENT HANDLING
    ===================================================== */

    if (
      provider ===
      "ithink"
    ) {
      /*
        iThink.js already extracts label_url and
        invoice_url when iThink returns them.

        We intentionally do NOT call a made-up
        iThink document endpoint here.
      */

      if (
        !labelUrl
      ) {
        documentError =
          [
            documentError,

            "iThink did not return a shipping label URL.",
          ]
            .filter(Boolean)
            .join(" | ");
      }

      if (
        !invoiceUrl
      ) {
        documentError =
          [
            documentError,

            "iThink did not return an invoice URL.",
          ]
            .filter(Boolean)
            .join(" | ");
      }
    }

    /* =====================================================
       FINAL FIREBASE UPDATE
    ===================================================== */

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
          courier ||
          null,

        shipmentId,

        logisticsOrderId:
          logisticsOrderId ||
          null,

        awb:
          awb ||
          null,

        trackingUrl:
          trackingUrl ||
          null,

        pickupStatus:
          pickupStatus ||
          "Pending",

        pickupToken:
          pickupToken ||
          "",

        labelUrl:
          labelUrl ||
          "",

        invoiceUrl:
          invoiceUrl ||
          "",

        combinedLabelInvoiceUrl:
          combinedLabelInvoiceUrl ||
          "",

        documentError:
          documentError ||
          "",

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
       FINAL RESPONSE
    ===================================================== */

    return sendJson(
      res,
      200,
      {
        success: true,

        alreadyProcessed:
          false,

        provider,

        orderId:
          trustedOrder.orderId,

        shipmentId,

        logisticsOrderId:
          logisticsOrderId ||
          null,

        awb:
          awb ||
          null,

        courier:
          courier ||
          null,

        trackingUrl:
          trackingUrl ||
          null,

        pickupStatus:
          pickupStatus ||
          "Pending",

        pickupToken:
          pickupToken ||
          "",

        labelUrl:
          labelUrl ||
          null,

        invoiceUrl:
          invoiceUrl ||
          null,

        combinedLabelInvoiceUrl:
          combinedLabelInvoiceUrl ||
          null,

        documentError:
          documentError ||
          "",

        paymentStatus:
          "Paid",

        shipmentStatus:
          finalStatus,

        message:
          extracted.message ||
          `${provider} shipment created successfully.`,
      }
    );
  } catch (error) {
    console.error(
      "LUXMO HUB create-shipment error:",
      error
    );

    return sendJson(
      res,
      500,
      {
        success: false,

        error:
          error?.message ||
          "Internal server error while creating shipment.",
      }
    );
  }
}
