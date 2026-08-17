import { db } from "../lib/firebase-admin.js";

export default async function handler(req, res) {
  try {
    const collections = await db.listCollections();

    return res.status(200).json({
      success: true,
      message: "Firebase Admin + Firestore connected successfully.",
      projectId: process.env.FIREBASE_PROJECT_ID,
      collections: collections.map((collection) => collection.id),
    });
  } catch (error) {
    console.error("Firebase Firestore connection test failed:", error);

    return res.status(500).json({
      success: false,
      message: "Firestore connection failed.",
      error: error.message,
    });
  }
}
