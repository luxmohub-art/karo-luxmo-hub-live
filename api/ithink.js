// api/ithink.js
// LUXMO HUB — iThink Logistics Shipment API
//
// Supports:
// 1. iThink Logistics authentication via access_token + secret_key
// 2. Prepaid shipment creation
// 3. Multiple products
// 4. Customer address
// 5. Shipping charges / discount
// 6. Pickup warehouse
// 7. AWB / waybill response
// 8. Tracking URL
// 9. Label / invoice URL extraction when returned by iThink
//
// IMPORTANT:
// This API is called only AFTER Razorpay payment is verified.
// Do not put iThink credentials in frontend code.

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

/* =========================================================
   HELPERS
========================================================= */

function clean(value) {
  return String(value ?? "").trim();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function positiveNumber(value, fallback) {
  const n = Number(value);

  return Number.isFinite(n) && n > 0
    ? n
    : fallback;
}

function normalizePhone(value) {
  const digits = clean(value).replace(
    /\D/g,
    ""
  );

  return digits.length > 10
    ? digits.slice(-10)
    : digits;
}

function normalizePincode(value) {
  return clean(value)
    .replace(/\D/g, "")
    .slice(0, 6);
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function formatDate(value) {
  const date = value
    ? new Date(value)
    : new Date();

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  }

  const pad = (n) =>
    String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
}

/* =========================================================
   ENVIRONMENT
========================================================= */

function getIThinkConfig() {
  const accessToken = clean(
    process.env.ITHINK_ACCESS_TOKEN ||
      process.env.ITHINK_ACCESS_KEY ||
      process.env.ITHINK_API_ACCESS_TOKEN
  );

  const secretKey = clean(
    process.env.ITHINK_SECRET_KEY ||
      process.env.ITHINK_API_SECRET_KEY
  );

  const pickupAddressId = clean(
    process.env.ITHINK_PICKUP_ADDRESS_ID ||
      process.env.ITHINK_PICKUP_ADDRESS
  );

  const logistics = clean(
    process.env.ITHINK_LOGISTICS ||
      ""
  );

  const serviceType = clean(
    process.env.ITHINK_SERVICE_TYPE ||
      "ground"
  );

  const orderType = clean(
    process.env.ITHINK_ORDER_TYPE ||
      ""
  );

  if (!accessToken) {
    throw new Error(
      "ITHINK_ACCESS_TOKEN is missing in Vercel Environment Variables."
    );
  }

  if (!secretKey) {
    throw new Error(
      "ITHINK_SECRET_KEY is missing in Vercel Environment Variables."
    );
  }

  if (!pickupAddressId) {
    throw new Error(
      "ITHINK_PICKUP_ADDRESS_ID is missing in Vercel Environment Variables."
    );
  }

  return {
    accessToken,
    secretKey,
    pickupAddressId,
    logistics,
    serviceType,
    orderType,
  };
}

/* =========================================================
   CUSTOMER ADDRESS
========================================================= */

function getAddress(order) {
  const shipping =
    order?.shippingAddress &&
    typeof order.shippingAddress ===
      "object"
      ? order.shippingAddress
      : order?.address &&
        typeof order.address ===
          "object"
      ? order.address
      : {};

  const customer =
    order?.customer &&
    typeof order.customer ===
      "object"
      ? order.customer
      : {};

  const name = clean(
    shipping.name ||
      customer.name ||
      order?.customerName ||
      order?.name
  );

  const phone = normalizePhone(
    shipping.phone ||
      customer.phone ||
      order?.phone ||
      order?.mobile
  );

  const email = normalizeEmail(
    shipping.email ||
      customer.email ||
      order?.email ||
      "support@luxmohub.in"
  );

  const address1 = clean(
    shipping.line1 ||
      shipping.address1 ||
      shipping.address ||
      order?.addressLine1 ||
      order?.address
  );

  const address2 = clean(
    shipping.line2 ||
      shipping.address2 ||
      order?.addressLine2 ||
      ""
  );

  const city = clean(
    shipping.city ||
      order?.city
  );

  const state = clean(
    shipping.state ||
      shipping.stateName ||
      order?.state
  );

  const pincode =
    normalizePincode(
      shipping.pincode ||
        shipping.postalCode ||
        shipping.zip ||
        order?.pincode
    );

  return {
    name,
    phone,
    email,
    address1,
    address2,
    city,
    state,
    pincode,
  };
}

/* =========================================================
   ORDER ITEMS
========================================================= */

function getItems(order) {
  const items =
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

  return items.map(
    (item, index) => {
      const quantity = Math.max(
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
        toNumber(
          item?.price ??
            item?.salePrice ??
            item?.sellingPrice ??
            item?.selling_price ??
            item?.amount ??
            0
        );

      const sku = clean(
        item?.sku ||
          item?.productSku ||
          item?.id ||
          `LUXMO-${index + 1}`
      );

      const title = clean(
        item?.title ||
          item?.name ||
          item?.productName ||
          `LUXMO HUB Product ${index + 1}`
      );

      return {
        product_name:
          title,

        product_sku:
          sku,

        product_quantity:
          String(quantity),

        product_price:
          String(
            Math.max(
              0,
              price
            )
          ),

        product_tax_rate:
          String(
            toNumber(
              item?.tax ??
                item?.gstRate ??
                0
            )
          ),

        product_hsn_code:
          clean(
            item?.hsn ||
              item?.hsnCode ||
              ""
          ),

        product_discount:
          String(
            toNumber(
              item?.discount ||
                0
            )
          ),

        product_img_url:
          clean(
            item?.image ||
              item?.imageUrl ||
              ""
          ),
      };
    }
  );
}

/* =========================================================
   TOTALS
========================================================= */

function getTotals(
  order,
  items
) {
  let subtotal = toNumber(
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
        toNumber(
          item.product_price
        ) *
          toNumber(
            item.product_quantity,
            1
          ),
      0
    );
  }

  const discount =
    Math.max(
      0,
      toNumber(
        order?.discount ||
          order?.totalDiscount ||
          order?.total_discount ||
          0
      )
    );

  const shipping =
    Math.max(
      0,
      toNumber(
        order?.shippingFee ??
          order?.shippingCharges ??
          order?.shippingCost ??
          0
      )
    );

  const total =
    Math.max(
      0,
      toNumber(
        order?.total ??
          order?.grandTotal ??
          order?.amount,
        subtotal -
          discount +
          shipping
      )
    );

  return {
    subtotal,
    discount,
    shipping,
    total,
  };
}

/* =========================================================
   PACKAGE
========================================================= */

function getPackage(order) {
  return {
    length: positiveNumber(
      order?.length ||
        order?.packageLength,
      20
    ),

    width: positiveNumber(
      order?.width ||
        order?.breadth ||
        order?.packageWidth,
      15
    ),

    height: positiveNumber(
      order?.height ||
        order?.packageHeight,
      10
    ),

    weight: positiveNumber(
      order?.weight ||
        order?.packageWeight ||
        order?.totalWeight,
      0.5
    ),
  };
}

/* =========================================================
   BUILD iTHINK V3 PAYLOAD
========================================================= */

function buildPayload(
  order,
  config
) {
  const address =
    getAddress(order);

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
    getItems(order);

  if (!items.length) {
    throw new Error(
      "No products found in the order."
    );
  }

  const totals =
    getTotals(
      order,
      items
    );

  const packageInfo =
    getPackage(order);

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
    iThink order number should be unique.
  */
  const orderNumber =
    websiteOrderId
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      )
      .slice(0, 40);

  /*
    Prepaid order:
    COD amount MUST remain 0.
  */
  const shipment = {
    waybill: "",

    order:
      orderNumber,

    sub_order:
      "",

    order_date:
      formatDate(
        order.createdAt
      ),

    total_amount:
      String(
        totals.total
      ),

    name:
      address.name,

    company_name:
      "LUXMO HUB",

    add:
      address.address1,

    add2:
      address.address2,

    add3:
      "",

    pin:
      address.pincode,

    city:
      address.city,

    state:
      address.state,

    country:
      "India",

    phone:
      address.phone,

    alt_phone:
      "",

    email:
      address.email,

    is_billing_same_as_shipping:
      "yes",

    billing_name:
      address.name,

    billing_company_name:
      "LUXMO HUB",

    billing_add:
      address.address1,

    billing_add2:
      address.address2,

    billing_add3:
      "",

    billing_pin:
      address.pincode,

    billing_city:
      address.city,

    billing_state:
      address.state,

    billing_country:
      "India",

    billing_phone:
      address.phone,

    billing_alt_phone:
      "",

    billing_email:
      address.email,

    products:
      items,

    shipment_length:
      String(
        packageInfo.length
      ),

    shipment_width:
      String(
        packageInfo.width
      ),

    shipment_height:
      String(
        packageInfo.height
      ),

    weight:
      String(
        packageInfo.weight
      ),

    shipping_charges:
      String(
        totals.shipping
      ),

    giftwrap_charges:
      "0",

    transaction_charges:
      "0",

    total_discount:
      String(
        totals.discount
      ),

    first_attemp_discount:
      "0",

    /*
      IMPORTANT:
      This is a prepaid Razorpay order.
    */
    cod_amount:
      "0",

    payment_mode:
      "Prepaid",

    reseller_name:
      "LUXMO HUB",

    eway_bill_number:
      clean(
        order.ewayBillNumber ||
          ""
      ),

    gst_number:
      clean(
        order.gstin ||
          order.customerGstin ||
          ""
      ),

    what3words:
      "",

    return_address_id:
      config.pickupAddressId,
  };

  return {
    data: {
      shipments: [
        shipment,
      ],

      pickup_address_id:
        config.pickupAddressId,

      access_token:
        config.accessToken,

      secret_key:
        config.secretKey,

      /*
        Optional logistics value.
        If not configured, iThink can use its
        configured/default routing.
      */
      ...(config.logistics
        ? {
            logistics:
              config.logistics,
          }
        : {}),

      s_type:
        config.serviceType,

      order_type:
        config.orderType,
    },
  };
}

