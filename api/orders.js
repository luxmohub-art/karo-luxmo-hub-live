// api/orders.js
// ============================================================
// LUXMO HUB — CUSTOMER MY ORDERS + ADMIN ORDERS API
// ============================================================

import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

const ADMIN_COOKIE_NAME = "luxmo_admin_session";

/* ============================================================
   FIREBASE
============================================================ */

function getDb() {
  const app = getFirebaseAdmin();
  return getFirestore(app);
}

/* ============================================================
   RESPONSE
============================================================ */

function sendJson(res, status, data) {
  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  return res.status(status).json(data);
}

/* ============================================================
   BASIC HELPERS
============================================================ */

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeMobile(value) {
  const digits = clean(value).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.length > 10
    ? digits.slice(-10)
    : digits;
}

function normalizeOrderId(value) {
  return clean(value)
    .replace(/\//g, "_")
    .slice(0, 120);
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function pickFirst(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      clean(value) !== ""
    ) {
      return value;
    }
  }

  return "";
}

/* ============================================================
   COOKIE
============================================================ */

function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie || "";

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const index = cookie.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = cookie
      .slice(0, index)
      .trim();

    const value = cookie
      .slice(index + 1)
      .trim();

    if (key === name) {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

/* ============================================================
   ADMIN SESSION
   Same format as /api/admin-session.js
============================================================ */

function base64UrlDecode(value) {
  if (!value) {
    return null;
  }

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
  if (
    typeof a !== "string" ||
    typeof b !== "string"
  ) {
    return false;
  }

  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      left,
      right
    );
  } catch {
    return false;
  }
}

function verifyAdminSession(req) {
  const secret = clean(
    process.env.ADMIN_SESSION_SECRET
  );

  if (!secret) {
    return {
      ok: false,
      status: 500,
      error:
        "ADMIN_SESSION_SECRET is not configured on the server.",
    };
  }

  const token = getCookie(
    req,
    ADMIN_COOKIE_NAME
  );

  if (!token) {
    return {
      ok: false,
      status: 401,
      error:
        "Admin session cookie not found.",
    };
  }

  const parts = String(token).split(".");

  if (parts.length !== 3) {
    return {
      ok: false,
      status: 401,
      error:
        "Invalid or expired admin session.",
    };
  }

  const [
    encodedPayload,
    expiresAtText,
    signature,
  ] = parts;

  if (
    !encodedPayload ||
    !expiresAtText ||
    !signature
  ) {
    return {
      ok: false,
      status: 401,
      error:
        "Invalid or expired admin session.",
    };
  }

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      secret
    )
    .update(
      `${encodedPayload}.${expiresAtText}`
    )
    .digest("base64url");

  if (
    !safeEqual(
      signature,
      expectedSignature
    )
  ) {
    return {
      ok: false,
      status: 401,
      error:
        "Invalid or expired admin session.",
    };
  }

  const expiresAt =
    Number(expiresAtText);

  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= 0 ||
    Date.now() >= expiresAt
  ) {
    return {
      ok: false,
      status: 401,
      error:
        "Invalid or expired admin session.",
    };
  }

  const payloadText =
    base64UrlDecode(
      encodedPayload
    );

  if (!payloadText) {
    return {
      ok: false,
      status: 401,
      error:
        "Invalid or expired admin session.",
    };
  }

  try {
    const payload =
      JSON.parse(payloadText);

    if (
      !payload ||
      payload.role !== "admin"
    ) {
      return {
        ok: false,
        status: 401,
        error:
          "Invalid or expired admin session.",
      };
    }

    return {
      ok: true,
      payload,
      expiresAt,
    };
  } catch {
    return {
      ok: false,
      status: 401,
      error:
        "Invalid or expired admin session.",
    };
  }
}

/* ============================================================
   FIRESTORE SERIALIZATION
============================================================ */

function serializeValue(value) {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    typeof value.toDate === "function"
  ) {
    try {
      return value.toDate().toISOString();
    } catch {
      return String(value);
    }
  }

  if (Array.isArray(value)) {
    return value.map(
      serializeValue
    );
  }

  if (typeof value === "object") {
    const output = {};

    for (
      const [key, item]
      of Object.entries(value)
    ) {
      output[key] =
        serializeValue(item);
    }

    return output;
  }

  return value;
}

