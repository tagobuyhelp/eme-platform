import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri || uri === "your_mongodb_connection") {
    console.warn("MONGO_URI not configured. Skipping MongoDB connection.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err?.message || err);
    process.exit(1);
  }
}
