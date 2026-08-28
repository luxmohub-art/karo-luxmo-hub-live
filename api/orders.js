import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

const COOKIE_NAME = "luxmo_admin_session";

/* ============================================================
   BASIC HELPERS
   ============================================================ */

function clean(value) {
  return String(value ?? "").trim();
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && clean(value)) {
      return value;
    }
  }

  return "";
}

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function normalizeMobile(value) {
  const digits = clean(value).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits.slice(-10);
  }

  return digits.slice(-10);
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function getDb() {
  return getFirestore(getFirebaseAdmin());
}

function sendJson(res, status, data) {
  return res.status(status).json(data);
}


/* ============================================================
   ADMIN SESSION
   ============================================================ */

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
      left.length === right.length &&
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
    signature
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
    !Number.isFinite(expiry) ||
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
      payload?.role === "admin"
    );
  } catch {
    return false;
  }
}


/* ============================================================
   CUSTOMER ACCESS TOKEN
   ============================================================ */

function createCustomerAccessToken(
  orderId,
  mobile
) {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not configured."
    );
  }

  const payload =
    Buffer.from(
      JSON.stringify({
        role: "customer",
        orderId: String(orderId),
        mobile: String(mobile)
      })
    ).toString("base64url");

  const expiresAt =
    String(
      Date.now() +
      30 * 60 * 1000
    );

  const signature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        `${payload}.${expiresAt}`
      )
      .digest("base64url");

  return (
    `${payload}.${expiresAt}.${signature}`
  );
}

function verifyCustomerAccessToken(
  token,
  orderId,
  mobile
) {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!token || !secret) {
    return false;
  }

  const parts =
    String(token).split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [
    payloadPart,
    expiresAt,
    signature
  ] = parts;

  const expected =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        `${payloadPart}.${expiresAt}`
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

  if (
    Date.now() >=
    Number(expiresAt)
  ) {
    return false;
  }

  try {
    const payload =
      JSON.parse(
        base64UrlDecode(
          payloadPart
        ) || "{}"
      );

    return (
      payload?.role === "customer" &&
      String(payload?.orderId) ===
        String(orderId) &&
      normalizeMobile(
        payload?.mobile
      ) ===
        normalizeMobile(mobile)
    );
  } catch {
    return false;
  }
}


/* ============================================================
   ORDER MOBILE
   ============================================================ */

function getOrderMobile(order) {
  return normalizeMobile(
    pickFirst(
      order?.customer?.phone,
      order?.customer?.mobile,
      order?.customerPhone,
      order?.customerMobile,
      order?.phone,
      order?.mobile,
      order?.contactNumber,
      order?.shippingAddress?.phone,
      order?.shippingAddress?.mobile,
      order?.address?.phone,
      order?.address?.mobile
    )
  );
}


/* ============================================================
   FIND ORDER
   ============================================================ */

async function findOrder(
  db,
  orderId
) {
  const cleanId =
    clean(orderId);

  if (!cleanId) {
    return null;
  }

  const direct =
    await db
      .collection("orders")
      .doc(cleanId)
      .get();

  if (direct.exists) {
    return {
      id: direct.id,
      ...direct.data()
    };
  }

  const fields = [
    "websiteOrderId",
    "orderId",
    "orderNumber"
  ];

  for (
    const field of fields
  ) {
    const snapshot =
      await db
        .collection("orders")
        .where(
          field,
          "==",
          cleanId
        )
        .limit(1)
        .get();

    if (!snapshot.empty) {
      const doc =
        snapshot.docs[0];

      return {
        id: doc.id,
        ...doc.data()
      };
    }
  }

  return null;
}


/* ============================================================
   CUSTOMER ORDER
   ============================================================ */

async function handleCustomerOrder(
  req,
  res,
  db
) {
  const body =
    req.body || {};

  const orderId =
    clean(body.orderId);

  const mobile =
    normalizeMobile(
      body.mobile ||
      body.phone
    );

  if (!orderId) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Order ID is required."
      }
    );
  }

  if (
    !/^[6-9]\d{9}$/.test(
      mobile
    )
  ) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Enter a valid 10-digit mobile number."
      }
    );
  }

  const order =
    await findOrder(
      db,
      orderId
    );

  if (!order) {
    return sendJson(
      res,
      404,
      {
        success: false,
        error:
          "Order not found."
      }
    );
  }

  const orderMobile =
    getOrderMobile(order);

  if (
    !orderMobile ||
    orderMobile !== mobile
  ) {
    return sendJson(
      res,
      403,
      {
        success: false,
        error:
          "Order ID and mobile number do not match."
      }
    );
  }

  return sendJson(
    res,
    200,
    {
      success: true,
      order
    }
  );
}


