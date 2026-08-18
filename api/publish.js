import crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

const COOKIE_NAME = "luxmo_admin_session";

function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie || "";

  if (!cookieHeader) return null;

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
    const aBuffer = Buffer.from(String(a));
    const bBuffer = Buffer.from(String(b));

    if (aBuffer.length !== bBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(aBuffer, bBuffer);
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

export default async function handler(req, res) {
  try {
    const isMasterSettings =
      String(req.query?.master || "") === "1";

    /*
     * =========================================================
     * MASTER SETTINGS API
     * GET  /api/admin/master-settings
     * PUT  /api/admin/master-settings
     *
     * Routed here through vercel.json.
     * =========================================================
     */
    if (isMasterSettings) {
      if (req.method !== "GET" && req.method !== "PUT") {
        res.setHeader("Allow", "GET, PUT");

        return sendJson(res, 405, {
          success: false,
          error: "MethodNotAllowed",
          message: "Only GET and PUT requests are allowed.",
        });
      }

      const auth = verifyAdminSession(req);

      if (auth.configurationError) {
        console.error(
          "ADMIN_SESSION_SECRET is not configured."
        );

        return sendJson(res, 500, {
          success: false,
          authenticated: false,
          error: "ServerConfigurationError",
        });
      }

      if (!auth.authenticated) {
        return sendJson(res, 401, {
          success: false,
          authenticated: false,
          error: "Unauthorized",
          message: "Admin authentication required.",
        });
      }

      const adminApp = getFirebaseAdmin();
      const db = getFirestore(adminApp);

      const settingsRef = db
        .collection("_system")
        .doc("master-settings");

      /*
       * GET MASTER SETTINGS
       */
      if (req.method === "GET") {
        const snapshot = await settingsRef.get();

        const settings = snapshot.exists
          ? snapshot.data() || {}
          : {};

        return sendJson(res, 200, {
          success: true,
          authenticated: true,
          settings,
        });
      }

      /*
       * PUT MASTER SETTINGS
       */
      const incoming = req.body || {};

      if (
        !incoming ||
        typeof incoming !== "object" ||
        Array.isArray(incoming)
      ) {
        return sendJson(res, 400, {
          success: false,
          error: "InvalidBody",
          message: "Master settings must be a valid JSON object.",
        });
      }

      const cleanSettings = cleanJSON(incoming);

      await settingsRef.set(
        {
          ...cleanSettings,
          updatedAt: new Date().toISOString(),
          updatedBy: "admin",
        },
        {
          merge: true,
        }
      );

      const updatedSnapshot = await settingsRef.get();

      return sendJson(res, 200, {
        success: true,
        authenticated: true,
        settings: updatedSnapshot.exists
          ? updatedSnapshot.data() || {}
          : cleanSettings,
        message: "Master settings saved successfully.",
      });
    }

    /*
     * =========================================================
     * EXISTING HOMEPAGE PUBLISH API
     * POST /api/publish
     * =========================================================
     */

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");

      return sendJson(res, 405, {
        success: false,
        error: "MethodNotAllowed",
        message: "Only POST requests are allowed.",
      });
    }

    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);

    const homepage = req.body || {};

    if (
      !homepage ||
      typeof homepage !== "object" ||
      Array.isArray(homepage)
    ) {
      return sendJson(res, 400, {
        success: false,
        error: "InvalidBody",
        message: "Homepage data must be a valid JSON object.",
      });
    }

    const cleanHomepage = cleanJSON(homepage);

    const homepageRef = db
      .collection("_system")
      .doc("homepage");

    await homepageRef.set(
      {
        ...cleanHomepage,
        published: true,
        updatedAt: new Date().toISOString(),
      },
      {
        merge: true,
      }
    );

    return sendJson(res, 200, {
      success: true,
      published: true,
      message: "Homepage published successfully.",
    });
  } catch (error) {
    console.error("Publish API error:", error);

    return sendJson(res, 500, {
      success: false,
      error: error?.code || "PublishApiError",
      message:
        error?.message || "Failed to process request.",
    });
  }
}