/* ============================================================
   MOBILE EXTRACTION
============================================================ */

function getOrderMobile(order) {
  return normalizeMobile(
    pickFirst(
      order?.customer?.phone,
      order?.customer?.mobile,
      order?.customer?.contact,
      order?.customerPhone,
      order?.customerMobile,
      order?.phone,
      order?.mobile,
      order?.contactNumber,
      order?.contact,
      order?.shippingAddress?.phone,
      order?.shippingAddress?.mobile,
      order?.shippingAddress?.contact,
      order?.address?.phone,
      order?.address?.mobile,
      order?.address?.contact,
      order?.billingAddress?.phone,
      order?.billingAddress?.mobile
    )
  );
}

function mobileMatches(
  order,
  suppliedMobile
) {
  const expected =
    getOrderMobile(order);

  const actual =
    normalizeMobile(
      suppliedMobile
    );

  if (
    !expected ||
    !actual
  ) {
    return false;
  }

  return expected === actual;
}

/* ============================================================
   ORDER ID EXTRACTION
============================================================ */

function getOrderIdentifiers(
  order,
  firestoreId = ""
) {
  return [
    order?.websiteOrderId,
    order?.website_order_id,
    order?.orderId,
    order?.orderID,
    order?.order_id,
    order?.externalOrderId,
    order?.external_order_id,
    order?.id,
    firestoreId,
  ]
    .map(normalizeOrderId)
    .filter(Boolean);
}

function orderIdMatches(
  order,
  requestedOrderId,
  firestoreId = ""
) {
  const requested =
    normalizeOrderId(
      requestedOrderId
    );

  if (!requested) {
    return false;
  }

  const identifiers =
    getOrderIdentifiers(
      order,
      firestoreId
    );

  return identifiers.some(
    (id) => id === requested
  );
}

/* ============================================================
   FIND ORDER
============================================================ */

async function findOrder(
  db,
  orderId,
  mobile
) {
  const normalizedOrderId =
    normalizeOrderId(orderId);

  const normalizedMobile =
    normalizeMobile(mobile);

  if (!normalizedOrderId) {
    return null;
  }

  const ordersRef =
    db.collection("orders");

  /* ----------------------------------------------------------
     1. Direct Firestore document ID
  ---------------------------------------------------------- */

  try {
    const directRef =
      ordersRef.doc(
        normalizedOrderId
      );

    const directSnapshot =
      await directRef.get();

    if (directSnapshot.exists) {
      const data =
        directSnapshot.data() || {};

      if (
        !normalizedMobile ||
        mobileMatches(
          data,
          normalizedMobile
        )
      ) {
        return {
          ref: directRef,
          data,
          id: directSnapshot.id,
        };
      }
    }
  } catch (error) {
    console.error(
      "Direct order lookup failed:",
      error
    );
  }

  /* ----------------------------------------------------------
     2. Search all known Order ID fields
  ---------------------------------------------------------- */

  const idFields = [
    "websiteOrderId",
    "website_order_id",
    "orderId",
    "orderID",
    "order_id",
    "externalOrderId",
    "external_order_id",
    "id",
  ];

  for (const field of idFields) {
    try {
      const snapshot =
        await ordersRef
          .where(
            field,
            "==",
            normalizedOrderId
          )
          .limit(10)
          .get();

      if (!snapshot.empty) {
        for (
          const doc
          of snapshot.docs
        ) {
          const data =
            doc.data() || {};

          if (
            !normalizedMobile ||
            mobileMatches(
              data,
              normalizedMobile
            )
          ) {
            return {
              ref: doc.ref,
              data,
              id: doc.id,
            };
          }
        }
      }
    } catch (error) {
      console.error(
        `Order lookup failed for ${field}:`,
        error
      );
    }
  }

  /* ----------------------------------------------------------
     3. Final compatibility scan
     
     This handles older orders where the Order ID or mobile
     was stored inside a different nested structure.
     
     Limit keeps the request bounded.
  ---------------------------------------------------------- */

  try {
    const snapshot =
      await ordersRef
        .limit(500)
        .get();

    for (
      const doc
      of snapshot.docs
    ) {
      const data =
        doc.data() || {};

      if (
        orderIdMatches(
          data,
          normalizedOrderId,
          doc.id
        ) &&
        (
          !normalizedMobile ||
          mobileMatches(
            data,
            normalizedMobile
          )
        )
      ) {
        return {
          ref: doc.ref,
          data,
          id: doc.id,
        };
      }
    }
  } catch (error) {
    console.error(
      "Compatibility order scan failed:",
      error
    );
  }

  return null;
}

