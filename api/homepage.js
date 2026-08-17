import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

export default async function handler(req, res) {
  try {
    // Only GET is allowed for public Homepage API
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        error: "Method Not Allowed",
      });
    }

    // Firebase Admin / Firestore
    const app = getFirebaseAdmin();
    const db = getFirestore(app);

    // Published homepage document
    const docRef = db
      .collection("site_settings")
      .doc("homepage");

    const snapshot = await docRef.get();

    // No published homepage yet
    if (!snapshot.exists) {
      return res.status(200).json({
        success: true,
        published: false,
        homepage: null,
      });
    }

    const homepage = snapshot.data();

    return res.status(200).json({
      success: true,
      published: true,
      homepage,
    });
  } catch (error) {
    console.error("Homepage API error:", error);

    return res.status(500).json({
      success: false,
      error: error?.code || "homepage_api_error",
      message: error?.message || "Failed to load homepage",
    });
  }
}
