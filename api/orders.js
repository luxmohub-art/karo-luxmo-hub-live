// api/orders.js
// ============================================================
// LUXMO HUB — CUSTOMER MY ORDERS + ADMIN ORDERS API
// ============================================================
//
// CUSTOMER:
// POST /api/orders
// {
//   action: "customer",
//   orderId: "LMH....",
//   mobile: "98XXXXXXXX"
// }
//
// GET compatibility:
// /api/orders?action=customer&orderId=LMH...&mobile=98XXXXXXXX
//
// CUSTOMER SESSION COMPATIBILITY:
// /api/orders?action=customer-session
//
// ADMIN:
// GET /api/orders
// Cookie: luxmo_admin_session=...
//
// POST /api/orders
// {
//   action: "admin"
// }
//
// IMPORTANT:
// - No new API function
// - Customer-session uses this same function
// - COD orders are supported
// - Razorpay orders are supported
// - Existing Firestore orders collection is used
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
   HELPERS
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
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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
   SERIALIZE FIRESTORE VALUES
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
    return value.map(serializeValue);
  }

  if (typeof value === "object") {
    const output = {};

    for (const [key, item] of Object.entries(value)) {
      output[key] = serializeValue(item);
    }

    return output;
  }

  return value;
}

/* ============================================================
   MOBILE MATCH
============================================================ */

function mobileMatches(order, suppliedMobile) {
  const expected = normalizeMobile(
    pickFirst(
      order?.customer?.phone,
      order?.customer?.mobile,
      order?.customerPhone,
      order?.phone,
      order?.mobile,
      order?.shippingAddress?.phone,
      order?.shippingAddress?.mobile,
      order?.address?.phone,
      order?.address?.mobile,
      order?.billingAddress?.phone,
      order?.billingAddress?.mobile
    )
  );

  const actual = normalizeMobile(suppliedMobile);

  if (!expected || !actual) {
    return false;
  }

  return expected === actual;
}

/* ============================================================
   FIND ORDER
============================================================ */