/* ============================================================
   ORDER ITEMS
============================================================ */

function buildItems(order) {
  const rawItems =
    Array.isArray(order?.items)
      ? order.items
      : Array.isArray(
          order?.orderItems
        )
      ? order.orderItems
      : Array.isArray(
          order?.products
        )
      ? order.products
      : [];

  return rawItems.map(
    (item) => {
      const quantity =
        Math.max(
          1,
          Math.floor(
            safeNumber(
              item?.qty ??
                item?.quantity ??
                item?.count ??
                1
            )
          )
        );

      const price =
        safeNumber(
          item?.price ??
            item?.salePrice ??
            item?.sellingPrice ??
            item?.unitPrice ??
            item?.amount ??
            0
        );

      return {
        id:
          item?.id ||
          item?.productId ||
          item?.product_id ||
          "",

        productId:
          item?.productId ||
          item?.product_id ||
          item?.id ||
          "",

        sku:
          item?.sku ||
          item?.SKU ||
          "",

        title:
          item?.title ||
          item?.name ||
          item?.productName ||
          item?.product_name ||
          "",

        name:
          item?.name ||
          item?.title ||
          item?.productName ||
          "",

        image:
          item?.image ||
          item?.imageUrl ||
          item?.image_url ||
          item?.thumbnail ||
          "",

        quantity,
        qty: quantity,

        price,

        salePrice:
          safeNumber(
            item?.salePrice ??
              item?.sellingPrice ??
              item?.price ??
              0
          ),

        colour:
          item?.colour ||
          item?.color ||
          item?.colourName ||
          "",

        color:
          item?.color ||
          item?.colour ||
          item?.colourName ||
          "",

        model:
          item?.model ||
          item?.modelName ||
          "",

        variant:
          item?.variant ||
          item?.variantName ||
          "",

        size:
          item?.size ||
          "",

        category:
          item?.category ||
          "",

        hsn:
          item?.hsn ||
          item?.HSN ||
          "",

        gst:
          safeNumber(
            item?.gst ??
              item?.gstAmount ??
              0
          ),
      };
    }
  );
}

/* ============================================================
   PAYMENT
============================================================ */

function getPaymentMethod(order) {
  const explicit =
    clean(
      order?.paymentMethod ||
      order?.payment_method ||
      order?.method ||
      order?.paymentType
    );

  if (explicit) {
    if (
      explicit.toLowerCase() ===
      "cod"
    ) {
      return "COD";
    }

    return explicit;
  }

  if (
    order?.isCOD === true ||
    order?.cod === true
  ) {
    return "COD";
  }

  return "Razorpay";
}

function getPaymentStatus(order) {
  const explicit =
    clean(
      order?.paymentStatus ||
      order?.payment_status ||
      order?.paymentState
    );

  if (explicit) {
    return explicit;
  }

  if (
    order?.paymentVerified === true
  ) {
    return "Paid";
  }

  return "Pending";
}

/* ============================================================
   SHIPMENT
============================================================ */

function getShipmentStatus(order) {
  const explicit =
    clean(
      order?.shipmentStatus ||
      order?.shipment_status ||
      order?.deliveryStatus ||
      order?.delivery_status
    );

  if (explicit) {
    return explicit;
  }

  if (
    order?.delivered === true
  ) {
    return "Delivered";
  }

  if (
    order?.shipmentId ||
    order?.shipment_id ||
    order?.awb ||
    order?.awbNumber
  ) {
    return "Created";
  }

  return "Pending";
}

/* ============================================================
   CUSTOMER ORDER RESPONSE
============================================================ */

