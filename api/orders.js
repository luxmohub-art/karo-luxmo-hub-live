// api/orders.js
// LUXMO HUB — CUSTOMER MY ORDERS + ADMIN ORDERS API
//
// CUSTOMER:
//   POST /api/orders
//   {
//     "action": "customer",
//     "orderId": "LUX....",
//     "mobile": "98XXXXXXXX"
//   }
//
// ADMIN:
//   Existing admin-session protected access remains available.
//
// Customer can see:
// - Order ID
// - Payment status
// - Payment amount
// - Products
// - Shipping
// - Courier
// - Shipment status
// - AWB
// - Tracking
// - Shipping Label
// - Invoice
// - Combined Label + Invoice
//
// SECURITY:
// Customer must provide BOTH:
// 1. Order ID
// 2. Mobile number
//
// Never expose Firebase admin credentials or internal
// admin-only data to the customer.

import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

/* =========================================================
   HELPERS
========================================================= */

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeMobile(value) {
  const digits = clean(value).replace(
    /\D/g,
    ""
  );

  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits;
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

  return Number.isFinite(n)
    ? n
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

/* =========================================================
   MOBILE MATCH
========================================================= */

function mobileMatches(
  order,
  suppliedMobile
) {
  const expected =
    normalizeMobile(
      pickFirst(
        order?.customer?.phone,
        order?.customerPhone,
        order?.phone,
        order?.mobile,
        order?.shippingAddress?.phone,
        order?.address?.phone
      )
    );

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

  return (
    expected === actual
  );
}

/* =========================================================
   FIND ORDER
========================================================= */

async function findOrder(
  db,
  orderId
) {
  const normalized =
    normalizeOrderId(
      orderId
    );

  if (!normalized) {
    return null;
  }

  const ordersRef =
    db.collection("orders");

  /* -------------------------------------------------------
     1. DIRECT DOCUMENT ID
  ------------------------------------------------------- */

  const directRef =
    ordersRef.doc(
      normalized
    );

  const directSnapshot =
    await directRef.get();

  if (
    directSnapshot.exists
  ) {
    return {
      ref: directRef,

      data:
        directSnapshot.data() ||
        {},
    };
  }

  /* -------------------------------------------------------
     2. websiteOrderId
  ------------------------------------------------------- */

  const websiteQuery =
    await ordersRef
      .where(
        "websiteOrderId",
        "==",
        normalized
      )
      .limit(1)
      .get();

  if (
    !websiteQuery.empty
  ) {
    const doc =
      websiteQuery.docs[0];

    return {
      ref: doc.ref,

      data:
        doc.data() ||
        {},
    };
  }

  /* -------------------------------------------------------
     3. orderId
  ------------------------------------------------------- */

  const orderQuery =
    await ordersRef
      .where(
        "orderId",
        "==",
        normalized
      )
      .limit(1)
      .get();

  if (
    !orderQuery.empty
  ) {
    const doc =
      orderQuery.docs[0];

    return {
      ref: doc.ref,

      data:
        doc.data() ||
        {},
    };
  }

  /* -------------------------------------------------------
     4. id
  ------------------------------------------------------- */

  const idQuery =
    await ordersRef
      .where(
        "id",
        "==",
        normalized
      )
      .limit(1)
      .get();

  if (
    !idQuery.empty
  ) {
    const doc =
      idQuery.docs[0];

    return {
      ref: doc.ref,

      data:
        doc.data() ||
        {},
    };
  }

  return null;
}

/* =========================================================
   CUSTOMER RESPONSE
========================================================= */

function buildCustomerOrder(
  order
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

  const items =
    rawItems.map(
      (item) => ({
        id:
          item?.id ||
          item?.productId ||
          "",

        sku:
          item?.sku ||
          "",

        title:
          item?.title ||
          item?.name ||
          item?.productName ||
          "",

        image:
          item?.image ||
          item?.imageUrl ||
          item?.thumbnail ||
          "",

        quantity:
          Math.max(
            1,
            Math.floor(
              safeNumber(
                item?.qty ??
                  item?.quantity ??
                  1
              )
            )
          ),

        price:
          safeNumber(
            item?.price ??
              item?.salePrice ??
              item?.sellingPrice ??
              item?.amount ??
              0
          ),

        colour:
          item?.colour ||
          item?.color ||
          "",

        model:
          item?.model ||
          "",

        variant:
          item?.variant ||
          "",
      })
    );

  const orderId =
    pickFirst(
      order.websiteOrderId,
      order.orderId,
      order.id
    );

  const paymentStatus =
    pickFirst(
      order.paymentStatus,
      order.payment_status,
      order.paymentVerified
        ? "Paid"
        : "Pending"
    );

  const shipmentStatus =
    pickFirst(
      order.shipmentStatus,
      order.shipment_status,
      order.shipmentId
        ? "Created"
        : "Pending"
    );

  return {
    /* -----------------------------------------------------
       BASIC ORDER
    ----------------------------------------------------- */

    orderId,

    websiteOrderId:
      order.websiteOrderId ||
      orderId,

    status:
      order.status ||
      "Order Placed",

    createdAt:
      order.createdAt ||
      null,

    updatedAt:
      order.updatedAt ||
      null,

    paidAt:
      order.paidAt ||
      order.paymentDate ||
      null,

    /* -----------------------------------------------------
       PAYMENT
    ----------------------------------------------------- */

    payment: {
      status:
        paymentStatus,

      verified:
        order.paymentVerified ===
        true,

      method:
        order.paymentMethod ||
        "Razorpay",

      amount:
        safeNumber(
          order.paidAmount ??
            order.amount ??
            order.total ??
            0
        ),

      currency:
        order.currency ||
        "INR",

      razorpayOrderId:
        order.razorpayOrderId ||
        null,

      razorpayPaymentId:
        order.razorpayPaymentId ||
        null,
    },

    /* -----------------------------------------------------
       PRICING
    ----------------------------------------------------- */

    pricing: {
      subtotal:
        safeNumber(
          order.subtotal
        ),

      discount:
        safeNumber(
          order.discount ??
            order.totalDiscount ??
            order.total_discount
        ),

      shippingFee:
        safeNumber(
          order.shippingFee ??
            order.shippingCharges ??
            order.shippingCost ??
            0
        ),

      total:
        safeNumber(
          order.total ??
            order.grandTotal ??
            order.amount
        ),

      couponCode:
        order.couponCode ||
        order.coupon ||
        null,
    },

    /* -----------------------------------------------------
       CUSTOMER
    ----------------------------------------------------- */

    customer: {
      name:
        pickFirst(
          customer.name,
          order.customerName,
          order.name,
          shippingAddress.name
        ),

      mobile:
        normalizeMobile(
          pickFirst(
            customer.phone,
            order.phone,
            order.mobile,
            shippingAddress.phone
          )
        ),

      email:
        normalizeEmail(
          pickFirst(
            customer.email,
            order.email,
            shippingAddress.email
          )
        ),
    },

    /* -----------------------------------------------------
       SHIPPING ADDRESS
    ----------------------------------------------------- */

    shippingAddress: {
      name:
        shippingAddress.name ||
        "",

      address:
        pickFirst(
          shippingAddress.line1,
          shippingAddress.address1,
          shippingAddress.address
        ),

      address2:
        pickFirst(
          shippingAddress.line2,
          shippingAddress.address2
        ),

      city:
        shippingAddress.city ||
        "",

      state:
        shippingAddress.state ||
        shippingAddress.stateName ||
        "",

      pincode:
        shippingAddress.pincode ||
        shippingAddress.postalCode ||
        shippingAddress.zip ||
        "",

      country:
        shippingAddress.country ||
        "India",
    },

    /* -----------------------------------------------------
       PRODUCTS
    ----------------------------------------------------- */

    items,

    /* -----------------------------------------------------
       SHIPMENT
    ----------------------------------------------------- */

    shipment: {
      status:
        shipmentStatus,

      provider:
        order.courierProvider ||
        order.provider ||
        "Shiprocket",

      courier:
        order.courier ||
        order.courierName ||
        null,

      shipmentId:
        order.shipmentId ||
        null,

      logisticsOrderId:
        order.logisticsOrderId ||
        order.shiprocketOrderId ||
        null,

      awb:
        order.awb ||
        order.awbCode ||
        order.waybill ||
        null,

      trackingUrl:
        order.trackingUrl ||
        order.tracking_url ||
        null,

      pickupStatus:
        order.pickupStatus ||
        "Pending",

      pickupToken:
        order.pickupToken ||
        null,

      labelUrl:
        order.labelUrl ||
        order.label_url ||
        null,

      invoiceUrl:
        order.invoiceUrl ||
        order.invoice_url ||
        null,

      combinedLabelInvoiceUrl:
        order.combinedLabelInvoiceUrl ||
        order.combined_label_invoice_url ||
        null,

      documentError:
        order.documentError ||
        "",
    },

    /* -----------------------------------------------------
       WARRANTY
    ----------------------------------------------------- */

    warranty: {
      status:
        order.warrantyStatus ||
        null,

      registrationId:
        order.warrantyRegistrationId ||
        null,
    },
  };
}

/* =========================================================
   CUSTOMER ORDER
========================================================= */

async function getCustomerOrder(
  req,
  res,
  db
) {
  const body =
    req.body || {};

  const orderId =
    clean(
      body.orderId ||
        body.websiteOrderId ||
        body.id
    );

  const mobile =
    normalizeMobile(
      body.mobile ||
        body.phone ||
        body.customerMobile
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

  if (
    !mobile ||
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

  /*
    Do not reveal whether the order exists
    before mobile verification.
  */

  if (!found) {
    return sendJson(
      res,
      404,
      {
        success: false,
        error:
          "Order ID or mobile number is incorrect.",
      }
    );
  }

  if (
    !mobileMatches(
      found.data,
      mobile
    )
  ) {
    return sendJson(
      res,
      401,
      {
        success: false,
        error:
          "Order ID or mobile number is incorrect.",
      }
    );
  }

  const customerOrder =
    buildCustomerOrder(
      found.data
    );

  return sendJson(
    res,
    200,
    {
      success: true,

      verified: true,

      order:
        customerOrder,
    }
  );
}

/* =========================================================
   ADMIN ORDERS
========================================================= */

async function getAdminOrders(
  req,
  res,
  db
) {
  /*
    Preserve the existing admin session mechanism.

    The admin session token can be supplied as:
      Authorization: Bearer TOKEN

    or:
      x-admin-session
  */

  const authorization =
    clean(
      req.headers?.authorization
    );

  const headerToken =
    clean(
      req.headers?.[
        "x-admin-session"
      ]
    );

  const token =
    authorization
      .replace(
        /^Bearer\s+/i,
        ""
      )
      .trim() ||
    headerToken;

  if (!token) {
    return sendJson(
      res,
      401,
      {
        success: false,
        error:
          "Admin authentication required.",
      }
    );
  }

  /*
    IMPORTANT:
    This endpoint does not trust the client token.
    It validates against the existing adminSessions
    collection.
  */

  const sessionRef =
    db
      .collection(
        "adminSessions"
      )
      .doc(token);

  const sessionSnapshot =
    await sessionRef.get();

  if (
    !sessionSnapshot.exists
  ) {
    return sendJson(
      res,
      401,
      {
        success: false,
        error:
          "Invalid or expired admin session.",
      }
    );
  }

  const session =
    sessionSnapshot.data() ||
    {};

  const expiresAt =
    session.expiresAt
      ? new Date(
          session.expiresAt
        ).getTime()
      : 0;

  if (
    expiresAt &&
    Date.now() >
      expiresAt
  ) {
    await sessionRef.delete();

    return sendJson(
      res,
      401,
      {
        success: false,
        error:
          "Admin session expired.",
      }
    );
  }

  /* -------------------------------------------------------
     QUERY
  ------------------------------------------------------- */

  const limitRaw =
    Number(
      req.query?.limit ||
        req.body?.limit ||
        50
    );

  const limit = Math.min(
    100,
    Math.max(
      1,
      Number.isFinite(
        limitRaw
      )
        ? Math.floor(
            limitRaw
          )
        : 50
    )
  );

  const snapshot =
    await db
      .collection("orders")
      .orderBy(
        "createdAt",
        "desc"
      )
      .limit(limit)
      .get();

  const orders =
    snapshot.docs.map(
      (doc) => ({
        id: doc.id,

        ...doc.data(),
      })
    );

  return sendJson(
    res,
    200,
    {
      success: true,

      orders,
    }
  );
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {
  try {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    const adminApp =
      getFirebaseAdmin();

    const db =
      getFirestore(
        adminApp
      );

    /* =====================================================
       GET
       Existing admin orders
    ===================================================== */

    if (
      req.method === "GET"
    ) {
      return await getAdminOrders(
        req,
        res,
        db
      );
    }

    /* =====================================================
       POST
    ===================================================== */

    if (
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
          error:
            "Method not allowed.",
        }
      );
    }

    const body =
      req.body || {};

    const action =
      clean(
        body.action ||
          body.type ||
          "customer"
      ).toLowerCase();

    /* =====================================================
       CUSTOMER MY ORDERS
    ===================================================== */

    if (
      action ===
        "customer" ||
      action ===
        "my-orders" ||
      action ===
        "myorders" ||
      action ===
        "lookup"
    ) {
      return await getCustomerOrder(
        req,
        res,
        db
      );
    }

    /* =====================================================
       ADMIN
    ===================================================== */

    if (
      action ===
        "admin" ||
      action ===
        "list"
    ) {
      return await getAdminOrders(
        req,
        res,
        db
      );
    }

    return sendJson(
      res,
      400,
      {
        success: false,
        error:
          "Invalid orders action.",
      }
    );
  } catch (error) {
    console.error(
      "LUXMO HUB orders API error:",
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
