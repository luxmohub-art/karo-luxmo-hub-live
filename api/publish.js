import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

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

    // Firebase Admin
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);

    // Request body
    const homepage = req.body || {};

    if (
      !homepage ||
      typeof homepage !== "object" ||
      Array.isArray(homepage)
    ) {
      return res.status(400).json({
        success: false,
        error: "InvalidBody",
        message: "Homepage data must be a valid JSON object.",
      });
    }

    // Clean undefined values
    const cleanHomepage = JSON.parse(
      JSON.stringify(homepage, (_, value) =>
        value === undefined ? null : value
      )
    );

    // Firestore document
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
      message:
        error?.message || "Failed to publish homepage.",
    });
  }
}
