// api/create-order.js
// LUXMO HUB — Razorpay Order Creation
// Fixes:
// 1. Invalid subtotal
// 2. Empty coupon
// 3. Coupon validation
// 4. Product price calculation
// 5. Shipping calculation
// 6. Razorpay amount validation

function parseMoney(value) {
  if (value === undefined || value === null || value === "") {
    return NaN;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
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

  return Number.isFinite(number) ? number : NaN;
}

function normalizeCoupon(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeId(value) {
  return String(value || "").trim();
}

function getItemPrice(item) {
  const salePrice = parseMoney(item?.salePrice);

  if (Number.isFinite(salePrice) && salePrice >= 0) {
    return salePrice;
  }

  const price = parseMoney(item?.price);

  if (Number.isFinite(price) && price >= 0) {
    return price;
  }

  return NaN;
}

function getItemQty(item) {
  const qty = Number(item?.qty ?? item?.quantity ?? 1);

  if (!Number.isFinite(qty) || qty <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(qty));
}

function isSolarInverter(item) {
  const category = String(
    item?.category ||
      item?.productCategory ||
      item?.mainCategory ||
      ""
  ).toLowerCase();

  const title = String(
    item?.title ||
      item?.name ||
      ""
  ).toLowerCase();

  return (
    category.includes("hybrid solar inverter") ||
    category.includes("solar inverter") ||
    title.includes("hybrid solar inverter") ||
    title.includes("solar inverter")
  );
}

/*
 * ---------------------------------------------------------
 * SHIPPING
 * ---------------------------------------------------------
 */

function calculateShipping(body, subtotal) {
  const mode = String(
    body?.shippingMode || "standard"
  )
    .trim()
    .toLowerCase();

  if (
    mode === "free" ||
    mode === "free_shipping" ||
    mode === "pickup" ||
    mode === "store_pickup"
  ) {
    return 0;
  }

  const suppliedShipping = parseMoney(
    body?.shippingFee
  );

  if (
    Number.isFinite(suppliedShipping) &&
    suppliedShipping >= 0
  ) {
    return suppliedShipping;
  }

  /*
   * Environment variable can override shipping.
   *
   * Example:
   * LUXMO_STANDARD_SHIPPING_FEE=79
   */

  const configuredShipping = parseMoney(
    process.env.LUXMO_STANDARD_SHIPPING_FEE
  );

  if (
    Number.isFinite(configuredShipping) &&
    configuredShipping >= 0
  ) {
    return configuredShipping;
  }

  // Default Luxmo Hub standard shipping
  return subtotal > 0 ? 79 : 0;
}

/*
 * ---------------------------------------------------------
 * MAIN HANDLER
 * ---------------------------------------------------------
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const body = req.body || {};

    /*
     * -------------------------------------------------------
     * CART ITEMS
     * -------------------------------------------------------
     */

    const items = Array.isArray(body.items)
      ? body.items
      : [];

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Your cart is empty.",
      });
    }

    /*
     * -------------------------------------------------------
     * CALCULATE SUBTOTAL
     *
     * IMPORTANT:
     * Frontend may send only:
     *
     * id
     * sku
     * qty
     *
     * Therefore we calculate subtotal from the supplied
     * product price when available.
     * -------------------------------------------------------
     */

    let subtotal = 0;

    let hasSolarInverter = false;

    const normalizedItems = [];

    for (const item of items) {
      const qty = getItemQty(item);

      let unitPrice = getItemPrice(item);

      /*
       * If frontend did not send price, try the item's
       * other common price fields.
       */

      if (!Number.isFinite(unitPrice)) {
        unitPrice = parseMoney(
          item?.sellingPrice
        );
      }

      if (!Number.isFinite(unitPrice)) {
        unitPrice = parseMoney(
          item?.amount
        );
      }

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid product price.",
          productId:
            normalizeId(item?.id) || null,
          productName:
            item?.title ||
            item?.name ||
            null,
        });
      }

      subtotal += unitPrice * qty;

      if (isSolarInverter(item)) {
        hasSolarInverter = true;
      }

      normalizedItems.push({
        id: normalizeId(item?.id),
        sku: String(item?.sku || "").trim(),
        title:
          item?.title ||
          item?.name ||
          "",
        qty,
        price: unitPrice,
        model: String(item?.model || ""),
        colour: String(
          item?.colour ||
            item?.color ||
            ""
        ),
      });
    }

    /*
     * -------------------------------------------------------
     * FALLBACK SUBTOTAL
     *
     * This keeps compatibility with older checkout requests.
     * -------------------------------------------------------
     */

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0
    ) {
      subtotal = parseMoney(
        body.subtotal
      );
    }

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0
    ) {
      subtotal = parseMoney(
        body.amount
      );
    }

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid subtotal",
      });
    }

    /*
     * -------------------------------------------------------
     * COUPONS
     * -------------------------------------------------------
     */

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

    /*
     * IMPORTANT:
     * Coupon optional hai.
     *
     * Coupon blank:
     *   -> koi error nahi
     *
     * Coupon filled:
     *   -> validate hoga
     */

    const couponCode = normalizeCoupon(
      body.couponCode ||
        body.coupon ||
        ""
    );

    let discount = 0;

    let appliedCoupon = "";

    if (couponCode) {
      const coupon =
        COUPONS[couponCode];

      if (!coupon) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid or inactive coupon code.",
        });
      }

      if (
        subtotal < coupon.minOrder
      ) {
        return res.status(400).json({
          success: false,
          error:
            `Minimum order value for ${couponCode} is ₹${coupon.minOrder.toLocaleString("en-IN")}.`,
        });
      }

      if (
        coupon.solarOnly &&
        !hasSolarInverter
      ) {
        return res.status(400).json({
          success: false,
          error:
            "SOLAR500 is applicable only to Hybrid Solar Inverter orders.",
        });
      }

      if (
        coupon.type === "percent"
      ) {
        discount =
          (subtotal * coupon.value) /
          100;

        if (
          coupon.maxDiscount > 0 &&
          discount > coupon.maxDiscount
        ) {
          discount =
            coupon.maxDiscount;
        }
      }

      if (
        coupon.type === "flat"
      ) {
        discount = coupon.value;
      }

      discount = Math.min(
        Math.max(0, discount),
        subtotal
      );

      appliedCoupon = couponCode;
    }

    /*
     * -------------------------------------------------------
     * SHIPPING
     * -------------------------------------------------------
     */

    const shippingFee =
      calculateShipping(
        body,
        subtotal
      );

    /*
     * -------------------------------------------------------
     * FINAL AMOUNT
     * -------------------------------------------------------
     */

    const finalAmount =
      Math.max(
        0,
        subtotal -
          discount +
          shippingFee
      );

    if (
      !Number.isFinite(
        finalAmount
      ) ||
      finalAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid final amount",
      });
    }

    /*
     * Razorpay amount is paise.
     */

    const amountPaise =
      Math.round(
        finalAmount * 100
      );

    if (
      !Number.isInteger(
        amountPaise
      ) ||
      amountPaise < 100
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Minimum payment amount is ₹1",
      });
    }

    /*
     * -------------------------------------------------------
     * RAZORPAY CONFIG
     * -------------------------------------------------------
     */

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
      console.error(
        "Razorpay environment variables are missing."
      );

      return res.status(500).json({
        success: false,
        error:
          "Razorpay server configuration missing.",
      });
    }

    /*
     * -------------------------------------------------------
     * RAZORPAY AUTH
     * -------------------------------------------------------
     */

    const auth =
      Buffer.from(
        `${razorpayKeyId}:${razorpayKeySecret}`
      ).toString("base64");

    /*
     * -------------------------------------------------------
     * RECEIPT
     * -------------------------------------------------------
     */

    const websiteOrderId =
      String(
        body.websiteOrderId ||
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

    /*
     * -------------------------------------------------------
     * CREATE RAZORPAY ORDER
     * -------------------------------------------------------
     */

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
                appliedCoupon ||
                "NONE",

              subtotal:
                String(
                  subtotal
                ),

              discount:
                String(
                  discount
                ),

              shipping_fee:
                String(
                  shippingFee
                ),

              final_amount:
                String(
                  finalAmount
                ),

              source:
                "luxmo-website",
            },
          }),
        }
      );

    /*
     * -------------------------------------------------------
     * RAZORPAY RESPONSE
     * -------------------------------------------------------
     */

    const data =
      await razorpayResponse
        .json()
        .catch(
          () => ({})
        );

    /*
     * -------------------------------------------------------
     * RAZORPAY ERROR
     * -------------------------------------------------------
     */

    if (
      !razorpayResponse.ok
    ) {
      console.error(
        "Razorpay order error:",
        data
      );

      return res.status(
        razorpayResponse.status
      ).json({
        success: false,

        error:
          data?.error
            ?.description ||
          data?.error?.code ||
          "Razorpay order creation failed.",
      });
    }

    /*
     * -------------------------------------------------------
     * SUCCESS
     * -------------------------------------------------------
     */

    return res.status(200).json({
      success: true,

      orderId:
        data.id,

      amount:
        data.amount,

      currency:
        data.currency,

      receipt:
        data.receipt,

      pricing: {
        subtotal,

        discount,

        shippingFee,

        total:
          finalAmount,

        couponCode:
          appliedCoupon ||
          null,
      },

      items:
        normalizedItems,
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        "Internal server error.",
    });
  }
      }
