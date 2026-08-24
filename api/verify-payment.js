import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";
import {
  sendOrderConfirmationNotifications,
} from "../lib/notifications.js";

/*
  LUXMO HUB
  Secure Razorpay Payment Verification

  IMPORTANT:
  - Razorpay amount is the final source of truth.
  - Website order total is used only when it can be
    reliably reconstructed.
  - The same verified order is saved in Firestore.
  - Duplicate verification is safely handled.
*/

function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(String(a || ""), "hex");
    const right = Buffer.from(String(b || ""), "hex");

    return (
      left.length > 0 &&
      left.length === right.length &&
      crypto.timingSafeEqual(left, right)
    );
  } catch {
    return false;
  }
}

function cleanDocId(value) {
  return String(value || "")
    .trim()
    .replace(/\//g, "_")
    .slice(0, 120);
}

function toPositiveNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : 0;
}

function getOrderTotal(order) {
  if (!order || typeof order !== "object") {
    return 0;
  }

  /*
    Support all common total field names used by
    the existing Luxmo checkout.
  */
  const directValues = [
    order.total,
    order.grandTotal,
    order.grand_total,
    order.finalTotal,
    order.final_total,
    order.amount,
    order.payableAmount,
    order.payable_amount,
    order.orderTotal,
    order.order_total,
  ];

  for (const value of directValues) {
    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return Math.round(number * 100) / 100;
    }
  }

  /*
    Fallback: calculate from products.
  */
  const items =
    Array.isArray(order.items)
      ? order.items
      : Array.isArray(order.orderItems)
      ? order.orderItems
      : Array.isArray(order.products)
      ? order.products
      : [];

  if (items.length > 0) {
    const productsTotal = items.reduce(
      (sum, item) => {
        const price = Number(
          item?.price ??
            item?.salePrice ??
            item?.sellingPrice ??
            item?.selling_price ??
            item?.unitPrice ??
            0
        );

        const quantity = Math.max(
          1,
          Number(
            item?.quantity ??
              item?.qty ??
              item?.units ??
              1
          )
        );

        if (
          !Number.isFinite(price) ||
          !Number.isFinite(quantity)
        ) {
          return sum;
        }

        return sum + price * quantity;
      },
      0
    );

    const shipping = Number(
      order.shippingCharges ??
        order.shipping_charges ??
        order.shippingCost ??
        order.shipping_cost ??
        0
    );

    const discount = Number(
      order.discount ??
        order.totalDiscount ??
        order.total_discount ??
        0
    );

    const calculated =
      productsTotal +
      (Number.isFinite(shipping) ? shipping : 0) -
      (Number.isFinite(discount) ? discount : 0);

    if (calculated > 0) {
      return Math.round(calculated * 100) / 100;
    }
  }

  return 0;
}

