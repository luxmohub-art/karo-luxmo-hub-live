const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";

const ITHINK_BASE =
  "https://my.ithinklogistics.com/api_v3";

const MAX_ORDER_ID_LENGTH = 50;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
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

function normalizePhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function normalizeOrderId(value) {
  return String(value || "")
    .trim()
    .slice(0, MAX_ORDER_ID_LENGTH);
}

function normalizeProvider(value) {
  return String(value || "auto")
    .trim()
    .toLowerCase();
}

function maskMobile(mobile) {
  const phone = normalizePhone(mobile);

  if (phone.length !== 10) {
    return "";
  }

  return `******${phone.slice(-4)}`;
}

function safeJsonResponse(data) {
  if (!data || typeof data !== "object") {
    return {};
  }

  return data;
}

function sendJson(res, status, data) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  res.setHeader(
    "Pragma",
    "no-cache"
  );

  res.setHeader(
    "Expires",
    "0"
  );

  return res.status(status).json(data);
}

/*
|--------------------------------------------------------------------------
| Shiprocket Login
|--------------------------------------------------------------------------
*/

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

  const response = await fetch(
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

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok || !data.token) {
    throw new Error(
      data.message ||
        data.error ||
        "Shiprocket authentication failed."
    );
  }

  return data.token;
}

/*
|--------------------------------------------------------------------------
| Shiprocket API Request
|--------------------------------------------------------------------------
*/

