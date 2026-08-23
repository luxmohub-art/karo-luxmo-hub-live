import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

const COOKIE_NAME = "luxmo_admin_session";

/* =========================================================
   COMMON HELPERS
========================================================= */

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function cleanJSON(value) {
  return JSON.parse(
    JSON.stringify(value, (_, currentValue) =>
      currentValue === undefined ? null : currentValue
    )
  );
}

function cleanForFirestore(value) {
  if (Array.isArray(value)) {
    return value.map(cleanForFirestore);
  }

  if (value && typeof value === "object") {
    const output = {};

    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        output[key] = cleanForFirestore(val);
      }
    }

    return output;
  }

  return value;
}

/* =========================================================
   COOKIE / ADMIN SESSION
========================================================= */

function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie || "";

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      try {
        return decodeURIComponent(valueParts.join("="));
      } catch {
        return null;
      }
    }
  }

  return null;
}

function safeEqual(a, b) {
  try {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));

    if (left.length !== right.length) {
      return false;
    }

    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function base64UrlDecode(value) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function verifyAdminSession(req) {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return {
      authenticated: false,
      configurationError: true,
    };
  }

  const token = getCookie(req, COOKIE_NAME);

  if (!token) {
    return {
      authenticated: false,
    };
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return {
      authenticated: false,
    };
  }

  const [
    encodedPayload,
    expiresAt,
    signature,
  ] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedPayload}.${expiresAt}`)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    return {
      authenticated: false,
    };
  }

  const expiry = Number(expiresAt);

  if (!Number.isFinite(expiry) || Date.now() >= expiry) {
    return {
      authenticated: false,
    };
  }

  const payloadText = base64UrlDecode(encodedPayload);

  if (!payloadText) {
    return {
      authenticated: false,
    };
  }

  try {
    const payload = JSON.parse(payloadText);

    if (!payload || payload.role !== "admin") {
      return {
        authenticated: false,
      };
    }

    return {
      authenticated: true,
      payload,
    };
  } catch {
    return {
      authenticated: false,
    };
  }
}

function requireAdmin(req, res) {
  const auth = verifyAdminSession(req);

  if (auth.configurationError) {
    sendJson(res, 500, {
      success: false,
      authenticated: false,
      error: "ServerConfigurationError",
      message: "Admin session configuration is missing.",
    });

    return false;
  }

  if (!auth.authenticated) {
    sendJson(res, 401, {
      success: false,
      authenticated: false,
      error: "Unauthorized",
      message: "Admin authentication required.",
    });

    return false;
  }

  return true;
}

/* =========================================================
   PRODUCT HELPERS
========================================================= */

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

function selected(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function text(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function includesAny(value, values) {
  const source = selected(value).map(text);

  if (!values || values.length === 0) {
    return true;
  }

  return values.some((wanted) =>
    source.some(
      (item) =>
        item === text(wanted) ||
        item.includes(text(wanted)) ||
        text(wanted).includes(item)
    )
  );
}

function capacityMatches(value, values) {
  if (!values || values.length === 0) {
    return true;
  }

  const number = Number(
    String(value ?? "")
      .match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || 0
  );

  return values.some((wanted) => {
    const wantedNumber = Number(
      String(wanted ?? "")
        .match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || 0
    );

    return number === wantedNumber;
  });
}

function productMatches(product, query = {}) {
  const {
    q = "",
    category,
    model,
    voltage,
    chargeController,
    frequency,
    mounting,
    smartFeature,
    capacity,
  } = query;

  if (
    category &&
    !includesAny(product.category, [category])
  ) {
    return false;
  }

  if (
    model &&
    !includesAny(
      product.models || product.model,
      [model]
    )
  ) {
    return false;
  }

  const attributes = product.attributes || {};

  if (
    voltage &&
    !includesAny(attributes.voltage, [voltage])
  ) {
    return false;
  }

  if (
    chargeController &&
    !includesAny(
      attributes.chargeController,
      [chargeController]
    )
  ) {
    return false;
  }

  if (
    frequency &&
    !includesAny(
      attributes.frequency,
      [frequency]
    )
  ) {
    return false;
  }

  if (
    mounting &&
    !includesAny(
      attributes.mounting,
      [mounting]
    )
  ) {
    return false;
  }

  if (
    smartFeature &&
    !includesAny(
      attributes.smartFeature,
      [smartFeature]
    )
  ) {
    return false;
  }

  if (
    capacity &&
    !capacityMatches(
      attributes.capacity,
      [capacity]
    )
  ) {
    return false;
  }

  if (q) {
    const searchText = (
      `${product.title || ""} ` +
      `${product.description || ""} ` +
      `${product.model || ""} ` +
      `${product.sku || ""}`
    ).toLowerCase();

    if (
      !searchText.includes(
        String(q).toLowerCase()
      )
    ) {
      return false;
    }
  }

  return true;
}

/* =========================================================
   PRODUCT GET
========================================================= */

async function readProducts(db, query = {}) {
  const snapshot = await db
    .collection("products")
    .limit(500)
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((product) =>
      productMatches(product, query)
    );
}

/* =========================================================
   PRODUCT SAVE
========================================================= */

async function saveProducts(db, products) {
  if (!Array.isArray(products)) {
    throw new Error(
      "Invalid products data. Products must be an array."
    );
  }

  if (products.length === 0) {
    throw new Error(
      "No product was provided to save."
    );
  }

  const savedProducts = [];

  for (const product of products) {
    if (
      !product ||
      typeof product !== "object" ||
      Array.isArray(product)
    ) {
      continue;
    }

    const rawId = String(
      product.id || ""
    ).trim();

    const id =
      rawId ||
      `lmh_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const data = cleanForFirestore({
      ...product,
      id,
      updatedAt: new Date().toISOString(),
    });

    delete data.__proto__;

    await db
      .collection("products")
      .doc(id)
      .set(data, {
        merge: true,
      });

    savedProducts.push({
      ...data,
      id,
    });
  }

  if (savedProducts.length === 0) {
    throw new Error(
      "No valid product was found to save."
    );
  }

  return savedProducts;
}

