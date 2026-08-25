// api/create-order.js
// LUXMO HUB — COMPLETE CHECKOUT API
// Razorpay + COD + Coupon + Firestore Pricing + Shipping + Serviceability

import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

/* =========================================================
   BASIC HELPERS
========================================================= */

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function parseMoney(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return NaN;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : NaN;
  }

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "")
    .trim();

  if (!cleaned) {
    return NaN;
  }

  const n = Number(cleaned);

  return Number.isFinite(n)
    ? n
    : NaN;
}

function cleanError(error) {
  if (!error) {
    return "Request failed.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message || "Request failed.";
  }

  if (typeof error === "object") {
    return (
      error.message ||
      error.error ||
      error.description ||
      "Request failed."
    );
  }

  return String(error);
}

function normalizeId(value) {
  return String(value || "").trim();
}

function normalizeCoupon(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function getQty(item) {
  const qty = Number(
    item?.qty ??
      item?.quantity ??
      item?.units ??
      1
  );

  if (!Number.isFinite(qty) || qty <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(qty));
}

/* =========================================================
   PRODUCT PRICE
========================================================= */

function getPriceFromObject(product) {
  const values = [
    product?.salePrice,
    product?.sellingPrice,
    product?.selling_price,
    product?.price,
    product?.amount,
  ];

  for (const value of values) {
    const price = parseMoney(value);

    if (
      Number.isFinite(price) &&
      price > 0
    ) {
      return price;
    }
  }

  return NaN;
}

async function getTrustedCartItems(items) {
  const db =
    getFirestore(
      getFirebaseAdmin()
    );

  const collection =
    db.collection("products");

  const trustedItems = [];

  for (const item of items) {
    const productId =
      normalizeId(item?.id);

    const sku =
      String(
        item?.sku || ""
      ).trim();

    let productDoc = null;

    if (productId) {
      const snapshot =
        await collection
          .doc(productId)
          .get();

      if (snapshot.exists) {
        productDoc = snapshot;
      }
    }

    if (!productDoc && sku) {
      const snapshot =
        await collection
          .where(
            "sku",
            "==",
            sku
          )
          .limit(1)
          .get();

      if (!snapshot.empty) {
        productDoc =
          snapshot.docs[0];
      }
    }

    if (!productDoc) {
      throw new Error(
        `Product not found. ID: ${
          productId || "N/A"
        }`
      );
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    };

    const quantity =
      getQty(item);

    let price = NaN;

    if (
      Array.isArray(
        product.variants
      )
    ) {
      const variant =
        product.variants.find(
          (v) =>
            sku &&
            String(
              v?.sku || ""
            )
              .trim()
              .toLowerCase() ===
              sku.toLowerCase()
        );

      if (variant) {
        price =
          getPriceFromObject(
            variant
          );
      }
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      price =
        getPriceFromObject(
          product
        );
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      price =
        getPriceFromObject(
          item
        );
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw new Error(
        `Invalid product price for ${
          product.title ||
          product.name ||
          product.id
        }.`
      );
    }

    trustedItems.push({
      id: product.id,

      sku:
        sku ||
        String(
          product.sku || ""
        ).trim(),

      title:
        product.title ||
        product.name ||
        "LUXMO Product",

      category:
        product.category || "",

      productCategory:
        product.productCategory ||
        product.category ||
        "",

      model:
        item?.model ||
        product.model ||
        "",

      colour:
        item?.colour ||
        item?.color ||
        product.colour ||
        product.color ||
        "",

      qty: quantity,

      price,

      hsn:
        product.hsn ||
        product.hsnCode ||
        "",

      brand:
        product.brand ||
        "LUXMO HUB",

      tax:
        Number(
          product.gstRate || 0
        ),
    });
  }

  return trustedItems;
}

/* =========================================================
   COUPONS
========================================================= */

const COUPONS = {
  WELCOME5: {
    code: "WELCOME5",
    type: "percent",
    value: 5,
    minOrder: 499,
    maxDiscount: 500,
  },

  SOLAR500: {
    code: "SOLAR500",
    type: "flat",
    value: 500,
    minOrder: 15000,
    maxDiscount: 500,
    solarOnly: true,
  },

  LUXMO100: {
    code: "LUXMO100",
    type: "flat",
    value: 100,
    minOrder: 1999,
    maxDiscount: 100,
  },
};

function isSolarOrder(items) {
  return items.some((item) => {
    const category =
      String(
        item?.category ||
          item?.productCategory ||
          ""
      ).toLowerCase();

    const title =
      String(
        item?.title || ""
      ).toLowerCase();

    return (
      category.includes("solar") ||
      title.includes("solar inverter") ||
      title.includes("hybrid inverter")
    );
  });
}

function calculateDiscount(
  couponCode,
  subtotal,
  items
) {
  const code =
    normalizeCoupon(
      couponCode
    );

  if (!code) {
    return {
      discount: 0,
      appliedCoupon: "",
    };
  }

  const coupon =
    COUPONS[code];

  if (!coupon) {
    throw new Error(
      "Invalid or inactive coupon code."
    );
  }

  if (
    subtotal <
    coupon.minOrder
  ) {
    throw new Error(
      `Minimum order value for ${code} is ₹${coupon.minOrder.toLocaleString(
        "en-IN"
      )}.`
    );
  }

  if (
    coupon.solarOnly &&
    !isSolarOrder(items)
  ) {
    throw new Error(
      "SOLAR500 is applicable only to Hybrid Solar Inverter orders."
    );
  }

  let discount = 0;

  if (
    coupon.type === "percent"
  ) {
    discount =
      (subtotal *
        coupon.value) /
      100;
  } else {
    discount =
      coupon.value;
  }

  discount = Math.min(
    Math.max(0, discount),
    coupon.maxDiscount ||
      discount,
    subtotal
  );

  return {
    discount,
    appliedCoupon: code,
  };
}

/* =========================================================
   SHIPPING
========================================================= */

function calculateShipping(
  body,
  subtotal
) {
  const mode =
    String(
      body?.shippingMode ||
        "standard"
    )
      .trim()
      .toLowerCase();

  if (
    mode === "free" ||
    mode === "pickup" ||
    mode === "store_pickup"
  ) {
    return 0;
  }

  const frontendShipping =
    parseMoney(
      body?.shippingFee
    );

  if (
    Number.isFinite(
      frontendShipping
    ) &&
    frontendShipping >= 0
  ) {
    return frontendShipping;
  }

  if (
    mode === "express"
  ) {
    const express =
      parseMoney(
        process.env
          .LUXMO_EXPRESS_SHIPPING_FEE
      );

    return Number.isFinite(
      express
    )
      ? Math.max(0, express)
      : 149;
  }

  const standard =
    parseMoney(
      process.env
        .LUXMO_STANDARD_SHIPPING_FEE
    );

  return Number.isFinite(
    standard
  )
    ? Math.max(0, standard)
    : subtotal > 0
      ? 79
      : 0;
}

/* =========================================================
   PRICING
========================================================= */

async function calculatePricing(body) {
  const items =
    Array.isArray(body?.items)
      ? body.items
      : [];

  if (!items.length) {
    throw new Error(
      "Your cart is empty."
    );
  }

  const trustedItems =
    await getTrustedCartItems(
      items
    );

  const subtotal =
    trustedItems.reduce(
      (total, item) =>
        total +
        item.price *
          item.qty,
      0
    );

  if (
    !Number.isFinite(
      subtotal
    ) ||
    subtotal <= 0
  ) {
    throw new Error(
      "Invalid subtotal."
    );
  }

  const couponResult =
    calculateDiscount(
      body?.couponCode ??
        body?.coupon ??
        "",
      subtotal,
      trustedItems
    );

  const shippingFee =
    calculateShipping(
      body,
      subtotal
    );

  const total =
    Math.max(
      0,
      subtotal -
        couponResult.discount +
        shippingFee
    );

  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    throw new Error(
      "Invalid final amount."
    );
  }

  return {
    items:
      trustedItems,

    subtotal,

    discount:
      couponResult.discount,

    shippingFee,

    total,

    couponCode:
      couponResult.appliedCoupon ||
      null,
  };
}

