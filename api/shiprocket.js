// api/shiprocket.js
// LUXMO HUB — Shiprocket Order + Shipment + AWB + Label

const BASE =
  "https://apiv2.shiprocket.in/v1/external";

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function clean(value) {
  return String(value ?? "").trim();
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function positive(value, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function phone(value) {
  const digits = clean(value).replace(/\D/g, "");
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

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

// =========================================================
// SHIPROCKET LOGIN
// =========================================================

async function getToken() {
  const loginEmail = clean(
    process.env.SHIPROCKET_EMAIL
  );

  const password = clean(
    process.env.SHIPROCKET_PASSWORD
  );

  if (!loginEmail || !password) {
    throw new Error(
      "Shiprocket credentials missing. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in Vercel."
    );
  }

  const response = await fetch(
    `${BASE}/auth/login`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: loginEmail,
        password,
      }),
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !data?.token) {
    const details =
      data?.message ||
      data?.error ||
      data?.errors ||
      data;

    throw new Error(
      typeof details === "string"
        ? details
        : JSON.stringify(details)
    );
  }

  return data.token;
}

// =========================================================
// SHIPROCKET REQUEST
// =========================================================

async function request(
  endpoint,
  token,
  options = {}
) {
  const response = await fetch(
    `${BASE}${endpoint}`,
    {
      method:
        options.method || "POST",

      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },

      ...(options.body !== undefined
        ? {
            body: JSON.stringify(
              options.body
            ),
          }
        : {}),
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
      data?.errors ??
      data?.error ??
      data?.message ??
      data?.raw ??
      data;

    const message =
      typeof details === "string"
        ? details
        : JSON.stringify(details);

    const error = new Error(
      message ||
        `Shiprocket API failed with HTTP ${response.status}.`
    );

    error.status =
      response.status;

    error.data = data;

    throw error;
  }

  return data;
}

// =========================================================
// ADDRESS
// =========================================================

function getAddress(order) {
  const address =
    order?.shippingAddress ||
    order?.address ||
    order?.deliveryAddress ||
    {};

  const customer =
    order?.customer || {};

  return {
    name: clean(
      address.name ||
        customer.name ||
        order?.customerName ||
        order?.name
    ),

    phone: phone(
      address.phone ||
        customer.phone ||
        order?.phone ||
        order?.mobile
    ),

    email: email(
      address.email ||
        customer.email ||
        order?.email ||
        "support@luxmohub.in"
    ),

    line1: clean(
      address.line1 ||
        address.address1 ||
        address.street ||
        address.address ||
        order?.addressLine1 ||
        order?.address
    ),

    line2: clean(
      address.line2 ||
        address.address2 ||
        order?.addressLine2 ||
        ""
    ),

    city: clean(
      address.city ||
        order?.city
    ),

    state: clean(
      address.state ||
        address.stateName ||
        order?.state
    ),

    pincode: pincode(
      address.pincode ||
        address.postalCode ||
        address.zip ||
        order?.pincode
    ),
  };
}

// =========================================================
// ITEMS
// =========================================================

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
      name: clean(
        item?.title ||
          item?.name ||
          item?.productName ||
          `LUXMO HUB Product ${index + 1}`
      ),

      sku: clean(
        item?.sku ||
          item?.productSku ||
          item?.id ||
          `LUXMO-${index + 1}`
      ),

      units: Math.max(
        1,
        Math.floor(
          positive(
            item?.qty ??
              item?.quantity ??
              1,
            1
          )
        )
      ),

      selling_price:
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
        ),

      discount:
        Math.max(
          0,
          num(
            item?.discount,
            0
          )
        ),

      tax:
        Math.max(
          0,
          num(
            item?.tax ??
              item?.gstRate,
            0
          )
        ),

      hsn: clean(
        item?.hsn ||
          item?.hsnCode ||
          ""
      ),
    })
  );
}

// =========================================================
// TOTALS
// =========================================================

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
    !Number.isFinite(
      subtotal
    )
  ) {
    subtotal =
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.selling_price *
            item.units,
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

  const shippingFee =
    Math.max(
      0,
      num(
        order?.shippingFee ??
          order?.shippingCharges ??
          order?.shippingCost,
        0
      )
    );

  const calculated =
    Math.max(
      0,
      subtotal -
        discount +
        shippingFee
    );

  const total =
    Math.max(
      0,
      num(
        order?.total ??
          order?.grandTotal ??
          order?.amount,
        calculated
      )
    );

  return {
    subtotal,
    discount,
    shippingFee,
    total,
  };
}

