// api/orders.js
// ============================================================
// LUXMO HUB — CUSTOMER MY ORDERS + ADMIN ORDERS API
// ============================================================
//
// CUSTOMER:
// POST /api/orders
// {
//   "action": "customer",
//   "orderId": "LMH....",
//   "mobile": "98XXXXXXXX"
// }
//
// ADMIN:
// GET /api/orders
// Authorization: Bearer ADMIN_SESSION_TOKEN
//
// POST /api/orders
// {
//   "action": "admin"
// }
//
// CUSTOMER SECURITY:
// - Order ID required
// - Mobile number required
// - Mobile must match the order
//
// CUSTOMER CAN SEE:
// - Order ID
// - Order status
// - Payment status
// - Payment amount
// - Payment method
// - Products
// - Shipping
// - Customer details
// - Shipping address
// - Courier
// - Shipment status
// - AWB
// - Tracking URL
// - Shipping label
// - Invoice
// - Combined label + invoice
// - Warranty
//
// ============================================================

import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

/* ============================================================
   RESPONSE HELPER
============================================================ */

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

/* ============================================================
   STRING HELPERS
============================================================ */

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeMobile(value) {
  const digits = clean(value).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

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
   MOBILE MATCH
============================================================ */

function mobileMatches(order, suppliedMobile) {
  const expected = normalizeMobile(
    pickFirst(
      order?.customer?.phone,
      order?.customerPhone,
      order?.customer?.mobile,
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

  /* ----------------------------------------------------------
     1. DIRECT FIRESTORE DOCUMENT ID
  ---------------------------------------------------------- */

  const directRef = ordersRef.doc(normalized);

  const directSnapshot = await directRef.get();

  if (directSnapshot.exists) {
    return {
      ref: directRef,
      data: directSnapshot.data() || {},
    };
  }

  /* ----------------------------------------------------------
     2. websiteOrderId
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     3. orderId
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     4. id
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     5. externalOrderId
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     ITEMS
  ---------------------------------------------------------- */

  const rawItems =
    Array.isArray(order?.items)
      ? order.items
      : Array.isArray(order?.orderItems)
      ? order.orderItems
      : Array.isArray(order?.products)
      ? order.products
      : [];

  const items = rawItems.map((item) => ({
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

    quantity: Math.max(
      1,
      Math.floor(
        safeNumber(
          item?.qty ??
            item?.quantity ??
            item?.count ??
            1
        )
      )
    ),

    qty: Math.max(
      1,
      Math.floor(
        safeNumber(
          item?.qty ??
            item?.quantity ??
            item?.count ??
            1
        )
      )
    ),

    price: safeNumber(
      item?.price ??
        item?.salePrice ??
        item?.sellingPrice ??
        item?.unitPrice ??
        item?.amount ??
        0
    ),

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

    gst:
      safeNumber(
        item?.gst ??
          item?.gstAmount ??
          0
      ),
  }));

  /* ----------------------------------------------------------
     ORDER ID
  ---------------------------------------------------------- */

  const orderId = pickFirst(
    order.websiteOrderId,
    order.orderId,
    order.externalOrderId,
    order.id,
    firestoreId
  );

  /* ----------------------------------------------------------
     PAYMENT
  ---------------------------------------------------------- */

  let paymentStatus = pickFirst(
    order.paymentStatus,
    order.payment_status,
    order.paymentState
  );

  if (!paymentStatus) {
    if (order.paymentVerified === true) {
      paymentStatus = "Paid";
    } else if (
      String(order.paymentMethod || "").toLowerCase() ===
      "cod"
    ) {
      paymentStatus = "Pending";
    } else {
      paymentStatus = "Pending";
    }
  }

  const paymentMethod =
    order.paymentMethod ||
    order.payment_method ||
    order.method ||
    (
      order.isCOD === true ||
      order.cod === true ||
      String(order.paymentType || "").toLowerCase() === "cod"
        ? "COD"
        : "Razorpay"
    );

  /* ----------------------------------------------------------
     SHIPMENT
  ---------------------------------------------------------- */

  let shipmentStatus = pickFirst(
    order.shipmentStatus,
    order.shipment_status,
    order.deliveryStatus,
    order.delivery_status
  );

  if (!shipmentStatus) {
    if (order.delivered === true) {
      shipmentStatus = "Delivered";
    } else if (order.shipmentId) {
      shipmentStatus = "Created";
    } else {
      shipmentStatus = "Pending";
    }
  }

  /* ----------------------------------------------------------
     CUSTOMER
  ---------------------------------------------------------- */

  const customerMobile = normalizeMobile(
    pickFirst(
      customer.phone,
      customer.mobile,
      order.customerPhone,
      order.phone,
      order.mobile,
      shippingAddress.phone,
      shippingAddress.mobile
    )
  );

  const customerEmail = normalizeEmail(
    pickFirst(
      customer.email,
      order.customerEmail,
      order.email,
      shippingAddress.email
    )
  );

  /* ----------------------------------------------------------
     RETURN CUSTOMER OBJECT
  ---------------------------------------------------------- */

  return {
    /* ========================================================
       BASIC ORDER
    ======================================================== */

    id: firestoreId || order.id || null,

    orderId,

    websiteOrderId:
      order.websiteOrderId ||
      orderId,

    externalOrderId:
      order.externalOrderId ||
      null,

    status:
      order.status ||
      order.orderStatus ||
      "Order Placed",

    orderStatus:
      order.orderStatus ||
      order.status ||
      "Order Placed",

    createdAt:
      order.createdAt ||
      order.created_at ||
      null,

    updatedAt:
      order.updatedAt ||
      order.updated_at ||
      null,

    paidAt:
      order.paidAt ||
      order.paymentDate ||
      order.payment_date ||
      null,

    /* ========================================================
       PAYMENT
    ======================================================== */

    payment: {
      status: paymentStatus,

      verified:
        order.paymentVerified === true,

      method: paymentMethod,

      amount: safeNumber(
        order.paidAmount ??
          order.amount ??
          order.totalAmount ??
          order.total ??
          order.grandTotal ??
          0
      ),

      currency:
        order.currency ||
        "INR",

      razorpayOrderId:
        order.razorpayOrderId ||
        order.razorpay_order_id ||
        null,

      razorpayPaymentId:
        order.razorpayPaymentId ||
        order.razorpay_payment_id ||
        null,
    },

    /* ========================================================
       PAYMENT COMPATIBILITY FIELDS
    ======================================================== */

    paymentStatus,

    paymentMethod,

    paymentVerified:
      order.paymentVerified === true,

    /* ========================================================
       PRICING
    ======================================================== */

    pricing: {
      subtotal: safeNumber(
        order.subtotal ??
          order.subTotal ??
          0
      ),

      discount: safeNumber(
        order.discount ??
          order.totalDiscount ??
          order.total_discount ??
          0
      ),

      shippingFee: safeNumber(
        order.shippingFee ??
          order.shippingCharges ??
          order.shippingCharge ??
          order.shippingCost ??
          order.shipping ??
          0
      ),

      total: safeNumber(
        order.total ??
          order.grandTotal ??
          order.totalAmount ??
          order.amount ??
          0
      ),

      couponCode:
        order.couponCode ||
        order.coupon ||
        null,
    },

    /* ========================================================
       TOP LEVEL PRICE COMPATIBILITY
    ======================================================== */

    subtotal: safeNumber(
      order.subtotal ??
        order.subTotal ??
        0
    ),

    discount: safeNumber(
      order.discount ??
        order.totalDiscount ??
        0
    ),

    shippingFee: safeNumber(
      order.shippingFee ??
        order.shippingCharges ??
        order.shippingCharge ??
        order.shippingCost ??
        order.shipping ??
        0
    ),

    total: safeNumber(
      order.total ??
        order.grandTotal ??
        order.totalAmount ??
        order.amount ??
        0
    ),

    /* ========================================================
       CUSTOMER
    ======================================================== */

    customer: {
      name: pickFirst(
        customer.name,
        customer.fullName,
        order.customerName,
        order.name,
        order.fullName,
        shippingAddress.name
      ),

      mobile: customerMobile,

      phone: customerMobile,

      email: customerEmail,
    },

    /* ========================================================
       SHIPPING ADDRESS
    ======================================================== */

    shippingAddress: {
      name:
        shippingAddress.name ||
        shippingAddress.fullName ||
        "",

      address: pickFirst(
        shippingAddress.line1,
        shippingAddress.address1,
        shippingAddress.address,
        shippingAddress.street
      ),

      address1: pickFirst(
        shippingAddress.line1,
        shippingAddress.address1,
        shippingAddress.address
      ),

      address2: pickFirst(
        shippingAddress.line2,
        shippingAddress.address2
      ),

      city:
        shippingAddress.city ||
        shippingAddress.cityName ||
        "",

      state:
        shippingAddress.state ||
        shippingAddress.stateName ||
        "",

      pincode:
        shippingAddress.pincode ||
        shippingAddress.postalCode ||
        shippingAddress.zip ||
        shippingAddress.zipCode ||
        "",

      country:
        shippingAddress.country ||
        "India",

      phone:
        shippingAddress.phone ||
        shippingAddress.mobile ||
        customerMobile,

      email:
        shippingAddress.email ||
        customerEmail,
    },

    /* ========================================================
       BILLING ADDRESS
    ======================================================== */

    billingAddress: {
      name:
        billingAddress.name ||
        billingAddress.fullName ||
        "",

      address: pickFirst(
        billingAddress.line1,
        billingAddress.address1,
        billingAddress.address
      ),

      address2: pickFirst(
        billingAddress.line2,
        billingAddress.address2
      ),

      city:
        billingAddress.city ||
        "",

      state:
        billingAddress.state ||
        billingAddress.stateName ||
        "",

      pincode:
        billingAddress.pincode ||
        billingAddress.postalCode ||
        billingAddress.zip ||
        "",

      country:
        billingAddress.country ||
        "India",

      phone:
        billingAddress.phone ||
        billingAddress.mobile ||
        customerMobile,

      email:
        billingAddress.email ||
        customerEmail,
    },

    /* ========================================================
       PRODUCTS
    ======================================================== */

    items,

    products: items,

    orderItems: items,

    /* ========================================================
       SHIPMENT
    ======================================================== */

    shipment: {
      status: shipmentStatus,

      provider:
        order.courierProvider ||
        order.logisticsProvider ||
        order.provider ||
        (
          order.shiprocketOrderId ||
          order.shipmentId
            ? "Shiprocket"
            : "iThink Logistics"
        ),

      courier:
        order.courier ||
        order.courierName ||
        order.courierProvider ||
        null,

      shipmentId:
        order.shipmentId ||
        order.shipment_id ||
        null,

      logisticsOrderId:
        order.logisticsOrderId ||
        order.shiprocketOrderId ||
        order.ithinkOrderId ||
        null,

      awb:
        order.awb ||
        order.awbCode ||
        order.waybill ||
        order.trackingNumber ||
        null,

      trackingUrl:
        order.trackingUrl ||
        order.tracking_url ||
        order.trackingLink ||
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
        order.shippingLabelUrl ||
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

    /* ========================================================
       SHIPMENT COMPATIBILITY FIELDS
    ======================================================== */

    courier:
      order.courier ||
      order.courierName ||
      order.courierProvider ||
      null,

    courierProvider:
      order.courierProvider ||
      order.provider ||
      null,

    shipmentId:
      order.shipmentId ||
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

    /* ========================================================
       WARRANTY
    ======================================================== */

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

/* ============================================================
   CUSTOMER ORDER
============================================================ */

async function getCustomerOrder(req, res, db) {
  const body = req.body || {};

  const orderId = clean(
    body.orderId ||
      body.websiteOrderId ||
      body.externalOrderId ||
      body.id
  );

  const mobile = normalizeMobile(
    body.mobile ||
      body.phone ||
      body.customerMobile
  );

  if (!orderId) {
    return sendJson(res, 400, {
      success: false,
      error: "Order ID is required.",
      message: "Order ID is required.",
    });
  }

  if (!mobile || mobile.length !== 10) {
    return sendJson(res, 400, {
      success: false,
      error: "Enter a valid 10-digit mobile number.",
      message: "Enter a valid 10-digit mobile number.",
    });
  }

  /* ----------------------------------------------------------
     FIND ORDER
  ---------------------------------------------------------- */

  const found = await findOrder(
    db,
    orderId
  );

  if (!found) {
    return sendJson(res, 404, {
      success: false,
      error: "Order ID or mobile number is incorrect.",
      message: "Order not found.",
    });
  }

  /* ----------------------------------------------------------
     MOBILE VERIFICATION
  ---------------------------------------------------------- */

  if (!mobileMatches(found.data, mobile)) {
    return sendJson(res, 401, {
      success: false,
      error: "Order ID or mobile number is incorrect.",
      message: "Mobile number does not match this order.",
    });
  }

  /* ----------------------------------------------------------
     BUILD SAFE CUSTOMER ORDER
  ---------------------------------------------------------- */

  const customerOrder = buildCustomerOrder(
    found.data,
    found.ref.id
  );

  return sendJson(res, 200, {
    success: true,
    verified: true,

    order: customerOrder,

    /* Compatibility */
    data: customerOrder,
  });
}

/* ============================================================
   ADMIN AUTHENTICATION
============================================================ */

async function getAdminOrders(req, res, db) {
  /*
    Admin session can be supplied as:

    Authorization: Bearer TOKEN

    OR

    x-admin-session: TOKEN
  */

  const authorization = clean(
    req.headers?.authorization
  );

  const headerToken = clean(
    req.headers?.["x-admin-session"]
  );

  let token = "";

  if (authorization) {
    token = authorization
      .replace(/^Bearer\s+/i, "")
      .trim();
  }

  if (!token) {
    token = headerToken;
  }

  if (!token) {
    return sendJson(res, 401, {
      success: false,
      error: "Admin authentication required.",
    });
  }

  /* ----------------------------------------------------------
     VALIDATE ADMIN SESSION
  ---------------------------------------------------------- */

  const sessionRef = db
    .collection("adminSessions")
    .doc(token);

  const sessionSnapshot =
    await sessionRef.get();

  if (!sessionSnapshot.exists) {
    return sendJson(res, 401, {
      success: false,
      error: "Invalid or expired admin session.",
    });
  }

  const session =
    sessionSnapshot.data() || {};

  const expiresAt =
    session.expiresAt
      ? new Date(
          session.expiresAt
        ).getTime()
      : 0;

  if (
    expiresAt &&
    Date.now() > expiresAt
  ) {
    await sessionRef.delete();

    return sendJson(res, 401, {
      success: false,
      error: "Admin session expired.",
    });
  }

  /* ----------------------------------------------------------
     LIMIT
  ---------------------------------------------------------- */

  const limitRaw = Number(
    req.query?.limit ||
      req.body?.limit ||
      50
  );

  const limit =
    Number.isFinite(limitRaw)
      ? Math.min(
          100,
          Math.max(
            1,
            Math.floor(limitRaw)
          )
        )
      : 50;

  /* ----------------------------------------------------------
     GET ORDERS
  ---------------------------------------------------------- */

  let snapshot;

  try {
    snapshot = await db
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
  } catch (error) {
    /*
      Fallback if some old documents do not have
      createdAt / Firestore index issue.
    */

    console.error(
      "Admin orderBy failed:",
      error
    );

    snapshot = await db
      .collection("orders")
      .limit(limit)
      .get();
  }

  const orders = snapshot.docs.map(
    (doc) => ({
      id: doc.id,
      ...doc.data(),
    })
  );

  return sendJson(res, 200, {
    success: true,
    orders,
    count: orders.length,
  });
}

/* ============================================================
   MAIN HANDLER
============================================================ */

export default async function handler(req, res) {
  try {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    /* --------------------------------------------------------
       FIREBASE
    -------------------------------------------------------- */

    const adminApp =
      getFirebaseAdmin();

    const db =
      getFirestore(adminApp);

    /* ========================================================
       GET
       ADMIN ORDERS
    ======================================================== */

    if (req.method === "GET") {
      return await getAdminOrders(
        req,
        res,
        db
      );
    }

    /* ========================================================
       ONLY POST AFTER THIS
    ======================================================== */

    if (req.method !== "POST") {
      res.setHeader(
        "Allow",
        "GET, POST"
      );

      return sendJson(res, 405, {
        success: false,
        error: "Method not allowed.",
      });
    }

    /* --------------------------------------------------------
       REQUEST BODY
    -------------------------------------------------------- */

    const body = req.body || {};

    const action = clean(
      body.action ||
        body.type ||
        "customer"
    ).toLowerCase();

    /* ========================================================
       CUSTOMER MY ORDERS
    ======================================================== */

    if (
      action === "customer" ||
      action === "my-orders" ||
      action === "myorders" ||
      action === "lookup"
    ) {
      return await getCustomerOrder(
        req,
        res,
        db
      );
    }

    /* ========================================================
       ADMIN
    ======================================================== */

    if (
      action === "admin" ||
      action === "list"
    ) {
      return await getAdminOrders(
        req,
        res,
        db
      );
    }

    /* ========================================================
       INVALID ACTION
    ======================================================== */

    return sendJson(res, 400, {
      success: false,
      error: "Invalid orders action.",
    });
  } catch (error) {
    console.error(
      "LUXMO HUB orders API error:",
      error
    );

    return sendJson(res, 500, {
      success: false,
      error:
        error?.message ||
        "Internal server error.",
    });
  }
}
