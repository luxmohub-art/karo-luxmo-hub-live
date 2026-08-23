// api/create-order.js
// LUXMO HUB — COMPLETE CHECKOUT API
// Razorpay + Coupon + Firestore Pricing + Shipping + Serviceability

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

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
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
      String(item?.sku || "").trim();

    let productDoc = null;

    /* -------------------------------------------------------
       FIND BY FIRESTORE DOCUMENT ID
    ------------------------------------------------------- */

    if (productId) {
      const snapshot =
        await collection
          .doc(productId)
          .get();

      if (snapshot.exists) {
        productDoc = snapshot;
      }
    }

    /* -------------------------------------------------------
       FIND BY SKU
    ------------------------------------------------------- */

    if (!productDoc && sku) {
      const snapshot =
        await collection
          .where("sku", "==", sku)
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

    /* -------------------------------------------------------
       VARIANT PRICE
    ------------------------------------------------------- */

    if (
      Array.isArray(
        product.variants
      )
    ) {
      const variant =
        product.variants.find(
          (variant) => {
            const variantSku =
              String(
                variant?.sku || ""
              )
                .trim()
                .toLowerCase();

            return (
              sku &&
              variantSku ===
                sku.toLowerCase()
            );
          }
        );

      if (variant) {
        price =
          getPriceFromObject(
            variant
          );
      }
    }

    /* -------------------------------------------------------
       PRODUCT PRICE
    ------------------------------------------------------- */

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      price =
        getPriceFromObject(
          product
        );
    }

    /* -------------------------------------------------------
       FRONTEND FALLBACK
    ------------------------------------------------------- */

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
        product.category ||
        "",

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
      category.includes(
        "solar"
      ) ||
      title.includes(
        "solar inverter"
      ) ||
      title.includes(
        "hybrid inverter"
      )
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

  /* NO COUPON = NO ERROR */
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
    coupon.type ===
    "percent"
  ) {
    discount =
      (subtotal *
        coupon.value) /
      100;
  }

  if (
    coupon.type ===
    "flat"
  ) {
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
      ? Math.max(
          0,
          express
        )
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
    ? Math.max(
        0,
        standard
      )
    : 79;
}

/* =========================================================
   PRICING
========================================================= */

async function calculatePricing(body) {
  const items =
    Array.isArray(
      body?.items
    )
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
      (
        total,
        item
      ) =>
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

  const couponValue =
    body?.couponCode ??
    body?.coupon ??
    "";

  const couponResult =
    calculateDiscount(
      couponValue,
      subtotal,
      trustedItems
    );

  const shippingFee =
    calculateShipping(
      body,
      subtotal
    );

  const total = Math.max(
    0,
    subtotal -
      couponResult.discount +
      shippingFee
  );

  if (
    !Number.isFinite(
      total
    ) ||
    total <= 0
  ) {
    throw new Error(
      "Invalid final amount."
    );
  }

  return {
    items: trustedItems,

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

async function checkServiceability(
  req
) {
  const pincode =
    String(
      req.query?.pincode ||
      ""
    ).replace(
      /\D/g,
      ""
    );

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

  if (
    !email ||
    !password
  ) {
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

  /* -------------------------------------------------------
     SHIPROCKET LOGIN
  ------------------------------------------------------- */

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

        details: data,
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
    id: data.id,

    amount:
      data.amount,

    currency:
      data.currency,

    receipt:
      data.receipt,
  };
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

    /* =====================================================
       CALCULATE TRUSTED PRICE
    ===================================================== */

    const pricing =
      await calculatePricing(
        body
      );

    /* =====================================================
       COUPON QUOTE
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
       RAZORPAY ORDER
    =
