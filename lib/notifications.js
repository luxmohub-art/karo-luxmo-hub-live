// lib/notifications.js

function cleanText(value, maxLength = 500) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function cleanPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return "";
}

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/**
 * Send LUXMO HUB order confirmation email.
 *
 * Provider: Resend
 *
 * Required Vercel Environment Variables:
 * RESEND_API_KEY
 * NOTIFICATION_FROM_EMAIL
 */
export async function sendOrderEmail(order) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn(
      "Email notification skipped: RESEND_API_KEY or NOTIFICATION_FROM_EMAIL is missing."
    );
    return {
      success: false,
      skipped: true,
      channel: "email",
      reason: "Email environment variables missing",
    };
  }

  const customer = order?.customer || {};
  const address = order?.shippingAddress || order?.address || {};

  const email = cleanText(customer.email || order?.email, 320);

  if (!email || !email.includes("@")) {
    return {
      success: false,
      skipped: true,
      channel: "email",
      reason: "Customer email missing or invalid",
    };
  }

  const orderId = cleanText(
    order?.websiteOrderId || order?.id || "LUXMO-ORDER",
    120
  );

  const total = formatINR(order?.total);

  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  const itemRows = items
    .map((item) => {
      const title = cleanText(item?.title || "Product", 200);
      const qty = Number(item?.qty || 1);
      const price = formatINR(
        Number(item?.price || 0) * qty
      );

      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            ${title}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">
            ${qty}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">
            ${price}
          </td>
        </tr>
      `;
    })
    .join("");

  const customerName = cleanText(
    customer.name || address.name || "Customer",
    120
  );

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>LUXMO HUB Order Confirmation</title>
</head>

<body style="margin:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#111827;">

  <div style="max-width:680px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

    <div style="background:#111827;color:#ffffff;padding:28px;">
      <h1 style="margin:0;font-size:26px;">
        LUXMO HUB
      </h1>

      <p style="margin:8px 0 0;color:#d1d5db;">
        Order Confirmation
      </p>
    </div>

    <div style="padding:28px;">

      <h2 style="margin-top:0;">
        Thank you, ${customerName}! 🎉
      </h2>

      <p style="color:#4b5563;line-height:1.6;">
        Your order has been successfully confirmed and your payment has been received.
      </p>

      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:20px 0;">
        <strong>Order ID:</strong> ${orderId}<br>
        <strong>Payment:</strong> Paid<br>
        <strong>Total:</strong> ${total}
      </div>

      ${
        itemRows
          ? `
        <h3>Order Summary</h3>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px;text-align:left;">Product</th>
              <th style="padding:10px;text-align:center;">Qty</th>
              <th style="padding:10px;text-align:right;">Amount</th>
            </tr>
          </thead>

          <tbody>
            ${itemRows}
          </tbody>
        </table>
      `
          : ""
      }

      <h3 style="margin-top:28px;">
        Delivery Address
      </h3>

      <p style="color:#4b5563;line-height:1.6;">
        ${cleanText(address.name || customerName)}<br>
        ${cleanText(address.line1 || "")}<br>
        ${
          address.line2
            ? `${cleanText(address.line2)}<br>`
            : ""
        }
        ${cleanText(address.city || "")},
        ${cleanText(address.state || "")}
        - ${cleanText(address.pincode || "")}<br>
        ${cleanText(address.phone || customer.phone || "")}
      </p>

      <div style="margin-top:28px;padding:18px;background:#f9fafb;border-radius:12px;">
        <strong>What's next?</strong>

        <p style="margin-bottom:0;color:#4b5563;line-height:1.6;">
          We will process your order and update the shipping information once your order is dispatched.
        </p>
      </div>

      <p style="margin-top:28px;color:#6b7280;font-size:13px;line-height:1.6;">
        If you have any questions about your order, please contact LUXMO HUB customer support.
      </p>

    </div>

    <div style="padding:20px 28px;background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
      © ${new Date().getFullYear()} LUXMO HUB. All rights reserved.
    </div>

  </div>

</body>
</html>
`;

  try {
    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `LUXMO HUB Order Confirmed — ${orderId}`,
          html,
        }),
      }
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      console.error(
        "LUXMO email notification failed:",
        data
      );

      return {
        success: false,
        channel: "email",
        error:
          data?.message ||
          data?.error ||
          `Email provider error (${response.status})`,
      };
    }

    return {
      success: true,
      channel: "email",
      messageId: data?.id || null,
    };
  } catch (error) {
    console.error(
      "LUXMO email notification error:",
      error
    );

    return {
      success: false,
      channel: "email",
      error:
        error?.message ||
        "Email notification failed",
    };
  }
}


/**
 * Send LUXMO HUB order confirmation SMS.
 *
 * Provider: MSG91
 *
 * Required Vercel Environment Variables:
 * MSG91_AUTH_KEY
 * MSG91_SENDER_ID
 *
 * NOTE:
 * MSG91 template-based SMS requires an approved
 * DLT template. The template ID should be configured
 * using MSG91_ORDER_TEMPLATE_ID.
 */
export async function sendOrderSMS(order) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const templateId =
    process.env.MSG91_ORDER_TEMPLATE_ID;

  if (!authKey || !senderId || !templateId) {
    console.warn(
      "SMS notification skipped: MSG91 environment variables are missing."
    );

    return {
      success: false,
      skipped: true,
      channel: "sms",
      reason: "SMS environment variables missing",
    };
  }

  const customer = order?.customer || {};

  const phone = cleanPhone(
    customer.phone ||
      order?.phone ||
      order?.shippingAddress?.phone
  );

  if (!phone) {
    return {
      success: false,
      skipped: true,
      channel: "sms",
      reason: "Customer mobile number missing or invalid",
    };
  }

  const orderId = cleanText(
    order?.websiteOrderId ||
      order?.id ||
      "LUXMO-ORDER",
    120
  );

  const amount = formatINR(order?.total);

  const customerName = cleanText(
    customer.name ||
      order?.shippingAddress?.name ||
      "Customer",
    100
  );

  try {
    const response = await fetch(
      "https://control.msg91.com/api/v5/flow/",
      {
        method: "POST",

        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          template_id: templateId,
          sender: senderId,

          recipients: [
            {
              mobiles: phone,
              name: customerName,
              order_id: orderId,
              amount,
            },
          ],
        }),
      }
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      console.error(
        "LUXMO SMS notification failed:",
        data
      );

      return {
        success: false,
        channel: "sms",
        error:
          data?.message ||
          data?.error ||
          `SMS provider error (${response.status})`,
      };
    }

    return {
      success: true,
      channel: "sms",
      response: data,
    };
  } catch (error) {
    console.error(
      "LUXMO SMS notification error:",
      error
    );

    return {
      success: false,
      channel: "sms",
      error:
        error?.message ||
        "SMS notification failed",
    };
  }
}


/**
 * Send all order-confirmation notifications.
 *
 * IMPORTANT:
 * Notification failure must NOT fail the paid order.
 */
export async function sendOrderConfirmationNotifications(
  order
) {
  const results = await Promise.allSettled([
    sendOrderEmail(order),
    sendOrderSMS(order),
  ]);

  const email =
    results[0].status === "fulfilled"
      ? results[0].value
      : {
          success: false,
          channel: "email",
          error: results[0].reason?.message,
        };

  const sms =
    results[1].status === "fulfilled"
      ? results[1].value
      : {
          success: false,
          channel: "sms",
          error: results[1].reason?.message,
        };

  return {
    success:
      Boolean(email.success) ||
      Boolean(sms.success),

    email,
    sms,
  };
}