/* ============================================================
   REQUEST CUSTOMER ACCESS
   ============================================================ */

async function handleRequestAccess(
  req,
  res,
  db
) {
  const body =
    req.body || {};

  const orderId =
    clean(body.orderId);

  const mobile =
    normalizeMobile(
      body.phone ||
      body.mobile
    );

  if (!orderId) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Order ID is required."
      }
    );
  }

  if (
    !/^[6-9]\d{9}$/.test(
      mobile
    )
  ) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Enter a valid 10-digit mobile number."
      }
    );
  }

  const order =
    await findOrder(
      db,
      orderId
    );

  if (!order) {
    return sendJson(
      res,
      404,
      {
        success: false,
        error:
          "Order not found."
      }
    );
  }

  const orderMobile =
    getOrderMobile(order);

  if (
    !orderMobile ||
    orderMobile !== mobile
  ) {
    return sendJson(
      res,
      403,
      {
        success: false,
        error:
          "Order ID and mobile number do not match."
      }
    );
  }

  const accessToken =
    createCustomerAccessToken(
      order.id,
      mobile
    );

  return sendJson(
    res,
    200,
    {
      success: true,
      accessToken,
      orderId: order.id
    }
  );
}


/* ============================================================
   AUTHENTICATED CUSTOMER GET
   ============================================================ */

async function handleAuthenticatedOrder(
  req,
  res,
  db
) {
  const orderId =
    clean(
      req.query?.orderId
    );

  const authorization =
    clean(
      req.headers?.authorization
    );

  const token =
    authorization.startsWith(
      "Bearer "
    )
      ? authorization.slice(7)
      : "";

  if (!orderId) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Order ID is required."
      }
    );
  }

  if (!token) {
    return sendJson(
      res,
      401,
      {
        success: false,
        error:
          "Order access token is required."
      }
    );
  }

  const order =
    await findOrder(
      db,
      orderId
    );

  if (!order) {
    return sendJson(
      res,
      404,
      {
        success: false,
        error:
          "Order not found."
      }
    );
  }

  let tokenPayload;

  try {
    const payloadPart =
      token.split(".")[0];

    tokenPayload =
      JSON.parse(
        base64UrlDecode(
          payloadPart
        ) || "{}"
      );
  } catch {
    tokenPayload = {};
  }

  if (
    !verifyCustomerAccessToken(
      token,
      order.id,
      tokenPayload?.mobile
    )
  ) {
    return sendJson(
      res,
      401,
      {
        success: false,
        error:
          "Invalid or expired order access token."
      }
    );
  }

  return sendJson(
    res,
    200,
    {
      success: true,
      order
    }
  );
}


/* ============================================================
   ADMIN ORDERS
   ============================================================ */

async function handleAdminOrders(
  req,
  res,
  db
) {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return sendJson(
      res,
      500,
      {
        success: false,
        error:
          "Admin session configuration missing."
      }
    );
  }

  const token =
    getCookie(
      req,
      COOKIE_NAME
    );

  if (
    !verifyAdminSession(
      token,
      secret
    )
  ) {
    return sendJson(
      res,
      401,
      {
        success: false,
        error:
          "Admin authentication required."
      }
    );
  }

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
        ...doc.data()
      })
    );

  return sendJson(
    res,
    200,
    {
      success: true,
      orders
    }
  );
}


/* ============================================================
   WHATSAPP CONFIG
   ============================================================ */

function getWhatsAppConfig() {
  return {
    accessToken: clean(
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.META_WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_CLOUD_API_TOKEN
    ),

    phoneNumberId: clean(
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.META_WHATSAPP_PHONE_NUMBER_ID
    ),

    apiVersion: clean(
      process.env.WHATSAPP_API_VERSION ||
      process.env.META_GRAPH_API_VERSION ||
      "v23.0"
    )
  };
}


/* ============================================================
   WHATSAPP ORDER NOTIFICATION
   ============================================================ */

function getOrderCustomerName(order) {
  return clean(
    order?.customer?.name ||
    order?.customerName ||
    order?.shippingAddress?.name ||
    order?.address?.name ||
    "Customer"
  );
}

