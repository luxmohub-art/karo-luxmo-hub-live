export default async function handler(req, res) {
  // Only POST requests are allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const {
      provider,
      order,
      orderId,
      paymentId,
    } = req.body || {};

    // Validate order data
    if (!order) {
      return res.status(400).json({
        success: false,
        error: "Order data is required",
      });
    }

    // Validate provider
    const selectedProvider = String(
      provider || process.env.DEFAULT_LOGISTICS_PROVIDER || "shiprocket"
    ).toLowerCase();

    if (!["shiprocket", "ithink"].includes(selectedProvider)) {
      return res.status(400).json({
        success: false,
        error: "Invalid logistics provider",
        allowedProviders: ["shiprocket", "ithink"],
      });
    }

    /*
     * IMPORTANT:
     * This endpoint does NOT verify Razorpay payment.
     * Razorpay verification must remain inside verify-payment.js.
     *
     * paymentId is only passed along as reference information.
     */

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      `https://${req.headers.host}`;

    const endpoint =
      selectedProvider === "shiprocket"
        ? "/api/shiprocket"
        : "/api/ithink";

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order,
        orderId: orderId || order.orderId || null,
        paymentId: paymentId || null,
      }),
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok || data.success === false) {
      console.error(
        `${selectedProvider} shipment creation failed:`,
        data
      );

      return res.status(response.status || 500).json({
        success: false,
        provider: selectedProvider,
        error:
          data.error ||
          `${selectedProvider} shipment creation failed`,
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      provider: selectedProvider,

      shipmentId:
        data.shipmentId ||
        data.shipment_id ||
        data.orderId ||
        data.order_id ||
        null,

      orderId:
        data.orderId ||
        data.order_id ||
        orderId ||
        null,

      awb:
        data.awb ||
        data.awbCode ||
        data.awb_code ||
        null,

      courier:
        data.courier ||
        data.courier_name ||
        null,

      message:
        data.message ||
        `${selectedProvider} shipment created successfully`,

      raw: data,
    });
  } catch (error) {
    console.error("Create shipment error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error?.message || "Unknown error",
    });
  }
}
