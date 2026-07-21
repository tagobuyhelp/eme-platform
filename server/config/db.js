import mongoose from "mongoose";
import User from "../modules/auth/auth.model.js";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri || uri === "your_mongodb_connection") {
    console.warn("MONGO_URI not configured. Skipping MongoDB connection.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");

    // Repair User email index for phone-only student logins
    try {
      const usersColl = mongoose.connection.db.collection("users");
      
      // 1. Unset email field on documents where email is null or empty string
      await usersColl.updateMany(
        { email: { $in: [null, ""] } },
        { $unset: { email: "" } }
      );

      // 2. Check if email_1 index exists and if it is not sparse, drop it
      const indexes = await usersColl.indexes();
      const emailIdx = indexes.find((idx) => idx.name === "email_1");
      if (emailIdx && !emailIdx.sparse) {
        console.log("🔄 Dropping non-sparse email_1 index on users collection...");
        await usersColl.dropIndex("email_1");
      }

      // 3. Sync indexes based on Mongoose schema (email: { unique: true, sparse: true })
      await User.syncIndexes();
      console.log("✅ User indexes synchronized (sparse email index active)");
    } catch (indexErr) {
      console.warn("⚠️ Index sync note:", indexErr.message);
    }
  } catch (err) {
    console.error("MongoDB connection error:", err?.message || err);
    process.exit(1);
  }
}
