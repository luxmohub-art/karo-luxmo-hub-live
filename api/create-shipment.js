import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

function cleanDocId(value) {
  return String(value || "")
    .trim()
    .replace(/\//g, "_")
    .slice(0, 120);
}

function getBaseUrl(req) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercel) {
    return `https://${vercel.replace(
      /^https?:\/\//,
      ""
    )}`;
  }

  const host =
    req.headers?.host;

  if (!host) {
    throw new Error(
      "Unable to determine application URL"
    );
  }

  return `https://${host}`;
}

function normalizeProvider(value) {
  const provider = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  if (
    provider === "ithink" ||
    provider === "i-think" ||
    provider === "i think" ||
    provider === "ithink logistics"
  ) {
    return "ithink";
  }

  return "shiprocket";
}

export default async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const body =
      req.body || {};

    const {
      provider,
      order,
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
    } = body;

    /*
     * Provider:
     * Shiprocket OR iThink Logistics
     */
    const selectedProvider =
      normalizeProvider(
        provider ||
          order?.provider ||
          order?.courierProvider ||
          process.env
            .DEFAULT_LOGISTICS_PROVIDER ||
          "shiprocket"
      );

    if (
      !razorpay_order_id ||
      !razorpay_payment_id
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Verified Razorpay order and payment IDs are required.",
      });
    }

    /*
     * Firebase Admin
     */
    const db =
      getFirestore(
        getFirebaseAdmin()
      );

    const ordersCollection =
      db.collection("orders");

    let orderSnapshot =
      null;

    /*
     * Find order using website order ID
     */
    const suppliedWebsiteOrderId =
      String(
        order?.id ||
          order?.websiteOrderId ||
          orderId ||
          ""
      ).trim();

    if (
      suppliedWebsiteOrderId
    ) {
      const ref =
        ordersCollection.doc(
          cleanDocId(
            suppliedWebsiteOrderId
          )
        );

      const snapshot =
        await ref.get();

      if (snapshot.exists) {
        orderSnapshot = {
          ref,
          data:
            snapshot.data(),
        };
      }
    }

    /*
     * Fallback:
     * Find using Razorpay Order ID
     */
    if (!orderSnapshot) {
      const querySnapshot =
        await ordersCollection
          .where(
            "razorpayOrderId",
            "==",
            String(
              razorpay_order_id
            )
          )
          .limit(1)
          .get();

      if (
        !querySnapshot.empty
      ) {
        const doc =
          querySnapshot.docs[0];

        orderSnapshot = {
          ref: doc.ref,
          data:
            doc.data(),
        };
      }
    }

    if (!orderSnapshot) {
      return res.status(409).json({
        success: false,
        error:
          "Verified payment order was not found in Firebase.",
      });
    }

    const dbOrder =
      orderSnapshot.data || {};

    /*
     * SECURITY:
     * Shipment is allowed ONLY
     * after successful server-side
     * payment verification.
     */
    if (
      dbOrder.paymentVerified !==
        true ||
      dbOrder.paymentStatus !==
        "Paid" ||
      dbOrder.razorpayOrderId !==
        razorpay_order_id ||
      dbOrder.razorpayPaymentId !==
        razorpay_payment_id
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Payment is not verified for this order. Shipment creation blocked.",
      });
    }

    /*
     * Prevent duplicate shipment
     */
    if (
      dbOrder.shipmentStatus ===
        "Created" ||
      dbOrder.shipmentStatus ===
        "Shipped"
    ) {
      return res.status(200).json({
        success: true,

        provider:
          dbOrder.courierProvider ||
          selectedProvider,

        shipmentId:
          dbOrder.shipmentId ||
          null,

        awb:
          dbOrder.awb ||
          null,

        courier:
          dbOrder.courier ||
          null,

        trackingUrl:
          dbOrder.trackingUrl ||
          null,

        orderId:
          dbOrder.websiteOrderId ||
          dbOrder.id ||
          razorpay_order_id,

        message:
          "Shipment already created for this order.",

        alreadyProcessed:
          true,
      });
    }

    /*
     * Firebase is the trusted
     * source for customer/order data.
     */
    const trustedOrder = {
      ...(dbOrder.order &&
      typeof dbOrder.order ===
        "object"
        ? dbOrder.order
        : dbOrder),

      id:
        dbOrder.websiteOrderId ||
        dbOrder.id ||
        suppliedWebsiteOrderId ||
        razorpay_order_id,

      orderId:
        dbOrder.websiteOrderId ||
        dbOrder.id ||
        suppliedWebsiteOrderId ||
        razorpay_order_id,

      websiteOrderId:
        dbOrder.websiteOrderId ||
        dbOrder.id ||
        suppliedWebsiteOrderId,

      razorpayOrderId:
        razorpay_order_id,

      razorpayPaymentId:
        razorpay_payment_id,

      paymentMethod:
        "razorpay",

      paymentStatus:
        "Paid",

      paymentVerified:
        true,

      provider:
        selectedProvider,

      courierProvider:
        selectedProvider,
    };

    /*
     * IMPORTANT:
     *
     * Shiprocket:
     * /api/shiprocket
     *
     * iThink Logistics:
     * /api/ithink
     */
    const endpoint =
      selectedProvider ===
      "ithink"
        ? "/api/ithink"
        : "/api/shiprocket";

    const baseUrl =
      getBaseUrl(req);

    const response =
      await fetch(
        `${baseUrl}${endpoint}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify({
              order:
                trustedOrder,

              orderId:
                trustedOrder.orderId,

              paymentId:
                razorpay_payment_id,

              provider:
                selectedProvider,
            }),
        }
      );

    const data =
      await response
        .json()
        .catch(() => ({}));

    if (
      !response.ok ||
      data.success === false
    ) {
      const errorMessage =
        data?.error ||
        data?.message ||
        `${selectedProvider} shipment creation failed.`;

      await orderSnapshot.ref.set(
        {
          shipmentStatus:
            "Pending",

          shipmentError:
            errorMessage,

          courierProvider:
            selectedProvider,

          updatedAt:
            new Date().toISOString(),
        },
        {
          merge: true,
        }
      );

      return res.status(
        response.status || 500
      ).json({
        success: false,

        provider:
          selectedProvider,

        error:
          errorMessage,

        details:
          data,
      });
    }

    /*
     * Normalize both providers'
     * responses.
     */
    const shipmentId =
      data.shipmentId ||
      data.shipment_id ||
      data.referenceNumber ||
      data.refnum ||
      data.orderId ||
      data.order_id ||
      null;

    const awb =
      data.awb ||
      data.awbCode ||
      data.awb_code ||
      data.waybill ||
      null;

    const courier =
      data.courier ||
      data.courier_name ||
      data.logistic_name ||
      null;

    const trackingUrl =
      data.trackingUrl ||
      data.tracking_url ||
      null;

    const now =
      new Date().toISOString();

    /*
     * Update the SAME Firebase order.
     */
    await orderSnapshot.ref.set(
      {
        paymentStatus:
          "Paid",

        paymentVerified:
          true,

        shipmentStatus:
          "Created",

        status:
          "Shipped",

        courierProvider:
          selectedProvider,

        courier,

        shipmentId,

        awb,

        trackingUrl,

        shipmentError:
          "",

        shippedAt:
          now,

        updatedAt:
          now,
      },
      {
        merge: true,
      }
    );

    return res.status(200).json({
      success: true,

      provider:
        selectedProvider,

      shipmentId,

      orderId:
        trustedOrder.orderId,

      awb,

      courier,

      trackingUrl,

      message:
        data.message ||
        `${selectedProvider} shipment created successfully.`,

      alreadyProcessed:
        false,
    });
  } catch (error) {
    console.error(
      "Create shipment error:",
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
