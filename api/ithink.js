// api/ithink.js
// LUXMO HUB
// iThink Logistics
// ORDER -> SHIPMENT -> AWB -> LABEL -> TRACKING

const BASE =
  "https://my.ithinklogistics.com/api_v3";

/* =========================================================
   HELPERS
========================================================= */

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function clean(value) {
  return String(value ?? "").trim();
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n)
    ? n
    : fallback;
}

function positive(value, fallback = 1) {
  const n = Number(value);

  return Number.isFinite(n) && n > 0
    ? n
    : fallback;
}

function phone(value) {
  const digits =
    clean(value).replace(/\D/g, "");

  return digits.length > 10
    ? digits.slice(-10)
    : digits;
}

function pincode(value) {
  return clean(value)
    .replace(/\D/g, "")
    .slice(0, 6);
}

function email(value) {
  return clean(value).toLowerCase();
}

/* =========================================================
   CONFIG
========================================================= */

function getConfig() {
  const accessToken =
    clean(
      process.env.ITHINK_ACCESS_TOKEN ||
      process.env.ITHINK_ACCESS_KEY ||
      process.env.ITHINK_API_ACCESS_TOKEN
    );

  const secretKey =
    clean(
      process.env.ITHINK_SECRET_KEY ||
      process.env.ITHINK_API_SECRET_KEY
    );

  const pickupAddressId =
    clean(
      process.env.ITHINK_PICKUP_ADDRESS_ID ||
      process.env.ITHINK_PICKUP_ADDRESS
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

    logistics:
      clean(
        process.env.ITHINK_LOGISTICS
      ),

    serviceType:
      clean(
        process.env.ITHINK_SERVICE_TYPE ||
        "ground"
      ),

    orderType:
      clean(
        process.env.ITHINK_ORDER_TYPE
      ),
  };
}

/* =========================================================
   API REQUEST
========================================================= */

async function request(
  path,
  body
) {
  const response =
    await fetch(
      `${BASE}${path}`,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-cache",
        },

        body:
          JSON.stringify(body),
      }
    );

  const text =
    await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = {
      raw: text,
    };
  }

  if (!response.ok) {
    const details =
      data?.message ||
      data?.error ||
      data?.errors ||
      data?.raw ||
      data;

    const error =
      new Error(
        typeof details === "string"
          ? details
          : JSON.stringify(details)
      );

    error.status =
      response.status;

    error.data = data;

    throw error;
  }

  return data;
}

/* =========================================================
   ADDRESS
========================================================= */

function getAddress(order) {
  const address =
    order?.shippingAddress ||
    order?.address ||
    order?.deliveryAddress ||
    {};

  const customer =
    order?.customer || {};

  return {
    name:
      clean(
        address.name ||
        customer.name ||
        order?.customerName ||
        order?.name
      ),

    phone:
      phone(
        address.phone ||
        customer.phone ||
        order?.phone ||
        order?.mobile ||
        order?.mobileNumber
      ),

    email:
      email(
        address.email ||
        customer.email ||
        order?.email ||
        "support@luxmohub.in"
      ),

    line1:
      clean(
        address.line1 ||
        address.address1 ||
        address.address ||
        order?.addressLine1 ||
        order?.address
      ),

    line2:
      clean(
        address.line2 ||
        address.address2 ||
        order?.addressLine2 ||
        ""
      ),

    city:
      clean(
        address.city ||
        order?.city ||
        order?.district
      ),

    state:
      clean(
        address.state ||
        address.stateName ||
        order?.state ||
        order?.stateName
      ),

    pincode:
      pincode(
        address.pincode ||
        address.postalCode ||
        address.zip ||
        order?.pincode ||
        order?.postalCode
      ),
  };
}

/* =========================================================
   ITEMS
========================================================= */

function getItems(order) {
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
    (item, index) => ({
      product_name:
        clean(
          item?.title ||
          item?.name ||
          item?.productName ||
          `LUXMO HUB Product ${index + 1}`
        ),

      product_sku:
        clean(
          item?.sku ||
          item?.productSku ||
          item?.id ||
          `LUXMO-${index + 1}`
        ),

      product_quantity:
        String(
          Math.max(
            1,
            Math.floor(
              positive(
                item?.qty ??
                item?.quantity ??
                1,
                1
              )
            )
          )
        ),

      product_price:
        String(
          Math.max(
            0,
            num(
              item?.price ??
              item?.salePrice ??
              item?.sellingPrice ??
              item?.selling_price ??
              item?.amount,
              0
            )
          )
        ),

      product_tax_rate:
        String(
          Math.max(
            0,
            num(
              item?.tax ??
              item?.gstRate,
              0
            )
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
          Math.max(
            0,
            num(
              item?.discount,
              0
            )
          )
        ),

      product_img_url:
        clean(
          item?.image ||
          item?.imageUrl ||
          ""
        ),
    })
  );
}

