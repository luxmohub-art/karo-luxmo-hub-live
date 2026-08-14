const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";

const ITHINK_BASE =
  "https://my.ithinklogistics.com/api_v3";

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
    .slice(0, 50);
}

function safeJsonResponse(data) {
  if (!data || typeof data !== "object") {
    return {};
  }

  return data;
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
| Shiprocket Tracking
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
    tracking?.shipment_track?.[0] ||
    {};

  const currentStatus =
    firstValue(
      shipmentTrack?.current_status,
      tracking?.current_status,
      tracking?.shipment_status,
      data?.status
    ) || "Tracking information available";

  const courierName =
    firstValue(
      shipmentTrack?.courier_name,
      tracking?.courier_name,
      tracking?.courier
    ) || null;

  const etd =
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

    estimatedDelivery:
      etd,

    trackingUrl:
      `https://shiprocket.co/tracking/${encodeURIComponent(
        awb
      )}`,

    raw:
      data,
  };
}

/*
|--------------------------------------------------------------------------
| Try to find Shiprocket order
|--------------------------------------------------------------------------
|
| The website sends the Razorpay order ID as the order ID.
| Shiprocket order ID is normally the same value that was
| submitted during /orders/create/adhoc.
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
  } catch {
    return null;
  }

  const order =
    data?.data ||
    data?.order ||
    data;

  if (!order) {
    return null;
  }

  /*
   * Security check:
   * Customer must provide the same mobile number
   * used on the order.
   */

  const storedPhone =
    firstValue(
      order?.billing_phone,
      order?.shipping_phone,
      order?.customer_phone,
      order?.phone
    );

  if (
    storedPhone &&
    mobile &&
    normalizePhone(storedPhone) !==
      normalizePhone(mobile)
  ) {
    return null;
  }

  const shipments =
    order?.shipments ||
    data?.shipments ||
    [];

  let shipment =
    Array.isArray(shipments) &&
    shipments.length
      ? shipments[0]
      : null;

  const awb =
    firstValue(
      shipment?.awb_code,
      shipment?.awb,
      order?.awb_code,
      data?.awb_code
    );

  const shipmentId =
    firstValue(
      shipment?.id,
      shipment?.shipment_id,
      order?.shipment_id
    );

  return {
    order,
    shipment,

    shipmentId:
      shipmentId || null,

    awb:
      awb || null,
  };
}

/*
|--------------------------------------------------------------------------
| iThink Tracking
|--------------------------------------------------------------------------
|
| iThink official tracking API accepts AWB number.
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

        body:
          JSON.stringify({
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

  /*
   * iThink responses can contain tracking
   * information inside data.
   */

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
    ) || "Tracking information available";

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

    raw:
      data,
  };
}

/*
|--------------------------------------------------------------------------
| iThink Order Lookup
|--------------------------------------------------------------------------
|
| Used when the order was created through iThink.
|
| NOTE:
| iThink tracking itself requires AWB.
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
    !secretKey
  ) {
    return null;
  }

  /*
   * If store ID is not available, do not
   * expose credentials or fail the complete
   * tracking endpoint.
   */

  if (!storeId) {
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

          body:
            JSON.stringify({
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

    /*
     * Find shipment/order information
     * without exposing private API credentials.
     */

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
          item?.shipping_phone
        );

      if (
        storedPhone &&
        mobile &&
        normalizePhone(
          storedPhone
        ) !==
          normalizePhone(
            mobile
          )
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

          raw:
            item,
        };
      }
    }

    return null;
  } catch (error) {
    console.error(
      "iThink order lookup error:",
      error
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
    return res.status(405).json({
      success: false,

      error:
        "Method not allowed. Use POST.",
    });
  }

  try {
    const body =
      req.body || {};

    /*
     * Accept multiple field names so the
     * App.jsx frontend remains flexible.
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
      String(
        firstValue(
          body.provider,
          "auto"
        )
      )
        .trim()
        .toLowerCase();

    const awb =
      String(
        firstValue(
          body.awb,
          body.awb_code,
          body.waybill
        )
      ).trim();

    /*
     * Basic validation.
     */

    if (!orderId) {
      return res.status(400).json({
        success: false,

        error:
          "Order ID is required.",
      });
    }

    if (
      !mobile ||
      mobile.length !== 10
    ) {
      return res.status(400).json({
        success: false,

        error:
          "Valid 10-digit mobile number is required.",
      });
    }

    /*
     * --------------------------------------------------
     * Direct AWB tracking
     * --------------------------------------------------
     *
     * If frontend already knows AWB and provider,
     * we can track directly.
     */

    if (
      awb &&
      provider === "shiprocket"
    ) {
      const token =
        await getShiprocketToken();

      const tracking =
        await trackShiprocketByAwb(
          awb,
          token
        );

      return res.status(200).json({
        success: true,

        verified: true,

        provider:
          "shiprocket",

        orderId,

        mobile:
          `******${mobile.slice(-4)}`,

        tracking,
      });
    }

    if (
      awb &&
      (
        provider === "ithink" ||
        provider ===
          "ithink logistics"
      )
    ) {
      const tracking =
        await trackIThinkByAwb(
          awb
        );

      return res.status(200).json({
        success: true,

        verified: true,

        provider:
          "ithink",

        orderId,

        mobile:
          `******${mobile.slice(-4)}`,

        tracking,
      });
    }

    /*
     * --------------------------------------------------
     * Shiprocket lookup
     * --------------------------------------------------
     */

    if (
      provider === "auto" ||
      provider ===
        "shiprocket"
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

          return res.status(200).json({
            success: true,

            verified: true,

            provider:
              "shiprocket",

            orderId,

            mobile:
              `******${mobile.slice(-4)}`,

            shipment: {
              shipmentId:
                found.shipmentId,

              awb:
                found.awb,
            },

            tracking,
          });
        }

        /*
         * If Shiprocket order exists but
         * AWB has not been assigned yet.
         */

        if (found) {
          return res.status(200).json({
            success: true,

            verified: true,

            provider:
              "shiprocket",

            orderId,

            mobile:
              `******${mobile.slice(-4)}`,

            shipment: {
              shipmentId:
                found.shipmentId ||
                null,

              awb:
                null,
            },

            tracking: {
              status:
                "Shipment created. AWB is not assigned yet.",

              courier:
                null,

              trackingUrl:
                null,
            },
          });
        }
      } catch (error) {
        console.error(
          "Shiprocket tracking lookup failed:",
          error
        );

        /*
         * In auto mode we can try iThink next.
         *
         * In explicit Shiprocket mode, return
         * the actual error.
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
     * iThink lookup
     * --------------------------------------------------
     */

    if (
      provider === "auto" ||
      provider === "ithink" ||
      provider ===
        "ithink logistics"
    ) {
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

        return res.status(200).json({
          success: true,

          verified: true,

          provider:
            "ithink",

          orderId,

          mobile:
            `******${mobile.slice(-4)}`,

          shipment: {
            awb:
              found.awb,
          },

          tracking,
        });
      }
    }

    /*
     * Do NOT reveal whether the order exists
     * when mobile verification fails.
     */

    return res.status(404).json({
      success: false,

      verified: false,

      error:
        "Order not found or the mobile number does not match.",
    });
  } catch (error) {
    console.error(
      "Track order error:",
      error
    );

    return res.status(500).json({
      success: false,

      verified: false,

      error:
        error?.message ||
        "Unable to track order at this time.",
    });
  }
                }