// =========================================================
// PACKAGE
// =========================================================

function getPackage(order) {
  return {
    weight: positive(
      order?.weight ||
        order?.packageWeight ||
        order?.totalWeight,
      0.5
    ),

    length: positive(
      order?.length ||
        order?.packageLength,
      20
    ),

    breadth: positive(
      order?.breadth ||
        order?.width ||
        order?.packageWidth,
      15
    ),

    height: positive(
      order?.height ||
        order?.packageHeight,
      10
    ),
  };
}

// =========================================================
// COD / PREPAID
// =========================================================

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
    method ===
      "cash on delivery" ||
    method ===
      "cash_on_delivery" ||
    method ===
      "cash-on-delivery" ||
    order?.isCOD === true ||
    order?.isCod === true
  );
}

// =========================================================
// CREATE ORDER PAYLOAD
// =========================================================

function buildOrderPayload(order) {
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
          .slice(0, 16)
          .replace(
            "T",
            " "
          )
      : createdAt
          .toISOString()
          .slice(0, 16)
          .replace(
            "T",
            " "
          );

  const cod =
    isCOD(order);

  return {
    order_id:
      websiteOrderId
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        )
        .slice(0, 50),

    order_date:
      orderDate,

    pickup_location:
      clean(
        process.env
          .SHIPROCKET_PICKUP_LOCATION ||
          "Primary"
      ),

    channel_id: "",

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
      cod
        ? "COD"
        : "Prepaid",

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
      pkg.length,

    breadth:
      pkg.breadth,

    height:
      pkg.height,

    weight:
      pkg.weight,

    ...(cod
      ? {
          cod_amount:
            totals.total,
        }
      : {}),
  };
}

// =========================================================
// DEEP FIND
// =========================================================

function deepFind(
  value,
  keys,
  depth = 0
) {
  if (
    value == null ||
    depth > 10 ||
    typeof value !==
      "object"
  ) {
    return null;
  }

  if (
    Array.isArray(value)
  ) {
    for (
      const item of value
    ) {
      const found =
        deepFind(
          item,
          keys,
          depth + 1
        );

      if (
        found !== null &&
        String(found).trim()
      ) {
        return found;
      }
    }

    return null;
  }

  for (
    const key of keys
  ) {
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
      found !== null &&
      String(found).trim()
    ) {
      return found;
    }
  }

  return null;
}

// =========================================================
// SHIPMENT DATA
// =========================================================

function extractShipmentData(
  ...sources
) {
  return {
    shipmentId:
      deepFind(
        sources,
        [
          "shipment_id",
          "shipmentId",
        ]
      ),

    orderId:
      deepFind(
        sources,
        [
          "order_id",
          "orderId",
        ]
      ),

    awb:
      deepFind(
        sources,
        [
          "awb_code",
          "awb",
          "waybill",
        ]
      ),

    courier:
      deepFind(
        sources,
        [
          "courier_name",
          "courier",
        ]
      ),

    courierId:
      deepFind(
        sources,
        [
          "courier_company_id",
          "courier_id",
          "courierId",
        ]
      ),

    trackingUrl:
      deepFind(
        sources,
        [
          "tracking_url",
          "trackingUrl",
        ]
      ),
  };
}

// =========================================================
// FIND EXISTING ORDER
// =========================================================

async function findExistingOrder(
  token,
  websiteOrderId
) {
  try {
    const search =
      encodeURIComponent(
        websiteOrderId
      );

    const data =
      await request(
        `/orders?search=${search}`,
        token,
        {
          method: "GET",
        }
      );

    const candidates =
      Array.isArray(data)
        ? data
        : Array.isArray(
            data?.data
          )
        ? data.data
        : Array.isArray(
            data?.data?.data
          )
        ? data.data.data
        : Array.isArray(
            data?.results
          )
        ? data.results
        : [];

    const wanted =
      websiteOrderId
        .toLowerCase();

    const exact =
      candidates.find(
        (item) => {
          const ids = [
            item?.channel_order_id,
            item?.channelOrderId,
            item?.order_id,
            item?.orderId,
          ]
            .filter(
              (v) =>
                v != null
            )
            .map(
              (v) =>
                clean(v)
                  .toLowerCase()
            );

          return ids.includes(
            wanted
          );
        }
      );

    return {
      data,
      order:
        exact ||
        candidates[0] ||
        null,
    };
  } catch {
    return {
      data: {},
      order: null,
    };
  }
}

