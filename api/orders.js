/* ============================================================
   WHATSAPP ABANDONED CHECKOUT
   ============================================================ */

function getWhatsAppConfig() {
  return {
    accessToken: clean(
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.META_WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_CLOUD_API_TOKEN
    ),

    phoneNumberId: clean(
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.META_WHATSAPP_PHONE_NUMBER_ID
    ),

    apiVersion: clean(
      process.env.WHATSAPP_API_VERSION ||
      process.env.META_GRAPH_API_VERSION ||
      "v23.0"
    ),

    templateName: clean(
      process.env.WHATSAPP_ABANDONED_TEMPLATE ||
      "abandoned_checkout"
    ),

    templateLanguage: clean(
      process.env.WHATSAPP_ABANDONED_TEMPLATE_LANGUAGE ||
      "en_US"
    )
  };
}


/* ============================================================
   WHATSAPP OPT-IN
============================================================ */

function isWhatsAppOptedIn(checkout) {
  return (
    checkout?.whatsappOptIn === true ||
    checkout?.whatsapp_opt_in === true ||
    checkout?.whatsappConsent === true ||
    checkout?.consent?.whatsapp === true
  );
}


/* ============================================================
   PURCHASE EXCLUSION
============================================================ */

function isPurchasedCheckout(checkout) {
  return (
    checkout?.purchased === true ||
    checkout?.purchaseCompleted === true ||
    checkout?.paymentVerified === true ||
    clean(
      checkout?.paymentStatus ||
      checkout?.payment_status ||
      ""
    ).toLowerCase() === "paid"
  );
}


/* ============================================================
   CUSTOMER MOBILE
============================================================ */

function getCheckoutMobile(checkout) {
  return normalizeMobile(
    pickFirst(
      checkout?.customer?.phone,
      checkout?.customer?.mobile,
      checkout?.customerPhone,
      checkout?.customerMobile,
      checkout?.phone,
      checkout?.mobile,
      checkout?.contactNumber,
      checkout?.shippingAddress?.phone,
      checkout?.shippingAddress?.mobile
    )
  );
}


/* ============================================================
   CHECKOUT ITEMS
============================================================ */

function getCheckoutItems(checkout) {
  const items =
    Array.isArray(checkout?.items)
      ? checkout.items
      : Array.isArray(checkout?.products)
      ? checkout.products
      : [];

  return items
    .slice(0, 10)
    .map((item) => ({
      name: clean(
        item?.name ||
        item?.title ||
        item?.productName ||
        "Product"
      ),

      price: safeNumber(
        item?.price ??
        item?.salePrice ??
        item?.sellingPrice ??
        item?.unitPrice ??
        0
      ),

      quantity: Math.max(
        1,
        Math.floor(
          safeNumber(
            item?.quantity ??
            item?.qty ??
            1
          )
        )
      ),

      image: clean(
        item?.image ||
        item?.imageUrl ||
        item?.image_url ||
        item?.thumbnail ||
        ""
      ),

      url: clean(
        item?.url ||
        item?.productUrl ||
        item?.productURL ||
        item?.productLink ||
        ""
      )
    }));
}


/* ============================================================
   PRODUCT SUMMARY
============================================================ */

function getCheckoutProduct(checkout) {
  const items =
    getCheckoutItems(checkout);

  if (!items.length) {
    return {
      name: "Your cart",

      price: safeNumber(
        checkout?.total ||
        checkout?.grandTotal ||
        checkout?.amount ||
        0
      ),

      image: "",

      url: ""
    };
  }

  const first =
    items[0];

  return {
    name:
      items.length === 1
        ? first.name
        : `${first.name} + ${items.length - 1} more`,

    price:
      safeNumber(
        checkout?.total ||
        checkout?.grandTotal ||
        checkout?.amount ||
        first.price ||
        0
      ),

    image:
      first.image,

    url:
      first.url
  };
}


/* ============================================================
   PRICE
============================================================ */

function formatWhatsAppPrice(value) {
  return `₹${safeNumber(
    value
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2
    }
  )}`;
}


/* ============================================================
   CHECKOUT URL
============================================================ */