async function razorpayGet(path, keyId, keySecret) {
  const auth = Buffer.from(
    `${keyId}:${keySecret}`
  ).toString("base64");

  const response = await fetch(
    `https://api.razorpay.com/v1${path}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.description ||
        data?.error?.code ||
        `Razorpay API request failed (${response.status})`
    );
  }

  return data;
}

function normalizeCustomerOrder(clientOrder) {
  if (
    clientOrder &&
    typeof clientOrder === "object"
  ) {
    return {
      ...clientOrder,
    };
  }

  return {};
}

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

    const razorpayOrderId = String(
      body.razorpay_order_id || ""
    ).trim();

    const razorpayPaymentId = String(
      body.razorpay_payment_id || ""
    ).trim();

    const razorpaySignature = String(
      body.razorpay_signature || ""
    ).trim();

    const clientOrder = normalizeCustomerOrder(
      body.order &&
        typeof body.order === "object"
        ? body.order
        : body.orderData &&
          typeof body.orderData === "object"
        ? body.orderData
        : {}
    );

    /* =====================================================
       1. REQUIRED PAYMENT DATA
    ===================================================== */

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing Razorpay payment verification details",
      });
    }

    /* =====================================================
       2. RAZORPAY SERVER CONFIG
    ===================================================== */

    const keyId = String(
      process.env.RAZORPAY_KEY_ID || ""
    ).trim();

    const keySecret = String(
      process.env.RAZORPAY_KEY_SECRET || ""
    ).trim();

    if (!keyId || !keySecret) {
      return res.status(500).json({
        success: false,
        error:
          "Razorpay server configuration missing",
      });
    }

    /* =====================================================
       3. VERIFY RAZORPAY SIGNATURE
    ===================================================== */

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

    if (
      !safeEqualHex(
        generatedSignature,
        razorpaySignature
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    /* =====================================================
       4. GET REAL RAZORPAY ORDER
    ===================================================== */

    const razorpayOrder =
      await razorpayGet(
        `/orders/${encodeURIComponent(
          razorpayOrderId
        )}`,
        keyId,
        keySecret
      );

    /* =====================================================
       5. GET REAL RAZORPAY PAYMENT
    ===================================================== */

    const razorpayPayment =
      await razorpayGet(
        `/payments/${encodeURIComponent(
          razorpayPaymentId
        )}`,
        keyId,
        keySecret
      );

    /* =====================================================
       6. PAYMENT MUST BELONG TO ORDER
    ===================================================== */

    if (
      String(
        razorpayPayment.order_id || ""
      ) !== razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Payment does not belong to this Razorpay order",
      });
    }

    /* =====================================================
       7. PAYMENT MUST BE CAPTURED
    ===================================================== */

    const paymentCaptured =
      razorpayPayment.status === "captured" ||
      razorpayPayment.captured === true;

    if (!paymentCaptured) {
      return res.status(400).json({
        success: false,
        error:
          `Payment is not captured yet (status: ${
            razorpayPayment.status || "unknown"
          })`,
      });
    }

    /* =====================================================
       8. REAL PAYMENT AMOUNT CHECK
    ===================================================== */

    const razorpayAmountPaise = Number(
      razorpayOrder.amount
    );

    const capturedAmountPaise = Number(
      razorpayPayment.amount
    );

    if (
      !Number.isFinite(
        razorpayAmountPaise
      ) ||
      razorpayAmountPaise <= 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid Razorpay order amount",
      });
    }

    if (
      !Number.isFinite(
        capturedAmountPaise
      ) ||
      capturedAmountPaise !==
        razorpayAmountPaise
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Captured payment amount does not match Razorpay order amount",
      });
    }

    /*
      IMPORTANT FIX:

      Do NOT reject a successful Razorpay payment merely
      because the frontend's `total` field has a different
      representation.

      The server-created Razorpay order is authoritative.

      We still calculate the website total for diagnostics
      and store both values.
    */

    const websiteTotal =
      getOrderTotal(clientOrder);

    const razorpayAmount =
      Math.round(
        razorpayAmountPaise / 100 * 100
      ) / 100;

    const amountDifference =
      Math.round(
        (websiteTotal - razorpayAmount) * 100
      ) / 100;

    /* =====================================================
       9. FIREBASE
    ===================================================== */

    const adminApp =
      getFirebaseAdmin();

    const db =
      getFirestore(adminApp);

    /* =====================================================
       10. WEBSITE ORDER ID
    ===================================================== */

    const suppliedWebsiteOrderId =
      String(
        clientOrder.websiteOrderId ||
          clientOrder.orderId ||
          clientOrder.id ||
          ""
      ).trim();

    const documentId = cleanDocId(
      suppliedWebsiteOrderId ||
        `rzp_${razorpayOrderId}`
    );

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error:
          "Website order ID is required",
      });
    }

    const orderRef =
      db
        .collection("orders")
        .doc(documentId);

    const existingSnapshot =
      await orderRef.get();

    const existing =
      existingSnapshot.exists
        ? existingSnapshot.data() || {}
        : {};

    /* =====================================================
       11. DUPLICATE PAYMENT PROTECTION
    ===================================================== */

    if (
      existing.paymentVerified === true &&
      String(
        existing.razorpayPaymentId || ""
      ) === razorpayPaymentId
    ) {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
        databaseSaved: true,

        message:
          "Payment already verified",

        paymentId:
          razorpayPaymentId,

        razorpayOrderId:
          razorpayOrderId,

        orderId:
          existing.websiteOrderId ||
          existing.id ||
          documentId,

        websiteOrderId:
          existing.websiteOrderId ||
          existing.id ||
          documentId,

        paymentStatus:
          "Paid",

        amount:
          Number(
            existing.amount ||
              razorpayAmount
          ),
      });
    }

    /* =====================================================
       12. CUSTOMER DATA
    ===================================================== */

    const customer =
      clientOrder.customer &&
      typeof clientOrder.customer === "object"
        ? clientOrder.customer
        : {};

    const shippingAddress =
      clientOrder.shippingAddress &&
      typeof clientOrder.shippingAddress === "object"
        ? clientOrder.shippingAddress
        : {};

    const customerName = String(
      customer.name ||
        clientOrder.customerName ||
        clientOrder.name ||
        shippingAddress.name ||
        ""
    ).trim();

    const customerPhone = String(
      customer.phone ||
        clientOrder.phone ||
        clientOrder.mobile ||
        shippingAddress.phone ||
        ""
    ).trim();

    const customerEmail = String(
      customer.email ||
        clientOrder.email ||
        shippingAddress.email ||
        ""
    ).trim();

    /* =====================================================
       13. SAVE VERIFIED ORDER
    ===================================================== */

    const now =
      new Date().toISOString();

    const firestoreOrder = {
      ...clientOrder,

      id:
        suppliedWebsiteOrderId ||
        documentId,

      websiteOrderId:
        suppliedWebsiteOrderId ||
        documentId,

      customer: {
        ...customer,

        name:
          customerName,

        phone:
          customerPhone,

        email:
          customerEmail,
      },

      razorpayOrderId:
        razorpayOrderId,

      razorpayPaymentId:
        razorpayPaymentId,

      razorpaySignatureVerified:
        true,

      paymentStatus:
        "Paid",

      paymentVerified:
        true,

      paymentCaptured:
        true,

      paymentMethod:
        "Razorpay",

      amount:
        razorpayAmount,

      paidAmount:
        razorpayAmount,

      currency:
        razorpayOrder.currency ||
        "INR",

      razorpayOrderStatus:
        razorpayOrder.status ||
        "paid",

      /*
        Diagnostic fields.
        These do not block successful payment.
      */
      websiteCalculatedTotal:
        websiteTotal || null,

      paymentAmountDifference:
        amountDifference,

      status:
        existing.status ||
        "Payment Confirmed - Shipment Pending",

      shipmentStatus:
        existing.shipmentStatus ||
        "Pending",

      shipmentId:
        existing.shipmentId ||
        null,

      awb:
        existing.awb ||
        null,

      courier:
        existing.courier ||
        null,

      trackingUrl:
        existing.trackingUrl ||
        null,

      shipmentError:
        existing.shipmentError ||
        "",

      createdAt:
        existing.createdAt ||
        clientOrder.createdAt ||
        now,

      paidAt:
        now,

      verifiedAt:
        now,

      updatedAt:
        now,

      source:
        "luxmo-website",
    };

    await orderRef.set(
      firestoreOrder,
      {
        merge: true,
      }
    );

    /* =====================================================
       14. SEND NOTIFICATIONS
    ===================================================== */

    let notificationResult = null;

    try {
      notificationResult =
        await sendOrderConfirmationNotifications(
          firestoreOrder
        );

      console.log(
        "LUXMO HUB notification result:",
        notificationResult
      );
    } catch (notificationError) {
      /*
        Notification failure must NEVER turn a successful
        Razorpay payment into a failed order.
      */
      console.error(
        "LUXMO HUB notification error:",
        notificationError?.message ||
          notificationError
      );
    }

    /* =====================================================
       15. FINAL SUCCESS
    ===================================================== */

    return res.status(200).json({
      success: true,

      alreadyProcessed:
        false,

      databaseSaved:
        true,

      paymentVerified:
        true,

      paymentStatus:
        "Paid",

      message:
        "Payment verified and order saved successfully",

      paymentId:
        razorpayPaymentId,

      razorpayOrderId:
        razorpayOrderId,

      orderId:
        firestoreOrder.id,

      websiteOrderId:
        firestoreOrder.websiteOrderId,

      amount:
        razorpayAmount,

      currency:
        firestoreOrder.currency,

      customerEmail:
        customerEmail || null,

      shipmentStatus:
        firestoreOrder.shipmentStatus,

      awb:
        firestoreOrder.awb,

      trackingUrl:
        firestoreOrder.trackingUrl,

      notificationSent:
        Boolean(notificationResult),
    });
  } catch (error) {
    console.error(
      "LUXMO HUB payment verification error:",
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
