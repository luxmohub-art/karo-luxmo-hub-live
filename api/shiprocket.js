// api/shiprocket.js
// LUXMO HUB — SHIPROCKET ORDER + SHIPMENT CREATION

const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function clean(value) {
  return String(value ?? "").trim();
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function positiveNumber(value, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizePhone(value) {
  const digits = clean(value).replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizePincode(value) {
  return clean(value).replace(/\D/g, "").slice(0, 6);
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    `${SHIPROCKET_BASE}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

  if (!response.ok || !data?.token) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Shiprocket authentication failed."
    );
  }

  return data.token;
}

/* =========================================================
   SHIPROCKET REQUEST
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

  const response = await fetch(
    `${SHIPROCKET_BASE}${endpoint}`,
    {
      method,

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      ...(body !== null
        ? {
            body: JSON.stringify(body),
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
      data?.errors ||
      data?.error ||
      data?.message ||
      data?.raw ||
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

  const phone =
    normalizePhone(
      address.phone ||
        customer.phone ||
        order?.phone ||
        order?.mobile
    );

  const email =
    normalizeEmail(
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
   ORDER ITEMS
========================================================= */

function getOrderItems(order) {
  const source =
    Array.isArray(order?.items)
      ? order.items
      : Array.isArray(order?.orderItems)
      ? order.orderItems
      : Array.isArray(order?.products)
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

      const sku =
        clean(
          item?.sku ||
            item?.productSku ||
            item?.id ||
            `LUXMO-${index + 1}`
        );

      const name =
        clean(
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
            item?.discount || 0,
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

function getOrderTotals(
  order,
  items
) {
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
    subtotal =
      items.reduce(
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
   PACKAGE
========================================================= */

function getPackageDetails(order) {
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

  if (!address.line1) {
    throw new Error(
      "Delivery address is missing."
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

  const shiprocketOrderId =
    websiteOrderId
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      )
      .slice(0, 50);

  const createdAt =
    order.createdAt
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
   FIND DEEP VALUE
========================================================= */

function findFieldDeep(
  value,
  keys,
  depth = 0
) {
  if (
    value === null ||
    value === undefined ||
    depth > 8
  ) {
    return null;
  }

  if (
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
        findFieldDeep(
          item,
          keys,
          depth + 1
        );

      if (
        found !== null
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
        candidate !==
          undefined &&
        candidate !== null &&
        String(
          candidate
        ).trim() !== ""
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
      findFieldDeep(
        child,
        keys,
        depth + 1
      );

    if (
      found !== null
    ) {
      return found;
    }
  }

  return null;
}

/* =========================================================
   EXTRACT SHIPMENT ID
========================================================= */

function extractShipmentId(
  ...sources
) {
  for (
    const source of sources
  ) {
    const value =
      findFieldDeep(
        source,
        [
          "shipment_id",
          "shipmentId",
        ]
      );

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   EXTRACT ORDER ID
========================================================= */

function extractOrderId(
  ...sources
) {
  for (
    const source of sources
  ) {
    const value =
      findFieldDeep(
        source,
        [
          "order_id",
          "orderId",
        ]
      );

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   EXTRACT AWB
========================================================= */

function extractAwb(
  ...sources
) {
  for (
    const source of sources
  ) {
    const value =
      findFieldDeep(
        source,
        [
          "awb_code",
          "awb",
          "waybill",
        ]
      );

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   EXTRACT COURIER
========================================================= */

function extractCourier(
  ...sources
) {
  for (
    const source of sources
  ) {
    const value =
      findFieldDeep(
        source,
        [
          "courier_name",
          "courier",
        ]
      );

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   EXTRACT COURIER ID
========================================================= */

function extractCourierId(
  ...sources
) {
  for (
    const source of sources
  ) {
    const value =
      findFieldDeep(
        source,
        [
          "courier_company_id",
          "courier_id",
          "courierId",
        ]
      );

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   EXTRACT TRACKING
========================================================= */

function extractTrackingUrl(
  ...sources
) {
  for (
    const source of sources
  ) {
    const value =
      findFieldDeep(
        source,
        [
          "tracking_url",
          "trackingUrl",
        ]
      );

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   EXTRACT ALL SHIPMENT DATA
========================================================= */

function extractShipmentData(
  ...sources
) {
  return {
    shipmentId:
      extractShipmentId(
        ...sources
      ),

    orderId:
      extractOrderId(
        ...sources
      ),

    awb:
      extractAwb(
        ...sources
      ),

    courier:
      extractCourier(
        ...sources
      ),

    courierId:
      extractCourierId(
        ...sources
      ),

    trackingUrl:
      extractTrackingUrl(
        ...sources
      ),
  };
}

/* =========================================================
   SEARCH EXISTING ORDER
========================================================= */

async function findExistingShiprocketOrder(
  token,
  websiteOrderId
) {
  try {
    const search =
      encodeURIComponent(
        clean(
          websiteOrderId
        )
      );

    const data =
      await shiprocketRequest(
        `/orders?search=${search}`,
        token,
        {
          method: "GET",
        }
      );

    let candidates = [];

    if (
      Array.isArray(data)
    ) {
      candidates =
        data;
    } else if (
      Array.isArray(
        data?.data
      )
    ) {
      candidates =
        data.data;
    } else if (
      Array.isArray(
        data?.data?.data
      )
    ) {
      candidates =
        data.data.data;
    } else if (
      Array.isArray(
        data?.results
      )
    ) {
      candidates =
        data.results;
    }

    const wanted =
      clean(
        websiteOrderId
      ).toLowerCase();

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
              (value) =>
                value !==
                  undefined &&
                value !== null
            )
            .map(
              (value) =>
                clean(
                  value
                ).toLowerCase()
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
  } catch (error) {
    console.warn(
      "Shiprocket order search warning:",
      error?.message ||
        error
    );

    return {
      data: {},
      order: null,
    };
  }
}

/* =========================================================
   GET SPECIFIC ORDER DETAILS
========================================================= */

async function getShiprocketOrderDetails(
  token,
  shiprocketOrderId
) {
  if (!shiprocketOrderId) {
    return {};
  }

  return shiprocketRequest(
    `/orders/show/${encodeURIComponent(
      shiprocketOrderId
    )}`,
    token,
    {
      method: "GET",
    }
  );
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
  } catch (error) {
    console.warn(
      "Shiprocket shipment details warning:",
      error?.message ||
        error
    );

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
    const numericCourierId =
      Number(courierId);

    if (
      Number.isFinite(
        numericCourierId
      ) &&
      numericCourierId > 0
    ) {
      body.courier_id =
        numericCourierId;
    }
  }

  return shiprocketRequest(
    "/courier/assign/awb",
    token,
    {
      method: "POST",
      body,
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
       RAZORPAY PAYMENT
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
       SHIPROCKET LOGIN
    ===================================================== */

    const token =
      await getShiprocketToken();

    /* =====================================================
       CREATE OR RECOVER EXISTING ORDER
    ===================================================== */

    let createdData = {};

    let recoveredOrder =
      null;

    /*
     * IMPORTANT:
     * First search Shiprocket.
     *
     * This prevents duplicate order creation when the
     * previous request successfully created an order but
     * the website did not receive shipment_id.
     */

    const existing =
      await findExistingShiprocketOrder(
        token,
        websiteOrderId
      );

    if (
      existing.order
    ) {
      recoveredOrder =
        existing.order;
    }

    /*
     * If no existing order is found, create one.
     */

    if (
      !recoveredOrder
    ) {
      try {
        const created =
          await createShiprocketOrder(
            token,
            order
          );

        createdData =
          created?.data ||
          {};
      } catch (createError) {
        /*
         * Creation may have succeeded on Shiprocket
         * even if the response/request timed out.
         *
         * Search once more before returning an error.
         */

        const recovery =
          await findExistingShiprocketOrder(
            token,
            websiteOrderId
          );

        if (
          !recovery.order
        ) {
          throw createError;
        }

        recoveredOrder =
          recovery.order;
      }
    }

    /* =====================================================
       SHIPROCKET ORDER ID
    ===================================================== */

    let shiprocketOrderId =
      extractOrderId(
        createdData,
        recoveredOrder
      );

    if (
      !shiprocketOrderId &&
      recoveredOrder
    ) {
      shiprocketOrderId =
        recoveredOrder.id ||
        recoveredOrder.order_id ||
        recoveredOrder.orderId ||
        null;
    }

    /* =====================================================
       ORDER DETAILS
    ===================================================== */

    let orderDetails =
      {};

    if (
      shiprocketOrderId
    ) {
      orderDetails =
        await getShiprocketOrderDetails(
          token,
          shiprocketOrderId
        );
    }

    /* =====================================================
       EXTRACT SHIPMENT
    ===================================================== */

    let shipmentInfo =
      extractShipmentData(
        createdData,
        recoveredOrder,
        orderDetails
      );

    /*
     * Shiprocket can take a short time to expose the
     * shipment inside order details.
     *
     * Retry instead of immediately returning:
     *
     * "Shipment ID was not returned."
     */

    if (
      !shipmentInfo.shipmentId
    ) {
      for (
        let attempt = 0;
        attempt < 5;
        attempt++
      ) {
        await sleep(
          1500
        );

        if (
          shiprocketOrderId
        ) {
          orderDetails =
            await getShiprocketOrderDetails(
              token,
              shiprocketOrderId
            );
        }

        shipmentInfo =
          extractShipmentData(
            createdData,
            recoveredOrder,
            orderDetails
          );

        if (
          shipmentInfo.shipmentId
        ) {
          break;
        }
      }
    }

    /* =====================================================
       FINAL ORDER SEARCH RECOVERY
    ===================================================== */

    if (
      !shipmentInfo.shipmentId
    ) {
      const retrySearch =
        await findExistingShiprocketOrder(
          token,
          websiteOrderId
        );

      if (
        retrySearch.order
      ) {
        recoveredOrder =
          retrySearch.order;

        const recoveredId =
          recoveredOrder.id ||
          recoveredOrder.order_id ||
          recoveredOrder.orderId ||
          null;

        if (
          recoveredId
        ) {
          shiprocketOrderId =
            shiprocketOrderId ||
            recoveredId;

          orderDetails =
            await getShiprocketOrderDetails(
              token,
              recoveredId
            );
        }

        shipmentInfo =
          extractShipmentData(
            createdData,
            recoveredOrder,
            orderDetails
          );
      }
    }

    /* =====================================================
       SHIPMENT ID STILL MISSING
    ===================================================== */

    if (
      !shipmentInfo.shipmentId
    ) {
      return sendJson(
        res,
        502,
        {
          success: false,

          provider:
            "shiprocket",

          error:
            "Shiprocket order was created/recovered, but shipment ID is still not available.",

          message:
            "Payment is already successful. Do NOT pay again. Retry Create Shipment after a short wait.",

          orderId:
            websiteOrderId,

          shiprocketOrderId:
            shiprocketOrderId ||
            null,

          retryable:
            true,

          details: {
            create:
              createdData,

            recovered:
              recoveredOrder,

            order:
              orderDetails,
          },
        }
      );
    }

    /* =====================================================
       SHIPMENT DETAILS
    ===================================================== */

    let shipmentDetails =
      await getShipmentDetails(
        token,
        shipmentInfo.shipmentId
      );

    shipmentInfo =
      extractShipmentData(
        createdData,
        recoveredOrder,
        orderDetails,
        shipmentDetails
      );

    /* =====================================================
       AWB
    ===================================================== */

    let awbData =
      {};

    if (
      !shipmentInfo.awb
    ) {
      const configuredCourierId =
        clean(
          process.env
            .SHIPROCKET_COURIER_ID
        );

      awbData =
        await assignAwb(
          token,
          shipmentInfo.shipmentId,
          configuredCourierId ||
            undefined
        );

      shipmentInfo =
        extractShipmentData(
          createdData,
          recoveredOrder,
          orderDetails,
          shipmentDetails,
          awbData
        );
    }

    /* =====================================================
       REFRESH SHIPMENT
    ===================================================== */

    if (
      !shipmentInfo.awb ||
      !shipmentInfo.courier
    ) {
      await sleep(
        1000
      );

      shipmentDetails =
        await getShipmentDetails(
          token,
          shipmentInfo.shipmentId
        );

      shipmentInfo =
        extractShipmentData(
          createdData,
          recoveredOrder,
          orderDetails,
          shipmentDetails,
          awbData
        );
    }

    /* =====================================================
       TRACKING URL
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
       SUCCESS
    ===================================================== */

    return sendJson(
      res,
      200,
      {
        success:
          true,

        provider:
          "shiprocket",

        orderId:
          websiteOrderId,

        shiprocketOrderId:
          shiprocketOrderId ||
          shipmentInfo.orderId ||
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

        razorpayOrderId:
          razorpayOrderId,

        razorpayPaymentId:
          razorpayPaymentId,

        shipmentReady:
          true,

        labelReady:
          Boolean(
            shipmentInfo.awb
          ),

        message:
          shipmentInfo.awb
            ? "Shiprocket shipment created and AWB assigned successfully."
            : "Shiprocket shipment created successfully. AWB assignment is pending.",

        raw: {
          create:
            createdData,

          recovered:
            recoveredOrder,

          order:
            orderDetails,

          shipment:
            shipmentDetails,

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
      Number(error?.status) >=
        400
        ? Number(
            error.status
          )
        : 500,
      {
        success:
          false,

        provider:
          "shiprocket",

        error:
          error?.message ||
          "Shiprocket shipment creation failed.",
      }
    );
  }
}