/* =========================================================
   SHIPROCKET SERVICEABILITY
========================================================= */

async function checkServiceability(req) {
  const pincode =
    String(
      req.query?.pincode ||
        ""
    ).replace(/\D/g, "");

  if (
    !/^[1-9]\d{5}$/.test(
      pincode
    )
  ) {
    return {
      status: 400,
      data: {
        success: false,
        serviceable: false,
        available: false,
        error:
          "Enter a valid 6-digit pincode.",
      },
    };
  }

  const pickupPincode =
    String(
      process.env
        .SHIPROCKET_PICKUP_PINCODE ||
        "274405"
    ).replace(
      /\D/g,
      ""
    );

  const email =
    String(
      process.env
        .SHIPROCKET_EMAIL ||
        ""
    ).trim();

  const password =
    String(
      process.env
        .SHIPROCKET_PASSWORD ||
        ""
    ).trim();

  if (!email || !password) {
    return {
      status: 500,
      data: {
        success: false,
        serviceable: false,
        available: false,
        error:
          "Shiprocket credentials are missing in Vercel Environment Variables.",
      },
    };
  }

  const loginResponse =
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

  const loginData =
    await loginResponse
      .json()
      .catch(() => ({}));

  if (
    !loginResponse.ok ||
    !loginData?.token
  ) {
    return {
      status: 502,
      data: {
        success: false,
        serviceable: false,
        available: false,
        error:
          loginData?.message ||
          loginData?.error ||
          "Shiprocket authentication failed.",
      },
    };
  }

  const weightNumber =
    Number(
      req.query?.weight ||
        0.5
    );

  const weight =
    Number.isFinite(
      weightNumber
    ) &&
    weightNumber > 0
      ? weightNumber
      : 0.5;

  const cod =
    String(
      req.query?.cod ||
        "0"
    ) === "1"
      ? 1
      : 0;

  const url =
    "https://apiv2.shiprocket.in/v1/external/courier/serviceability" +
    `?pickup_postcode=${encodeURIComponent(
      pickupPincode
    )}` +
    `&delivery_postcode=${encodeURIComponent(
      pincode
    )}` +
    `&cod=${cod}` +
    `&weight=${encodeURIComponent(
      weight
    )}`;

  const response =
    await fetch(
      url,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${loginData.token}`,
        },
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    return {
      status:
        response.status >= 400
          ? response.status
          : 502,

      data: {
        success: false,
        serviceable: false,
        available: false,
        error:
          data?.message ||
          data?.error ||
          "Delivery serviceability check failed.",
      },
    };
  }

  const couriers =
    Array.isArray(
      data?.data
        ?.available_courier_companies
    )
      ? data.data
          .available_courier_companies
      : [];

  const serviceable =
    couriers.length > 0;

  return {
    status: 200,

    data: {
      success: true,

      serviceable,

      available:
        serviceable,

      pincode,

      pickupPincode,

      courierCount:
        couriers.length,

      message:
        serviceable
          ? `Delivery is available for pincode ${pincode}.`
          : `Delivery is not available for pincode ${pincode}.`,
    },
  };
}

/* =========================================================
   RAZORPAY ORDER
========================================================= */

async function createRazorpayOrder(
  pricing,
  body
) {
  const keyId =
    process.env
      .RAZORPAY_KEY_ID;

  const keySecret =
    process.env
      .RAZORPAY_KEY_SECRET;

  if (
    !keyId ||
    !keySecret
  ) {
    throw new Error(
      "Razorpay server configuration missing."
    );
  }

  const amountPaise =
    Math.round(
      pricing.total * 100
    );

  if (
    !Number.isInteger(
      amountPaise
    ) ||
    amountPaise < 100
  ) {
    throw new Error(
      "Minimum payment amount is ₹1."
    );
  }

  const credentials =
    Buffer.from(
      `${keyId}:${keySecret}`
    ).toString(
      "base64"
    );

  const websiteOrderId =
    String(
      body?.websiteOrderId ||
        ""
    ).trim();

  const receiptBase =
    websiteOrderId
      ? `luxmo_${websiteOrderId}`
      : `luxmo_${Date.now()}`;

  const receipt =
    receiptBase
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      )
      .slice(0, 40);

  const response =
    await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",

        headers: {
          Authorization:
            `Basic ${credentials}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body: JSON.stringify({
          amount:
            amountPaise,

          currency:
            "INR",

          receipt,

          notes: {
            website_order_id:
              websiteOrderId ||
              receipt,

            coupon_code:
              pricing.couponCode ||
              "NONE",

            subtotal:
              String(
                pricing.subtotal
              ),

            discount:
              String(
                pricing.discount
              ),

            shipping_fee:
              String(
                pricing.shippingFee
              ),

            final_amount:
              String(
                pricing.total
              ),

            source:
              "luxmo-website",
          },
        }),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    const razorpayError =
      data?.error
        ?.description ||
      data?.error
        ?.message ||
      data?.message ||
      data?.error ||
      "Razorpay order creation failed.";

    throw new Error(
      cleanError(
        razorpayError
      )
    );
  }

  if (!data?.id) {
    throw new Error(
      "Razorpay did not return an order ID."
    );
  }

  return {
    id:
      data.id,

    amount:
      data.amount,

    currency:
      data.currency,

    receipt:
      data.receipt,
  };
}

