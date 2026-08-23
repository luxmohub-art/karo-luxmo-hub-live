import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* =========================================================
   FIREBASE
========================================================= */

function getDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (raw) {
      initializeApp({
        credential: cert(JSON.parse(raw)),
      });
    } else {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: String(
            process.env.FIREBASE_PRIVATE_KEY || ""
          ).replace(/\\n/g, "\n"),
        }),
      });
    }
  }

  return getFirestore();
}

/* =========================================================
   HELPERS
========================================================= */

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

function isTruthyAuth(data) {
  return Boolean(
    data &&
      (
        data.authenticated === true ||
        data.isAuthenticated === true ||
        data.loggedIn === true ||
        data.success === true
      )
  );
}

/* =========================================================
   ADMIN SESSION
========================================================= */

async function requireAdminSession(req) {
  const cookie = req.headers.cookie;

  if (!cookie) {
    return false;
  }

  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host ||
    process.env.VERCEL_URL;

  if (!host) {
    return false;
  }

  const protocol =
    String(req.headers["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim() ||
    (String(host).includes("localhost") ? "http" : "https");

  try {
    const response = await fetch(
      `${protocol}://${host}/api/admin-session`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: cookie,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    return response.ok && isTruthyAuth(data);
  } catch (error) {
    console.error("Admin session check failed:", error);
    return false;
  }
}

/* =========================================================
   PRODUCT FILTER
========================================================= */

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
    const searchText =
      `${product.title || ""} ` +
      `${product.description || ""} ` +
      `${product.model || ""} ` +
      `${product.sku || ""}`
        .toLowerCase();

    if (!searchText.includes(String(q).toLowerCase())) {
      return false;
    }
  }

  return true;
}

/* =========================================================
   GET PRODUCTS
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
   SAVE / UPSERT PRODUCTS
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

  /*
   * IMPORTANT:
   * Do NOT delete existing Firestore products here.
   * Only save/update the products received from Admin Panel.
   */

  const savedProducts = [];

  for (const product of products) {
    if (!product || typeof product !== "object") {
      continue;
    }

    const rawId = String(product.id || "").trim();

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
   API HANDLER
========================================================= */

export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  /* =======================================================
     GET
  ======================================================= */

  if (req.method === "GET") {
    try {
      const db = getDb();

      const products = await readProducts(
        db,
        req.query || {}
      );

      return res.status(200).json({
        success: true,
        products,
        count: products.length,
      });
    } catch (error) {
      console.error(
        "Products GET error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Unable to load products.",
      });
    }
  }

  /* =======================================================
     PUT
  ======================================================= */

  if (req.method === "PUT") {
    try {
      /* -----------------------------------------------
         ADMIN AUTHENTICATION
      ------------------------------------------------ */

      const authenticated =
        await requireAdminSession(req);

      if (!authenticated) {
        return res.status(401).json({
          success: false,
          error:
            "Admin authentication required.",
        });
      }

      /* -----------------------------------------------
         READ REQUEST BODY
      ------------------------------------------------ */

      let body = req.body || {};

      if (typeof body === "string") {
        try {
          body = JSON.parse(body || "{}");
        } catch {
          return res.status(400).json({
            success: false,
            error:
              "Invalid JSON request body.",
          });
        }
      }

      /* -----------------------------------------------
         SUPPORT BOTH:

         { product: {...} }

         AND

         { products: [...] }
      ------------------------------------------------ */

      let products = [];

      if (
        body &&
        body.product &&
        typeof body.product === "object"
      ) {
        products = [body.product];
      } else if (
        body &&
        Array.isArray(body.products)
      ) {
        products = body.products;
      } else {
        return res.status(400).json({
          success: false,
          error:
            "Product data is missing. Send product or products.",
        });
      }

      /* -----------------------------------------------
         SAVE
      ------------------------------------------------ */

      const db = getDb();

      const savedProducts =
        await saveProducts(
          db,
          products
        );

      /* -----------------------------------------------
         SUCCESS
      ------------------------------------------------ */

      return res.status(200).json({
        success: true,
        saved: savedProducts.length,
        products: savedProducts,
        message:
          savedProducts.length === 1
            ? "Product saved successfully."
            : `${savedProducts.length} products saved successfully.`,
      });
    } catch (error) {
      console.error(
        "Products PUT error:",
        error
      );

      /*
       * Return the REAL error message.
       * This prevents [object Object] type errors.
       */

      const errorMessage =
        error?.message ||
        String(error) ||
        "Unable to save products.";

      return res.status(500).json({
        success: false,
        error: errorMessage,
        message: errorMessage,
      });
    }
  }

  /* =======================================================
     OTHER METHODS
  ======================================================= */

  res.setHeader(
    "Allow",
    "GET, PUT"
  );

  return res.status(405).json({
    success: false,
    error: "Method not allowed.",
  });
}