/* =========================================================
   TOTALS
========================================================= */

function getTotals(
  order,
  items
) {
  let subtotal =
    num(
      order?.subtotal,
      NaN
    );

  if (
    !Number.isFinite(subtotal)
  ) {
    subtotal =
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          num(
            item.product_price,
            0
          ) *
          num(
            item.product_quantity,
            1
          ),
        0
      );
  }

  const discount =
    Math.max(
      0,
      num(
        order?.discount ??
        order?.totalDiscount ??
        order?.total_discount,
        0
      )
    );

  const shipping =
    Math.max(
      0,
      num(
        order?.shippingFee ??
        order?.shippingCharges ??
        order?.shippingCost,
        0
      )
    );

  const total =
    Math.max(
      0,
      num(
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
    length:
      positive(
        order?.length ||
        order?.packageLength,
        20
      ),

    width:
      positive(
        order?.width ||
        order?.breadth ||
        order?.packageWidth,
        15
      ),

    height:
      positive(
        order?.height ||
        order?.packageHeight,
        10
      ),

    weight:
      positive(
        order?.weight ||
        order?.packageWeight ||
        order?.totalWeight,
        0.5
      ),
  };
}

/* =========================================================
   COD
========================================================= */

function isCOD(order) {
  const method =
    clean(
      order?.paymentMethod ||
      order?.payment_method ||
      order?.paymentMode ||
      order?.payment_mode
    ).toLowerCase();

  return (
    method === "cod" ||
    method === "cash on delivery" ||
    method === "cash_on_delivery" ||
    method === "cash-on-delivery" ||
    order?.isCOD === true ||
    order?.isCod === true
  );
}

/* =========================================================
   PAYLOAD
========================================================= */

function buildPayload(
  order,
  cfg
) {
  const address =
    getAddress(order);

  const items =
    getItems(order);

  if (!address.name) {
    throw new Error(
      "Customer name is missing."
    );
  }

  if (
    address.phone.length !== 10
  ) {
    throw new Error(
      "Valid 10-digit customer mobile number is required."
    );
  }

  if (
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

  if (!address.line1) {
    throw new Error(
      "Delivery address is missing."
    );
  }

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

  const pkg =
    getPackage(order);

  const websiteOrderId =
    clean(
      order?.websiteOrderId ||
      order?.orderId ||
      order?.id
    );

  if (!websiteOrderId) {
    throw new Error(
      "Website order ID is missing."
    );
  }

  const createdAt =
    order?.createdAt
      ? new Date(
          order.createdAt
        )
      : new Date();

  const orderDate =
    Number.isNaN(
      createdAt.getTime()
    )
      ? new Date()
          .toISOString()
          .slice(0, 19)
          .replace(
            "T",
            " "
          )
      : createdAt
          .toISOString()
          .slice(0, 19)
          .replace(
            "T",
            " "
          );

  const cod =
    isCOD(order);

  const shipment = {
    waybill:
      "",

    order:
      websiteOrderId
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        )
        .slice(0, 40),

    sub_order:
      "",

    order_date:
      orderDate,

    total_amount:
      String(
        totals.total
      ),

    name:
      address.name,

    company_name:
      "LUXMO HUB",

    add:
      address.line1,

    add2:
      address.line2,

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
      address.line1,

    billing_add2:
      address.line2,

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
        pkg.length
      ),

    shipment_width:
      String(
        pkg.width
      ),

    shipment_height:
      String(
        pkg.height
      ),

    weight:
      String(
        pkg.weight
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

    cod_amount:
      cod
        ? String(
            totals.total
          )
        : "0",

    payment_mode:
      cod
        ? "COD"
        : "Prepaid",

    reseller_name:
      "LUXMO HUB",

    eway_bill_number:
      clean(
        order?.ewayBillNumber ||
        ""
      ),

    gst_number:
      clean(
        order?.gstin ||
        order?.customerGstin ||
        ""
      ),

    what3words:
      "",

    return_address_id:
      cfg.pickupAddressId,
  };

  return {
    data: {
      shipments: [
        shipment,
      ],

      pickup_address_id:
        cfg.pickupAddressId,

      access_token:
        cfg.accessToken,

      secret_key:
        cfg.secretKey,

      ...(cfg.logistics
        ? {
            logistics:
              cfg.logistics,
          }
        : {}),

      s_type:
        cfg.serviceType,

      order_type:
        cfg.orderType,
    },
  };
}

