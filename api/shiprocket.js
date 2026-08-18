const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";

/* =====================================================
   HELPERS
===================================================== */

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
}

function numberValue(
  value,
  fallback = 0
) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function getItems(order) {
  const items =
    order?.items ||
    order?.orderItems ||
    order?.products ||
    [];

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "At least one product is required."
    );
  }

  return items;
}

function getOrderId(
  order,
  suppliedOrderId
) {
  const value =
    firstValue(
      suppliedOrderId,
      order?.orderId,
      order?.order_id,
      order?.razorpayOrderId,
      order?.razorpay_order_id,
      order?.id
    );

  if (!value) {
    throw new Error(
      "Order ID is required."
    );
  }

  return String(value)
    .trim()
    .slice(0, 50);
}

async function fetchJson(
  url,
  options = {},
  timeoutMs = 30000
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controller.abort(),
      timeoutMs
    );

  try {
    const response =
      await fetch(
        url,
        {
          ...options,
          signal:
            controller.signal,
        }
      );

    const text =
      await response.text();

    let data = {};

    try {
      data =
        text
          ? JSON.parse(text)
          : {};
    } catch {
      data = {
        raw: text,
      };
    }

    return {
      response,
      data,
    };
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      throw new Error(
        "Shiprocket API request timed out."
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/* =====================================================
   SHIPROCKET AUTH
===================================================== */

async function getShiprocketToken() {
  const email =
    process.env
      .SHIPROCKET_EMAIL;

  const password =
    process.env
      .SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials are missing."
    );
  }

  const {
    response,
    data,
  } =
    await fetchJson(
      `${SHIPROCKET_BASE}/auth/login`,
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
            email,
            password,
          }),
      }
    );

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

/* =====================================================
   SHIPROCKET REQUEST
===================================================== */

async function shiprocketRequest(
  endpoint,
  token,
  body
) {
  const {
    response,
    data,
  } =
    await fetchJson(
      `${SHIPROCKET_BASE}${endpoint}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",
        },

        body:
          JSON.stringify(body),
      }
    );

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Shiprocket API failed (${response.status}).`
    );
  }

  return data;
}

/* =====================================================
   CREATE SHIPROCKET SHIPMENT
===================================================== */