function getCheckoutUrl(checkout) {
  const direct =
    clean(
      checkout?.checkoutUrl ||
      checkout?.checkoutURL ||
      checkout?.cartUrl ||
      ""
    );

  if (direct) {
    return direct;
  }

  const product =
    getCheckoutProduct(
      checkout
    );

  return (
    product.url ||
    clean(
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      "https://www.luxmohub.in"
    )
  );
}


/* ============================================================
   TIME
============================================================ */

function toMillis(value) {
  if (!value) {
    return 0;
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "object" &&
    typeof value.toMillis === "function"
  ) {
    try {
      return value.toMillis();
    } catch {}
  }

  const parsed =
    Date.parse(
      String(value)
    );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


function getCheckoutCreatedAt(
  checkout,
  fallback
) {
  return (
    toMillis(
      checkout?.checkoutStartedAt ||
      checkout?.checkout_started_at ||
      checkout?.createdAt ||
      checkout?.created_at ||
      checkout?.updatedAt ||
      checkout?.updated_at
    ) ||
    fallback
  );
}


function getLastWhatsAppReminderAt(
  checkout
) {
  return toMillis(
    checkout?.whatsappReminderSentAt ||
    checkout?.whatsapp_reminder_sent_at ||
    checkout?.lastWhatsAppReminderAt ||
    checkout?.last_whatsapp_reminder_at
  );
}


/* ============================================================
   SETTINGS
============================================================ */

function getAbandonedAfterMs() {
  const minutes =
    Math.max(
      15,
      safeNumber(
        process.env.WHATSAPP_ABANDONED_AFTER_MINUTES ||
        60
      )
    );

  return (
    minutes *
    60 *
    1000
  );
}


function getReminderCooldownMs() {
  const minutes =
    Math.max(
      60,
      safeNumber(
        process.env.WHATSAPP_ABANDONED_COOLDOWN_MINUTES ||
        1440
      )
    );

  return (
    minutes *
    60 *
    1000
  );
}


/* ============================================================
   WHATSAPP TEMPLATE PAYLOAD
============================================================ */

function buildAbandonedWhatsAppPayload(
  checkout
) {
  const config =
    getWhatsAppConfig();

  const product =
    getCheckoutProduct(
      checkout
    );

  const customerName =
    clean(
      checkout?.customer?.name ||
      checkout?.customerName ||
      checkout?.name ||
      "Customer"
    );

  return {
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      getCheckoutMobile(
        checkout
      ),

    type:
      "template",

    template: {
      name:
        config.templateName,

      language: {
        code:
          config.templateLanguage
      },

      components: [
        {
          type:
            "body",

          parameters: [
            {
              type:
                "text",

              text:
                customerName
            },

            {
              type:
                "text",

              text:
                product.name
            },

            {
              type:
                "text",

              text:
                formatWhatsAppPrice(
                  product.price
                )
            },

            {
              type:
                "text",

              text:
                getCheckoutUrl(
                  checkout
                )
            }
          ]
        }
      ]
    }
  };
}


/* ============================================================
   SEND WHATSAPP
============================================================ */

async function sendAbandonedWhatsApp(
  checkout
) {
  const config =
    getWhatsAppConfig();

  if (
    !config.accessToken ||
    !config.phoneNumberId
  ) {
    throw new Error(
      "WhatsApp Cloud API credentials are not configured."
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
        method:
          "POST",

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
            buildAbandonedWhatsAppPayload(
              checkout
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
      data?.message ||
      "WhatsApp message failed."
    );
  }

  return data;
}


/* ============================================================
   MARK PURCHASED
============================================================ */

async function markAbandonedCheckoutPurchased(
  db,
  order
) {
  const mobile =
    getOrderMobile(
      order
    );

  const email =
    normalizeEmail(
      pickFirst(
        order?.customer?.email,
        order?.customerEmail,
        order?.email
      )
    );

  if (
    !mobile &&
    !email
  ) {
    return 0;
  }

  const snapshot =
    await db
      .collection(
        "abandonedCheckouts"
      )
      .limit(500)
      .get();

  const batch =
    db.batch();

  let count = 0;

  for (
    const doc
    of snapshot.docs
  ) {
    const checkout =
      doc.data() ||
      {};

    const checkoutMobile =
      getCheckoutMobile(
        checkout
      );

    const checkoutEmail =
      normalizeEmail(
        pickFirst(
          checkout?.customer?.email,
          checkout?.customerEmail,
          checkout?.email
        )
      );

    if (
      (
        mobile &&
        checkoutMobile === mobile
      ) ||
      (
        email &&
        checkoutEmail &&
        checkoutEmail === email
      )
    ) {
      batch.set(
        doc.ref,
        {
          purchased:
            true,

          purchaseCompleted:
            true,

          purchasedAt:
            new Date(),

          whatsappReminderDisabled:
            true,

          whatsappReminderReason:
            "purchase",

          updatedAt:
            new Date()
        },
        {
          merge:
            true
        }
      );

      count += 1;
    }
  }

  if (count) {
    await batch.commit();
  }

  return count;
}


/* ============================================================
   ABANDONED CHECKOUT PROCESSOR
============================================================ */

async function handleWhatsAppAbandoned(
  req,
  res
) {
  if (
    req.method !==
    "GET"
  ) {
    res.setHeader(
      "Allow",
      "GET"
    );

    return sendJson(
      res,
      405,
      {
        success:
          false,

        error:
          "Method not allowed."
      }
    );
  }

  try {
    const db =
      getDb();

    const config =
      getWhatsAppConfig();

    if (
      !config.accessToken ||
      !config.phoneNumberId
    ) {
      return sendJson(
        res,
        200,
        {
          success:
            true,

          enabled:
            false,

          message:
            "WhatsApp Cloud API credentials are not configured.",

          scanned:
            0,

          sent:
            0,

          skipped:
            0,

          failed:
            0
        }
      );
    }

    const now =
      Date.now();

    const cutoff =
      now -
      getAbandonedAfterMs();

    const snapshot =
      await db
        .collection(
          "abandonedCheckouts"
        )
        .limit(500)
        .get();

    let scanned = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (
      const doc
      of snapshot.docs
    ) {
      const checkout =
        doc.data() ||
        {};

      scanned += 1;

      if (
        !isWhatsAppOptedIn(
          checkout
        )
      ) {
        skipped += 1;
        continue;
      }

      if (
        isPurchasedCheckout(
          checkout
        )
      ) {
        skipped += 1;
        continue;
      }

      if (
        checkout?.whatsappReminderDisabled ===
        true
      ) {
        skipped += 1;
        continue;
      }

      const mobile =
        getCheckoutMobile(
          checkout
        );

      if (!mobile) {
        skipped += 1;
        continue;
      }

      const createdAt =
        getCheckoutCreatedAt(
          checkout,
          now
        );

      if (
        createdAt >
        cutoff
      ) {
        skipped += 1;
        continue;
      }

      const lastReminder =
        getLastWhatsAppReminderAt(
          checkout
        );

      if (
        lastReminder &&
        now -
          lastReminder <
          getReminderCooldownMs()
      ) {
        skipped += 1;
        continue;
      }

      try {
        const result =
          await sendAbandonedWhatsApp(
            checkout
          );

        await doc.ref.set(
          {
            whatsappReminderSent:
              true,

            whatsappReminderSentAt:
              new Date(),

            lastWhatsAppReminderAt:
              new Date(),

            whatsappReminderMessageId:
              result?.messages?.[0]?.id ||
              null,

            whatsappReminderError:
              "",

            updatedAt:
              new Date()
          },
          {
            merge:
              true
          }
        );

        sent += 1;

      } catch (error) {
        failed += 1;

        await doc.ref.set(
          {
            whatsappReminderSent:
              false,

            whatsappReminderError:
              clean(
                error?.message ||
                error
              ).slice(
                0,
                1000
              ),

            updatedAt:
              new Date()
          },
          {
            merge:
              true
          }
        );
      }
    }

    return sendJson(
      res,
      200,
      {
        success:
          true,

        enabled:
          true,

        scanned,

        sent,

        skipped,

        failed,

        abandonedAfterMinutes:
          getAbandonedAfterMs() /
          60000,

        cooldownMinutes:
          getReminderCooldownMs() /
          60000
      }
    );

  } catch (error) {
    console.error(
      "WhatsApp abandoned checkout processor failed:",
      error
    );

    return sendJson(
      res,
      500,
      {
        success:
          false,

        error:
          error?.message ||
          "Unable to process abandoned checkout reminders."
      }
    );
  }
}