/* =========================================================
   DEEP FIND
========================================================= */

function deepFind(
  value,
  keys,
  depth = 0
) {
  if (
    value == null ||
    depth > 12 ||
    typeof value !== "object"
  ) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found =
        deepFind(
          item,
          keys,
          depth + 1
        );

      if (
        found != null &&
        String(found).trim()
      ) {
        return found;
      }
    }

    return null;
  }

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        value,
        key
      )
    ) {
      const candidate =
        value[key];

      if (
        candidate != null &&
        String(candidate).trim()
      ) {
        return candidate;
      }
    }
  }

  for (
    const child of
    Object.values(value)
  ) {
    const found =
      deepFind(
        child,
        keys,
        depth + 1
      );

    if (
      found != null &&
      String(found).trim()
    ) {
      return found;
    }
  }

  return null;
}

/* =========================================================
   EXTRACT RESPONSE
========================================================= */

function extract(data) {
  return {
    awb:
      deepFind(
        data,
        [
          "waybill",
          "awb",
          "awb_number",
          "airway_bill_no",
          "airwaybill",
          "awbCode",
        ]
      ),

    orderId:
      deepFind(
        data,
        [
          "order",
          "order_id",
          "orderId",
        ]
      ),

    shipmentId:
      deepFind(
        data,
        [
          "shipment_id",
          "shipmentId",
        ]
      ),

    courier:
      deepFind(
        data,
        [
          "logistics",
          "courier",
          "courier_name",
          "courierName",
        ]
      ),

    trackingUrl:
      deepFind(
        data,
        [
          "tracking_url",
          "trackingUrl",
        ]
      ),

    labelUrl:
      deepFind(
        data,
        [
          "label_url",
          "labelUrl",
          "file_name",
          "pdf_url",
          "url",
        ]
      ),

    status:
      clean(
        deepFind(
          data,
          ["status"]
        ) || ""
      ).toLowerCase(),

    message:
      deepFind(
        data,
        [
          "message",
          "error",
          "errors",
        ]
      ),
  };
}

/* =========================================================
   CREATE SHIPMENT
========================================================= */

async function createShipment(
  order,
  cfg
) {
  return request(
    "/order/add.json",
    buildPayload(
      order,
      cfg
    )
  );
}

/* =========================================================
   GENERATE LABEL
========================================================= */