/* =========================================================
   RESPONSE EXTRACTION
========================================================= */

function extractResponse(
  data
) {
  const root =
    data?.data ||
    data?.response ||
    data ||
    {};

  const shipments =
    Array.isArray(
      root?.shipments
    )
      ? root.shipments
      : Array.isArray(
          data?.shipments
        )
      ? data.shipments
      : [];

  const first =
    shipments[0] ||
    root?.shipment ||
    {};

  const awb =
    clean(
      first?.waybill ||
        first?.awb ||
        first?.awb_number ||
        first?.airway_bill_no ||
        root?.waybill ||
        root?.awb ||
        root?.awb_number ||
        root?.airway_bill_no ||
        data?.waybill ||
        data?.awb ||
        data?.awb_number ||
        data?.airway_bill_no
    );

  const orderId =
    clean(
      first?.order ||
        first?.order_id ||
        root?.order ||
        root?.order_id ||
        data?.order ||
        data?.order_id
    );

  const shipmentId =
    clean(
      first?.shipment_id ||
        first?.shipmentId ||
        root?.shipment_id ||
        root?.shipmentId ||
        data?.shipment_id ||
        data?.shipmentId ||
        awb
    );

  const courier =
    clean(
      first?.logistics ||
        first?.courier ||
        first?.courier_name ||
        root?.logistics ||
        root?.courier ||
        root?.courier_name ||
        data?.logistics ||
        data?.courier ||
        data?.courier_name
    );

  const trackingUrl =
    clean(
      first?.tracking_url ||
        first?.trackingUrl ||
        root?.tracking_url ||
        root?.trackingUrl ||
        data?.tracking_url ||
        data?.trackingUrl
    );

  const labelUrl =
    clean(
      first?.label_url ||
        first?.labelUrl ||
        root?.label_url ||
        root?.labelUrl ||
        data?.label_url ||
        data?.labelUrl
    );

  const invoiceUrl =
    clean(
      first?.invoice_url ||
        first?.invoiceUrl ||
        root?.invoice_url ||
        root?.invoiceUrl ||
        data?.invoice_url ||
        data?.invoiceUrl
    );

  const status =
    clean(
      data?.status ||
        root?.status ||
        first?.status
    );

  return {
    awb,
    orderId,
    shipmentId,
    courier,
    trackingUrl,
    labelUrl,
    invoiceUrl,
    status,
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
      body?.order &&
      typeof body.order ===
        "object"
        ? body.order
        : body?.orderData &&
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
       PAYMENT SECURITY
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
            "Payment is not verified. iThink shipment creation is blocked.",
        }
      );
    }

    if (
      clean(
        order.paymentStatus
      ).toLowerCase() !==
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
       CONFIG
    ===================================================== */

    const config =
      getIThinkConfig();

    /* =====================================================
       BUILD REQUEST
    ===================================================== */

    const payload =
      buildPayload(
        order,
        config
      );

    /* =====================================================
       PRODUCTION ENDPOINT
       iThink Logistics V3
    ===================================================== */

    const response =
      await fetch(
        "https://my.ithinklogistics.com/api_v3/order/add.json",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

    const data =
      await response
        .json()
        .catch(() => ({}));

    /* =====================================================
       ERROR
    ===================================================== */

    if (!response.ok) {
      return sendJson(
        res,
        502,
        {
          success: false,

          provider:
            "ithink",

          error:
            data?.message ||
            data?.error ||
            `iThink Logistics API returned HTTP ${response.status}.`,

          details:
            data || null,
        }
      );
    }

    const extracted =
      extractResponse(data);

    /* =====================================================
       iTHINK ERROR RESPONSE
    ===================================================== */

    const apiStatus =
      clean(
        extracted.status
      ).toLowerCase();

    if (
      apiStatus ===
        "error" ||
      apiStatus ===
        "failed" ||
      apiStatus ===
        "failure"
    ) {
      return sendJson(
        res,
        502,
        {
          success: false,

          provider:
            "ithink",

          error:
            data?.message ||
            data?.error ||
            "iThink Logistics rejected the shipment.",

          details:
            data,
        }
      );
    }

    /* =====================================================
       TRACKING FALLBACK
    ===================================================== */

    let trackingUrl =
      extracted.trackingUrl ||
      "";

    if (
      !trackingUrl &&
      extracted.awb
    ) {
      /*
        iThink's tracking page URL can vary by account.
        Allow an environment override instead of hard-coding
        an account-specific URL.
      */
      const template =
        clean(
          process.env
            .ITHINK_TRACKING_URL_TEMPLATE
        );

      if (template) {
        trackingUrl =
          template.replace(
            "{awb}",
            encodeURIComponent(
              extracted.awb
            )
          );
      }
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return sendJson(
      res,
      200,
      {
        success: true,

        provider:
          "ithink",

        orderId:
          order.websiteOrderId ||
          order.orderId ||
          order.id ||
          extracted.orderId ||
          null,

        logisticsOrderId:
          extracted.orderId ||
          null,

        shipmentId:
          extracted.shipmentId ||
          null,

        shipment_id:
          extracted.shipmentId ||
          null,

        awb:
          extracted.awb ||
          null,

        awbCode:
          extracted.awb ||
          null,

        courier:
          extracted.courier ||
          null,

        courier_name:
          extracted.courier ||
          null,

        trackingUrl:
          trackingUrl ||
          null,

        tracking_url:
          trackingUrl ||
          null,

        labelUrl:
          extracted.labelUrl ||
          null,

        invoiceUrl:
          extracted.invoiceUrl ||
          null,

        paymentStatus:
          "Paid",

        paymentVerified:
          true,

        razorpayOrderId,

        razorpayPaymentId,

        message:
          extracted.awb
            ? "iThink Logistics shipment created successfully."
            : "iThink Logistics accepted the order. AWB is pending.",

        raw:
          data,
      }
    );
  } catch (error) {
    console.error(
      "LUXMO HUB iThink Logistics error:",
      error
    );

    return sendJson(
      res,
      500,
      {
        success: false,

        provider:
          "ithink",

        error:
          error?.message ||
          "iThink Logistics shipment creation failed.",
      }
    );
  }
}