/* =========================================================
   MAIN API HANDLER
========================================================= */

export default async function handler(req, res) {
  try {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    const query = req.query || {};

    const isProducts =
      String(query.products || "") === "1";

    const isMasterSettings =
      String(query.master || "") === "1";

    /* =====================================================
       PRODUCTS API
       
       GET  /api/products
       PUT  /api/products
    ===================================================== */

    if (isProducts) {
      if (
        req.method !== "GET" &&
        req.method !== "PUT"
      ) {
        res.setHeader(
          "Allow",
          "GET, PUT"
        );

        return sendJson(res, 405, {
          success: false,
          error: "MethodNotAllowed",
          message:
            "Only GET and PUT requests are allowed.",
        });
      }

      /* -----------------------------------------------
         GET PRODUCTS
      ------------------------------------------------ */

      if (req.method === "GET") {
        const adminApp = getFirebaseAdmin();
        const db = getFirestore(adminApp);

        const products = await readProducts(
          db,
          query
        );

        return sendJson(res, 200, {
          success: true,
          products,
          count: products.length,
        });
      }

      /* -----------------------------------------------
         PUT PRODUCT
      ------------------------------------------------ */

      if (!requireAdmin(req, res)) {
        return;
      }

      let body = req.body || {};

      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          return sendJson(res, 400, {
            success: false,
            error: "InvalidBody",
            message:
              "Invalid JSON request body.",
          });
        }
      }

      let products = [];

      if (
        body &&
        body.product &&
        typeof body.product === "object" &&
        !Array.isArray(body.product)
      ) {
        products = [body.product];
      } else if (
        body &&
        Array.isArray(body.products)
      ) {
        products = body.products;
      } else if (
        body &&
        typeof body === "object" &&
        !Array.isArray(body)
      ) {
        /*
         * Also support sending the product
         * object directly.
         */
        products = [body];
      } else {
        return sendJson(res, 400, {
          success: false,
          error: "ProductDataMissing",
          message:
            "Product data is missing.",
        });
      }

      const adminApp = getFirebaseAdmin();
      const db = getFirestore(adminApp);

      const savedProducts =
        await saveProducts(
          db,
          products
        );

      return sendJson(res, 200, {
        success: true,
        saved: savedProducts.length,
        products: savedProducts,
        message:
          savedProducts.length === 1
            ? "Product saved successfully."
            : `${savedProducts.length} products saved successfully.`,
      });
    }

    /* =====================================================
       MASTER SETTINGS API
       
       GET /api/admin/master-settings
       PUT /api/admin/master-settings
    ===================================================== */

    if (isMasterSettings) {
      if (
        req.method !== "GET" &&
        req.method !== "PUT"
      ) {
        res.setHeader(
          "Allow",
          "GET, PUT"
        );

        return sendJson(res, 405, {
          success: false,
          error: "MethodNotAllowed",
          message:
            "Only GET and PUT requests are allowed.",
        });
      }

      if (!requireAdmin(req, res)) {
        return;
      }

      const adminApp = getFirebaseAdmin();
      const db = getFirestore(adminApp);

      const settingsRef = db
        .collection("_system")
        .doc("master-settings");

      /* GET MASTER SETTINGS */

      if (req.method === "GET") {
        const snapshot =
          await settingsRef.get();

        const settings =
          snapshot.exists
            ? snapshot.data() || {}
            : {};

        return sendJson(res, 200, {
          success: true,
          authenticated: true,
          settings,
        });
      }

      /* PUT MASTER SETTINGS */

      let incoming = req.body || {};

      if (typeof incoming === "string") {
        try {
          incoming = JSON.parse(incoming);
        } catch {
          return sendJson(res, 400, {
            success: false,
            error: "InvalidBody",
            message:
              "Invalid JSON request body.",
          });
        }
      }

      if (
        !incoming ||
        typeof incoming !== "object" ||
        Array.isArray(incoming)
      ) {
        return sendJson(res, 400, {
          success: false,
          error: "InvalidBody",
          message:
            "Master settings must be a valid JSON object.",
        });
      }

      const cleanSettings =
        cleanJSON(incoming);

      await settingsRef.set(
        {
          ...cleanSettings,
          updatedAt:
            new Date().toISOString(),
          updatedBy: "admin",
        },
        {
          merge: true,
        }
      );

      const updatedSnapshot =
        await settingsRef.get();

      return sendJson(res, 200, {
        success: true,
        authenticated: true,
        settings:
          updatedSnapshot.exists
            ? updatedSnapshot.data() || {}
            : cleanSettings,
        message:
          "Master settings saved successfully.",
      });
    }

    /* =====================================================
       EXISTING HOMEPAGE PUBLISH API
       
       POST /api/publish
    ===================================================== */

    if (req.method !== "POST") {
      res.setHeader(
        "Allow",
        "POST"
      );

      return sendJson(res, 405, {
        success: false,
        error: "MethodNotAllowed",
        message:
          "Only POST requests are allowed.",
      });
    }

    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);

    let homepage = req.body || {};

    if (typeof homepage === "string") {
      try {
        homepage = JSON.parse(homepage);
      } catch {
        return sendJson(res, 400, {
          success: false,
          error: "InvalidBody",
          message:
            "Invalid JSON request body.",
        });
      }
    }

    if (
      !homepage ||
      typeof homepage !== "object" ||
      Array.isArray(homepage)
    ) {
      return sendJson(res, 400, {
        success: false,
        error: "InvalidBody",
        message:
          "Homepage data must be a valid JSON object.",
      });
    }

    const cleanHomepage =
      cleanJSON(homepage);

    const homepageRef = db
      .collection("_system")
      .doc("homepage");

    await homepageRef.set(
      {
        ...cleanHomepage,
        published: true,
        updatedAt:
          new Date().toISOString(),
      },
      {
        merge: true,
      }
    );

    return sendJson(res, 200, {
      success: true,
      published: true,
      message:
        "Homepage published successfully.",
    });
  } catch (error) {
    console.error(
      "Combined Publish/Products API error:",
      error
    );

    const message =
      error?.message ||
      String(error) ||
      "Failed to process request.";

    return sendJson(res, 500, {
      success: false,
      error:
        error?.code ||
        "CombinedApiError",
      message,
    });
  }
          }
