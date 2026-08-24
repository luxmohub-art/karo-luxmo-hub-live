// api/create-shipment.js
// LUXMO HUB — VERIFIED ORDER SHIPMENT + AWB + LABEL + INVOICE
//
// Supports:
// 1. Verified Razorpay payment check
// 2. Shiprocket shipment creation
// 3. iThink shipment creation
// 4. AWB / courier / tracking
// 5. Shiprocket pickup request
// 6. Shipping label generation
// 7. Invoice generation
// 8. Combined label + invoice
// 9. Firebase order update
// 10. Duplicate shipment protection

import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

/* =========================================================
   HELPERS
========================================================= */

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function cleanDocId(value) {
  return String(value || "")
    .trim()
    .replace(/\//g, "_")
    .slice(0, 120);
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

function cleanString(value) {
  return String(value || "").trim();
}

async function parseResponse(response) {
  const contentType = String(
    response.headers.get("content-type") || ""
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
        message: text.slice(0, 3000),
      }
    : {};
}

/* =========================================================
   BASE URL
========================================================= */

function getBaseUrl(req) {
  const configured =
    String(
      process.env.NEXT_PUBLIC_SITE_URL ||
        ""
    ).trim();

  if (configured) {
    return configured.replace(
      /\/$/,
      ""
    );
  }

  const productionUrl =
    String(
      process.env
        .VERCEL_PROJECT_PRODUCTION_URL ||
        ""
    ).trim();

  if (productionUrl) {
    return `https://${productionUrl.replace(
      /^https?:\/\//,
      ""
    )}`;
  }

  const host = String(
    req.headers?.[
      "x-forwarded-host"
    ] ||
      req.headers?.host ||
      ""
  ).trim();

  if (!host) {
    throw new Error(
      "Unable to determine application URL."
    );
  }

  const forwardedProto =
    String(
      req.headers?.[
        "x-forwarded-proto"
      ] || ""
    )
      .split(",")[0]
      .trim();

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
  const email =
    String(
      process.env.SHIPROCKET_EMAIL ||
        ""
    ).trim();

  const password =
    String(
      process.env.SHIPROCKET_PASSWORD ||
        ""
    ).trim();

  if (!email || !password) {
    throw new Error(
      "SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD is missing in Vercel Environment Variables."
    );
  }

  const response =
    await fetch(
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
   SHIPROCKET POST
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

        body: JSON.stringify(body),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        data?.errors
          ? JSON.stringify(
              data?.errors || data
            )
          : `Shiprocket API failed (${response.status}).`
    );
  }

  return data;
}

/* =========================================================
   GENERATE SHIPPING LABEL
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
        "Shipment ID is required for label generation.",
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
        data?.label_url ||
        data?.labelUrl ||
        data?.url ||
        "",

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
   GENERATE INVOICE
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
        "Shiprocket order ID is required for invoice generation.",
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
        data?.invoice_url ||
        data?.invoiceUrl ||
        data?.url ||
        "",

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
   GENERATE COMBINED LABEL + INVOICE
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
        "Shipment ID is required.",
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
        data?.file_url ||
        data?.fileUrl ||
        data?.url ||
        "",

      errorCount:
        Number(
          data?.error_count || 0
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
   PICKUP REQUEST
========================================================= */

async function requestPickup({
  shipmentId,
  token,
}) {
  if (!shipmentId) {
    return {
      success: false,
      status: "Pending",
      error:
        "Shipment ID is required.",
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
        data?.pickup_status ||
        data?.status ||
        "Requested",

      tokenNumber:
        data?.response?.data
          ?.pickup_token_number ||
        data?.pickup_token_number ||
        "",

      raw: data,
    };
  } catch (error) {
    return {
      success: false,

      status: "Pending",

      error:
        error?.message ||
        "Pickup request failed.",
    };
  }
}

/* =========================================================
   DOCUMENT GENERATION
========================================================= */

async function generateShiprocketDocuments({
  shipmentId,
  logisticsOrderId,
  token,
}) {
  const errors = [];

  let labelUrl = "";
  let invoiceUrl = "";
  let combinedLabelInvoiceUrl =
    "";

  /* -------------------------------------------------------
     SHIPPING LABEL
  ------------------------------------------------------- */

  const label =
    await generateShippingLabel({
      shipmentId,
      token,
    });

  if (label.success) {
    labelUrl = label.url || "";
  } else if (label.error) {
    errors.push(
      `Label: ${label.error}`
    );
  }

  /* -------------------------------------------------------
     INVOICE
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     COMBINED LABEL + INVOICE
  ------------------------------------------------------- */

  const combined =
    await generateCombinedDocument({
      shipmentId,
      token,
    });

  if (combined.success) {
    combinedLabelInvoiceUrl =
      combined.url || "";

    if (
      Number(
        combined.errorCount || 0
      ) > 0
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

    /* =====================================================
       BASIC PAYMENT IDENTIFIERS
    ===================================================== */

    const razorpayOrderId =
      cleanString(
        body.razorpay_order_id
      );

    const razorpayPaymentId =
      cleanString(
        body.razorpay_payment_id
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
            "Verified Razorpay order and payment IDs are required.",
        }
      );
    }

    /* =====================================================
       FIREBASE
    ===================================================== */

    const adminApp =
      getFirebaseAdmin();

    const db =
      getFirestore(adminApp);

    const ordersRef =
      db.collection("orders");

    /* =====================================================
       FIND ORDER
    ===================================================== */

    const suppliedOrder =
      body?.order &&
      typeof body.order ===
        "object"
        ? body.order
        : {};

    const suppliedOrderId =
      cleanString(
        suppliedOrder.id ||
          suppliedOrder.websiteOrderId ||
          suppliedOrder.orderId ||
          body.orderId
      );

    let orderSnapshot =
      null;

    /* -----------------------------------------------------
       FIRST: DIRECT DOCUMENT ID
    ----------------------------------------------------- */

    if (
      suppliedOrderId
    ) {
      const ref =
        ordersRef.doc(
          cleanDocId(
            suppliedOrderId
          )
        );

      const snapshot =
        await ref.get();

      if (snapshot.exists) {
        orderSnapshot = {
          ref,
          data:
            snapshot.data() || {},
        };
      }
    }

    /* -----------------------------------------------------
       SECOND: RAZORPAY ORDER ID
    ----------------------------------------------------- */

    if (
      !orderSnapshot
    ) {
      const query =
        await ordersRef
          .where(
            "razorpayOrderId",
            "==",
            razorpayOrderId
          )
          .limit(1)
          .get();

      if (
        !query.empty
      ) {
        const doc =
          query.docs[0];

        orderSnapshot = {
          ref: doc.ref,

          data:
            doc.data() || {},
        };
      }
    }

    if (
      !orderSnapshot
    ) {
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
      orderSnapshot.data || {};

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
      String(
        order.paymentStatus ||
          ""
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
      String(
        order.razorpayOrderId ||
          ""
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
      String(
        order.razorpayPaymentId ||
          ""
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
       ALREADY CREATED SHIPMENT
    ===================================================== */

    const shipmentAlreadyCreated =
      Boolean(
        order.shipmentId
      ) &&
      (
        String(
          order.shipmentStatus ||
            ""
        ).toLowerCase() ===
          "created" ||
        String(
          order.shipmentStatus ||
            ""
        ).toLowerCase() ===
          "shipped" ||
        String(
          order.shipmentStatus ||
            ""
        ).toLowerCase() ===
          "awb assigned"
      );

    if (
      shipmentAlreadyCreated
    ) {
      /*
        Shipment already exists.

        We DO NOT create another shipment.

        Instead, if Shiprocket documents are missing,
        attempt to generate them again.
      */

      let labelUrl =
        order.labelUrl || "";

      let invoiceUrl =
        order.invoiceUrl || "";

      let combinedLabelInvoiceUrl =
        order.combinedLabelInvoiceUrl ||
        "";

      let documentError =
        order.documentError || "";

      let pickupStatus =
        order.pickupStatus || "";

      let pickupToken =
        order.pickupToken || "";

      if (
        provider ===
          "shiprocket" &&
        order.shipmentId
      ) {
        try {
          const token =
            await getShiprocketToken();

          /* ------------------------------------------------
             MISSING PICKUP
          ------------------------------------------------ */

          if (
            !pickupStatus ||
            pickupStatus ===
              "Pending"
          ) {
            const pickup =
              await requestPickup({
                shipmentId:
                  order.shipmentId,

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

          /* ------------------------------------------------
             MISSING DOCUMENTS
          ------------------------------------------------ */

          if (
            !labelUrl ||
            !invoiceUrl ||
            !combinedLabelInvoiceUrl
          ) {
            const documents =
              await generateShiprocketDocuments(
                {
                  shipmentId:
                    order.shipmentId,

                  logisticsOrderId:
                    order.logisticsOrderId ||
                    order.shiprocketOrderId ||
                    null,

                  token,
                }
              );

            labelUrl =
              documents.labelUrl ||
              labelUrl;

            invoiceUrl =
              documents.invoiceUrl ||
              invoiceUrl;

            combinedLabelInvoiceUrl =
              documents.combinedLabelInvoiceUrl ||
              combinedLabelInvoiceUrl;

            documentError =
              [
                documentError,
                documents.documentError,
              ]
                .filter(Boolean)
                .join(" | ");
          }

          await orderSnapshot.ref.set(
            {
              labelUrl,

              invoiceUrl,

              combinedLabelInvoiceUrl,

              documentError,

              pickupStatus,

              pickupToken,

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
                "Unable to generate shipment documents.",
            ]
              .filter(Boolean)
              .join(" | ");
        }
      }

      return sendJson(
        res,
        200,
        {
          success: true,

          alreadyProcessed:
            true,

          provider,

          orderId:
            order.websiteOrderId ||
            order.id ||
            suppliedOrderId ||
            razorpayOrderId,

          shipmentId:
            order.shipmentId ||
            null,

          logisticsOrderId:
            order.logisticsOrderId ||
            order.shiprocketOrderId ||
            null,

          awb:
            order.awb ||
            null,

          courier:
            order.courier ||
            null,

          trackingUrl:
            order.trackingUrl ||
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
            "Shipment already exists. Missing tracking documents were checked/backfilled.",
        }
      );
    }

    /* =====================================================
       BUILD TRUSTED ORDER
    ===================================================== */

    const trustedOrder = {
      ...order,

      id:
        order.websiteOrderId ||
        order.id ||
        suppliedOrderId ||
        razorpayOrderId,

      orderId:
        order.websiteOrderId ||
        order.id ||
        suppliedOrderId ||
        razorpayOrderId,

      websiteOrderId:
        order.websiteOrderId ||
        order.id ||
        suppliedOrderId ||
        "",

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
       CREATE SHIPMENT
    ===================================================== */

    const baseUrl =
      getBaseUrl(req);

    const providerEndpoint =
      provider ===
      "ithink"
        ? "/api/ithink"
        : "/api/shiprocket";

    const providerResponse =
      await fetch(
        `${baseUrl}${providerEndpoint}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
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
        providerData?.error ||
        providerData?.message ||
        `${provider} shipment creation failed.`;

      await orderSnapshot.ref.set(
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
          : 500,
        {
          success: false,

          provider,

          error: message,

          details:
            providerData || null,
        }
      );
    }

    /* =====================================================
       EXTRACT SHIPMENT DATA
    ===================================================== */

    const shipmentId =
      providerData?.shipmentId ||
      providerData?.shipment_id ||
      providerData?.referenceNumber ||
      providerData?.refnum ||
      null;

    const logisticsOrderId =
      providerData?.orderId ||
      providerData?.order_id ||
      providerData?.shiprocketOrderId ||
      providerData?.shiprocket_order_id ||
      null;

    const awb =
      providerData?.awb ||
      providerData?.awbCode ||
      providerData?.awb_code ||
      providerData?.waybill ||
      null;

    const courier =
      providerData?.courier ||
      providerData?.courier_name ||
      providerData?.logistic_name ||
      null;

    const trackingUrl =
      providerData?.trackingUrl ||
      providerData?.tracking_url ||
      null;

    if (!shipmentId) {
      throw new Error(
        `${provider} did not return a shipment ID.`
      );
    }

    /* =====================================================
       DOCUMENTS + PICKUP
    ===================================================== */

    let labelUrl = "";

    let invoiceUrl = "";

    let combinedLabelInvoiceUrl =
      "";

    let documentError = "";

    let pickupStatus =
      "";

    let pickupToken =
      "";

    if (
      provider ===
      "shiprocket"
    ) {
      try {
        const token =
          await getShiprocketToken();

        /* ------------------------------------------------
           PICKUP
        ------------------------------------------------ */

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

        /* ------------------------------------------------
           LABEL + INVOICE
        ------------------------------------------------ */

        const documents =
          await generateShiprocketDocuments(
            {
              shipmentId,

              logisticsOrderId,

              token,
            }
          );

        labelUrl =
          documents.labelUrl ||
          "";

        invoiceUrl =
          documents.invoiceUrl ||
          "";

        combinedLabelInvoiceUrl =
          documents.combinedLabelInvoiceUrl ||
          "";

        documentError =
          [
            documentError,
            documents.documentError,
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
       FINAL FIRESTORE UPDATE
    ===================================================== */

    const now =
      new Date().toISOString();

    await orderSnapshot.ref.set(
      {
        paymentStatus:
          "Paid",

        paymentVerified:
          true,

        shipmentStatus:
          "Created",

        status:
          "Shipment Created",

        courierProvider:
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
       SUCCESS RESPONSE
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

        message:
          providerData?.message ||
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
          "Internal server error.",
      }
    );
  }
}
