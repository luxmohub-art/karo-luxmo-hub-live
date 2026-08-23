// api/shiprocket.js
// LUXMO HUB - Shiprocket Shipment API

const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";

/* =========================================================
   HELPERS
========================================================= */

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

function numberValue(value, fallback = 0) {
  const n = Number(value);

  return Number.isFinite(n) ? n : fallback;
}

function positiveNumber(
  value,
  fallback
) {
  const n = Number(value);

  if (
    Number.isFinite(n) &&
    n > 0
  ) {
    return n;
  }

  return fallback;
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
  const value = firstValue(
    suppliedOrderId,
    order?.websiteOrderId,
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
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

/* =========================================================
   FETCH JSON
========================================================= */

async function fetchJson(
  url,
  options = {},
  timeoutMs = 30000
) {
  const controller =
    new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    const response = await fetch(
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
      data = text
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

/* =========================================================
   SHIPROCKET LOGIN
========================================================= */

async function getShiprocketToken() {
  const email = String(
    process.env.SHIPROCKET_EMAIL ||
      ""
  ).trim();

  const password = String(
    process.env.SHIPROCKET_PASSWORD ||
      ""
  ).trim();

  if (!email || !password) {
    throw new Error(
      "SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD is missing in Vercel Environment Variables."
    );
  }

  const {
    response,
    data,
  } = await fetchJson(
    `${SHIPROCKET_BASE}/auth/login`,
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

  if (
    !response.ok ||
    !data?.token
  ) {
    console.error(
      "Shiprocket login response:",
      data
    );

    throw new Error(
      data?.message ||
        data?.error ||
        `Shiprocket authentication failed (${response.status}).`
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
  body
) {
  const {
    response,
    data,
  } = await fetchJson(
    `${SHIPROCKET_BASE}${endpoint}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Accept:
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    console.error(
      `Shiprocket ${endpoint} error:`,
      data
    );

    throw new Error(
      data?.message ||
        data?.error ||
        data?.errors
          ? JSON.stringify(
              data.errors ||
                data
            )
          : `Shiprocket API failed with status ${response.status}.`
    );
  }

  return data;
}

/* =========================================================
   CREATE ORDER
========================================================= */

async function createShiprocketOrder(
  order,
  orderId,
  token
) {
  const pickupLocation =
    String(
      process.env
        .SHIPROCKET_PICKUP_LOCATION ||
        ""
    ).trim();

  if (!pickupLocation) {
    throw new Error(
      "SHIPROCKET_PICKUP_LOCATION is missing in Vercel Environment Variables."
    );
  }

  const customer =
    order?.customer || {};

  const address =
    order?.shippingAddress ||
    order?.shipping_address ||
    {};

  /* -------------------------------------------------------
     CUSTOMER
  ------------------------------------------------------- */

  const name = String(
    firstValue(
      customer?.name,
      order?.customerName,
      order?.name,
      address?.name
    )
  ).trim();

  const phone = String(
    firstValue(
      customer?.phone,
      order?.phone,
      order?.mobile,
      address?.phone
    )
  ).trim();

  const email = String(
    firstValue(
      customer?.email,
      order?.email,
      address?.email
    )
  ).trim();

  /* -------------------------------------------------------
     ADDRESS
  ------------------------------------------------------- */

  const line1 = String(
    firstValue(
      address?.line1,
      address?.address,
      address?.street,
      order?.address
    )
  ).trim();

  const line2 = String(
    firstValue(
      address?.line2,
      address?.address2,
      order?.address2
    )
  ).trim();

  const city = String(
    firstValue(
      address?.city,
      order?.city
    )
  ).trim();

  const state = String(
    firstValue(
      address?.state,
      order?.state
    )
  ).trim();

  const pincode = String(
    firstValue(
      address?.pincode,
      address?.pinCode,
      address?.postalCode,
      order?.pincode,
      order?.pinCode
    )
  ).trim();

  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  if (!name) {
    throw new Error(
      "Customer name is missing."
    );
  }

  if (!phone) {
    throw new Error(
      "Customer phone number is missing."
    );
  }

  if (!line1) {
    throw new Error(
      "Customer shipping address is missing."
    );
  }

  if (!city) {
    throw new Error(
      "Customer city is missing."
    );
  }

  if (!state) {
    throw new Error(
      "Customer state is missing."
    );
  }

  if (
    !/^\d{6}$/.test(
      pincode
    )
  ) {
    throw new Error(
      "Valid 6-digit shipping pincode is required."
    );
  }

  /* -------------------------------------------------------
     ITEMS
  ------------------------------------------------------- */

  const items =
    getItems(order);

  const orderItems =
    items.map(
      (item, index) => {
        const quantity =
          Math.max(
            1,
            Math.floor(
              numberValue(
                firstValue(
                  item?.quantity,
                  item?.qty,
                  item?.units
                ),
                1
              )
            )
          );

        const price =
          positiveNumber(
            firstValue(
              item?.price,
              item?.salePrice,
              item?.sellingPrice,
              item?.selling_price,
              item?.unitPrice
            ),
            0
          );

        if (price <= 0) {
          throw new Error(
            `Product ${index + 1} has an invalid price.`
          );
        }

        return {
          name:
            String(
              firstValue(
                item?.name,
                item?.title,
                item?.productName
              ) ||
                `LUXMO HUB Product ${
                  index + 1
                }`
            ).slice(0, 255),

          sku:
            String(
              firstValue(
                item?.sku,
                item?.productSku,
                item?.productId,
                item?.id
              ) ||
                `LUXMO-${Date.now()}-${index}`
            ).slice(0, 50),

          units:
            quantity,

          selling_price:
            price,

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
            String(
              firstValue(
                item?.hsn,
                item?.hsnCode
              ) || ""
            ),

          brand:
            String(
              firstValue(
                item?.brand
              ) ||
                "LUXMO HUB"
            ),
        };
      }
    );

  /* -------------------------------------------------------
     CALCULATE SUBTOTAL
     
     Shiprocket requires the calculated subtotal.
  ------------------------------------------------------- */

  const calculatedSubtotal =
    orderItems.reduce(
      (
        total,
        item
      ) => {
        const itemTotal =
          numberValue(
            item.selling_price,
            0
          ) *
          numberValue(
            item.units,
            1
          );

        const discount =
          numberValue(
            item.discount,
            0
          );

        return (
          total +
          Math.max(
            0,
            itemTotal -
              discount
          )
        );
      },
      0
    );

  if (
    calculatedSubtotal <= 0
  ) {
    throw new Error(
      "Calculated order subtotal must be greater than zero."
    );
  }

  /* -------------------------------------------------------
     SHIPPING / DISCOUNT
  ------------------------------------------------------- */

  const shippingCharges =
    Math.max(
      0,
      numberValue(
        order?.shippingCharges ||
          order?.shipping_charges,
        0
      )
    );

  const totalDiscount =
    Math.max(
      0,
      numberValue(
        order?.discount ||
          order?.totalDiscount ||
          order?.total_discount,
        0
      )
    );

  /*
   * IMPORTANT:
   * Shiprocket wants sub_total as calculated
   * product subtotal after item deductions.
   */
  const subTotal =
    Math.max(
      0,
      calculatedSubtotal -
        totalDiscount
    );

  if (subTotal <= 0) {
    throw new Error(
      "Shiprocket subtotal is zero after discount."
    );
  }

  /* -------------------------------------------------------
     PAYMENT
  ------------------------------------------------------- */

  const rawPayment =
    String(
      firstValue(
        order?.paymentMethod,
        order?.payment_method,
        "PREPAID"
      )
    )
      .trim()
      .toUpperCase();

  const paymentMethod =
    rawPayment === "COD"
      ? "COD"
      : "PREPAID";

  /* -------------------------------------------------------
     PACKAGE
  ------------------------------------------------------- */

  const length =
    positiveNumber(
      firstValue(
        order?.length,
        order?.packageLength,
        process.env
          .DEFAULT_PACKAGE_LENGTH
      ),
      20
    );

  const breadth =
    positiveNumber(
      firstValue(
        order?.breadth,
        order?.packageBreadth,
        process.env
          .DEFAULT_PACKAGE_BREADTH
      ),
      15
    );

  const height =
    positiveNumber(
      firstValue(
        order?.height,
        order?.packageHeight,
        process.env
          .DEFAULT_PACKAGE_HEIGHT
      ),
      10
    );

  const weight =
    positiveNumber(
      firstValue(
        order?.weight,
        order?.packageWeight,
        process.env
          .DEFAULT_PACKAGE_WEIGHT
      ),
      1
    );

  /* -------------------------------------------------------
     SHIPROCKET PAYLOAD
  ------------------------------------------------------- */

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

    reseller_name:
      "LUXMO HUB",

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
      email,

    billing_phone:
      phone,

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
      email,

    shipping_phone:
      phone,

    order_items:
      orderItems,

    payment_method:
      paymentMethod,

    shipping_charges:
      shippingCharges,

    giftwrap_charges:
      0,

    transaction_charges:
      0,

    total_discount:
      totalDiscount,

    sub_total:
      subTotal,

    length:
      length,

    breadth:
      breadth,

    height:
      height,

    weight:
      weight,
  };

  console.log(
    "Creating Shiprocket order:",
    {
      orderId,
      pickupLocation,
      paymentMethod,
      subTotal,
      weight,
    }
  );

  return shiprocketRequest(
    "/orders/create/adhoc",
    token,
    payload
  );
}

/* =========================================================
   ASSIGN AWB
========================================================= */

async function assignAWB(
  shipmentId,
  token
) {
  if (!shipmentId) {
    throw new Error(
      "Shiprocket shipment ID is missing."
    );
  }

  const data =
    await shiprocketRequest(
      "/courier/assign/awb",
      token,
      {
        shipment_id:
          Number(shipmentId),
      }
    );

  const responseData =
    data?.response?.data ||
    data?.response ||
    data?.data ||
    data ||
    {};

  const awb =
    firstValue(
      responseData?.awb_code,
      responseData?.awb,
      data?.awb_code,
      data?.awb
    );

  const courier =
    firstValue(
      responseData?.courier_name,
      responseData?.courier,
      data?.courier_name,
      data?.courier
    );

  if (!awb) {
    console.error(
      "Shiprocket AWB response:",
      data
    );

    throw new Error(
      data?.message ||
        responseData?.message ||
        "Shiprocket did not return an AWB number."
    );
  }

  return {
    awb: String(awb),
    courier:
      courier
        ? String(courier)
        : null,
  };
}

/* =========================================================
   MAIN HANDLER
========================================================= */

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
        "Method not allowed.",
    });
  }

  try {
    const body =
      req.body || {};

    const order =
      body?.order || {};

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
      provider !==
      "shiprocket"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid provider. This endpoint supports Shiprocket only.",
      });
    }

    const orderId =
      getOrderId(
        order,
        body?.orderId
      );

    /* -------------------------------------------------------
       AUTH
    ------------------------------------------------------- */

    const token =
      await getShiprocketToken();

    /* -------------------------------------------------------
       CREATE ORDER
    ------------------------------------------------------- */

    const created =
      await createShiprocketOrder(
        order,
        orderId,
        token
      );

    const shipmentId =
      firstValue(
        created?.shipment_id,
        created?.response
          ?.shipment_id,
        created?.data
          ?.shipment_id
      );

    const shiprocketOrderId =
      firstValue(
        created?.order_id,
        created?.response
          ?.order_id,
        created?.data
          ?.order_id,
        orderId
      );

    if (!shipmentId) {
      console.error(
        "Shiprocket create response:",
        created
      );

      throw new Error(
        created?.message ||
          "Shiprocket order was created but shipment ID was not returned."
      );
    }

    /* -------------------------------------------------------
       ASSIGN AWB
    ------------------------------------------------------- */

    const awbResult =
      await assignAWB(
        shipmentId,
        token
      );

    const trackingUrl =
      awbResult.awb
        ? `https://shiprocket.co/tracking/${encodeURIComponent(
            awbResult.awb
          )}`
        : null;

    /* -------------------------------------------------------
       SUCCESS
    ------------------------------------------------------- */

    return res.status(200).json({
      success: true,

      provider:
        "shiprocket",

      orderId:
        String(
          shiprocketOrderId
        ),

      shipmentId:
        Number(shipmentId),

      awb:
        awbResult.awb,

      courier:
        awbResult.courier,

      trackingUrl,

      message:
        "Shiprocket shipment created and AWB assigned successfully.",
    });
  } catch (error) {
    console.error(
      "Shiprocket API error:",
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
