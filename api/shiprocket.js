const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";

/**
 * Get Shiprocket API token
 */
async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials are missing. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in Vercel."
    );
  }

  const response = await fetch(
    `${SHIPROCKET_BASE}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Shiprocket authentication returned an invalid response."
    );
  }

  // IMPORTANT: Correct authentication condition
  if (!response.ok || !data.token) {
    console.error(
      "Shiprocket authentication failed:",
      data
    );

    throw new Error(
      data.message ||
        data.error ||
        "Shiprocket authentication failed"
    );
  }

  return data.token;
}

/**
 * Generic Shiprocket API request
 */
async function shiprocketRequest(
  path,
  token,
  body = null
) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(
    `${SHIPROCKET_BASE}${path}`,
    options
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    console.error(
      `Shiprocket API error ${path}:`,
      data
    );

    throw new Error(
      data.message ||
        data.error ||
        `Shiprocket API request failed: ${path}`
    );
  }

  return data;
}

/**
 * Safely convert value to number
 */
function numberValue(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

/**
 * Get first available value
 */
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

/**
 * Convert order items into Shiprocket format
 */
function buildOrderItems(order) {
  const sourceItems =
    order?.items ||
    order?.orderItems ||
    order?.products ||
    [];

  if (!Array.isArray(sourceItems)) {
    return [];
  }

  return sourceItems.map((item, index) => {
    const quantity = Math.max(
      1,
      numberValue(
        firstValue(
          item.quantity,
          item.qty,
          item.units
        ),
        1
      )
    );

    const price = numberValue(
      firstValue(
        item.selling_price,
        item.sellingPrice,
        item.price,
        item.amount,
        item.unitPrice
      ),
      0
    );

    return {
      name:
        firstValue(
          item.name,
          item.title,
          item.productName
        ) || `Product ${index + 1}`,

      sku:
        firstValue(
          item.sku,
          item.productSku,
          item.id
        ) || `LUXMO-${index + 1}`,

      units: quantity,

      selling_price: price,

      discount: numberValue(
        firstValue(
          item.discount,
          item.discountAmount
        ),
        0
      ),

      tax: numberValue(
        firstValue(
          item.tax,
          item.taxAmount
        ),
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
        ) || "LUXMO HUB",
    };
  });
}

/**
 * Create Shiprocket shipment
 */
async function createShiprocketShipment(
  order,
  suppliedOrderId = null
) {
  const token = await getShiprocketToken();

  const pickupLocation =
    firstValue(
      order?.pickup_location,
      order?.pickupLocation,
      process.env.SHIPROCKET_PICKUP_LOCATION
    );

  if (!pickupLocation) {
    throw new Error(
      "SHIPROCKET_PICKUP_LOCATION is missing."
    );
  }

  const customerName =
    firstValue(
      order?.customerName,
      order?.customer_name,
      order?.name,
      order?.shippingCustomerName,
      order?.shipping_customer_name
    ) || "Customer";

  const customerPhone =
    firstValue(
      order?.phone,
      order?.mobile,
      order?.customerPhone,
      order?.customer_phone,
      order?.shippingPhone,
      order?.shipping_phone
    );

  const customerEmail =
    firstValue(
      order?.email,
      order?.customerEmail,
      order?.customer_email,
      order?.shippingEmail,
      order?.shipping_email
    );

  const address =
    firstValue(
      order?.address,
      order?.shippingAddress,
      order?.shipping_address
    );

  const address2 =
    firstValue(
      order?.address2,
      order?.shippingAddress2,
      order?.shipping_address_2
    );

  const city =
    firstValue(
      order?.city,
      order?.shippingCity,
      order?.shipping_city
    );

  const state =
    firstValue(
      order?.state,
      order?.shippingState,
      order?.shipping_state
    );

  const pincode =
    firstValue(
      order?.pincode,
      order?.pinCode,
      order?.postalCode,
      order?.shippingPincode,
      order?.shipping_pincode
    );

  if (!customerPhone) {
    throw new Error(
      "Customer phone number is missing."
    );
  }

  if (!address || !city || !state || !pincode) {
    throw new Error(
      "Complete shipping address is required."
    );
  }

  const orderItems = buildOrderItems(order);

  if (!orderItems.length) {
    throw new Error(
      "At least one order item is required."
    );
  }

  const localOrderId =
    firstValue(
      suppliedOrderId,
      order?.orderId,
      order?.order_id,
      order?.id,
      order?.razorpayOrderId
    );

  if (!localOrderId) {
    throw new Error(
      "Order ID is missing."
    );
  }

  const paymentMethod =
    String(
      firstValue(
        order?.paymentMethod,
        order?.payment_method,
        "PREPAID"
      )
    ).toUpperCase();

  const total =
    numberValue(
      firstValue(
        order?.total,
        order?.totalAmount,
        order?.amount,
        order?.grandTotal
      ),
      0
    );

  const shippingCharges =
    numberValue(
      firstValue(
        order?.shippingCharges,
        order?.shipping_charges
      ),
      0
    );

  const discount =
    numberValue(
      firstValue(
        order?.discount,
        order?.totalDiscount,
        order?.total_discount
      ),
      0
    );

  const subTotal =
    numberValue(
      firstValue(
        order?.subTotal,
        order?.sub_total,
        total
      ),
      total
    );

  const length =
    numberValue(
      firstValue(
        order?.length,
        process.env.DEFAULT_PACKAGE_LENGTH
      ),
      20
    );

  const breadth =
    numberValue(
      firstValue(
        order?.breadth,
        process.env.DEFAULT_PACKAGE_BREADTH
      ),
      15
    );

  const height =
    numberValue(
      firstValue(
        order?.height,
        process.env.DEFAULT_PACKAGE_HEIGHT
      ),
      10
    );

  const weight =
    numberValue(
      firstValue(
        order?.weight,
        order?.packageWeight,
        process.env.DEFAULT_PACKAGE_WEIGHT
      ),
      1
    );

  /**
   * Shiprocket custom/adhoc order
   *
   * Official endpoint:
   * POST /orders/create/adhoc
   */
  const payload = {
    order_id: String(localOrderId).slice(0, 50),

    order_date:
      order?.orderDate ||
      order?.order_date ||
      new Date().toISOString().slice(0, 10),

    pickup_location: pickupLocation,

    billing_customer_name: customerName,

    billing_last_name:
      firstValue(
        order?.lastName,
        order?.last_name
      ) || "",

    billing_address: address,

    billing_address_2: address2,

    billing_city: city,

    billing_pincode: Number(pincode),

    billing_state: state,

    billing_country:
      firstValue(
        order?.country,
        order?.shippingCountry,
        order?.shipping_country,
        "India"
      ),

    billing_email: customerEmail,

    billing_phone: String(customerPhone),

    shipping_is_billing: false,

    shipping_customer_name: customerName,

    shipping_last_name:
      firstValue(
        order?.lastName,
        order?.last_name
      ) || "",

    shipping_address: address,

    shipping_address_2: address2,

    shipping_city: city,

    shipping_pincode: Number(pincode),

    shipping_country:
      firstValue(
        order?.country,
        order?.shippingCountry,
        order?.shipping_country,
        "India"
      ),

    shipping_state: state,

    shipping_email: customerEmail,

    shipping_phone: String(customerPhone),

    order_items: orderItems,

    payment_method:
      paymentMethod === "COD"
        ? "COD"
        : "PREPAID",

    shipping_charges: shippingCharges,

    total_discount: discount,

    sub_total: subTotal,

    length,

    breadth,

    height,

    weight,
  };

  console.log(
    "Creating Shiprocket order:",
    {
      order_id: payload.order_id,
      pickup_location:
        payload.pickup_location,
    }
  );

  const created = await shiprocketRequest(
    "/orders/create/adhoc",
    token,
    payload
  );

  const shiprocketOrderId =
    created?.order_id ||
    created?.response?.order_id ||
    created?.data?.order_id ||
    null;

  const shipmentId =
    created?.shipment_id ||
    created?.response?.shipment_id ||
    created?.data?.shipment_id ||
    null;

  if (!shipmentId) {
    console.error(
      "Shiprocket order creation response:",
      created
    );

    throw new Error(
      "Shiprocket order created but shipment ID was not returned."
    );
  }

  /**
   * Assign AWB
   */
  const awbResult =
    await shiprocketRequest(
      "/courier/assign/awb",
      token,
      {
        shipment_id: Number(shipmentId),
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
    awbResult?.data?.courier_name ||
    null;

  return {
    success: true,

    provider: "shiprocket",

    orderId:
      shiprocketOrderId ||
      localOrderId,

    shipmentId,

    awb,

    courier,

    message:
      "Shiprocket shipment created successfully.",

    raw: {
      order: created,
      awb: awbResult,
    },
  };
}

/**
 * API Handler
 */
export default async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const body = req.body || {};

    const order =
      body.order ||
      body.orderData ||
      body;

    const orderId =
      body.orderId ||
      body.order_id ||
      order?.orderId ||
      order?.order_id ||
      null;

    const result =
      await createShiprocketShipment(
        order,
        orderId
      );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Shiprocket shipment error:",
      error
    );

    return res.status(500).json({
      success: false,
      provider: "shiprocket",
      error:
        error?.message ||
        "Shiprocket shipment creation failed",
    });
  }
      }
