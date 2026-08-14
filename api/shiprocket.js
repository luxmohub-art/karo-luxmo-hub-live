const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";


// =====================================================
// SHIPROCKET AUTHENTICATION
// =====================================================

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials are missing"
    );
  }

  const response = await fetch(
    `${SHIPROCKET_BASE}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(
      data.message ||
      data.error ||
      "Shiprocket authentication failed"
    );
  }

  return data.token;
}


// =====================================================
// GENERIC SHIPROCKET REQUEST
// =====================================================

async function shiprocketRequest(
  path,
  token,
  body
) {
  const response = await fetch(
    `${SHIPROCKET_BASE}${path}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },

      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Shiprocket API failed: ${response.status}`
    );
  }

  return data;
}


// =====================================================
// CREATE SHIPROCKET SHIPMENT
// =====================================================

export async function createShiprocketShipment(order) {

  // ---------------------------------------------------
  // Get fresh Shiprocket token
  // ---------------------------------------------------

  const token =
    await getShiprocketToken();


  // ---------------------------------------------------
  // Customer & Address
  // ---------------------------------------------------

  const customer =
    order?.customer || {};

  const address =
    order?.shippingAddress || {};


  // ---------------------------------------------------
  // Products
  // ---------------------------------------------------

  const items =
    Array.isArray(order?.items)
      ? order.items
      : [];


  // ---------------------------------------------------
  // Basic validation
  // ---------------------------------------------------

  if (!customer.name) {
    throw new Error(
      "Customer name is required"
    );
  }

  if (!customer.phone) {
    throw new Error(
      "Customer phone is required"
    );
  }

  if (!address.line1) {
    throw new Error(
      "Shipping address is required"
    );
  }

  if (!address.city) {
    throw new Error(
      "Shipping city is required"
    );
  }

  if (!address.state) {
    throw new Error(
      "Shipping state is required"
    );
  }

  if (!address.pincode) {
    throw new Error(
      "Shipping pincode is required"
    );
  }


  // ---------------------------------------------------
  // Shiprocket order items
  // ---------------------------------------------------

  const orderItems =
    items.map((item, index) => ({

      name:
        item.title ||
        item.name ||
        `LUXMO Product ${index + 1}`,

      sku:
        item.sku ||
        item.id ||
        `LUXMO-${index + 1}`,

      units:
        Number(
          item.qty ||
          item.quantity ||
          1
        ),

      selling_price:
        Number(
          item.price ||
          item.salePrice ||
          0
        ),

      discount: 0,

      tax: "",

      hsn:
        item.hsn ||
        "",

      brand:
        "LUXMO HUB"

    }));


  // ---------------------------------------------------
  // Validate products
  // ---------------------------------------------------

  if (orderItems.length === 0) {
    throw new Error(
      "At least one product is required"
    );
  }


  // ---------------------------------------------------
  // Package details
  // ---------------------------------------------------

  const length =
    Number(
      order.length ||
      process.env.DEFAULT_PACKAGE_LENGTH ||
      20
    );

  const breadth =
    Number(
      order.breadth ||
      process.env.DEFAULT_PACKAGE_BREADTH ||
      15
    );

  const height =
    Number(
      order.height ||
      process.env.DEFAULT_PACKAGE_HEIGHT ||
      10
    );

  const weight =
    Number(
      order.weight ||
      process.env.DEFAULT_PACKAGE_WEIGHT ||
      1
    );


  // ---------------------------------------------------
  // Pickup location
  // ---------------------------------------------------

  const pickupLocation =
    process.env.SHIPROCKET_PICKUP_LOCATION;

  if (!pickupLocation) {
    throw new Error(
      "SHIPROCKET_PICKUP_LOCATION is missing"
    );
  }


  // ---------------------------------------------------
  // Unique order ID
  // ---------------------------------------------------

  const orderId =
    order.orderNumber ||
    order.razorpayOrderId ||
    `LUXMO-${Date.now()}`;


  // ---------------------------------------------------
  // Shiprocket order payload
  // ---------------------------------------------------

  const payload = {

    order_id:
      String(orderId).substring(0, 50),

    order_date:
      new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),

    pickup_location:
      pickupLocation,

    comment:
      "LUXMO HUB Website Order",

    reseller_name:
      "LUXMO HUB",

    company_name:
      "LUXMO HUB",


    // ------------------------------
    // Billing
    // ------------------------------

    billing_customer_name:
      customer.name,

    billing_last_name:
      "",

    billing_address:
      address.line1,

    billing_address_2:
      address.line2 || "",

    billing_city:
      address.city,

    billing_pincode:
      address.pincode,

    billing_state:
      address.state,

    billing_country:
      "India",

    billing_email:
      customer.email || "",

    billing_phone:
      customer.phone,


    // ------------------------------
    // Shipping
    // ------------------------------

    shipping_is_billing:
      false,

    shipping_customer_name:
      customer.name,

    shipping_last_name:
      "",

    shipping_address:
      address.line1,

    shipping_address_2:
      address.line2 || "",

    shipping_city:
      address.city,

    shipping_pincode:
      address.pincode,

    shipping_state:
      address.state,

    shipping_country:
      "India",

    shipping_email:
      customer.email || "",

    shipping_phone:
      customer.phone,


    // ------------------------------
    // Products
    // ------------------------------

    order_items:
      orderItems,


    // ------------------------------
    // Payment
    // ------------------------------

    payment_method:
      order.paymentMethod === "COD"
        ? "COD"
        : "PREPAID",


    // ------------------------------
    // Charges
    // ------------------------------

    shipping_charges:
      Number(
        order.shippingCharges || 0
      ),

    total_discount:
      Number(
        order.discount || 0
      ),

    sub_total:
      Number(
        order.total || 0
      ),


    // ------------------------------
    // Package
    // ------------------------------

    length:
      length,

    breadth:
      breadth,

    height:
      height,

    weight:
      weight

  };


  // ===================================================
  // CREATE ORDER
  // ===================================================

  const created =
    await shiprocketRequest(
      "/orders/create/adhoc",
      token,
      payload
    );


  // ---------------------------------------------------
  // Get Shiprocket shipment ID
  // ---------------------------------------------------

  const shipmentId =
    created?.shipment_id ||
    created?.shipment?.id;


  // ---------------------------------------------------
  // Get Shiprocket order ID
  // ---------------------------------------------------

  const shiprocketOrderId =
    created?.order_id ||
    created?.order?.id;


  // ===================================================
  // IMPORTANT:
  // Shipment ID MUST exist
  // ===================================================

  if (!shipmentId) {

    console.error(
      "Shiprocket order response:",
      created
    );

    throw new Error(
      "Shiprocket shipment ID was not returned"
    );
  }


  // ===================================================
  // GENERATE AWB
  // ===================================================

  const awbResult =
    await shiprocketRequest(
      "/courier/assign/awb",
      token,
      {
        shipment_id:
          Number(shipmentId)
      }
    );


  // ---------------------------------------------------
  // Extract AWB
  // ---------------------------------------------------

  const awb =
    awbResult?.response?.data?.awb_code ||
    awbResult?.awb_code ||
    null;


  // ---------------------------------------------------
  // Extract courier
  // ---------------------------------------------------

  const courier =
    awbResult?.response?.data?.courier_name ||
    awbResult?.courier_name ||
    null;


  // ===================================================
  // FINAL RESPONSE
  // ===================================================

  return {

    success: true,

    provider:
      "shiprocket",

    orderId:
      shiprocketOrderId,

    shipmentId:
      shipmentId,

    awb:
      awb,

    courier:
      courier,

    raw: {

      order:
        created,

      awb:
        awbResult

    }

  };
    }
