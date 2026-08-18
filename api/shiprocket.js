import crypto from "crypto";

const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";

const ITHINK_BASE =
  "https://my.ithinklogistics.com/api_v3";

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

function numberValue(value, fallback = 0) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function normalizeProvider(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getItems(order) {
  const items =
    order?.items ||
    order?.orderItems ||
    order?.products ||
    [];

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "At least one product is required."
    );
  }

  return items;
}

function getOrderId(order, suppliedOrderId) {
  const value = firstValue(
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

  return String(value).trim().slice(0, 50);
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
      () => controller.abort(),
      timeoutMs
    );

  try {
    const response =
      await fetch(url, {
        ...options,
        signal: controller.signal,
      });

    const text =
      await response.text();

    let data = {};

    try {
      data =
        text ? JSON.parse(text) : {};
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
    if (error?.name === "AbortError") {
      throw new Error(
        "Logistics API request timed out."
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}


/* =====================================================
   RAZORPAY PAYMENT VERIFICATION
===================================================== */

function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}) {
  const secret =
    process.env.RAZORPAY_SECRET;

  if (!secret) {
    throw new Error(
      "RAZORPAY_SECRET is missing in Vercel."
    );
  }

  if (
    !orderId ||
    !paymentId ||
    !signature
  ) {
    throw new Error(
      "Razorpay payment verification data is incomplete."
    );
  }

  const generatedSignature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        `${orderId}|${paymentId}`
      )
      .digest("hex");

  const generated =
    Buffer.from(
      generatedSignature,
      "utf8"
    );

  const received =
    Buffer.from(
      String(signature),
      "utf8"
    );

  if (
    generated.length !==
    received.length
  ) {
    throw new Error(
      "Invalid Razorpay payment signature."
    );
  }

  if (
    !crypto.timingSafeEqual(
      generated,
      received
    )
  ) {
    throw new Error(
      "Invalid Razorpay payment signature."
    );
  }

  return true;
}


/* =====================================================
   SHIPROCKET AUTH
===================================================== */

async function getShiprocketToken() {
  const email =
    process.env.SHIPROCKET_EMAIL;

  const password =
    process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials are missing."
    );
  }

  const { response, data } =
    await fetchJson(
      `${SHIPROCKET_BASE}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
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
  const { response, data } =
    await fetchJson(
      `${SHIPROCKET_BASE}${endpoint}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
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
    process.env.SHIPROCKET_PICKUP_LOCATION;

  if (!pickupLocation) {
    throw new Error(
      "SHIPROCKET_PICKUP_LOCATION is missing."
    );
  }

  const customer =
    order?.customer || {};

  const address =
    order?.shippingAddress || {};

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

  const orderItems =
    items.map(
      (item, index) => ({
        name:
          firstValue(
            item.name,
            item.title,
            item.productName
          ) ||
          `LUXMO Product ${index + 1}`,

        sku:
          firstValue(
            item.sku,
            item.productSku,
            item.id
          ) ||
          `LUXMO-${index + 1}`,

        units:
          Math.max(
            1,
            numberValue(
              firstValue(
                item.quantity,
                item.qty,
                item.units
              ),
              1
            )
          ),

        selling_price:
          numberValue(
            firstValue(
              item.price,
              item.salePrice,
              item.selling_price,
              item.sellingPrice,
              item.unitPrice
            ),
            0
          ),

        discount:
          numberValue(
            item.discount,
            0
          ),

        tax:
          numberValue(
            item.tax,
            0
          ),

        hsn:
          firstValue(
            item.hsn,
            item.hsnCode
          ) || "",

        brand:
          firstValue(
            item.brand
          ) ||
          "LUXMO HUB",
      })
    );

  const total =
    numberValue(
      firstValue(
        order.total,
        order.totalAmount,
        order.grandTotal,
        order.amount
      ),
      0
    );

  if (total <= 0) {
    throw new Error(
      "Order total must be greater than zero."
    );
  }

  const paymentMethod =
    normalizeProvider(
      firstValue(
        order.paymentMethod,
        order.payment_method,
        "PREPAID"
      )
    );

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
      paymentMethod === "cod"
        ? "COD"
        : "PREPAID",

    shipping_charges:
      numberValue(
        order.shippingCharges,
        0
      ),

    total_discount:
      numberValue(
        order.discount,
        0
      ),

    /*
     * Shiprocket requires the correctly
     * calculated subtotal.
     */
    sub_total:
      total,

    length:
      numberValue(
        order.length,
        numberValue(
          process.env.DEFAULT_PACKAGE_LENGTH,
          20
        )
      ),

    breadth:
      numberValue(
        order.breadth,
        numberValue(
          process.env.DEFAULT_PACKAGE_BREADTH,
          15
        )
      ),

    height:
      numberValue(
        order.height,
        numberValue(
          process.env.DEFAULT_PACKAGE_HEIGHT,
          10
        )
      ),

    weight:
      numberValue(
        order.weight,
        numberValue(
          process.env.DEFAULT_PACKAGE_WEIGHT,
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
    created?.response?.shipment_id ||
    created?.data?.shipment_id ||
    null;

  const shiprocketOrderId =
    created?.order_id ||
    created?.response?.order_id ||
    created?.data?.order_id ||
    orderId;

  if (!shipmentId) {
    throw new Error(
      "Shiprocket order was not returned with a shipment ID."
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
    awbResult?.response?.data?.awb_code ||
    awbResult?.response?.awb_code ||
    awbResult?.awb_code ||
    awbResult?.data?.awb_code ||
    null;

  const courier =
    awbResult?.response?.data?.courier_name ||
    awbResult?.response?.courier_name ||
    awbResult?.courier_name ||
    null;

  return {
    success:
      true,

    provider:
      "shiprocket",

    orderId:
      shiprocketOrderId,

    shipmentId,

    awb,

    courier,

    message:
      "Shiprocket shipment created successfully.",
  };
}


/* =====================================================
   iTHINK LOGISTICS
===================================================== */

async function createIThink(
  order,
  orderId
) {
  const accessToken =
    process.env.ITHINK_ACCESS_TOKEN;

  const secretKey =
    process.env.ITHINK_SECRET_KEY;

  /*
   * IMPORTANT:
   * This is NOT the same as STORE_ID.
   * It must be the iThink pickup warehouse/address ID.
   */
  const pickupAddressId =
    process.env.ITHINK_PICKUP_ADDRESS_ID;

  if (!accessToken) {
    throw new Error(
      "ITHINK_ACCESS_TOKEN is missing."
    );
  }

  if (!secretKey) {
    throw new Error(
      "ITHINK_SECRET_KEY is missing."
    );
  }

  if (!pickupAddressId) {
    throw new Error(
      "ITHINK_PICKUP_ADDRESS_ID is missing. IThink requires the Pickup Warehouse ID."
    );
  }

  const customer =
    order?.customer || {};

  const address =
    order?.shippingAddress || {};

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

  const products =
    items.map(
      (item, index) => ({
        product_name:
          firstValue(
            item.name,
            item.title,
            item.productName
          ) ||
          `LUXMO Product ${index + 1}`,

        product_sku:
          firstValue(
            item.sku,
            item.productSku,
            item.id
          ) ||
          `LUXMO-${index + 1}`,

        product_quantity:
          String(
            Math.max(
              1,
              numberValue(
                firstValue(
                  item.quantity,
                  item.qty,
                  item.units
                ),
                1
              )
            )
          ),

        product_price:
          String(
            numberValue(
              firstValue(
                item.price,
                item.salePrice,
                item.selling_price,
                item.sellingPrice,
                item.unitPrice
              ),
              0
            )
          ),

        product_tax_rate:
          String(
            numberValue(
              item.taxRate,
              0
            )
          ),

        product_hsn_code:
          String(
            firstValue(
              item.hsn,
              item.hsnCode
            ) || ""
          ),

        product_discount:
          String(
            numberValue(
              item.discount,
              0
            )
          ),

        product_img_url:
          firstValue(
            item.image,
            item.imageUrl
          ) || "",
      })
    );

  const total =
    numberValue(
      firstValue(
        order.total,
        order.totalAmount,
        order.grandTotal,
        order.amount
      ),
      0
    );

  if (total <= 0) {
    throw new Error(
      "Order total must be greater than zero."
    );
  }

  const paymentMode =
    normalizeProvider(
      firstValue(
        order.paymentMethod,
        order.payment_method,
        "PREPAID"
      )
    );

  const isCOD =
    paymentMode === "cod";

  const shipment = {
    waybill:
      "",

    order:
      orderId,

    sub_order:
      "",

    order_date:
      new Date()
        .toISOString()
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("-"),

    total_amount:
      String(total),

    name,

    company_name:
      "",

    add:
      line1,

    add2:
      line2,

    add3:
      "",

    pin:
      String(pincode),

    city,

    state,

    country:
      "India",

    phone:
      String(phone),

    alt_phone:
      "",

    email:
      email || "",

    is_billing_same_as_shipping:
      "yes",

    billing_name:
      name,

    billing_company_name:
      "",

    billing_add:
      line1,

    billing_add2:
      line2,

    billing_add3:
      "",

    billing_pin:
      String(pincode),

    billing_city:
      city,

    billing_state:
      state,

    billing_country:
      "India",

    billing_phone:
      String(phone),

    billing_alt_phone:
      "",

    billing_email:
      email || "",

    products,

    shipment_length:
      String(
        numberValue(
          order.length,
          numberValue(
            process.env.DEFAULT_PACKAGE_LENGTH,
            20
          )
        )
      ),

    shipment_width:
      String(
        numberValue(
          order.breadth,
          numberValue(
            process.env.DEFAULT_PACKAGE_BREADTH,
            15
          )
        )
      ),

    shipment_height:
      String(
        numberValue(
          order.height,
          numberValue(
            process.env.DEFAULT_PACKAGE_HEIGHT,
            10
          )
        )
      ),

    /*
     * iThink documentation example uses weight
     * in grams.
     */
    weight:
      String(
        Math.round(
          numberValue(
            order.weight,
            numberValue(
              process.env.DEFAULT_PACKAGE_WEIGHT,
              1
            )
          ) * 1000
        )
      ),

    shipping_charges:
      String(
        numberValue(
          order.shippingCharges,
          0
        )
      ),

    giftwrap_charges:
      "0",

    transaction_charges:
      "0",

    total_discount:
      String(
        numberValue(
          order.discount,
          0
        )
      ),

    first_attemp_discount:
      "0",

    cod_amount:
      isCOD
        ? String(total)
        : "0",

    payment_mode:
      isCOD
        ? "COD"
        : "Prepaid",

    reseller_name:
      "LUXMO HUB",

    eway_bill_number:
      "",

    gst_number:
      process.env.LUXMO_GST_NUMBER ||
      "",

    what3words:
      "",

    return_address_id:
      pickupAddressId,
  };

  const payload = {
    data: {
      shipments: [
        shipment,
      ],

      pickup_address_id:
        pickupAddressId,

      access_token:
        accessToken,

      secret_key:
        secretKey,

      /*
       * Optional. Leave blank if you want
       * iThink's normal selection process.
       */
      logistics:
        process.env.ITHINK_LOGISTICS ||
        "",

      s_type:
        process.env.ITHINK_S_TYPE ||
        "",

      order_type:
        "forward",
    },
  };

  const {
    response,
    data,
  } =
    await fetchJson(
      `${ITHINK_BASE}/order/add.json`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-cache",
        },

        body:
          JSON.stringify(payload),
      }
    );

  if (!response.ok) {
    throw new Error(
      data?.html_message ||
      data?.message ||
      data?.error ||
      `iThink API failed (${response.status}).`
    );
  }

  const apiStatus =
    String(
      data?.status || ""
    ).toLowerCase();

  if (
    apiStatus !== "success"
  ) {
    throw new Error(
      data?.html_message ||
      data?.message ||
      data?.error ||
      "iThink order creation failed."
    );
  }

  /*
   * iThink response:
   * data["1"].waybill
   * data["1"].refnum
   * data["1"].logistic_name
   * data["1"].tracking_url
   */
  const firstShipment =
    data?.data?.["1"] ||
    Object.values(
      data?.data || {}
    )[0] ||
    {};

  return {
    success:
      true,

    provider:
      "ithink",

    orderId:
      orderId,

    waybill:
      firstShipment?.waybill ||
      null,

    referenceNumber:
      firstShipment?.refnum ||
      null,

    courier:
      firstShipment?.logistic_name ||
      null,

    trackingUrl:
      firstShipment?.tracking_url ||
      null,

    message:
      "iThink Logistics shipment created successfully.",
  };
}
/* =====================================================
   MAIN API HANDLER
===================================================== */

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

    const order =
      body.order &&
      typeof body.order === "object"
        ? body.order
        : {};

    const provider = normalizeProvider(
      firstValue(
        body.provider,
        order.provider,
        order.courierProvider,
        process.env.DEFAULT_LOGISTICS_PROVIDER,
        "shiprocket"
      )
    );

    if (
      !["shiprocket", "ithink"].includes(provider)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid logistics provider.",
        allowedProviders: [
          "shiprocket",
          "ithink",
        ],
      });
    }

    const orderId = getOrderId(
      order,
      body.orderId
    );

    let result;

    if (provider === "ithink") {
      result = await createIThink(
        order,
        orderId
      );

      return res.status(200).json({
        success: true,

        provider: "ithink",

        orderId:
          result.orderId ||
          orderId,

        shipmentId:
          result.referenceNumber ||
          result.waybill ||
          null,

        awb:
          result.waybill ||
          null,

        courier:
          result.courier ||
          null,

        trackingUrl:
          result.trackingUrl ||
          null,

        message:
          result.message ||
          "iThink Logistics shipment created successfully.",
      });
    }

    result = await createShiprocket(
      order,
      orderId
    );

    return res.status(200).json({
      success: true,

      provider: "shiprocket",

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
      "Logistics shipment error:",
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        "Shipment creation failed.",
    });
  }
}
