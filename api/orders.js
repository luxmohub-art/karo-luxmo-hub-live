/* ============================================================
   WHATSAPP WEBHOOK
   Reuses this existing Vercel function.
   No new API function/file is required.
============================================================ */

function getWhatsAppQuery(req, key) {
  return clean(req.query?.[key]);
}

function verifyWhatsAppSignature(req, rawBody) {
  const appSecret = clean(
    process.env.META_APP_SECRET
  );

  if (!appSecret) {
    return true;
  }

  const signature = clean(
    req.headers?.["x-hub-signature-256"] ||
    req.headers?.["X-Hub-Signature-256"]
  );

  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

  return safeEqual(
    signature,
    expected
  );
}

async function handleWhatsAppWebhook(
  req,
  res
) {
  const verifyToken = clean(
    process.env.WHATSAPP_VERIFY_TOKEN ||
    "LUXMO_HUB_WA_2026"
  );

  if (req.method === "GET") {
    const mode = getWhatsAppQuery(
      req,
      "hub.mode"
    );

    const token = getWhatsAppQuery(
      req,
      "hub.verify_token"
    );

    const challenge = getWhatsAppQuery(
      req,
      "hub.challenge"
    );

    if (
      mode === "subscribe" &&
      token === verifyToken &&
      challenge
    ) {
      res.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8"
      );

      return res
        .status(200)
        .send(challenge);
    }

    return res
      .status(403)
      .send("Forbidden");
  }

  if (req.method === "POST") {
    const rawBody =
      typeof req.body === "string"
        ? req.body
        : JSON.stringify(
            req.body || {}
          );

    if (
      !verifyWhatsAppSignature(
        req,
        rawBody
      )
    ) {
      return res
        .status(401)
        .send("Invalid signature");
    }

    console.log(
      "WhatsApp webhook received:",
      JSON.stringify(
        req.body || {}
      )
    );

    return sendJson(
      res,
      200,
      {
        success: true,
        received: true
      }
    );
  }

  res.setHeader(
    "Allow",
    "GET, POST"
  );

  return sendJson(
    res,
    405,
    {
      success: false,
      error: "Method not allowed."
    }
  );
}