async function findOrder(db, orderId) {
  const normalized = normalizeOrderId(orderId);

  if (!normalized) {
    return null;
  }

  const ordersRef = db.collection("orders");

  // 1. Firestore document ID
  const directRef = ordersRef.doc(normalized);
  const directSnapshot = await directRef.get();

  if (directSnapshot.exists) {
    return {
      ref: directRef,
      data: directSnapshot.data() || {},
    };
  }

  // 2. websiteOrderId
  const websiteQuery = await ordersRef
    .where("websiteOrderId", "==", normalized)
    .limit(1)
    .get();

  if (!websiteQuery.empty) {
    const doc = websiteQuery.docs[0];

    return {
      ref: doc.ref,
      data: doc.data() || {},
    };
  }

  // 3. orderId
  const orderQuery = await ordersRef
    .where("orderId", "==", normalized)
    .limit(1)
    .get();

  if (!orderQuery.empty) {
    const doc = orderQuery.docs[0];

    return {
      ref: doc.ref,
      data: doc.data() || {},
    };
  }

  // 4. id
  const idQuery = await ordersRef
    .where("id", "==", normalized)
    .limit(1)
    .get();

  if (!idQuery.empty) {
    const doc = idQuery.docs[0];

    return {
      ref: doc.ref,
      data: doc.data() || {},
    };
  }

  // 5. externalOrderId
  const externalQuery = await ordersRef
    .where("externalOrderId", "==", normalized)
    .limit(1)
    .get();

  if (!externalQuery.empty) {
    const doc = externalQuery.docs[0];

    return {
      ref: doc.ref,
      data: doc.data() || {},
    };
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
      : Array.isArray(order?.orderItems)
      ? order.orderItems
      : Array.isArray(order?.products)
      ? order.products
      : [];

  return rawItems.map((item) => {
    const quantity = Math.max(
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

    const price = safeNumber(
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

      salePrice: safeNumber(
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

      gst: safeNumber(
        item?.gst ??
        item?.gstAmount ??
        0
      ),
    };
  });
}

/* ============================================================
   PAYMENT
============================================================ */

function getPaymentMethod(order) {
  const explicit = clean(
    order?.paymentMethod ||
    order?.payment_method ||
    order?.method ||
    order?.paymentType
  );

  if (explicit) {
    if (explicit.toLowerCase() === "cod") {
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
  const explicit = clean(
    order?.paymentStatus ||
    order?.payment_status ||
    order?.paymentState
  );

  if (explicit) {
    return explicit;
  }

  if (order?.paymentVerified === true) {
    return "Paid";
  }

  if (getPaymentMethod(order) === "COD") {
    return "Pending";
  }

  return "Pending";
}

/* ============================================================
   SHIPMENT
============================================================ */

function getShipmentStatus(order) {
  const explicit = clean(
    order?.shipmentStatus ||
    order?.shipment_status ||
    order?.deliveryStatus ||
    order?.delivery_status
  );

  if (explicit) {
    return explicit;
  }

  if (order?.delivered === true) {
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

function buildCustomerOrder(order, firestoreId = "") {
  const customer =
    order?.customer &&
    typeof order.customer === "object"
      ? order.customer
      : {};

  const shippingAddress =
    order?.shippingAddress &&
    typeof order.shippingAddress === "object"
      ? order.shippingAddress
      : order?.address &&
        typeof order.address === "object"
      ? order.address
      : {};

  const billingAddress =
    order?.billingAddress &&
    typeof order.billingAddress === "object"
      ? order.billingAddress
      : {};

  const orderId = pickFirst(
    order?.websiteOrderId,
    order?.orderId,
    order?.externalOrderId,
    order?.id,
    firestoreId
  );

  const paymentMethod = getPaymentMethod(order);
  const paymentStatus = getPaymentStatus(order);
  const shipmentStatus = getShipmentStatus(order);

  const customerMobile = normalizeMobile(
    pickFirst(
      customer?.phone,
      customer?.mobile,
      order?.customerPhone,
      order?.phone,
      order?.mobile,
      shippingAddress?.phone,
      shippingAddress?.mobile
    )
  );

  const customerEmail = normalizeEmail(
    pickFirst(
      customer?.email,
      order?.customerEmail,
      order?.email,
      shippingAddress?.email
    )
  );

  const subtotal = safeNumber(
    order?.subtotal ??
    order?.subTotal ??
    0
  );

  const discount = safeNumber(
    order?.discount ??
    order?.totalDiscount ??
    order?.total_discount ??
    0
  );

  const shippingFee = safeNumber(
    order?.shippingFee ??
    order?.shippingCharges ??
    order?.shippingCharge ??
    order?.shippingCost ??
    order?.shipping ??
    0
  );

  const total = safeNumber(
    order?.total ??
    order?.grandTotal ??
    order?.totalAmount ??
    order?.amount ??
    0
  );

  const paidAmount = safeNumber(
    order?.paidAmount ??
    (
      paymentStatus === "Paid"
        ? total
        : 0
    )
  );

  const result = {
    // ---------------------------------------------------------
    // BASIC
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // PAYMENT
    // ---------------------------------------------------------

    payment: {
      status: paymentStatus,

      verified:
        order?.paymentVerified === true,

      method: paymentMethod,

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
      order?.paymentVerified === true,

    // ---------------------------------------------------------
    // PRICING
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // CUSTOMER
    // ---------------------------------------------------------

    customer: {
      name: pickFirst(
        customer?.name,
        customer?.fullName,
        order?.customerName,
        order?.name,
        order?.fullName,
        shippingAddress?.name
      ),

      mobile: customerMobile,
      phone: customerMobile,
      email: customerEmail,
    },

    // ---------------------------------------------------------
    // SHIPPING ADDRESS
    // ---------------------------------------------------------

    shippingAddress: {
      name:
        shippingAddress?.name ||
        shippingAddress?.fullName ||
        "",

      address: pickFirst(
        shippingAddress?.line1,
        shippingAddress?.address1,
        shippingAddress?.address,
        shippingAddress?.street
      ),

      address1: pickFirst(
        shippingAddress?.line1,
        shippingAddress?.address1,
        shippingAddress?.address
      ),

      address2: pickFirst(
        shippingAddress?.line2,
        shippingAddress?.address2
      ),

      city:
        shippingAddress?.city ||
        shippingAddress?.cityName ||
        "",

      state:
        shippingAddress?.state ||
        shippingAddress?.stateName ||
        "",

      pincode:
        shippingAddress?.pincode ||
        shippingAddress?.postalCode ||
        shippingAddress?.zip ||
        shippingAddress?.zipCode ||
        "",

      country:
        shippingAddress?.country ||
        "India",

      phone:
        shippingAddress?.phone ||
        shippingAddress?.mobile ||
        customerMobile,

      email:
        shippingAddress?.email ||
        customerEmail,
    },

    billingAddress,

    // ---------------------------------------------------------
    // ITEMS
    // ---------------------------------------------------------

    items: buildItems(order),

    orderItems: buildItems(order),

    products: buildItems(order),

    // ---------------------------------------------------------
    // SHIPMENT
    // ---------------------------------------------------------

    shipment: {
      status: shipmentStatus,

      shipmentId:
        order?.shipmentId ||
        order?.shipment_id ||
        null,

      awb:
        order?.awb ||
        order?.awbNumber ||
        order?.trackingNumber ||
        null,

      courier:
        order?.courier ||
        order?.courierName ||
        order?.shippingProvider ||
        null,

      trackingUrl:
        order?.trackingUrl ||
        order?.trackingURL ||
        order?.tracking_url ||
        null,

      labelUrl:
        order?.labelUrl ||
        order?.shippingLabelUrl ||
        order?.shipping_label_url ||
        null,

      invoiceUrl:
        order?.invoiceUrl ||
        order?.invoiceURL ||
        order?.invoice_url ||
        null,

      combinedLabelInvoiceUrl:
        order?.combinedLabelInvoiceUrl ||
        order?.combinedLabelUrl ||
        order?.labelInvoiceUrl ||
        null,
    },

    shipmentStatus,

    awb:
      order?.awb ||
      order?.awbNumber ||
      order?.trackingNumber ||
      null,

    courier:
      order?.courier ||
      order?.courierName ||
      order?.shippingProvider ||
      null,

    trackingUrl:
      order?.trackingUrl ||
      order?.trackingURL ||
      order?.tracking_url ||
      null,

    shippingLabel:
      order?.shippingLabel ||
      order?.shippingLabelUrl ||
      order?.labelUrl ||
      null,

    invoice:
      order?.invoice ||
      order?.invoiceUrl ||
      null,

    combinedLabelInvoice:
      order?.combinedLabelInvoice ||
      order?.combinedLabelInvoiceUrl ||
      order?.combinedLabelUrl ||
      null,

    // ---------------------------------------------------------
    // WARRANTY
    // ---------------------------------------------------------

    warranty: {
      registered:
        order?.warranty?.registered === true ||
        order?.warrantyRegistered === true,

      registrationId:
        order?.warranty?.registrationId ||
        order?.warrantyRegistrationId ||
        null,

      status:
        order?.warranty?.status ||
        null,
    },

    warrantyRegistration:
      order?.warrantyRegistration ||
      null,
  };

  // Keep additional safe order information that frontend may
  // already expect, without exposing admin credentials/secrets.

  if (order?.notes) {
    result.notes = order.notes;
  }

  if (order?.couponCode) {
    result.couponCode = order.couponCode;
  }

  return serializeValue(result);
}

/* ============================================================
   ADMIN COOKIE
============================================================ */

function getCookie(req, name) {
  const cookieHeader =
    req.headers?.cookie || "";

  if (!cookieHeader) {
    return null;
  }

  const cookies =
    cookieHeader.split(";");

  for (const cookie of cookies) {
    const index =
      cookie.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key =
      cookie
        .slice(0, index)
        .trim();

    const value =
      cookie
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
   SAFE EQUAL
============================================================ */

function safeEqual(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string"
  ) {
    return false;
  }

  const left =
    Buffer.from(a, "utf8");

  const right =
    Buffer.from(b, "utf8");

  if (
    left.length !== right.length
  ) {
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

/* ============================================================
   VERIFY ADMIN SESSION
   Same format used by api/admin-session.js
============================================================ */

function verifyAdminSession(req) {
  const secret =
    String(
      process.env.ADMIN_SESSION_SECRET || ""
    ).trim();

  if (!secret) {
    return {
      valid: false,
      reason: "missing_secret",
    };
  }

  const token =
    getCookie(
      req,
      ADMIN_COOKIE_NAME
    );

  if (!token) {
    return {
      valid: false,
      reason: "missing_cookie",
    };
  }

  const parts =
    String(token).split(".");

  if (parts.length !== 3) {
    return {
      valid: false,
      reason: "invalid_token",
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
      valid: false,
      reason: "invalid_token",
    };
  }

  const expectedSignature =
    crypto
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
      valid: false,
      reason: "invalid_signature",
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
      valid: false,
      reason: "expired",
    };
  }

  let payload;

  try {
    const payloadText =
      Buffer.from(
        encodedPayload,
        "base64url"
      ).toString("utf8");

    payload =
      JSON.parse(payloadText);
  } catch {
    return {
      valid: false,
      reason: "invalid_payload",
    };
  }

  if (
    !payload ||
    payload.role !== "admin"
  ) {
    return {
      valid: false,
      reason: "not_admin",
    };
  }

  return {
    valid: true,
    payload,
    expiresAt,
  };
}

/* ============================================================
   ADMIN ORDER LIST
============================================================ */

async function getAdminOrders(db) {
  const snapshot =
    await db
      .collection("orders")
      .orderBy(
        "createdAt",
        "desc"
      )
      .limit(500)
      .get();

  const orders =
    snapshot.docs.map((doc) => {
      const raw =
        doc.data() || {};

      return serializeValue({
        id: doc.id,

        ...raw,

        websiteOrderId:
          raw.websiteOrderId ||
          raw.orderId ||
          raw.externalOrderId ||
          doc.id,

        paymentMethod:
          getPaymentMethod(raw),

        paymentStatus:
          getPaymentStatus(raw),

        shipmentStatus:
          getShipmentStatus(raw),
      });
    });

  return orders;
}

/* ============================================================
   CUSTOMER SESSION COMPATIBILITY
   ------------------------------------------------------------
   IMPORTANT:
   This does NOT create another Vercel function.
   It is handled by api/orders.js after a Vercel rewrite.
============================================================ */

function handleCustomerSession(req, res) {
  if (
    req.method !== "GET" &&
    req.method !== "POST"
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
        authenticated: false,
        error: "Method not allowed.",
      }
    );
  }

  return sendJson(
    res,
    200,
    {
      success: true,
      authenticated: false,
      customer: null,
      message:
        "Customer session is available through the orders API.",
    }
  );
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
    req.body &&
    typeof req.body === "object"
      ? req.body
      : {};

  const query =
    req.query &&
    typeof req.query === "object"
      ? req.query
      : {};

  const orderId =
    clean(
      body.orderId ||
      body.websiteOrderId ||
      query.orderId ||
      query.websiteOrderId ||
      ""
    );

  const mobile =
    normalizeMobile(
      body.mobile ||
      body.phone ||
      query.mobile ||
      query.phone ||
      ""
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

  if (
    mobile.length !== 10
  ) {
    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Enter a valid 10-digit mobile number.",
      }
    );
  }

  const found =
    await findOrder(
      db,
      orderId
    );

  if (!found) {
    return sendJson(
      res,
      404,
      {
        success: false,
        error:
          "Order not found.",
      }
    );
  }

  const order =
    found.data || {};

  if (
    !mobileMatches(
      order,
      mobile
    )
  ) {
    return sendJson(
      res,
      403,
      {
        success: false,
        error:
          "Order ID and mobile number do not match.",
      }
    );
  }

  const customerOrder =
    buildCustomerOrder(
      order,
      found.ref.id
    );

  return sendJson(
    res,
    200,
    {
      success: true,
      order: customerOrder,
      data: customerOrder,
    }
  );
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
        req.method || ""
      ).toUpperCase();

    const body =
      req.body &&
      typeof req.body === "object"
        ? req.body
        : {};

    const query =
      req.query &&
      typeof req.query === "object"
        ? req.query
        : {};

    const action =
      clean(
        body.action ||
        query.action ||
        ""
      ).toLowerCase();

    /* ========================================================
       CUSTOMER SESSION COMPATIBILITY
       /api/orders?action=customer-session
    ======================================================== */

    if (
      action ===
        "customer-session" ||
      action === "session"
    ) {
      return handleCustomerSession(
        req,
        res
      );
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    const db =
      getDb();

    /* ========================================================
       CUSTOMER
    ======================================================== */

    if (
      action === "customer" ||
      action === "my-orders" ||
      action === "myorder"
    ) {
      if (
        method !== "POST" &&
        method !== "GET"
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

      return handleCustomerOrder(
        req,
        res,
        db
      );
    }

    /* ========================================================
       ADMIN
    ======================================================== */

    if (
      action === "admin"
    ) {
      if (
        method !== "POST" &&
        method !== "GET"
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

      const session =
        verifyAdminSession(req);

      if (!session.valid) {
        return sendJson(
          res,
          401,
          {
            success: false,
            authenticated: false,
            error:
              "Unauthorized.",
          }
        );
      }

      const orders =
        await getAdminOrders(
          db
        );

      return sendJson(
        res,
        200,
        {
          success: true,
          authenticated: true,
          orders,
          data: orders,
          count: orders.length,
        }
      );
    }

    /* ========================================================
       ADMIN GET
       GET /api/orders
    ======================================================== */

    if (
      method === "GET"
    ) {
      const session =
        verifyAdminSession(req);

      if (!session.valid) {
        return sendJson(
          res,
          401,
          {
            success: false,
            authenticated: false,
            error:
              "Unauthorized.",
          }
        );
      }

      const orders =
        await getAdminOrders(
          db
        );

      return sendJson(
        res,
        200,
        {
          success: true,
          authenticated: true,
          orders,
          data: orders,
          count: orders.length,
        }
      );
    }

    /* ========================================================
       POST WITHOUT ACTION
    ======================================================== */

    if (
      method === "POST"
    ) {
      return sendJson(
        res,
        400,
        {
          success: false,
          error:
            "Invalid action.",
          supportedActions: [
            "customer",
            "admin",
            "customer-session",
          ],
        }
      );
    }

    /* ========================================================
       METHOD NOT ALLOWED
    ======================================================== */

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
      "orders.js error:",
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