async function generateLabel(
  awb,
  cfg
) {
  return request(
    "/shipping/label.json",
    {
      data: {
        access_token:
          cfg.accessToken,

        secret_key:
          cfg.secretKey,

        awb_numbers:
          String(awb),

        page_size:
          clean(
            process.env
              .ITHINK_LABEL_PAGE_SIZE ||
            "A4"
          ),

        display_cod_prepaid:
          "1",

        display_shipper_mobile:
          "1",

        display_shipper_address:
          "1",
      },
    }
  );
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
       RAZORPAY
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
       WEBSITE ORDER ID
    ===================================================== */

    const websiteOrderId =
      clean(
        order.websiteOrderId ||
        order.orderId ||
        order.id
      );

    if (!websiteOrderId) {
      return sendJson(
        res,
        400,
        {
          success: false,
          error:
            "Website order ID is missing.",
        }
      );
    }

    /* =====================================================
       CONFIG
    ===================================================== */

    const cfg =
      getConfig();

    /* =====================================================
       CREATE iTHINK SHIPMENT
    ===================================================== */

    let createResponse;

    try {
      createResponse =
        await createShipment(
          order,
          cfg
        );
    } catch (
      createError
    ) {
      return sendJson(
        res,
        Number(
          createError?.status
        ) || 502,
        {
          success: false,

          provider:
            "ithink",

          stage:
            "shipment_creation",

          retryable:
            true,

          error:
            createError?.message ||
            "iThink Logistics shipment creation failed.",

          orderId:
            websiteOrderId,

          details:
            createError?.data ||
            null,
        }
      );
    }

    /* =====================================================
       EXTRACT SHIPMENT
    ===================================================== */

    const info =
      extract(
        createResponse
      );

    /* =====================================================
       AWB CHECK
    ===================================================== */

    if (!info.awb) {
      return sendJson(
        res,
        502,
        {
          success: false,

          provider:
            "ithink",

          stage:
            "awb_assignment",

          retryable:
            true,

          error:
            "iThink accepted the shipment/order but did not return an AWB. Label generation cannot continue until iThink provides an AWB.",

          orderId:
            websiteOrderId,

          logisticsOrderId:
            info.orderId ||
            null,

          shipmentId:
            info.shipmentId ||
            null,

          details:
            createResponse,
        }
      );
    }

    /* =====================================================
       GENERATE LABEL
    ===================================================== */

    let labelResponse =
      {};

    let labelInfo =
      {};

    try {
      labelResponse =
        await generateLabel(
          info.awb,
          cfg
        );

      labelInfo =
        extract(
          labelResponse
        );
    } catch (
      labelError
    ) {
      /*
        Shipment + AWB already exist.
        Do not mark payment/order failed
        only because label generation failed.
      */

      const trackingTemplate =
        clean(
          process.env
            .ITHINK_TRACKING_URL_TEMPLATE
        );

      const trackingUrl =
        info.trackingUrl ||
        (
          trackingTemplate &&
          info.awb
            ? trackingTemplate.replace(
                "{awb}",
                encodeURIComponent(
                  String(
                    info.awb
                  )
                )
              )
            : null
        );

      return sendJson(
        res,
        200,
        {
          success: true,

          provider:
            "ithink",

          orderId:
            websiteOrderId,

          logisticsOrderId:
            info.orderId ||
            null,

          shipmentId:
            info.shipmentId ||
            null,

          shipment_id:
            info.shipmentId ||
            null,

          awb:
            info.awb,

          awbCode:
            info.awb,

          courier:
            info.courier ||
            null,

          courier_name:
            info.courier ||
            null,

          trackingUrl,

          tracking_url:
            trackingUrl,

          labelUrl:
            null,

          label_url:
            null,

          labelReady:
            false,

          shipmentReady:
            true,

          paymentStatus:
            "Paid",

          paymentVerified:
            true,

          razorpayOrderId,

          razorpayPaymentId,

          documentError:
            labelError?.message ||
            "iThink shipping label generation is pending.",

          message:
            "iThink shipment and AWB are ready. Shipping label can be generated later.",

          raw: {
            create:
              createResponse,

            labelError:
              labelError?.data ||
              null,
          },
        }
      );
    }

    /* =====================================================
       TRACKING
    ===================================================== */

    const trackingTemplate =
      clean(
        process.env
          .ITHINK_TRACKING_URL_TEMPLATE
      );

    const trackingUrl =
      info.trackingUrl ||
      (
        trackingTemplate &&
        info.awb
          ? trackingTemplate.replace(
              "{awb}",
              encodeURIComponent(
                String(
                  info.awb
                )
              )
            )
          : null
      );

    /* =====================================================
       FINAL LABEL
    ===================================================== */

    const finalLabelUrl =
      labelInfo.labelUrl ||
      info.labelUrl ||
      null;

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
          websiteOrderId,

        logisticsOrderId:
          info.orderId ||
          null,

        shipmentId:
          info.shipmentId ||
          null,

        shipment_id:
          info.shipmentId ||
          null,

        awb:
          info.awb,

        awbCode:
          info.awb,

        courier:
          info.courier ||
          null,

        courier_name:
          info.courier ||
          null,

        trackingUrl,

        tracking_url:
          trackingUrl,

        labelUrl:
          finalLabelUrl,

        label_url:
          finalLabelUrl,

        labelReady:
          Boolean(
            finalLabelUrl
          ),

        shipmentReady:
          true,

        paymentStatus:
          "Paid",

        paymentVerified:
          true,

        razorpayOrderId,

        razorpayPaymentId,

        message:
          finalLabelUrl
            ? "iThink shipment, AWB and shipping label generated successfully."
            : "iThink shipment and AWB created, but label URL was not returned.",

        raw: {
          create:
            createResponse,

          label:
            labelResponse,
        },
      }
    );
  } catch (error) {
    console.error(
      "LUXMO HUB iThink Logistics error:",
      error
    );

    return sendJson(
      res,
      Number(
        error?.status
      ) >= 400
        ? Number(
            error.status
          )
        : 500,
      {
        success: false,

        provider:
          "ithink",

        error:
          error?.message ||
          "iThink Logistics shipment creation failed.",

        details:
          error?.data ||
          null,
      }
    );
  }
}
