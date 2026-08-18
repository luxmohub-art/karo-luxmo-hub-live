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
    const amount = Number(body.amount);
    const websiteOrderId = String(body.websiteOrderId || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      });
    }

    const amountPaise = Math.round(amount * 100);

    if (amountPaise < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum payment amount is ₹1",
      });
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({
        success: false,
        error: "Razorpay server configuration missing",
      });
    }

    const auth = Buffer.from(
      `${razorpayKeyId}:${razorpayKeySecret}`
    ).toString("base64");

    const receiptBase = websiteOrderId
      ? `luxmo_${websiteOrderId}`
      : `luxmo_${Date.now()}`;

    const receipt = receiptBase
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: {
            website_order_id: websiteOrderId || receipt,
            source: "luxmo-website",
          },
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Razorpay order error:", data);

      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.description ||
          data?.error?.code ||
          "Razorpay order creation failed",
      });
    }

    return res.status(200).json({
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}
