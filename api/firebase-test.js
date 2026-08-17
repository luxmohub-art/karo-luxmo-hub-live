import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../lib/firebase-admin.js";

export default async function handler(req, res) {
  try {
    const db = getFirestore(getFirebaseAdmin());

    const testRef = db.collection("_system").doc("firebase-test");

    await testRef.set({
      status: "connected",
      test: true,
      updatedAt: new Date().toISOString(),
    });

    const snapshot = await testRef.get();

    return res.status(200).json({
      success: true,
      firebase: "connected",
      firestore: "connected",
      documentExists: snapshot.exists,
    });
  } catch (error) {
    console.error("Firebase test error:", error);

    return res.status(500).json({
      success: false,
      error: error?.name || "UnknownError",
      code: error?.code || null,
      message: error?.message || "Unknown Firebase error",
    });
  }
}
