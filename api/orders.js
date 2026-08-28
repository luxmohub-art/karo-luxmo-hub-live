/* ============================================================
   LUXMO HUB — ORDER WHATSAPP NOTIFICATIONS
   ============================================================
   Sends:
   🛒 Order Placed
   💰 Payment Successful
   📦 Order Shipped
   🚚 Out for Delivery
   ✅ Delivered

   Uses the EXISTING /api/orders endpoint.
   No new API folder is required.
   ============================================================ */

function getLuxmoOrderWhatsAppConfig() {
  return {
    accessToken: clean(
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.META_WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_CLOUD_API_TOKEN ||
      ""
    ),

    phoneNumberId: clean(
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.META_WHATSAPP_PHONE_NUMBER_ID ||
      ""
    ),

    apiVersion: clean(
      process.env.WHATSAPP_API_VERSION ||
      process.env.META_GRAPH_API_VERSION ||
      "v23.0"
    ),

    templateName: clean(
      process.env.WHATSAPP_ORDER_TEMPLATE ||
      "luxmo_order_update"
    ),

    templateLanguage: clean(
      process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE ||
      process.env.WHATSAPP_ORDER_LANGUAGE ||
      "en_US"
    )
  };
}


/* ============================================================
   CUSTOMER NAME
   ============================================================ */

function getLuxmoOrderCustomerName(order) {
  return clean(
    order?.customer?.name ||
    order?.customerName ||
    order?.name ||
    order?.shippingAddress?.name ||
    order?.address?.name ||
    "Customer"
  );
}


/* ============================================================
   CUSTOMER MOBILE / WHATSAPP
   ============================================================ */

function getLuxmoOrderCustomerMobile(order) {
  const raw = pickFirst(
    order?.customer?.phone,
    order?.customer?.mobile,
    order?.customerPhone,
    order?.customerMobile,
    order?.phone,
    order?.mobile,
    order?.contactNumber,
    order?.shippingAddress?.phone,
    order?.shippingAddress?.mobile,
    order?.address?.phone,
    order?.address?.mobile
  );

  return normalizeMobile(raw);
}


/* ============================================================
   ORDER ID
   ============================================================ */

function getLuxmoOrderNumber(order) {
  return clean(
    order?.websiteOrderId ||
    order?.orderNumber ||
    order?.orderId ||
    order?.id ||
    "N/A"
  );
}


/* ============================================================
   ORDER TOTAL
   ============================================================ */

function getLuxmoOrderTotal(order) {
  const total = safeNumber(
    order?.total ??
    order?.grandTotal ??
    order?.amount ??
    order?.pricing?.total ??
    0
  );

  return `₹${total.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}


/* ============================================================
   ORDER ITEMS
   ============================================================ */

function getLuxmoOrderItems(order) {
  const items =
    Array.isArray(order?.items)
      ? order.items
      : Array.isArray(order?.products)
      ? order.products
      : [];

  if (!items.length) {
    return "Your LUXMO HUB order";
  }

  return items
    .slice(0, 3)
    .map((item) => {
      const name = clean(
        item?.name ||
        item?.title ||
        item?.productName ||
        "Product"
      );

      const quantity = Math.max(
        1,
        Math.floor(
          safeNumber(
            item?.quantity ??
            item?.qty ??
            1
          )
        )
      );

      return `${name} x${quantity}`;
    })
    .join(", ");
}


/* ============================================================
   NOTIFICATION TEXT
   ============================================================ */

function getLuxmoOrderNotificationText(type) {
  switch (type) {

    case "order_placed":
      return "Your LUXMO HUB order has been placed successfully.";

    case "payment_success":
      return "Your payment has been received successfully.";

    case "order_shipped":
      return "Your LUXMO HUB order has been shipped.";

    case "out_for_delivery":
      return "Your LUXMO HUB order is out for delivery.";

    case "delivered":
      return "Your LUXMO HUB order has been delivered successfully.";

    default:
      return "Your LUXMO HUB order status has been updated.";
  }
}


/* ============================================================
   WHATSAPP TEMPLATE PAYLOAD
   ============================================================ */

function buildLuxmoOrderWhatsAppPayload(order, type) {
  const config =
    getLuxmoOrderWhatsAppConfig();

  return {
    messaging_product: "whatsapp",

    recipient_type: "individual",

    to:
      getLuxmoOrderCustomerMobile(order),

    type: "template",

    template: {
      name:
        config.templateName,

      language: {
        code:
          config.templateLanguage
      },

      components: [
        {
          type: "body",

          parameters: [
            {
              type: "text",
              text:
                getLuxmoOrderCustomerName(order)
            },

            {
              type: "text",
              text:
                getLuxmoOrderNumber(order)
            },

            {
              type: "text",
              text:
                getLuxmoOrderNotificationText(type)
            },

            {
              type: "text",
              text:
                getLuxmoOrderTotal(order)
            },

            {
              type: "text",
              text:
                getLuxmoOrderItems(order)
            }
          ]
        }
      ]
    }
  };
}


/* ============================================================
   SEND ORDER WHATSAPP
   ============================================================ */

async function sendLuxmoOrderWhatsApp(order, type) {

  const config =
    getLuxmoOrderWhatsAppConfig();

  if (
    !config.accessToken ||
    !config.phoneNumberId
  ) {
    throw new Error(
      "WhatsApp Cloud API credentials are not configured."
    );
  }

  const mobile =
    getLuxmoOrderCustomerMobile(order);

  if (!mobile) {
    throw new Error(
      "Customer WhatsApp/mobile number is missing or invalid."
    );
  }

  const response =
    await fetch(
      `https://graph.facebook.com/${encodeURIComponent(
        config.apiVersion
      )}/${encodeURIComponent(
        config.phoneNumberId
      )}/messages`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${config.accessToken}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body:
          JSON.stringify(
            buildLuxmoOrderWhatsAppPayload(
              order,
              type
            )
          )
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {

    throw new Error(
      data?.error?.message ||
      data?.error?.error_data?.details ||
      data?.message ||
      "WhatsApp order notification failed."
    );
  }

  console.log(
    "LUXMO WhatsApp notification sent:",
    {
      type,
      orderId:
        getLuxmoOrderNumber(order),
      mobile,
      messageId:
        data?.messages?.[0]?.id ||
        null
    }
  );

  return data;
}


/* ============================================================
   SAFE NOTIFICATION WRAPPER
   ============================================================ */

async function sendLuxmoOrderNotification(
  order,
  type
) {

  const allowedTypes =
    new Set([
      "order_placed",
      "payment_success",
      "order_shipped",
      "out_for_delivery",
      "delivered"
    ]);

  if (!allowedTypes.has(type)) {

    return {
      success: false,
      error:
        `Unsupported notification type: ${type}`
    };
  }

  try {

    const result =
      await sendLuxmoOrderWhatsApp(
        order,
        type
      );

    return {
      success: true,

      channel: "whatsapp",

      type,

      orderId:
        getLuxmoOrderNumber(order),

      messageId:
        result?.messages?.[0]?.id ||
        null
    };

  } catch (error) {

    console.error(
      `LUXMO WhatsApp ${type} notification failed:`,
      error
    );

    /*
     * IMPORTANT:
     * Notification failure must NEVER
     * make a successful order/payment fail.
     */

    return {
      success: false,

      channel: "whatsapp",

      type,

      orderId:
        getLuxmoOrderNumber(order),

      error:
        clean(
          error?.message ||
          error
        ).slice(
          0,
          1000
        )
    };
  }
}
