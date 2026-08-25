/* =========================================================
   COD ORDER CREATION
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
    typeof body.customer === "object"
      ? body.customer
      : {};

  const shippingAddress =
    body?.shippingAddress &&
    typeof body.shippingAddress === "object"
      ? body.shippingAddress
      : {};

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

    courier:
      null,

    awb:
      null,

    trackingUrl:
      null,

    shipmentId:
      null,

    shiprocketOrderId:
      null,

    ithinkOrderId:
      null,

    customer: {
      name:
        String(
          customer.name ||
            body?.customerName ||
            ""
        ).trim(),

      phone:
        String(
          customer.phone ||
            body?.phone ||
            ""
        ).trim(),

      email:
        String(
          customer.email ||
            body?.email ||
            ""
        ).trim()
        .toLowerCase(),
    },

    shippingAddress,

    items:
      pricing.items,

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

    currency:
      "INR",

    createdAt:
      new Date(),

    updatedAt:
      new Date(),

    source:
      "website",

    paymentProvider:
      null,

    razorpayOrderId:
      null,

    razorpayPaymentId:
      null,
  };

  const orderRef =
    db
      .collection("orders")
      .doc(websiteOrderId);

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
      websiteOrderId,
    };
  }

  await orderRef.set(
    orderData,
    {
      merge: false,
    }
  );

  return orderData;
}