/* =========================================================
   COD ORDER
========================================================= */

async function createCodOrder(
  pricing,
  body
) {
  const db =
    getFirestore(
      getFirebaseAdmin()
    );

  const websiteOrderId =
    String(
      body?.websiteOrderId ||
        `LMH${Date.now()}`
    ).trim();

  if (!websiteOrderId) {
    throw new Error(
      "Website order ID is missing."
    );
  }

  const customer =
    body?.customer &&
    typeof body.customer ===
      "object"
      ? body.customer
      : {};

  const shippingAddress =
    body?.shippingAddress &&
    typeof body.shippingAddress ===
      "object"
      ? body.shippingAddress
      : {};

  const customerName =
    String(
      customer.name ||
        body?.customerName ||
        ""
    ).trim();

  const customerPhone =
    String(
      customer.phone ||
        body?.phone ||
        ""
    )
      .replace(
        /\D/g,
        ""
      )
      .slice(-10);

  if (!customerName) {
    throw new Error(
      "Customer name is required for COD order."
    );
  }

  if (
    customerPhone.length !== 10
  ) {
    throw new Error(
      "Valid 10-digit customer mobile number is required for COD order."
    );
  }

  const orderData = {
    websiteOrderId,

    orderId:
      websiteOrderId,

    paymentMethod:
      "cod",

    paymentStatus:
      "Pending",

    paymentVerified:
      false,

    orderStatus:
      "Pending",

    shipmentStatus:
      "Pending",

    shipment:
      "Pending",

    courier:
      null,

    courier_name:
      null,

    awb:
      null,

    awbCode:
      null,

    trackingUrl:
      null,

    tracking_url:
      null,

    shipmentId:
      null,

    shipment_id:
      null,

    shiprocketOrderId:
      null,

    ithinkOrderId:
      null,

    customer: {
      name:
        customerName,

      phone:
        customerPhone,

      email:
        String(
          customer.email ||
            body?.email ||
            ""
        )
          .trim()
          .toLowerCase(),
    },

    customerName:
      customerName,

    phone:
      customerPhone,

    shippingAddress,

    items:
      pricing.items,

    subtotal:
      pricing.subtotal,

    discount:
      pricing.discount,

    shippingFee:
      pricing.shippingFee,

    shippingCharges:
      pricing.shippingFee,

    total:
      pricing.total,

    grandTotal:
      pricing.total,

    amount:
      pricing.total,

    couponCode:
      pricing.couponCode,

    currency:
      "INR",

    source:
      "luxmo-website",

    createdAt:
      new Date(),

    updatedAt:
      new Date(),
  };

  const orderRef =
    db
      .collection("orders")
      .doc(
        websiteOrderId
      );

  const existing =
    await orderRef.get();

  if (existing.exists) {
    const existingData =
      existing.data() || {};

    return {
      ...existingData,

      orderId:
        existingData.orderId ||
        websiteOrderId,

      websiteOrderId:
        existingData.websiteOrderId ||
        websiteOrderId,
    };
  }

  await orderRef.set(
    orderData
  );

  return orderData;
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
      "no-store, no-cache, must-revalidate"
    );

    /* =====================================================
       GET = PINCODE SERVICEABILITY
    ===================================================== */

    if (
      req.method === "GET"
    ) {
      const result =
        await checkServiceability(
          req
        );

      return sendJson(
        res,
        result.status,
        result.data
      );
    }

    /* =====================================================
       ONLY POST AFTER THIS
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

    let body =
      req.body || {};

    if (
      typeof body ===
      "string"
    ) {
      try {
        body =
          JSON.parse(body);
      } catch {
        return sendJson(
          res,
          400,
          {
            success: false,
            error:
              "Invalid JSON request body.",
          }
        );
      }
    }

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return sendJson(
        res,
        400,
        {
          success: false,
          error:
            "Invalid request body.",
        }
      );
    }

    /* =====================================================
       TRUSTED PRICING
    ===================================================== */

    const pricing =
      await calculatePricing(
        body
      );

    /* =====================================================
       QUOTE
    ===================================================== */

    if (
      String(
        body?.action || ""
      ).toLowerCase() ===
      "quote"
    ) {
      return sendJson(
        res,
        200,
        {
          success: true,

          pricing: {
            subtotal:
              pricing.subtotal,

            discount:
              pricing.discount,

            shippingFee:
              pricing.shippingFee,

            total:
              pricing.total,

            couponCode:
              pricing.couponCode,
          },

          items:
            pricing.items,
        }
      );
    }

    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    const paymentMethod =
      String(
        body?.paymentMethod ||
          body?.payment_method ||
          "razorpay"
      )
        .trim()
        .toLowerCase();

    /* =====================================================
       COD ORDER
    ===================================================== */

    if (
      paymentMethod ===
        "cod" ||
      paymentMethod ===
        "cash_on_delivery"
    ) {
      const codOrder =
        await createCodOrder(
          pricing,
          body
        );

      return sendJson(
        res,
        200,
        {
          success: true,

          paymentMethod:
            "cod",

          orderId:
            codOrder.orderId,

          websiteOrderId:
            codOrder.websiteOrderId,

          amount:
            Math.round(
              Number(
                codOrder.total
              ) * 100
            ),

          amountRupees:
            Number(
              codOrder.total
            ),

          currency:
            "INR",

          paymentStatus:
            "Pending",

          paymentVerified:
            false,

          orderStatus:
            "Pending",

          shipmentStatus:
            "Pending",

          shipment:
            "Pending",

          message:
            "COD order created successfully.",
        }
      );
    }

    /* =====================================================
       RAZORPAY ORDER
    ===================================================== */

    const order =
      await createRazorpayOrder(
        pricing,
        body
      );

    return sendJson(
      res,
      200,
      {
        success: true,

        order,

        razorpayKeyId:
          process.env
            .RAZORPAY_KEY_ID,

        pricing: {
          subtotal:
            pricing.subtotal,

          discount:
            pricing.discount,

          shippingFee:
            pricing.shippingFee,

          total:
            pricing.total,

          couponCode:
            pricing.couponCode,
        },

        items:
          pricing.items,

        paymentMethod:
          "razorpay",
      }
    );
  } catch (error) {
    const message =
      cleanError(error);

    const lower =
      message.toLowerCase();

    let status = 500;

    if (
      lower.includes(
        "cart is empty"
      ) ||
      lower.includes(
        "invalid or inactive coupon"
      ) ||
      lower.includes(
        "minimum order value"
      ) ||
      lower.includes(
        "applicable only to"
      ) ||
      lower.includes(
        "minimum payment amount"
      ) ||
      lower.includes(
        "invalid json"
      ) ||
      lower.includes(
        "invalid request body"
      ) ||
      lower.includes(
        "customer name is required"
      ) ||
      lower.includes(
        "valid 10-digit"
      )
    ) {
      status = 400;
    } else if (
      lower.includes(
        "product not found"
      )
    ) {
      status = 404;
    }

    console.error(
      "LUXMO HUB create-order error:",
      error
    );

    return sendJson(
      res,
      status,
      {
        success: false,
        error: message,
      }
    );
  }
}
