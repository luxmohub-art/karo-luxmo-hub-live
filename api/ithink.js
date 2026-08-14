const ITHINK_BASE_URL =
  "https://my.ithinklogistics.com/api_v3";


// =====================================================
// iTHINK LOGISTICS — CREATE ORDER
// =====================================================

export async function createIThinkShipment(order) {
  const accessToken =
    process.env.ITHINK_ACCESS_TOKEN;

  const secretKey =
    process.env.ITHINK_SECRET_KEY;

  const pickupAddressId =
    process.env.ITHINK_PICKUP_ADDRESS_ID;

  if (!accessToken) {
    throw new Error(
      "ITHINK_ACCESS_TOKEN is missing"
    );
  }

  if (!secretKey) {
    throw new Error(
      "ITHINK_SECRET_KEY is missing"
    );
  }

  if (!pickupAddressId) {
    throw new Error(
      "ITHINK_PICKUP_ADDRESS_ID is missing"
    );
  }


  // ---------------------------------------------------
  // Customer
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


  if (items.length === 0) {
    throw new Error(
      "At least one product is required"
    );
  }


  // ---------------------------------------------------
  // Required customer validation
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
  // Order ID
  // ---------------------------------------------------

  const orderId =
    order.orderNumber ||
    order.razorpayOrderId ||
    `LUXMO-${Date.now()}`;


  // ---------------------------------------------------
  // Product list
  // ---------------------------------------------------

  const products =
    items.map((item, index) => ({

      product_name:
        item.title ||
        item.name ||
        `LUXMO Product ${index + 1}`,

      product_sku:
        item.sku ||
        item.id ||
        `LUXMO-${index + 1}`,

      product_quantity:
        String(
          item.qty ||
          item.quantity ||
          1
        ),

      product_price:
        String(
          Number(
            item.price ||
            item.salePrice ||
            0
          )
        ),

      product_tax_rate:
        String(
          item.gstRate ||
          ""
        ),

      product_hsn_code:
        String(
          item.hsn ||
          ""
        ),

      product_discount:
        "0",

      product_img_url:
        item.image ||
        item.images?.[0] ||
        ""

    }));


  // ---------------------------------------------------
  // Package dimensions
  // ---------------------------------------------------

  const length =
    Number(
      order.length ||
      process.env.DEFAULT_PACKAGE_LENGTH ||
      20
    );

  const width =
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

  const weightKg =
    Number(
      order.weight ||
      process.env.DEFAULT_PACKAGE_WEIGHT ||
      1
    );


  // ---------------------------------------------------
  // Payment mode
  // ---------------------------------------------------

  const paymentMode =
    order.paymentMethod === "COD"
      ? "COD"
      : "Prepaid";


  // ---------------------------------------------------
  // iThink order payload
  // ---------------------------------------------------

  const shipment = {

    waybill: "",

    order:
      String(orderId),

    sub_order: "",

    order_date:
      new Date()
        .toISOString()
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("-"),

    total_amount:
      String(
        Number(order.total || 0)
      ),


    // ------------------------------
    // Shipping customer
    // ------------------------------

    name:
      customer.name,

    company_name:
      "",

    add:
      address.line1,

    add2:
      address.line2 || "",

    add3:
      "",

    pin:
      String(address.pincode),

    city:
      address.city,

    state:
      address.state,

    country:
      "India",

    phone:
      String(customer.phone),

    alt_phone:
      "",

    email:
      customer.email || "",


    // ------------------------------
    // Billing
    // ------------------------------

    is_billing_same_as_shipping:
      "yes",

    billing_name:
      customer.name,

    billing_company_name:
      "",

    billing_add:
      address.line1,

    billing_add2:
      address.line2 || "",

    billing_add3:
      "",

    billing_pin:
      String(address.pincode),

    billing_city:
      address.city,

    billing_state:
      address.state,

    billing_country:
      "India",

    billing_phone:
      String(customer.phone),

    billing_alt_phone:
      "",

    billing_email:
      customer.email || "",


    // ------------------------------
    // Products
    // ------------------------------

    products:
      products,


    // ------------------------------
    // Package
    // ------------------------------

    shipment_length:
      String(length),

    shipment_width:
      String(width),

    shipment_height:
      String(height),

    weight:
      String(
        Math.round(weightKg * 1000)
      ),


    // ------------------------------
    // Charges
    // ------------------------------

    shipping_charges:
      String(
        Number(
          order.shippingCharges || 0
        )
      ),

    giftwrap_charges:
      "0",

    transaction_charges:
      "0",

    total_discount:
      String(
        Number(
          order.discount || 0
        )
      ),


    // ------------------------------
    // Payment
    // ------------------------------

    cod_amount:
      paymentMode === "COD"
        ? String(
            Number(order.total || 0)
          )
        : "0",

    payment_mode:
      paymentMode,


    // ------------------------------
    // Company
    // ------------------------------

    reseller_name:
      "LUXMO HUB",

    eway_bill_number:
      "",

    gst_number:
      process.env.LUXMO_GST_NUMBER || "",

    what3words:
      "",

    return_address_id:
      pickupAddressId

  };


  // ===================================================
  // iTHINK REQUEST
  // ===================================================

  const payload = {

    data: {

      shipments: [
        shipment
      ],

      pickup_address_id:
        pickupAddressId,

      access_token:
        accessToken,

      secret_key:
        secretKey,

      logistics:
        process.env.ITHINK_LOGISTICS ||
        "",

      s_type:
        process.env.ITHINK_S_TYPE ||
        "ground",

      order_type:
        ""

    }

  };


  // ===================================================
  // API CALL
  // ===================================================

  const response =
    await fetch(
      `${ITHINK_BASE_URL}/order/add.json`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    );


  let data;

  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      "Invalid response received from iThink Logistics"
    );

  }


  // ===================================================
  // HTTP ERROR
  // ===================================================

  if (!response.ok) {

    console.error(
      "iThink HTTP error:",
      data
    );

    throw new Error(
      data?.message ||
      data?.error ||
      `iThink API failed: ${response.status}`
    );

  }


  // ===================================================
  // API ERROR
  // ===================================================

  const status =
    String(
      data?.status ||
      ""
    ).toLowerCase();


  if (
    status === "error" ||
    status === "failed" ||
    data?.success === false
  ) {

    console.error(
      "iThink API error:",
      data
    );

    throw new Error(
      data?.message ||
      data?.error ||
      "iThink shipment creation failed"
    );

  }


  // ===================================================
  // SUCCESS
  // ===================================================

  return {

    success:
      true,

    provider:
      "ithink",

    orderId:
      orderId,

    waybill:
      data?.waybill ||
      data?.data?.waybill ||
      data?.response?.waybill ||
      null,

    raw:
      data

  };

          }