function buildCustomerOrder(
  order,
  firestoreId = ""
) {
  const customer =
    order?.customer &&
    typeof order.customer ===
      "object"
      ? order.customer
      : {};

  const shippingAddress =
    order?.shippingAddress &&
    typeof order.shippingAddress ===
      "object"
      ? order.shippingAddress
      : order?.address &&
        typeof order.address ===
          "object"
      ? order.address
      : {};

  const billingAddress =
    order?.billingAddress &&
    typeof order.billingAddress ===
      "object"
      ? order.billingAddress
      : {};

  const orderId =
    pickFirst(
      order?.websiteOrderId,
      order?.website_order_id,
      order?.orderId,
      order?.orderID,
      order?.order_id,
      order?.externalOrderId,
      order?.external_order_id,
      order?.id,
      firestoreId
    );

  const paymentMethod =
    getPaymentMethod(order);

  const paymentStatus =
    getPaymentStatus(order);

  const shipmentStatus =
    getShipmentStatus(order);

  const customerMobile =
    getOrderMobile(order);

  const customerEmail =
    normalizeEmail(
      pickFirst(
        customer?.email,
        order?.customerEmail,
        order?.email,
        shippingAddress?.email
      )
    );

  const subtotal =
    safeNumber(
      order?.subtotal ??
        order?.subTotal ??
        0
    );

  const discount =
    safeNumber(
      order?.discount ??
        order?.totalDiscount ??
        order?.total_discount ??
        0
    );

  const shippingFee =
    safeNumber(
      order?.shippingFee ??
        order?.shippingCharges ??
        order?.shippingCharge ??
        order?.shippingCost ??
        order?.shipping ??
        0
    );

  const total =
    safeNumber(
      order?.total ??
        order?.grandTotal ??
        order?.totalAmount ??
        order?.amount ??
        0
    );

  const paidAmount =
    safeNumber(
      order?.paidAmount ??
        (
          paymentStatus
            .toLowerCase() ===
            "paid"
            ? total
            : 0
        )
    );

  return {
    id:
      firestoreId ||
      order?.id ||
      null,

    orderId,

    websiteOrderId:
      order?.websiteOrderId ||
      orderId,

    externalOrderId:
      order?.externalOrderId ||
      null,

    status:
      order?.status ||
      order?.orderStatus ||
      "Order Placed",

    orderStatus:
      order?.orderStatus ||
      order?.status ||
      "Order Placed",

    shipmentStatus,

    createdAt:
      order?.createdAt ||
      order?.created_at ||
      null,

    updatedAt:
      order?.updatedAt ||
      order?.updated_at ||
      null,

    paidAt:
      order?.paidAt ||
      order?.paymentDate ||
      order?.payment_date ||
      null,

    payment: {
      status:
        paymentStatus,

      verified:
        order?.paymentVerified ===
        true,

      method:
        paymentMethod,

      amount:
        paidAmount,

      totalAmount:
        total,

      currency:
        order?.currency ||
        "INR",

      razorpayOrderId:
        order?.razorpayOrderId ||
        order?.razorpay_order_id ||
        null,

      razorpayPaymentId:
        order?.razorpayPaymentId ||
        order?.razorpay_payment_id ||
        null,
    },

    paymentStatus,

    paymentMethod,

    paymentVerified:
      order?.paymentVerified ===
      true,

    pricing: {
      subtotal,
      discount,
      shippingFee,
      total,

      couponCode:
        order?.couponCode ||
        order?.coupon ||
        null,
    },

    subtotal,
    discount,
    shippingFee,
    total,

    grandTotal: total,
    totalAmount: total,

    customer: {
      name:
        pickFirst(
          customer?.name,
          customer?.fullName,
          order?.customerName,
          order?.name,
          order?.fullName,
          shippingAddress?.name
        ),

      mobile:
        customerMobile,

      phone:
        customerMobile,

      email:
        customerEmail,
    },

    shippingAddress: {
      name:
        pickFirst(
          shippingAddress?.name,
          shippingAddress?.fullName
        ),

      address:
        pickFirst(
          shippingAddress?.line1,
          shippingAddress?.address1,
          shippingAddress?.address,
          shippingAddress?.street
        ),

      address1:
        pickFirst(
          shippingAddress?.line1,
          shippingAddress?.address1,
          shippingAddress?.address
        ),

      address2:
        pickFirst(
          shippingAddress?.line2,
          shippingAddress?.address2
        ),

      city:
        shippingAddress?.city ||
        "",

      state:
        shippingAddress?.state ||
        "",

      pincode:
        shippingAddress?.pincode ||
        shippingAddress?.pinCode ||
        shippingAddress?.postalCode ||
        shippingAddress?.zip ||
        "",

      postalCode:
        shippingAddress?.postalCode ||
        shippingAddress?.pincode ||
        shippingAddress?.pinCode ||
        "",

      country:
        shippingAddress?.country ||
        "India",

      phone:
        normalizeMobile(
          pickFirst(
            shippingAddress?.phone,
            shippingAddress?.mobile,
            customerMobile
          )
        ),
    },

    billingAddress: {
      name:
        pickFirst(
          billingAddress?.name,
          billingAddress?.fullName
        ),

      address:
        pickFirst(
          billingAddress?.line1,
          billingAddress?.address1,
          billingAddress?.address
        ),

      address2:
        billingAddress?.line2 ||
        billingAddress?.address2 ||
        "",

      city:
        billingAddress?.city ||
        "",

      state:
        billingAddress?.state ||
        "",

      pincode:
        billingAddress?.pincode ||
        billingAddress?.pinCode ||
        billingAddress?.postalCode ||
        "",

      country:
        billingAddress?.country ||
        "India",
    },

    items:
      buildItems(order),

    shipment: {
      status:
        shipmentStatus,

      shipmentId:
        order?.shipmentId ||
        order?.shipment_id ||
        null,

      awb:
        order?.awb ||
        order?.awbNumber ||
        order?.trackingNumber ||
        null,

      trackingNumber:
        order?.trackingNumber ||
        order?.awb ||
        order?.awbNumber ||
        null,

      courier:
        order?.courier ||
        order?.courierName ||
        order?.carrier ||
        null,

      trackingUrl:
        order?.trackingUrl ||
        order?.tracking_url ||
        null,

      estimatedDelivery:
        order?.estimatedDelivery ||
        order?.estimated_delivery ||
        null,
    },

    invoice: {
      number:
        order?.invoiceNumber ||
        order?.invoice_number ||
        null,

      url:
        order?.invoiceUrl ||
        order?.invoice_url ||
        null,
    },

    notes:
      order?.notes ||
      "",

    raw: serializeValue(
      order
    ),
  };
}

