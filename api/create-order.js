// api/create-order.js
// LUXMO HUB — COMPLETE CHECKOUT API
//
// Supports:
// 1. Razorpay order creation
// 2. Coupon quote
// 3. Optional coupon
// 4. Firestore product pricing
// 5. Variant pricing
// 6. Shipping calculation
// 7. Pincode serviceability
//
// IMPORTANT:
// Do NOT create another API file for serviceability.
// This single API handles both GET and POST.

import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

/* =========================================================
   HELPERS
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
    1
  );

  if (
    !Number.isFinite(qty) ||
    qty <= 0
  ) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(qty)
  );
}

function cleanError(value) {
  if (!value) {
    return "Request failed.";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message || "Request failed.";
  }

  if (typeof value === "object") {
    return (
      value.message ||
      value.error ||
      value.description ||
      "Request failed."
    );
  }

  return String(value);
}

/* =========================================================
   ERROR -> HTTP STATUS MAPPING
   These are expected, "your input was wrong" style errors.
   Anything not matched here falls back to 500 (real server bug).
========================================================= */

function statusForError(message) {
  const text = String(message || "").toLowerCase();

  if (text.includes("cart is empty")) return 400;
  if (text.includes("product not found")) return 404;
  if (text.includes("invalid or inactive coupon")) return 400;
  if (text.includes("minimum order value")) return 400;
  if (text.includes("applicable only to")) return 400;
  if (text.includes("missing firebase environment")) return 500;
  if (text.includes("razorpay server configuration")) return 500;
  if (text.includes("minimum payment amount")) return 400;
  if (text.includes("invalid product price")) return 500;
  if (text.includes("invalid subtotal")) return 500;
  if (text.includes("invalid final amount")) return 500;

  return 500;
}

/* =========================================================
   PRODUCT PRICE
========================================================= */

function getPriceFromObject(product) {
  const candidates = [
    product?.salePrice,
    product?.sellingPrice,
    product?.selling_price,
    product?.price,
    product?.amount,
  ];

  for (const value of candidates) {
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
  const firebaseAdmin =
    getFirebaseAdmin();

  const db =
    getFirestore(firebaseAdmin);

  const productsRef =
    db.collection("products");

  const trustedItems = [];

  for (const item of items) {
    const productId =
      normalizeId(item?.id);

    const sku =
      String(item?.sku || "").trim();

    let productDoc = null;

    /* -------------------------------------------------------
       FIND PRODUCT BY ID
    ------------------------------------------------------- */

    if (productId) {
      const snapshot =
        await productsRef
          .doc(productId)
          .get();

      if (snapshot.exists) {
        productDoc = snapshot;
      }
    }

    /* -------------------------------------------------------
       FIND PRODUCT BY SKU
    ------------------------------------------------------- */

    if (!productDoc && sku) {
      const snapshot =
        await productsRef
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

    const qty = getQty(item);

    let price = NaN;

    /* -------------------------------------------------------
       VARIANT PRICE
    ------------------------------------------------------- */

    if (
      Array.isArray(product.variants) &&
      product.variants.length
    ) {
      const variant =
        product.variants.find(
          (v) =>
            sku &&
            String(v?.sku || "")
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
       LAST COMPATIBILITY FALLBACK
       Existing checkout data may contain price.
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
        "",

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
        "",

      qty,

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
        "solar inverter"
      ) ||
      title.includes(
        "solar inverter"
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
      subtotal *
      coupon.value /
      100;
  }

  if (
    coupon.type ===
    "flat"
  ) {
    discount =
      coupon.value;
  }

  discount =
    Math.min(
      Math.max(
        0,
        discount
      ),
      coupon.maxDiscount ||
        discount,
      subtotal
    );

  return {
    discount,
    appliedCoupon:
      code,
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

  const supplied =
    parseMoney(
      body?.shippingFee
    );

  if (
    Number.isFinite(
      supplied
    ) &&
    supplied >= 0
  ) {
    return supplied;
  }

  if (
    mode === "express"
  ) {
    const express =
      parseMoney(
        process.env
          .LUXMO_EXPRESS_SHIPPING_FEE
      );

    if (
      Number.isFinite(
        express
      ) &&
      express >= 0
    ) {
      return express;
    }

    return subtotal > 0
      ? 149
      : 0;
  }

  const standard =
    parseMoney(
      process.env
        .LUXMO_STANDARD_SHIPPING_FEE
    );

  if (
    Number.isFinite(
      standard
    ) &&
    standard >= 0
  ) {
    return standard;
  }

  return subtotal > 0
    ? 79
    : 0;
}

/* =========================================================
   CALCULATE PRICING
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

  let subtotal = 0;

  for (
    const item of trustedItems
  ) {
    subtotal +=
      item.price *
      item.qty;
  }

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

  const {
    discount,
    appliedCoupon,
  } =
    calculateDiscount(
      body?.couponCode ||
      body?.coupon ||
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
        discount +
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
    items:
      trustedItems,

    subtotal,

    discount,

    shippingFee,

    total,

    couponCode:
      appliedCoupon ||
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
        error:
          loginData?.message ||
          loginData?.error ||
          "Shiprocket authentication failed.",
      },
    };
  }

  const weight =
    Number(
      req.query?.weight || 0.5
    );

  const cod =
    String(
      req.query?.cod || "0"
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
      Number.isFinite(weight) &&
      weight > 0
        ? weight
        : 0.5
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

  return {
    status: 200,

    data: {
      success: true,

      available:
        couriers.length > 0,

      pincode,

      pickupPincode,

      courierCount:
        couriers.length,

      message:
        couriers.length > 0
          ? `Delivery is available for pincode ${pincode}.`
          : `Delivery is not available for pincode ${pincode}.`,
    },
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
      "no-store"
    );

    /* =====================================================
       GET SERVICEABILITY
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
       POST CHECK
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

    /* =====================================================
       PRICING
    ===================================================== */

    const pricing =
      await calculatePricing(
        body
      );

    /* =====================================================
       QUOTE ONLY
       Coupon Apply button uses action=quote.
       DO NOT create Razorpay order here.
    ===================================================== */

    if (
      body?.action ===
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
       CREATE RAZORPAY ORDER
    ===================================================== */

    const razorpayKeyId =
      process.env
        .RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env
        .RAZORPAY_KEY_SECRET;

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      return sendJson(
        res,
        500,
        {
          success: false,
          error:
            "Razorpay server configuration missing.",
        }
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
      return sendJson(
        res,
        400,
        {
          success: false,
          error:
            "Minimum payment amount is ₹1.",
        }
      );
    }

    const auth =
      Buffer.from(
        `${razorpayKeyId}:${razorpayKeySecret}`
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

    const razorpayResponse =
      await fetch(
        "https://api.razorpay.com/v1/orders",
        {
          method: "POST",

          headers: {
            Authorization:
              `Basic ${auth}`,

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