function getOrderNumber(order) {
  return clean(
    order?.websiteOrderId ||
    order?.orderNumber ||
    order?.orderId ||
    order?.id ||
    "N/A"
  );
}

function getOrderTotal(order) {
  const total =
    safeNumber(
      order?.total ??
      order?.grandTotal ??
      order?.amount ??
      order?.pricing?.total ??
      0
    );

  return `₹${total.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`;
}

function getOrderItems(order) {
  const items =
    Array.isArray(order?.items)
      ? order.items
      : Array.isArray(order?.products)
      ? order.products
      : [];

  if (!items.length) {
    return "Your LUXMO HUB order";
  }

  return items
    .slice(0, 3)
    .map(
      (item) =>
        `${clean(
          item?.name ||
          item?.title ||
          item?.productName ||
          "Product"
        )} x${Math.max(
          1,
          Math.floor(
            safeNumber(
              item?.quantity ??
              item?.qty ??
              1
            )
          )
        )}`
    )
    .join(", ");
}

function getNotificationText(
  type
) {
  const messages = {
    order_placed:
      "Your order has been placed successfully.",

    payment_success:
      "Your payment has been received successfully.",

    order_shipped:
      "Your order has been shipped.",

    out_for_delivery:
      "Your order is out for delivery.",

    delivered:
      "Your order has been delivered successfully."
  };

  return (
    messages[type] ||
    "Your order status has been updated."
  );
}

async function sendOrderWhatsApp(
  order,
  type
) {
  const config =
    getWhatsAppConfig();

  if (
    !config.accessToken ||
    !config.phoneNumberId
  ) {
    throw new Error(
      "WhatsApp Cloud API credentials are not configured."
    );
  }

  const mobile =
    getOrderMobile(order);

  if (
    !/^[6-9]\d{9}$/.test(
      mobile
    )
  ) {
    throw new Error(
      "Customer WhatsApp/mobile number is missing or invalid."
    );
  }

  const templateName =
    clean(
      process.env.WHATSAPP_ORDER_TEMPLATE ||
      "luxmo_order_update"
    );

  const language =
    clean(
      process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE ||
      process.env.WHATSAPP_ORDER_LANGUAGE ||
      "en_US"
    );

  const payload = {
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      `91${mobile}`,

    type:
      "template",

    template: {
      name:
        templateName,

      language: {
        code:
          language
      },

      components: [
        {
          type:
            "body",

          parameters: [
            {
              type:
                "text",
              text:
                getOrderCustomerName(
                  order
                )
            },

            {
              type:
                "text",
              text:
                getOrderNumber(
                  order
                )
            },

            {
              type:
                "text",
              text:
                getNotificationText(
                  type
                )
            },

            {
              type:
                "text",
              text:
                getOrderTotal(
                  order
                )
            },

            {
              type:
                "text",
              text:
                getOrderItems(
                  order
                )
            }
          ]
        }
      ]
    }
  };

  const response =
    await fetch(
      `https://graph.facebook.com/${encodeURIComponent(
        config.apiVersion
      )}/${encodeURIComponent(
        config.phoneNumberId
      )}/messages`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${config.accessToken}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      data?.error?.error_data?.details ||
      "WhatsApp message failed."
    );
  }

  return data;
}


/* ============================================================
   WHATSAPP MARKETING
   ============================================================ */

async function handleWhatsAppMarketing(
  req,
  res
) {
  const body =
    req.body || {};

  const mobile =
    normalizeMobile(
      body.mobile
    );

  if (
    !/^[6-9]\d{9}$/.test(
      mobile
    )
  ) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Enter a valid WhatsApp number."
      }
    );
  }

  const config =
    getWhatsAppConfig();

  if (
    !config.accessToken ||
    !config.phoneNumberId
  ) {
    return sendJson(
      res,
      500,
      {
        success: false,
        error:
          "WhatsApp Cloud API credentials are not configured."
      }
    );
  }

  const templateName =
    clean(
      body.templateName ||
      process.env.WHATSAPP_MARKETING_TEMPLATE ||
      "luxmo_shop_now"
    );

  const language =
    clean(
      body.languageCode ||
      process.env.WHATSAPP_MARKETING_LANGUAGE ||
      "en_US"
    );

  const product =
    body.product || {};

  const payload = {
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      `91${mobile}`,

    type:
      "template",

    template: {
      name:
        templateName,

      language: {
        code:
          language
      },

      components: [
        {
          type:
            "body",

          parameters: [
            {
              type:
                "text",
              text:
                clean(
                  product.title ||
                  "LUXMO HUB Product"
                )
            },

            {
              type:
                "text",
              text:
                `₹${safeNumber(
                  product.price
                ).toLocaleString(
                  "en-IN"
                )}`
            },

            {
              type:
                "text",
              text:
                clean(
                  product.url ||
                  process.env.SITE_URL ||
                  "https://www.luxmohub.in"
                )
            }
          ]
        }
      ]
    }
  };

  const response =
    await fetch(
      `https://graph.facebook.com/${encodeURIComponent(
        config.apiVersion
      )}/${encodeURIComponent(
        config.phoneNumberId
      )}/messages`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${config.accessToken}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    return sendJson(
      res,
      502,
      {
        success: false,
        error:
          data?.error?.message ||
          data?.message ||
          "WhatsApp marketing message failed."
      }
    );
  }

  return sendJson(
    res,
    200,
    {
      success: true,
      messageId:
        data?.messages?.[0]?.id ||
        null
    }
  );
}


