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

    const amount = Number(body.amount);
    const subtotal = Number(body.subtotal ?? amount);
    const shippingFee = Number(body.shippingFee || 0);

    const couponCode = String(
      body.couponCode ||
      body.coupon ||
      ""
    )
      .trim()
      .toUpperCase();

    const websiteOrderId = String(
      body.websiteOrderId || ""
    ).trim();

    /*
     * ---------------------------------------------------------
     * BASIC AMOUNT VALIDATION
     * ---------------------------------------------------------
     */

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid subtotal",
      });
    }

    /*
     * ---------------------------------------------------------
     * COUPON RULES
     * ---------------------------------------------------------
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
        category: "Hybrid Solar Inverter",
      },

      LUXMO100: {
        code: "LUXMO100",
        type: "flat",
        value: 100,
        minOrder: 1999,
        maxDiscount: 100,
      },
    };

    let discount = 0;
    let appliedCoupon = "";

    /*
     * ---------------------------------------------------------
     * PRODUCT / CATEGORY CHECK
     * ---------------------------------------------------------
     */

    const items = Array.isArray(body.items)
      ? body.items
      : [];

    const hasSolarInverter = items.some((item) => {
      const category = String(
        item?.category ||
        item?.productCategory ||
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
    });

    /*
     * ---------------------------------------------------------
     * APPLY COUPON
     * ---------------------------------------------------------
     */

    if (couponCode) {
      const coupon = COUPONS[couponCode];

      if (!coupon) {
        return res.status(400).json({
          success: false,
          error: "Invalid or inactive coupon code.",
        });
      }

      if (subtotal < coupon.minOrder) {
        return res.status(400).json({
          success: false,
          error: `Minimum order value for ${couponCode} is ₹${coupon.minOrder.toLocaleString(
            "en-IN"
          )}.`,
        });
      }

      if (
        coupon.category === "Hybrid Solar Inverter" &&
        !hasSolarInverter
      ) {
        return res.status(400).json({
          success: false,
          error:
            "SOLAR500 is applicable only to Hybrid Solar Inverter orders.",
        });
      }

      if (coupon.type === "percent") {
        discount = (subtotal * coupon.value) / 100;

        if (
          coupon.maxDiscount > 0 &&
          discount > coupon.maxDiscount
        ) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.value;
      }

      discount = Math.min(
        Math.max(0, discount),
        subtotal
      );

      appliedCoupon = couponCode;
    }

    /*
     * ---------------------------------------------------------
     * FINAL AMOUNT
     * ---------------------------------------------------------
     */

    const finalAmount = Math.max(
      0,
      subtotal - discount + shippingFee
    );

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid final amount",
      });
    }

    const amountPaise = Math.round(
      finalAmount * 100
    );

    if (amountPaise < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum payment amount is ₹1",
      });
    }

    /*
     * ---------------------------------------------------------
     * RAZORPAY CONFIG
     * ---------------------------------------------------------
     */

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      return res.status(500).json({
        success: false,
        error:
          "Razorpay server configuration missing",
      });
    }

    /*
     * ---------------------------------------------------------
     * RAZORPAY AUTH
     * ---------------------------------------------------------
     */

    const auth = Buffer.from(
      `${razorpayKeyId}:${razorpayKeySecret}`
    ).toString("base64");

    /*
     * ---------------------------------------------------------
     * RECEIPT
     * ---------------------------------------------------------
     */

    const receiptBase = websiteOrderId
      ? `luxmo_${websiteOrderId}`
      : `luxmo_${Date.now()}`;

    const receipt = receiptBase
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);

    /*
     * ---------------------------------------------------------
     * CREATE RAZORPAY ORDER
     * ---------------------------------------------------------
     */

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",

        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,

          notes: {
            website_order_id:
              websiteOrderId || receipt,

            coupon_code:
              appliedCoupon || "NONE",

            subtotal: String(subtotal),

            discount: String(discount),

            shipping_fee:
              String(shippingFee),

            final_amount:
              String(finalAmount),

            source: "luxmo-website",
          },
        }),
      }
    );

    const data =
      await razorpayResponse
        .json()
        .catch(() => ({}));

    /*
     * ---------------------------------------------------------
     * RAZORPAY ERROR
     * ---------------------------------------------------------
     */

    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay order error:",
        data
      );

      return res.status(
        razorpayResponse.status
      ).json({
        success: false,
        error:
          data?.error?.description ||
          data?.error?.code ||
          "Razorpay order creation failed",
      });
    }

    /*
     * ---------------------------------------------------------
     * SUCCESS
     * ---------------------------------------------------------
     */

    return res.status(200).json({
      success: true,

      orderId: data.id,

      amount: data.amount,

      currency: data.currency,

      receipt: data.receipt,

      pricing: {
        subtotal,

        discount,

        shippingFee,

        total: finalAmount,

        couponCode:
          appliedCoupon || null,
      },
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
        "Internal server error",
    });
  }
        }