/* ============================================================
   CUSTOMER LOOKUP
============================================================ */

async function handleCustomer(
  req,
  res
) {
  const body =
    req.method === "POST"
      ? (
          req.body &&
          typeof req.body === "object"
            ? req.body
            : {}
        )
      : {};

  const query =
    req.query || {};

  const orderId =
    clean(
      body.orderId ??
        body.websiteOrderId ??
        body.id ??
        query.orderId ??
        query.websiteOrderId ??
        query.id
    );

  const mobile =
    clean(
      body.mobile ??
        body.phone ??
        body.customerMobile ??
        query.mobile ??
        query.phone ??
        query.customerMobile
    );

  if (!orderId) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Order ID is required.",
      }
    );
  }

  if (!mobile) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Mobile number is required.",
      }
    );
  }

  const db = getDb();

  const found =
    await findOrder(
      db,
      orderId,
      mobile
    );

  if (!found) {
    return sendJson(
      res,
      404,
      {
        success: false,
        found: false,
        error:
          "Order not found.",
      }
    );
  }

  return sendJson(
    res,
    200,
    {
      success: true,
      found: true,

      order:
        buildCustomerOrder(
          found.data,
          found.id
        ),
    }
  );
}

/* ============================================================
   CUSTOMER SESSION COMPATIBILITY
============================================================ */

async function handleCustomerSession(
  req,
  res
) {
  /*
    IMPORTANT:

    This does NOT create a new API endpoint.
    It is handled inside /api/orders.

    If there is no customer session, return a normal
    unauthenticated response instead of 404.
  */

  return sendJson(
    res,
    200,
    {
      success: true,
      authenticated: false,
      customer: null,
      message:
        "Customer session is not active.",
    }
  );
}

/* ============================================================
   ADMIN ORDERS
============================================================ */