async function createShiprocket(
  order,
  orderId
) {
  const token =
    await getShiprocketToken();

  const pickupLocation =
    process.env
      .SHIPROCKET_PICKUP_LOCATION;

  if (!pickupLocation) {
    throw new Error(
      "SHIPROCKET_PICKUP_LOCATION is missing."
    );
  }

  const customer =
    order?.customer || {};

  const address =
    order?.shippingAddress ||
    {};

  const name =
    firstValue(
      customer.name,
      order?.customerName,
      order?.name
    );

  const phone =
    firstValue(
      customer.phone,
      order?.phone,
      order?.mobile
    );

  const email =
    firstValue(
      customer.email,
      order?.email
    );

  const line1 =
    firstValue(
      address.line1,
      address.address,
      order?.address
    );

  const line2 =
    firstValue(
      address.line2,
      address.address2,
      order?.address2
    );

  const city =
    firstValue(
      address.city,
      order?.city
    );

  const state =
    firstValue(
      address.state,
      order?.state
    );

  const pincode =
    firstValue(
      address.pincode,
      address.pinCode,
      order?.pincode,
      order?.pinCode
    );

  if (
    !name ||
    !phone ||
    !line1 ||
    !city ||
    !state ||
    !pincode
  ) {
    throw new Error(
      "Complete customer shipping details are required."
    );
  }

  const items =
    getItems(order);

  const total =
    numberValue(
      firstValue(
        order?.total,
        order?.totalAmount,
        order?.grandTotal,
        order?.amount
      ),
      0
    );

  if (total <= 0) {
    throw new Error(
      "Order total must be greater than zero."
    );
  }

  const orderItems =
    items.map(
      (
        item,
        index
      ) => ({
        name:
          firstValue(
            item?.name,
            item?.title,
            item?.productName
          ) ||
          `LUXMO Product ${index + 1}`,

        sku:
          firstValue(
            item?.sku,
            item?.productSku,
            item?.id
          ) ||
          `LUXMO-${index + 1}`,

        units:
          Math.max(
            1,
            numberValue(
              firstValue(
                item?.quantity,
                item?.qty,
                item?.units
              ),
              1
            )
          ),

        selling_price:
          numberValue(
            firstValue(
              item?.price,
              item?.salePrice,
              item?.selling_price,
              item?.sellingPrice,
              item?.unitPrice
            ),
            0
          ),

        discount:
          numberValue(
            item?.discount,
            0
          ),

        tax:
          numberValue(
            item?.tax,
            0
          ),

        hsn:
          firstValue(
            item?.hsn,
            item?.hsnCode
          ) || "",

        brand:
          firstValue(
            item?.brand
          ) ||
          "LUXMO HUB",
      })
    );

  const paymentMethod =
    String(
      order?.paymentMethod ||
        order?.payment_method ||
        "PREPAID"
    )
      .trim()
      .toLowerCase() ===
    "cod"
      ? "COD"
      : "PREPAID";

  const payload = {
    order_id:
      orderId,

    order_date:
      new Date()
        .toISOString()
        .slice(0, 10),

    pickup_location:
      pickupLocation,

    comment:
      "LUXMO HUB Website Order",

    billing_customer_name:
      name,

    billing_last_name:
      "",

    billing_address:
      line1,

    billing_address_2:
      line2,

    billing_city:
      city,

    billing_pincode:
      Number(pincode),

    billing_state:
      state,

    billing_country:
      "India",

    billing_email:
      email || "",

    billing_phone:
      String(phone),

    shipping_is_billing:
      false,

    shipping_customer_name:
      name,

    shipping_last_name:
      "",

    shipping_address:
      line1,

    shipping_address_2:
      line2,

    shipping_city:
      city,

    shipping_pincode:
      Number(pincode),

    shipping_state:
      state,

    shipping_country:
      "India",

    shipping_email:
      email || "",

    shipping_phone:
      String(phone),

    order_items:
      orderItems,

    payment_method:
      paymentMethod,

    shipping_charges:
      numberValue(
        order?.shippingCharges,
        0
      ),

    total_discount:
      numberValue(
        order?.discount,
        0
      ),

    sub_total:
      total,

    length:
      numberValue(
        order?.length,
        numberValue(
          process.env
            .DEFAULT_PACKAGE_LENGTH,
          20
        )
      ),

    breadth:
      numberValue(
        order?.breadth,
        numberValue(
          process.env
            .DEFAULT_PACKAGE_BREADTH,
          15
        )
      ),

    height:
      numberValue(
        order?.height,
        numberValue(
          process.env
            .DEFAULT_PACKAGE_HEIGHT,
          10
        )
      ),

    weight:
      numberValue(
        order?.weight,
        numberValue(
          process.env
            .DEFAULT_PACKAGE_WEIGHT,
          1
        )
      ),
  };

  const created =
    await shiprocketRequest(
      "/orders/create/adhoc",
      token,
      payload
    );

  const shipmentId =
    created?.shipment_id ||
    created?.response
      ?.shipment_id ||
    created?.data
      ?.shipment_id ||
    null;

  const shiprocketOrderId =
    created?.order_id ||
    created?.response
      ?.order_id ||
    created?.data
      ?.order_id ||
    orderId;

  if (!shipmentId) {
    throw new Error(
      "Shiprocket shipment ID was not returned."
    );
  }

  const awbResult =
    await shiprocketRequest(
      "/courier/assign/awb",
      token,
      {
        shipment_id:
          Number(shipmentId),
      }
    );

  const awb =
    awbResult?.response
      ?.data?.awb_code ||
    awbResult?.response
      ?.awb_code ||
    awbResult?.awb_code ||
    awbResult?.data
      ?.awb_code ||
    null;

  const courier =
    awbResult?.response
      ?.data?.courier_name ||
    awbResult?.response
      ?.courier_name ||
    awbResult?.courier_name ||
    null;

  return {
    success: true,

    provider:
      "shiprocket",

    orderId:
      shiprocketOrderId,

    shipmentId,

    awb,

    courier,

    trackingUrl:
      awb
        ? `https://shiprocket.co/tracking/${awb}`
        : null,

    message:
      "Shiprocket shipment created successfully.",
  };
}

/* =====================================================
   MAIN HANDLER
===================================================== */

export default async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    res.setHeader(
      "Allow",
      "POST"
    );

    return res.status(405).json({
      success: false,
      error:
        "Method not allowed",
    });
  }

  try {
    const body =
      req.body || {};

    const order =
      body?.order || {};

    const orderId =
      getOrderId(
        order,
        body?.orderId
      );

    /*
     * This endpoint is specifically
     * for Shiprocket.
     */
    const provider =
      String(
        body?.provider ||
          order?.provider ||
          order?.courierProvider ||
          "shiprocket"
      )
        .trim()
        .toLowerCase();

    if (
      provider !== "shiprocket"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid provider for /api/shiprocket.",
      });
    }

    const result =
      await createShiprocket(
        order,
        orderId
      );

    return res.status(200).json({
      success: true,

      provider:
        "shiprocket",

      orderId:
        result.orderId ||
        orderId,

      shipmentId:
        result.shipmentId ||
        null,

      awb:
        result.awb ||
        null,

      courier:
        result.courier ||
        null,

      trackingUrl:
        result.trackingUrl ||
        null,

      message:
        result.message ||
        "Shiprocket shipment created successfully.",
    });
  } catch (error) {
    console.error(
      "Shiprocket shipment error:",
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        "Shiprocket shipment creation failed.",
    });
  }
}
