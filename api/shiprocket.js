// api/shiprocket.js
// LUXMO HUB — SHIPROCKET ORDER + SHIPMENT CREATION
//
// Responsibilities:
// 1. Shiprocket authentication
// 2. Create Shiprocket order
// 3. Create shipment
// 4. Select/assign courier
// 5. Assign AWB
// 6. Return order/shipment/AWB/courier/tracking data
//
// IMPORTANT:
// Label + Invoice generation is handled by create-shipment.js
// after this file successfully returns shipment information.

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function clean(value) {
  return String(value ?? "").trim();
}

function number(value, fallback = 0) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function positiveNumber(value, fallback = 1) {
  const n = Number(value);

  return Number.isFinite(n) && n > 0
    ? n
    : fallback;
}

function normalizePhone(value) {
  const digits = clean(value)
    .replace(/\D/g, "");

  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits;
}

function normalizePincode(value) {
  return clean(value)
    .replace(/\D/g, "")
    .slice(0, 6);
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

/* =========================================================
   SHIPROCKET LOGIN
========================================================= */

async function getShiprocketToken() {
  const email = clean(
    process.env.SHIPROCKET_EMAIL
  );

  const password = clean(
    process.env.SHIPROCKET_PASSWORD
  );

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials are missing. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in Vercel Environment Variables."
    );
  }

  const response = await fetch(
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

  const data = await response
    .json()
    .catch(() => ({}));

  if (
    !response.ok ||
    !data?.token
  ) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Shiprocket authentication failed."
    );
  }

  return data.token;
}

/* =========================================================
   SHIPROCKET API REQUEST
========================================================= */