async function handleAdminOrders(
  req,
  res
) {
  const session =
    verifyAdminSession(req);

  if (!session.ok) {
    return sendJson(
      res,
      session.status,
      {
        success: false,
        authenticated: false,
        error: session.error,
      }
    );
  }

  const db = getDb();

  const limitValue =
    Number(
      req.query?.limit || 100
    );

  const limit = Math.min(
    Math.max(
      Number.isFinite(
        limitValue
      )
        ? Math.floor(
            limitValue
          )
        : 100,
      1
    ),
    500
  );

  try {
    const snapshot =
      await db
        .collection("orders")
        .limit(limit)
        .get();

    const orders =
      snapshot.docs.map(
        (doc) => {
          const data =
            doc.data() || {};

          return {
            ...serializeValue(
              data
            ),

            id:
              doc.id,

            orderId:
              pickFirst(
                data?.websiteOrderId,
                data?.website_order_id,
                data?.orderId,
                data?.orderID,
                data?.order_id,
                data?.externalOrderId,
                data?.external_order_id,
                data?.id,
                doc.id
              ),
          };
        }
      );

    return sendJson(
      res,
      200,
      {
        success: true,
        authenticated: true,
        orders,
        count: orders.length,
      }
    );
  } catch (error) {
    console.error(
      "Admin orders failed:",
      error
    );

    return sendJson(
      res,
      500,
      {
        success: false,
        authenticated: true,
        error:
          "Unable to load orders.",
      }
    );
  }
}

/* ============================================================
   MAIN HANDLER
============================================================ */

export default async function handler(
  req,
  res
) {
  try {
    const method =
      String(
        req.method || "GET"
      ).toUpperCase();

    const action =
      clean(
        req.query?.action
      ).toLowerCase();

    /* --------------------------------------------------------
       CUSTOMER SESSION COMPATIBILITY
    -------------------------------------------------------- */

    if (
      action ===
        "customer-session" ||
      action ===
        "customersession"
    ) {
      if (
        method !== "GET"
      ) {
        res.setHeader(
          "Allow",
          "GET"
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

      return handleCustomerSession(
        req,
        res
      );
    }

    /* --------------------------------------------------------
       CUSTOMER ORDER LOOKUP

       POST:
       /api/orders

       {
         action: "customer",
         orderId: "...",
         mobile: "..."
       }

       GET:
       /api/orders?action=customer&orderId=...&mobile=...
    -------------------------------------------------------- */

    if (
      action ===
        "customer" ||
      action ===
        "lookup" ||
      action ===
        "my-orders" ||
      (
        method === "POST" &&
        req.body &&
        typeof req.body ===
          "object" &&
        (
          req.body.action ===
            "customer" ||
          req.body.orderId ||
          req.body.websiteOrderId
        )
      )
    ) {
      if (
        method !== "GET" &&
        method !== "POST"
      ) {
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
              "Method not allowed.",
          }
        );
      }

      return handleCustomer(
        req,
        res
      );
    }

    /* --------------------------------------------------------
       ADMIN

       GET /api/orders

       POST /api/orders
       {
         action: "admin"
       }
    -------------------------------------------------------- */

    if (
      action === "admin" ||
      method === "GET"
    ) {
      return handleAdminOrders(
        req,
        res
      );
    }

    if (
      method === "POST" &&
      req.body &&
      typeof req.body ===
        "object" &&
      req.body.action ===
        "admin"
    ) {
      return handleAdminOrders(
        req,
        res
      );
    }

    /* --------------------------------------------------------
       DEFAULT

       Preserve old behaviour:
       GET = ADMIN
       POST = CUSTOMER/ADMIN based on body
    -------------------------------------------------------- */

    if (
      method === "GET"
    ) {
      return handleAdminOrders(
        req,
        res
      );
    }

    if (
      method === "POST"
    ) {
      const body =
        req.body &&
        typeof req.body ===
          "object"
          ? req.body
          : {};

      if (
        body.orderId ||
        body.websiteOrderId ||
        body.id ||
        body.mobile
      ) {
        return handleCustomer(
          req,
          res
        );
      }

      return handleAdminOrders(
        req,
        res
      );
    }

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
          "Method not allowed.",
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
          "Internal server error.",
      }
    );
  }
}
