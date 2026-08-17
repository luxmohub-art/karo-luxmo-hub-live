import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../lib/firebase-admin.js";

export default async function handler(req, res) {
  try {
    // Only POST is allowed
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "MethodNotAllowed",
        message: "Only POST requests are allowed.",
      });
    }

    // Firebase Admin / Firestore
    const db = getFirestore(getFirebaseAdmin());

    // Request body
    const body = req.body || {};

    // Homepage data must be an object
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        error: "InvalidBody",
        message: "Homepage data must be a valid JSON object.",
      });
    }

    // Remove undefined values because Firestore does not accept them
    const cleanData = JSON.parse(
      JSON.stringify(body, (_, value) =>
        value === undefined ? null : value
      )
    );

    // Save published homepage
    const homepageRef = db.collection("_system").doc("homepage");

    await homepageRef.set(
      {
        ...cleanData,
        published: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      published: true,
      message: "Homepage published successfully.",
    });
  } catch (error) {
    console.error("Homepage publish error:", error);

    return res.status(500).json({
      success: false,
      error: error?.code || "HomepagePublishError",
      message: error?.message || "Failed to publish homepage.",
    });
  }
}