// =========================================================
// CREATE ORDER
// =========================================================

async function createOrder(
  token,
  order
) {
  return request(
    "/orders/create/adhoc",
    token,
    {
      method: "POST",
      body:
        buildOrderPayload(
          order
        ),
    }
  );
}

// =========================================================
// SHOW ORDER
// =========================================================

async function showOrder(
  token,
  orderId
) {
  if (!orderId) {
    return {};
  }

  return request(
    `/orders/show/${encodeURIComponent(
      orderId
    )}`,
    token,
    {
      method: "GET",
    }
  );
}

// =========================================================
// SHIPMENT DETAILS
// =========================================================

async function getShipment(
  token,
  shipmentId
) {
  if (!shipmentId) {
    return {};
  }

  try {
    return await request(
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

// =========================================================
// ASSIGN AWB
// =========================================================

async function assignAWB(
  token,
  shipmentId
) {
  const body = {
    shipment_id:
      Number(
        shipmentId
      ),
  };

  const courierId =
    num(
      process.env
        .SHIPROCKET_COURIER_ID,
      0
    );

  if (
    courierId > 0
  ) {
    body.courier_id =
      courierId;
  }

  return request(
    "/courier/assign/awb",
    token,
    {
      method: "POST",
      body,
    }
  );
}

// =========================================================
// GENERATE SHIPPING LABEL
// =========================================================

async function generateLabel(
  token,
  shipmentId
) {
  return request(
    "/courier/generate/label",
    token,
    {
      method: "POST",
      body: {
        shipment_id: [
          Number(
            shipmentId
          ),
        ],
      },
    }
  );
}

// =========================================================
// MAIN
// =========================================================

export default async function handler(
  req,
  res
) {
  if (
    req.method !==
    "POST"
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

    // PAYMENT SECURITY
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
            "Payment is not verified. Shiprocket shipment creation is blocked.",
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

    const token =
      await getToken();

    // Recover existing order first.
    let recovered =
      (
        await findExistingOrder(
          token,
          websiteOrderId
        )
      ).order;

    let created = {};

    if (!recovered) {
      try {
        created =
          await createOrder(
            token,
            order
          );
      } catch (createError) {
        recovered =
          (
            await findExistingOrder(
              token,
              websiteOrderId
            )
          ).order;

        if (!recovered) {
          throw createError;
        }
      }
    }

    let shiprocketOrderId =
      extractShipmentData(
        created,
        recovered
      ).orderId ||
      recovered?.id ||
      recovered?.order_id ||
      recovered?.orderId ||
      null;

    let orderDetails =
      await showOrder(
        token,
        shiprocketOrderId
      );

    let info =
      extractShipmentData(
        created,
        recovered,
        orderDetails
      );

    // Wait for shipment ID.
    for (
      let attempt = 0;
      !info.shipmentId &&
      attempt < 6;
      attempt++
    ) {
      await sleep(1500);

      orderDetails =
        await showOrder(
          token,
          shiprocketOrderId
        );

      info =
        extractShipmentData(
          created,
          recovered,
          orderDetails
        );
    }

    if (
      !info.shipmentId
    ) {
      return sendJson(
        res,
        502,
        {
          success: false,
          provider:
            "shiprocket",
          stage:
            "shipment_creation",
          retryable: true,
          error:
            "Shiprocket order was created/recovered, but Shipment ID is still not available.",
          message:
            "Payment is successful. Do NOT pay again. Retry shipment creation after a short wait.",
          orderId:
            websiteOrderId,
          shiprocketOrderId,
          details: {
            create:
              created,
            recovered,
            order:
              orderDetails,
          },
        }
      );
    }

    let shipment =
      await getShipment(
        token,
        info.shipmentId
      );

    info =
      extractShipmentData(
        created,
        recovered,
        orderDetails,
        shipment
      );

    // AWB
    let awbResponse =
      {};

    if (!info.awb) {
      try {
        awbResponse =
          await assignAWB(
            token,
            info.shipmentId
          );
      } catch (
        awbError
      ) {
        return sendJson(
          res,
          Number(
            awbError?.status
          ) || 502,
          {
            success: false,
            provider:
              "shiprocket",
            stage:
              "awb_assignment",
            retryable: true,
            error:
              awbError?.message ||
              "Shiprocket AWB assignment failed.",
            orderId:
              websiteOrderId,
            shiprocketOrderId,
            shipmentId:
              info.shipmentId,
            details:
              awbError?.data ||
              null,
          }
        );
      }

      info =
        extractShipmentData(
          created,
          recovered,
          orderDetails,
          shipment,
          awbResponse
        );
    }

    // Refresh shipment after AWB assignment.
    if (
      !info.awb
    ) {
      await sleep(1200);

      shipment =
        await getShipment(
          token,
          info.shipmentId
        );

      info =
        extractShipmentData(
          created,
          recovered,
          orderDetails,
          shipment,
          awbResponse
        );
    }

    if (!info.awb) {
      return sendJson(
        res,
        502,
        {
          success: false,
          provider:
            "shiprocket",
          stage:
            "awb_assignment",
          retryable: true,
          error:
            "Shipment exists, but Shiprocket has not assigned an AWB yet.",
          orderId:
            websiteOrderId,
          shiprocketOrderId,
          shipmentId:
            info.shipmentId,
          details: {
            shipment,
            awb:
              awbResponse,
          },
        }
      );
    }

    // LABEL
    let labelResponse =
      {};

    let labelUrl =
      deepFind(
        [
          shipment,
          orderDetails,
          awbResponse,
        ],
        [
          "label_url",
          "labelUrl",
          "file_name",
          "pdf_url",
        ]
      );

    if (!labelUrl) {
      try {
        labelResponse =
          await generateLabel(
            token,
            info.shipmentId
          );
      } catch (
        labelError
      ) {
        return sendJson(
          res,
          Number(
            labelError?.status
          ) || 502,
          {
            success: false,
            provider:
              "shiprocket",
            stage:
              "label_generation",
            retryable: true,
            error:
              labelError?.message ||
              "Shiprocket shipping label generation failed.",
            orderId:
              websiteOrderId,
            shiprocketOrderId,
            shipmentId:
              info.shipmentId,
            awb:
              info.awb,
            details:
              labelError?.data ||
              null,
          }
        );
      }

      labelUrl =
        deepFind(
          labelResponse,
          [
            "label_url",
            "labelUrl",
            "file_name",
            "pdf_url",
            "url",
          ]
        );
    }

    const trackingUrl =
      info.trackingUrl ||
      (
        info.awb
          ? `https://shiprocket.co/tracking/${encodeURIComponent(
              info.awb
            )}`
          : null
      );

    return sendJson(
      res,
      200,
      {
        success: true,
        provider:
          "shiprocket",

        orderId:
          websiteOrderId,

        shiprocketOrderId,

        shipmentId:
          info.shipmentId,

        shipment_id:
          info.shipmentId,

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

        courierId:
          info.courierId ||
          null,

        trackingUrl,

        tracking_url:
          trackingUrl,

        labelUrl:
          labelUrl ||
          null,

        label_url:
          labelUrl ||
          null,

        labelReady:
          Boolean(labelUrl),

        shipmentReady:
          true,

        paymentStatus:
          "Paid",

        paymentVerified:
          true,

        razorpayOrderId,

        razorpayPaymentId,

        message:
          labelUrl
            ? "Shiprocket shipment, AWB and shipping label generated successfully."
            : "Shiprocket shipment and AWB are ready, but label URL was not returned.",

        raw: {
          create:
            created,

          recovered,

          order:
            orderDetails,

          shipment,

          awb:
            awbResponse,

          label:
            labelResponse,
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
          "shiprocket",
        error:
          error?.message ||
          "Shiprocket shipment creation failed.",
        details:
          error?.data ||
          null,
      }
    );
  }
}
