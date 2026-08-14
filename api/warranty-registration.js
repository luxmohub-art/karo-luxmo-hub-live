const ALLOWED_METHOD = "POST";

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

function clean(value, maxLength = 500) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function isValidPhone(value) {
  return /^\d{10}$/.test(
    normalizePhone(value)
  );
}

function isValidEmail(value) {
  if (!value) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value)
  );
}

function generateRegistrationId() {
  const timestamp =
    Date.now().toString(36).toUpperCase();

  const random =
    Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

  return `LUXMO-WR-${timestamp}-${random}`;
}

export default async function handler(
  req,
  res
) {
  if (req.method !== ALLOWED_METHOD) {
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  try {
    const body =
      req.body || {};

    /*
     * --------------------------------------------------
     * Customer Details
     * --------------------------------------------------
     */

    const customerName =
      clean(
        firstValue(
          body.customerName,
          body.customer_name,
          body.name
        ),
        100
      );

    const mobile =
      normalizePhone(
        firstValue(
          body.mobile,
          body.phone,
          body.customerPhone,
          body.customer_phone
        )
      );

    const email =
      clean(
        firstValue(
          body.email,
          body.customerEmail,
          body.customer_email
        ),
        150
      );

    /*
     * --------------------------------------------------
     * Product / Inverter Details
     * --------------------------------------------------
     */

    const productName =
      clean(
        firstValue(
          body.productName,
          body.product_name,
          body.product
        ),
        200
      );

    const model =
      clean(
        firstValue(
          body.model,
          body.modelNumber,
          body.model_number
        ),
        150
      );

    const serialNumber =
      clean(
        firstValue(
          body.serialNumber,
          body.serial_number,
          body.serial
        ),
        150
      ).toUpperCase();

    const purchaseDate =
      clean(
        firstValue(
          body.purchaseDate,
          body.purchase_date
        ),
        30
      );

    const invoiceNumber =
      clean(
        firstValue(
          body.invoiceNumber,
          body.invoice_number,
          body.invoiceNo
        ),
        100
      );

    /*
     * --------------------------------------------------
     * Installation Details
     * --------------------------------------------------
     */

    const installationDate =
      clean(
        firstValue(
          body.installationDate,
          body.installation_date
        ),
        30
      );

    const installerName =
      clean(
        firstValue(
          body.installerName,
          body.installer_name,
          body.installer
        ),
        150
      );

    const installerPhone =
      normalizePhone(
        firstValue(
          body.installerPhone,
          body.installer_phone
        )
      );

    /*
     * --------------------------------------------------
     * Address
     * --------------------------------------------------
     */

    const address =
      clean(
        firstValue(
          body.address,
          body.installationAddress,
          body.installation_address
        ),
        500
      );

    const city =
      clean(
        body.city,
        100
      );

    const state =
      clean(
        body.state,
        100
      );

    const pincode =
      clean(
        firstValue(
          body.pincode,
          body.pinCode,
          body.postalCode,
          body.postal_code
        ),
        10
      );

    /*
     * --------------------------------------------------
     * Optional Information
     * --------------------------------------------------
     */

    const inverterCapacity =
      clean(
        firstValue(
          body.inverterCapacity,
          body.inverter_capacity,
          body.capacity
        ),
        100
      );

    const batteryType =
      clean(
        firstValue(
          body.batteryType,
          body.battery_type
        ),
        100
      );

    const batteryCapacity =
      clean(
        firstValue(
          body.batteryCapacity,
          body.battery_capacity
        ),
        100
      );

    const purchaseSource =
      clean(
        firstValue(
          body.purchaseSource,
          body.purchase_source,
          body.source
        ),
        150
      );

    const notes =
      clean(
        firstValue(
          body.notes,
          body.message,
          body.remarks
        ),
        1000
      );

    /*
     * --------------------------------------------------
     * Required Field Validation
     * --------------------------------------------------
     */

    if (!customerName) {
      return res.status(400).json({
        success: false,
        error:
          "Customer name is required.",
      });
    }

    if (!isValidPhone(mobile)) {
      return res.status(400).json({
        success: false,
        error:
          "Valid 10-digit mobile number is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error:
          "Please enter a valid email address.",
      });
    }

    if (!productName) {
      return res.status(400).json({
        success: false,
        error:
          "Product name is required.",
      });
    }