async function shiprocketRequest(
  path,
  token,
  options = {}
) {
  const method =
    options.method || "GET";

  const body =
    options.body !== undefined
      ? options.body
      : null;

  const headers = {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };

  const requestOptions = {
    method,
    headers,
  };

  if (body !== null) {
    requestOptions.body =
      JSON.stringify(body);
  }

  const response = await fetch(
    `${SHIPROCKET_BASE}${path}`,
    requestOptions
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Shiprocket API failed with status ${response.status}.`
    );
  }

  return safeJsonResponse(data);
}

/*
|--------------------------------------------------------------------------
| Shiprocket AWB Tracking
|--------------------------------------------------------------------------
*/

async function trackShiprocketByAwb(
  awb,
  token
) {
  if (!awb) {
    throw new Error(
      "Shiprocket AWB is missing."
    );
  }

  const data =
    await shiprocketRequest(
      `/courier/track/awb/${encodeURIComponent(
        awb
      )}`,
      token,
      {
        method: "GET",
      }
    );

  const tracking =
    data?.tracking_data ||
    data?.data ||
    data;

  const shipmentTrack =
    tracking?.shipment_track?.[0] ||
    {};

  const currentStatus =
    firstValue(
      shipmentTrack?.current_status,
      tracking?.current_status,
      tracking?.shipment_status,
      data?.status
    ) ||
    "Tracking information available";

  const courierName =
    firstValue(
      shipmentTrack?.courier_name,
      tracking?.courier_name,
      tracking?.courier
    ) || null;

  const estimatedDelivery =
    firstValue(
      shipmentTrack?.edd,
      tracking?.edd,
      tracking?.etd
    ) || null;

  return {
    success: true,

    provider:
      "shiprocket",

    awb:
      String(awb),

    courier:
      courierName,

    status:
      currentStatus,

    estimatedDelivery,

    trackingUrl:
      `https://shiprocket.co/tracking/${encodeURIComponent(
        awb
      )}`,
  };
}

/*
|--------------------------------------------------------------------------
| Shiprocket Order Lookup
|--------------------------------------------------------------------------
*/

async function findShiprocketOrder(
  orderId,
  mobile,
  token
) {
  let data;

  try {
    data =
      await shiprocketRequest(
        `/orders/show/${encodeURIComponent(
          orderId
        )}`,
        token,
        {
          method: "GET",
        }
      );
  } catch (error) {
    console.error(
      "Shiprocket order lookup failed:",
      error?.message || error
    );

    return null;
  }

  const order =
    data?.data ||
    data?.order ||
    data;

  if (
    !order ||
    typeof order !== "object"
  ) {
    return null;
  }

  /*
   * Mobile verification.
   *
   * If Shiprocket does not return a stored
   * phone number, we cannot securely verify
   * the customer's mobile number.
   */

  const storedPhone =
    firstValue(
      order?.billing_phone,
      order?.shipping_phone,
      order?.customer_phone,
      order?.phone
    );

  const normalizedStoredPhone =
    normalizePhone(storedPhone);

  const normalizedMobile =
    normalizePhone(mobile);

  if (
    !normalizedStoredPhone ||
    !normalizedMobile ||
    normalizedStoredPhone !==
      normalizedMobile
  ) {
    return null;
  }

  const shipments =
    Array.isArray(order?.shipments)
      ? order.shipments
      : Array.isArray(data?.shipments)
      ? data.shipments
      : [];

  const shipment =
    shipments.length
      ? shipments[0]
      : null;

  const awb =
    firstValue(
      shipment?.awb_code,
      shipment?.awb,
      order?.awb_code,
      order?.awb,
      data?.awb_code,
      data?.awb
    );

  const shipmentId =
    firstValue(
      shipment?.id,
      shipment?.shipment_id,
      order?.shipment_id
    );

  return {
    shipmentId:
      shipmentId || null,

    awb:
      awb || null,
  };
}

/*
|--------------------------------------------------------------------------
| iThink AWB Tracking
|--------------------------------------------------------------------------
*/

async function trackIThinkByAwb(
  awb
) {
  const accessToken =
    process.env.ITHINK_ACCESS_TOKEN;

  const secretKey =
    process.env.ITHINK_SECRET_KEY;

  if (
    !accessToken ||
    !secretKey
  ) {
    throw new Error(
      "iThink Logistics credentials are missing."
    );
  }

  if (!awb) {
    throw new Error(
      "iThink AWB is missing."
    );
  }

  const response =
    await fetch(
      `${ITHINK_BASE}/order/track.json`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-cache",
        },

        body: JSON.stringify({
          data: {
            awb_number_list:
              String(awb),

            access_token:
              accessToken,

            secret_key:
              secretKey,
          },
        }),
      }
    );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `iThink API failed with status ${response.status}.`
    );
  }

  const statusText =
    String(
      data?.status || ""
    ).toLowerCase();

  if (
    statusText === "error" ||
    data?.success === false
  ) {
    throw new Error(
      data.message ||
        data.error ||
        "iThink tracking failed."
    );
  }

  const trackingData =
    data?.data ||
    data?.response ||
    data;

  let firstShipment = null;

  if (
    Array.isArray(
      trackingData
    )
  ) {
    firstShipment =
      trackingData[0] || null;
  } else if (
    Array.isArray(
      trackingData?.shipment
    )
  ) {
    firstShipment =
      trackingData.shipment[0] ||
      null;
  } else if (
    Array.isArray(
      trackingData?.shipments
    )
  ) {
    firstShipment =
      trackingData.shipments[0] ||
      null;
  }

  firstShipment =
    firstShipment ||
    trackingData;

  const currentStatus =
    firstValue(
      firstShipment?.status,
      firstShipment?.current_status,
      firstShipment?.status_name,
      firstShipment?.tracking_status
    ) ||
    "Tracking information available";

  const courier =
    firstValue(
      firstShipment?.logistic_name,
      firstShipment?.courier_name,
      firstShipment?.courier
    ) || null;

  const trackingUrl =
    firstValue(
      firstShipment?.tracking_url,
      firstShipment?.trackingUrl
    ) || null;

  return {
    success: true,

    provider:
      "ithink",

    awb:
      String(awb),

    courier,

    status:
      currentStatus,

    trackingUrl,
  };
}

/*
|--------------------------------------------------------------------------
| iThink Order Lookup
|--------------------------------------------------------------------------
*/

async function findIThinkOrder(
  orderId,
  mobile
) {
  const accessToken =
    process.env.ITHINK_ACCESS_TOKEN;

  const secretKey =
    process.env.ITHINK_SECRET_KEY;

  const storeId =
    process.env.ITHINK_STORE_ID;

  if (
    !accessToken ||
    !secretKey ||
    !storeId
  ) {
    return null;
  }

  try {
    const response =
      await fetch(
        `${ITHINK_BASE}/store/get-order-details.json`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Cache-Control":
              "no-cache",
          },

          body: JSON.stringify({
            data: {
              order_no_list:
                String(orderId),

              platform_id:
                Number(storeId),

              access_token:
                accessToken,

              secret_key:
                secretKey,
            },
          }),
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      return null;
    }

    const raw =
      data?.data ||
      data?.response ||
      data;

    const candidates = [];

    if (Array.isArray(raw)) {
      candidates.push(
        ...raw
      );
    }

    if (
      Array.isArray(
        raw?.shipments
      )
    ) {
      candidates.push(
        ...raw.shipments
      );
    }

    if (
      Array.isArray(
        raw?.orders
      )
    ) {
      candidates.push(
        ...raw.orders
      );
    }

    if (
      raw &&
      typeof raw === "object" &&
      !Array.isArray(raw)
    ) {
      candidates.push(raw);
    }

    for (
      const item of candidates
    ) {
      const storedPhone =
        firstValue(
          item?.phone,
          item?.billing_phone,
          item?.shipping_phone,
          item?.customer_phone
        );

      const normalizedStoredPhone =
        normalizePhone(
          storedPhone
        );

      const normalizedMobile =
        normalizePhone(
          mobile
        );

      /*
       * Require phone verification.
       */

      if (
        !normalizedStoredPhone ||
        !normalizedMobile ||
        normalizedStoredPhone !==
          normalizedMobile
      ) {
        continue;
      }

      const awb =
        firstValue(
          item?.waybill,
          item?.awb,
          item?.awb_number,
          item?.awb_code
        );

      if (awb) {
        return {
          awb:
            String(awb),
        };
      }
    }

    return null;
  } catch (error) {
    console.error(
      "iThink order lookup error:",
      error?.message || error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| MAIN TRACK ORDER HANDLER
|--------------------------------------------------------------------------
*/

export default async function handler(
  req,
  res
) {
  /*
   * Only POST is allowed.
   */

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
          "Method not allowed. Use POST.",
      }
    );
  }

  try {
    const body =
      req.body || {};

    /*
     * Accept multiple field names
     * for frontend compatibility.
     */

    const orderId =
      normalizeOrderId(
        firstValue(
          body.orderId,
          body.order_id,
          body.razorpayOrderId,
          body.razorpay_order_id
        )
      );

    const mobile =
      normalizePhone(
        firstValue(
          body.mobile,
          body.phone,
          body.customerPhone
        )
      );

    const provider =
      normalizeProvider(
        firstValue(
          body.provider,
          "auto"
        )
      );

    /*
     * Basic validation.
     */

    if (!orderId) {
      return sendJson(
        res,
        400,
        {
          success: false,

          error:
            "Order ID is required.",
        }
      );
    }

    if (
      mobile.length !== 10
    ) {
      return sendJson(
        res,
        400,
        {
          success: false,

          error:
            "Valid 10-digit mobile number is required.",
        }
      );
    }

    /*
     * --------------------------------------------------
     * SHIPROCKET
     * --------------------------------------------------
     *
     * Important:
     * We ALWAYS verify Order ID + Mobile
     * before returning tracking information.
     */

    if (
      provider === "auto" ||
      provider === "shiprocket"
    ) {
      try {
        const token =
          await getShiprocketToken();

        const found =
          await findShiprocketOrder(
            orderId,
            mobile,
            token
          );

        if (
          found &&
          found.awb
        ) {
          const tracking =
            await trackShiprocketByAwb(
              found.awb,
              token
            );

          return sendJson(
            res,
            200,
            {
              success: true,

              verified: true,

              provider:
                "shiprocket",

              orderId,

              mobile:
                maskMobile(
                  mobile
                ),

              shipment: {
                shipmentId:
                  found.shipmentId,

                awb:
                  found.awb,
              },

              tracking,
            }
          );
        }

        /*
         * Order is verified but AWB
         * has not been assigned yet.
         */

        if (found) {
          return sendJson(
            res,
            200,
            {
              success: true,

              verified: true,

              provider:
                "shiprocket",

              orderId,

              mobile:
                maskMobile(
                  mobile
                ),

              shipment: {
                shipmentId:
                  found.shipmentId,

                awb:
                  null,
              },

              tracking: {
                success: true,

                provider:
                  "shiprocket",

                awb:
                  null,

                status:
                  "Shipment created. AWB is not assigned yet.",

                courier:
                  null,

                estimatedDelivery:
                  null,

                trackingUrl:
                  null,
              },
            }
          );
        }
      } catch (error) {
        console.error(
          "Shiprocket tracking error:",
          error?.message || error
        );

        /*
         * In auto mode, continue to iThink.
         */

        if (
          provider ===
          "shiprocket"
        ) {
          throw error;
        }
      }
    }

    /*
     * --------------------------------------------------
     * ITHINK
     * --------------------------------------------------
     */

    if (
      provider === "auto" ||
      provider === "ithink" ||
      provider ===
        "ithink logistics"
    ) {
      try {
        const found =
          await findIThinkOrder(
            orderId,
            mobile
          );

        if (
          found &&
          found.awb
        ) {
          const tracking =
            await trackIThinkByAwb(
              found.awb
            );

          return sendJson(
            res,
            200,
            {
              success: true,

              verified: true,

              provider:
                "ithink",

              orderId,

              mobile:
                maskMobile(
                  mobile
                ),

              shipment: {
                awb:
                  found.awb,
              },

              tracking,
            }
          );
        }
      } catch (error) {
        console.error(
          "iThink tracking error:",
          error?.message || error
        );

        if (
          provider === "ithink" ||
          provider ===
            "ithink logistics"
        ) {
          throw error;
        }
      }
    }

    /*
     * Do not reveal whether an order exists
     * when mobile verification fails.
     */

    return sendJson(
      res,
      404,
      {
        success: false,

        verified: false,

        error:
          "Order not found or the mobile number does not match.",
      }
    );
  } catch (error) {
    console.error(
      "Track order error:",
      error?.message || error
    );

    return sendJson(
      res,
      500,
      {
        success: false,

        verified: false,

        error:
          "Unable to track order at this time.",
      }
    );
  }
    }