async function shiprocketRequest(
  endpoint,
  token,
  options = {}
) {
  const method =
    options.method || "POST";

  const body =
    options.body ?? null;

  const response =
    await fetch(
      `https://apiv2.shiprocket.in/v1/external${endpoint}`,
      {
        method,

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        ...(body !== null
          ? {
              body: JSON.stringify(
                body
              ),
            }
          : {}),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    const details =
      data?.errors ||
      data?.error ||
      data?.message ||
      data;

    throw new Error(
      typeof details === "string"
        ? details
        : JSON.stringify(details)
    );
  }

  return data;
}

/* =========================================================
   ADDRESS
========================================================= */

function getShippingAddress(order) {
  const address =
    order?.shippingAddress ||
    order?.address ||
    order?.deliveryAddress ||
    {};

  const customer =
    order?.customer || {};

  const name = clean(
    address.name ||
      customer.name ||
      order?.customerName ||
      order?.name
  );

  const phone = normalizePhone(
    address.phone ||
      customer.phone ||
      order?.phone ||
      order?.mobile
  );

  const email = normalizeEmail(
    address.email ||
      customer.email ||
      order?.email
  );

  const line1 = clean(
    address.line1 ||
      address.address1 ||
      address.street ||
      address.address ||
      order?.addressLine1
  );

  const line2 = clean(
    address.line2 ||
      address.address2 ||
      order?.addressLine2 ||
      ""
  );

  const city = clean(
    address.city ||
      order?.city
  );

  const state = clean(
    address.state ||
      address.stateName ||
      order?.state
  );

  const pincode =
    normalizePincode(
      address.pincode ||
        address.postalCode ||
        address.zip ||
        order?.pincode
    );

  return {
    name,
    phone,
    email,
    line1,
    line2,
    city,
    state,
    pincode,
  };
}

/* =========================================================
   PICKUP LOCATION
========================================================= */

function getPickupLocation() {
  return clean(
    process.env.SHIPROCKET_PICKUP_LOCATION ||
      "Primary"
  );
}

/* =========================================================
   ITEMS
========================================================= */

function getOrderItems(order) {
  const source =
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

  return source.map(
    (item, index) => {
      const quantity =
        Math.max(
          1,
          Math.floor(
            positiveNumber(
              item?.qty ??
                item?.quantity ??
                1,
              1
            )
          )
        );

      const price =
        number(
          item?.price ??
            item?.salePrice ??
            item?.sellingPrice ??
            item?.selling_price ??
            item?.amount ??
            0,
          0
        );

      const sku = clean(
        item?.sku ||
          item?.productSku ||
          item?.id ||
          `LUXMO-${index + 1}`
      );

      const name = clean(
        item?.title ||
          item?.name ||
          item?.productName ||
          `LUXMO HUB Product ${index + 1}`
      );

      return {
        name,
        sku,
        units: quantity,
        selling_price:
          Math.max(
            0,
            price
          ),

        discount:
          number(
            item?.discount ||
              0,
            0
          ),

        tax:
          number(
            item?.tax ||
              item?.gstRate ||
              0,
            0
          ),

        hsn:
          clean(
            item?.hsn ||
              item?.hsnCode ||
              ""
          ),
      };
    }
  );
}

/* =========================================================
   TOTALS
========================================================= */

function getOrderTotals(order, items) {
  let subtotal =
    number(
      order?.subtotal,
      NaN
    );

  if (
    !Number.isFinite(
      subtotal
    )
  ) {
    subtotal = items.reduce(
      (sum, item) =>
        sum +
        number(
          item.selling_price,
          0
        ) *
          number(
            item.units,
            1
          ),
      0
    );
  }

  const discount =
    number(
      order?.discount,
      0
    );

  const shippingFee =
    number(
      order?.shippingFee ??
        order?.shippingCharges ??
        order?.shippingCost ??
        0,
      0
    );

  const total =
    number(
      order?.total ??
        order?.grandTotal ??
        order?.amount,
      subtotal -
        discount +
        shippingFee
    );

  return {
    subtotal:
      Math.max(
        0,
        subtotal
      ),

    discount:
      Math.max(
        0,
        discount
      ),

    shippingFee:
      Math.max(
        0,
        shippingFee
      ),

    total:
      Math.max(
        0,
        total
      ),
  };
}

/* =========================================================
   PACKAGE DETAILS
========================================================= */

function getPackageDetails(
  order
) {
  const weight =
    positiveNumber(
      order?.weight ||
        order?.packageWeight ||
        order?.totalWeight,
      0.5
    );

  const length =
    positiveNumber(
      order?.length ||
        order?.packageLength,
      20
    );

  const breadth =
    positiveNumber(
      order?.breadth ||
        order?.width ||
        order?.packageWidth,
      15
    );

  const height =
    positiveNumber(
      order?.height ||
        order?.packageHeight,
      10
    );

  return {
    weight,
    length,
    breadth,
    height,
  };
}

/* =========================================================
   CREATE SHIPROCKET ORDER
========================================================= */

async function createShiprocketOrder(
  token,
  order
) {
  const address =
    getShippingAddress(order);

  if (!address.name) {
    throw new Error(
      "Customer name is missing."
    );
  }

  if (
    !address.phone ||
    address.phone.length !== 10
  ) {
    throw new Error(
      "Valid 10-digit customer mobile number is required."
    );
  }

  if (
    !address.pincode ||
    address.pincode.length !== 6
  ) {
    throw new Error(
      "Valid 6-digit delivery pincode is required."
    );
  }

  if (!address.city) {
    throw new Error(
      "Delivery city is missing."
    );
  }

  if (!address.state) {
    throw new Error(
      "Delivery state is missing."
    );
  }

  const items =
    getOrderItems(order);

  if (!items.length) {
    throw new Error(
      "No products found in the order."
    );
  }

  const totals =
    getOrderTotals(
      order,
      items
    );

  const packageInfo =
    getPackageDetails(order);

  const websiteOrderId =
    clean(
      order.websiteOrderId ||
        order.orderId ||
        order.id
    );

  if (!websiteOrderId) {
    throw new Error(
      "Website order ID is missing."
    );
  }

  /*
    IMPORTANT:
    Shiprocket's order_id must be unique.
  */

  const shiprocketOrderId =
    websiteOrderId
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      )
      .slice(0, 40);

  const orderDate =
    order.createdAt
      ? new Date(
          order.createdAt
        )
          .toISOString()
          .slice(0, 19)
      : new Date()
          .toISOString()
          .slice(0, 19);

  const payload = {
    order_id:
      shiprocketOrderId,

    order_date:
      orderDate,

    pickup_location:
      getPickupLocation(),

    channel_id:
      "",

    comment:
      `LUXMO HUB Website Order ${websiteOrderId}`,

    billing_customer_name:
      address.name,

    billing_last_name:
      "",

    billing_address:
      address.line1,

    billing_address_2:
      address.line2,

    billing_isd_code:
      "91",

    billing_city:
      address.city,

    billing_pincode:
      address.pincode,

    billing_state:
      address.state,

    billing_country:
      "India",

    billing_email:
      address.email ||
      "support@luxmohub.in",

    billing_phone:
      address.phone,

    shipping_is_billing:
      true,

    shipping_customer_name:
      address.name,

    shipping_last_name:
      "",

    shipping_address:
      address.line1,

    shipping_address_2:
      address.line2,

    shipping_city:
      address.city,

    shipping_pincode:
      address.pincode,

    shipping_country:
      "India",

    shipping_state:
      address.state,

    shipping_email:
      address.email ||
      "support@luxmohub.in",

    shipping_phone:
      address.phone,

    order_items:
      items,

    payment_method:
      "Prepaid",

    shipping_charges:
      totals.shippingFee,

    giftwrap_charges:
      0,

    transaction_charges:
      0,

    total_discount:
      totals.discount,

    sub_total:
      totals.subtotal,

    length:
      packageInfo.length,

    breadth:
      packageInfo.breadth,

    height:
      packageInfo.height,

    weight:
      packageInfo.weight,
  };

  const data =
    await shiprocketRequest(
      "/orders/create/adhoc",
      token,
      {
        method: "POST",

        body: payload,
      }
    );

  return {
    data,
    payload,
  };
}