/* ============================================================
   MAIN VERCEL API HANDLER
   ============================================================ */

export default async function handler(
  req,
  res
) {
  try {
    const db =
      getDb();

    /* --------------------------------------------------------
       GET
       -------------------------------------------------------- */

    if (
      req.method === "GET"
    ) {

      /*
       * Customer authenticated order
       */
      if (
        req.query?.orderId &&
        req.headers?.authorization
      ) {
        return handleAuthenticatedOrder(
          req,
          res,
          db
        );
      }

      /*
       * Existing abandoned-checkout processor
       */
      if (
        String(
          req.query?.action || ""
        ).toLowerCase() ===
        "whatsapp-abandoned"
      ) {
        return res.status(200).json({
          success: true,
          enabled: false,
          message:
            "Abandoned checkout processor is available through the existing WhatsApp flow."
        });
      }

      /*
       * Admin orders
       */
      return handleAdminOrders(
        req,
        res,
        db
      );
    }


    /* --------------------------------------------------------
       POST
       -------------------------------------------------------- */

    if (
      req.method === "POST"
    ) {

      const body =
        req.body || {};

      const action =
        clean(
          body.action
        ).toLowerCase();

      /*
       * Customer order lookup
       */
      if (
        action === "customer"
      ) {
        return handleCustomerOrder(
          req,
          res,
          db
        );
      }

      /*
       * Customer order access token
       */
      if (
        action === "request-access"
      ) {
        return handleRequestAccess(
          req,
          res,
          db
        );
      }

      /*
       * Existing WhatsApp marketing
       */
      if (
        action ===
        "whatsapp-marketing"
      ) {
        return handleWhatsAppMarketing(
          req,
          res
        );
      }

      /*
       * Internal order notification.
       *
       * This can be called from existing server-side
       * order/payment/status code without creating
       * another API endpoint.
       */
      if (
        action ===
        "order-notification"
      ) {

        const type =
          clean(
            body.type
          );

        const allowed =
          new Set([
            "order_placed",
            "payment_success",
            "order_shipped",
            "out_for_delivery",
            "delivered"
          ]);

        if (
          !allowed.has(type)
        ) {
          return sendJson(
            res,
            400,
            {
              success: false,
              error:
                "Invalid order notification type."
            }
          );
        }

        try {
          const result =
            await sendOrderWhatsApp(
              body.order || {},
              type
            );

          return sendJson(
            res,
            200,
            {
              success: true,
              messageId:
                result?.messages?.[0]?.id ||
                null
            }
          );

        } catch (error) {
          console.error(
            "LUXMO order WhatsApp notification failed:",
            error
          );

          return sendJson(
            res,
            502,
            {
              success: false,
              error:
                error?.message ||
                "WhatsApp notification failed."
            }
          );
        }
      }

      return sendJson(
        res,
        400,
        {
          success: false,
          error:
            "Unknown orders API action."
        }
      );
    }


    /* --------------------------------------------------------
       METHOD NOT ALLOWED
       -------------------------------------------------------- */

    res.setHeader(
      "Allow",
      "GET, POST"
    );

    return sendJson(
      res,
      405,
      {
        success: false,
        error:
          "Method not allowed."
      }
    );

  } catch (error) {

    console.error(
      "Orders API error:",
      error
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        error:
          error?.message ||
          "Orders API failed."
      }
    );
  }
}