/* =========================================================
   GET SHIPMENT DETAILS
========================================================= */

async function getShipmentDetails(
  token,
  shipmentId
) {
  if (!shipmentId) {
    return {};
  }

  try {
    return await shiprocketRequest(
      `/shipments/${encodeURIComponent(
        shipmentId
      )}`,
      token,
      {
        method: "GET",
      }
    );
  } catch {
    return {};
  }
}

/* =========================================================
   ASSIGN AWB
========================================================= */

async function assignAwb(
  token,
  shipmentId,
  courierId
) {
  if (!shipmentId) {
    throw new Error(
      "Shipment ID is missing."
    );
  }

  const body = {
    shipment_id:
      Number(shipmentId),
  };

  if (
    courierId !== undefined &&
    courierId !== null &&
    String(courierId).trim()
  ) {
    body.courier_id =
      Number(courierId);
  }

  return await shiprocketRequest(
    "/courier/assign/awb",
    token,
    {
      method: "POST",

      body,
    }
  );
}

/* =========================================================
   EXTRACT RESPONSE
========================================================= */

function extractShipmentData(
  createData,
  shipmentDetails,
  awbData
) {
  const shipment =
    createData?.shipment ||
    createData?.data?.shipment ||
    createData?.response?.data ||
    {};

  const awbResponse =
    awbData?.response?.data ||
    awbData?.data ||
    awbData ||
    {};

  const details =
    shipmentDetails?.data ||
    shipmentDetails ||
    {};

  const shipmentId =
    createData?.shipment_id ||
    createData?.shipmentId ||
    createData?.data
      ?.shipment_id ||
    shipment?.shipment_id ||
    shipment?.id ||
    details?.shipment_id ||
    details?.id ||
    null;

  const orderId =
    createData?.order_id ||
    createData?.orderId ||
    createData?.data
      ?.order_id ||
    createData?.data
      ?.orderId ||
    null;

  const awb =
    awbResponse?.awb_code ||
    awbResponse?.awb ||
    awbResponse?.waybill ||
    shipment?.awb_code ||
    shipment?.awb ||
    details?.awb_code ||
    details?.awb ||
    null;

  const courier =
    awbResponse?.courier_name ||
    awbResponse?.courier ||
    shipment?.courier_name ||
    details?.courier_name ||
    null;

  const courierId =
    awbResponse?.courier_company_id ||
    awbResponse?.courier_id ||
    shipment?.courier_company_id ||
    null;

  const trackingUrl =
    createData?.tracking_url ||
    createData?.trackingUrl ||
    awbResponse?.tracking_url ||
    awbResponse?.trackingUrl ||
    details?.tracking_url ||
    details?.trackingUrl ||
    null;

  return {
    shipmentId,
    orderId,
    awb,
    courier,
    courierId,
    trackingUrl,
  };
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {
  if (
    req.method !== "POST"
  ) {
    res.setHeader(
      "Allow",
      "POST"
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

  try {
    const body =
      req.body || {};

    const order =
      body.order &&
      typeof body.order ===
        "object"
        ? body.order
        : body.orderData &&
          typeof body.orderData ===
            "object"
        ? body.orderData
        : null;

    if (!order) {
      return sendJson(
        res,
        400,
        {
          success: false,
          error:
            "Order data is required.",
        }
      );
    }

    /* =====================================================
       PAYMENT SAFETY
    ===================================================== */

    if (
      order.paymentVerified !==
      true
    ) {
      return sendJson(
        res,
        403,
        {
          success: false,
          error:
            "Payment is not verified. Shiprocket shipment creation blocked.",
        }
      );
    }

    const paymentStatus =
      clean(
        order.paymentStatus
      ).toLowerCase();

    if (
      paymentStatus !==
      "paid"
    ) {
      return sendJson(
        res,
        403,
        {
          success: false,
          error:
            "Order payment status is not Paid.",
        }
      );
    }

    /* =====================================================
       RAZORPAY IDs
    ===================================================== */

    const razorpayOrderId =
      clean(
        order.razorpayOrderId ||
          body.razorpay_order_id
      );

    const razorpayPaymentId =
      clean(
        order.razorpayPaymentId ||
          body.razorpay_payment_id
      );

    if (
      !razorpayOrderId ||
      !razorpayPaymentId
    ) {
      return sendJson(
        res,
        400,
        {
          success: false,
          error:
            "Verified Razorpay payment details are missing.",
        }
      );
    }

    /* =====================================================
       SHIPROCKET TOKEN
    ===================================================== */

    const token =
      await getShiprocketToken();

    /* =====================================================
       CREATE ORDER
    ===================================================== */

    const created =
      await createShiprocketOrder(
        token,
        order
      );

    const createData =
      created.data || {};

    /* =====================================================
       EXTRACT SHIPMENT
    ===================================================== */

    let shipmentInfo =
      extractShipmentData(
        createData,
        {},
        {}
      );

    /* =====================================================
       SHIPMENT ID CHECK
    ===================================================== */

    if (
      !shipmentInfo.shipmentId
    ) {
      return sendJson(
        res,
        502,
        {
          success: false,

          error:
            "Shiprocket order was created but shipment ID was not returned.",

          details:
            createData,
        }
      );
    }

    /* =====================================================
       FETCH SHIPMENT DETAILS
    ===================================================== */

    const shipmentDetails =
      await getShipmentDetails(
        token,
        shipmentInfo.shipmentId
      );

    shipmentInfo =
      extractShipmentData(
        createData,
        shipmentDetails,
        {}
      );

    /* =====================================================
       AWB
    ===================================================== */

    let awbData = {};

    if (
      !shipmentInfo.awb
    ) {
      /*
        Let Shiprocket choose the courier when courier ID
        is not supplied.

        If a preferred courier ID is configured, use it.
      */

      const configuredCourierId =
        clean(
          process.env
            .SHIPROCKET_COURIER_ID
        );

      awbData =
        await assignAwb(
          token,

          shipmentInfo.shipmentId,

          configuredCourierId
            ? configuredCourierId
            : undefined
        );

      shipmentInfo =
        extractShipmentData(
          createData,

          shipmentDetails,

          awbData
        );
    }

    /* =====================================================
       REFRESH SHIPMENT DETAILS
    ===================================================== */

    if (
      !shipmentInfo.awb ||
      !shipmentInfo.courier
    ) {
      const refreshed =
        await getShipmentDetails(
          token,
          shipmentInfo.shipmentId
        );

      shipmentInfo =
        extractShipmentData(
          createData,

          refreshed,

          awbData
        );
    }

    /* =====================================================
       TRACKING URL FALLBACK
    ===================================================== */

    let trackingUrl =
      shipmentInfo.trackingUrl ||
      "";

    if (
      !trackingUrl &&
      shipmentInfo.awb
    ) {
      trackingUrl =
        `https://shiprocket.co/tracking/${encodeURIComponent(
          shipmentInfo.awb
        )}`;
    }

    /* =====================================================
       FINAL VALIDATION
    ===================================================== */

    if (
      !shipmentInfo.shipmentId
    ) {
      return sendJson(
        res,
        502,
        {
          success: false,
          error:
            "Shiprocket shipment ID is missing.",
        }
      );
    }

    /*
      AWB may sometimes be assigned slightly after shipment
      creation. Do not fail the whole payment/order because
      of a temporary AWB delay.
    */

    return sendJson(
      res,
      200,
      {
        success: true,

        provider:
          "shiprocket",

        orderId:
          order.websiteOrderId ||
          order.orderId ||
          order.id ||
          createData.order_id ||
          createData.orderId ||
          null,

        shiprocketOrderId:
          createData.order_id ||
          createData.orderId ||
          null,

        shipmentId:
          shipmentInfo.shipmentId,

        shipment_id:
          shipmentInfo.shipmentId,

        awb:
          shipmentInfo.awb ||
          null,

        awbCode:
          shipmentInfo.awb ||
          null,

        courier:
          shipmentInfo.courier ||
          null,

        courier_name:
          shipmentInfo.courier ||
          null,

        courierId:
          shipmentInfo.courierId ||
          null,

        trackingUrl:
          trackingUrl ||
          null,

        tracking_url:
          trackingUrl ||
          null,

        paymentStatus:
          "Paid",

        paymentVerified:
          true,

        razorpayOrderId,

        razorpayPaymentId,

        message:
          shipmentInfo.awb
            ? "Shiprocket shipment created and AWB assigned successfully."
            : "Shiprocket shipment created successfully. AWB assignment is pending.",

        raw: {
          create:
            createData,

          awb:
            awbData,
        },
      }
    );
  } catch (error) {
    console.error(
      "LUXMO HUB Shiprocket error:",
      error
    );

    return sendJson(
      res,
      500,
      {
        success: false,

        provider:
          "shiprocket",

        error:
          error?.message ||
          "Shiprocket shipment creation failed.",
      }
    );
  }
}
